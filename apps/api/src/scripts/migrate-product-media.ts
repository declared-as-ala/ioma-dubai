/** Back up first, then migrate official catalogue images without re-importing products. */
import "reflect-metadata";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { mkdir, readFile, writeFile } from "fs/promises";
import { resolve, basename, extname, sep } from "path";
import sharp from "sharp";
import { mongo } from "mongoose";
import { StorageModule } from "../common/storage/storage.module";
import { MediaModule } from "../modules/media/media.module";
import { ProductMediaService } from "../modules/media/product-media.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, "../../../../.env"),
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || "mongodb://localhost:27017/ioma"),
    StorageModule,
    MediaModule,
  ],
})
class MigrationModule {}

async function download(source: string) {
  let url = new URL(source);
  for (let redirects = 0; redirects < 4; redirects++) {
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !["cdn.shopify.com", "ioma-paris.com", "www.ioma-paris.com"].includes(url.hostname)
    )
      throw new Error("Unapproved official asset host");
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Missing redirect target");
      url = new URL(location, url);
      continue;
    }
    if (!response.ok || !response.body)
      throw new Error(`Download HTTP ${response.status}`);
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      size += chunk.length;
      if (size > 10 * 1024 * 1024) throw new Error("Image exceeds 10 MB");
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  throw new Error("Too many redirects");
}
async function main() {
  const app = await NestFactory.createApplicationContext(MigrationModule, {
    logger: ["error", "warn"],
  });
  try {
    const media = app.get(ProductMediaService);
    const products = await media.products.find().lean();
    const assets = await media.assets.find().lean();
    const root = resolve(__dirname, "../../../.."),
      output = resolve(
        root,
        "scratch",
        `product-media-${new Date().toISOString().replace(/[:.]/g, "-")}`,
      );
    await mkdir(output, { recursive: true });
    // Extended JSON preserves dates/ObjectIds for exact restoration with EJSON.parse.
    const { EJSON } = mongo.BSON;
    await writeFile(
      resolve(output, "backup.ejson"),
      EJSON.stringify({ products, mediaAssets: assets }, { relaxed: false }),
    );
    const report = {
      backup: output,
      apply: process.argv.includes("--apply"),
      productsBefore: products.length,
      assetsBefore: assets.length,
      migrated: 0,
      skipped: 0,
      images: 0,
      failures: [] as Array<{ product: string; source: string; error: string }>,
    };
    const publicRoot = resolve(root, "apps/web/public");
    for (const product of products) {
      if (product.media?.length) {
        report.skipped++;
        continue;
      }
      if (!report.apply) continue;
      const gallery: Array<{
        assetId: string;
        alt: { en: string; fr: string; ar: string };
      }> = [];
      let failed = false;
      for (const source of product.images ?? []) {
        try {
          let buffer: Buffer;
          if (source.startsWith("/images/")) {
            const local = resolve(publicRoot, `.${source}`);
            if (!local.startsWith(publicRoot + sep))
              throw new Error("Invalid local image path");
            buffer = await readFile(local);
          } else buffer = await download(source);
          const metadata = await sharp(buffer).metadata();
          const ext =
            metadata.format === "jpeg"
              ? ".jpg"
              : metadata.format === "png"
                ? ".png"
                : metadata.format === "webp"
                  ? ".webp"
                  : "";
          if (!ext) throw new Error("Unsupported original image format");
          // Legacy importer wrote all extensions as jpg; actual decoded format is authoritative.
          const originalname =
            basename(source.split("?")[0]!, extname(source.split("?")[0]!)) + ext;
          const asset = await media.upload(
            String(product._id),
            {
              buffer,
              originalname,
              mimetype: `image/${metadata.format}`,
              size: buffer.length,
            } as Express.Multer.File,
            undefined,
            source,
          );
          if (!gallery.some((m) => m.assetId === asset.id))
            gallery.push({ assetId: asset.id, alt: product.name });
        } catch (error) {
          failed = true;
          report.failures.push({
            product: product.slug,
            source,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      // Preserve the whole original gallery if any file fails; reruns reuse successful assets.
      if (!failed && gallery.length) {
        await media.saveGallery(String(product._id), {
          revision: product.mediaRevision ?? 0,
          media: gallery,
        });
        report.migrated++;
        report.images += gallery.length;
      }
      await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2));
    }
    const productsAfter = await media.products.countDocuments(),
      assetsAfter = await media.assets.countDocuments();
    if (productsAfter !== products.length)
      throw new Error("Catalogue count changed during migration");
    await writeFile(
      resolve(output, "report.json"),
      JSON.stringify({ ...report, productsAfter, assetsAfter }, null, 2),
    );
    console.log(JSON.stringify({ ...report, productsAfter, assetsAfter }, null, 2));
  } finally {
    await app.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
