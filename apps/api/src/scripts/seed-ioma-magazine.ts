import mongoose from "mongoose";
import * as fs from "fs";
import * as path from "path";

interface LocalizedString {
  en: string;
  fr: string;
  ar: string;
}

interface TranslatedArticle {
  slug: string;
  sourceUrl: string;
  author: string;
  datePublished: string;
  category: LocalizedString;
  categorySlug: string;
  coverImage: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  htmlBody: LocalizedString;
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
  readingTimeMinutes: number;
}

/**
 * Parses simple HTML sections into structured CMS blocks for admin compatibility
 */
function htmlToBlocks(htmlBody: LocalizedString) {
  // Extract paragraphs or headers to create initial blocks
  const frText = htmlBody?.fr || "";
  const enText = htmlBody?.en || "";
  const arText = htmlBody?.ar || "";

  // Split into rough sections by <h2> or <h3>
  const cleanTags = (str: string) =>
    str
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  return [
    {
      type: "text",
      heading: {
        en: "Article Overview",
        fr: "Vue d'ensemble",
        ar: "نظرة عامة على المقال",
      },
      body: {
        en: cleanTags(enText).slice(0, 1000),
        fr: cleanTags(frText).slice(0, 1000),
        ar: cleanTags(arText).slice(0, 1000),
      },
    },
  ];
}

async function run() {
  const force = process.argv.includes("--force");
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    "mongodb://localhost:27017/ioma";

  console.log("==================================================");
  console.log("  IOMA Paris Dubai — Magazine Migration & Seeder  ");
  console.log("==================================================");
  console.log(`Connecting to MongoDB at ${mongoUri.replace(/:([^:@]+)@/, ":****@")}...`);

  await mongoose.connect(mongoUri);
  const collection = mongoose.connection.collection("contentpages");

  // Ensure index on slug and kind
  await collection.createIndex({ slug: 1, kind: 1 }, { unique: true });

  const rootDir = process.cwd();
  let scratchDir = path.resolve(rootDir, "scratch");
  if (!fs.existsSync(scratchDir)) {
    scratchDir = path.resolve(rootDir, "..", "..", "scratch");
  }

  // Load all batch files or all_translated_articles.json
  let allArticles: TranslatedArticle[] = [];
  const combinedPath = path.join(scratchDir, "all_translated_articles.json");

  if (fs.existsSync(combinedPath)) {
    console.log(`Loading pre-combined articles from ${combinedPath}...`);
    allArticles = JSON.parse(fs.readFileSync(combinedPath, "utf8"));
  } else {
    console.log(
      "Aggregating batch files (batch_1_translated.json .. batch_6_translated.json)...",
    );
    for (let b = 1; b <= 6; b++) {
      const batchFile = path.join(scratchDir, `batch_${b}_translated.json`);
      if (fs.existsSync(batchFile)) {
        try {
          const batchData = JSON.parse(fs.readFileSync(batchFile, "utf8"));
          console.log(`  ✓ Loaded batch ${b}: ${batchData.length} articles`);
          allArticles.push(...batchData);
        } catch (err: any) {
          console.error(`  ✗ Error loading batch ${b}:`, err.message);
        }
      } else {
        console.warn(`  ! Batch ${b} file not found: ${batchFile}`);
      }
    }
  }

  console.log(`\nTotal articles ready to process: ${allArticles.length}`);

  let importedCount = 0;
  let updatedCount = 0;
  const skippedCount = 0;
  let errorCount = 0;

  for (const article of allArticles) {
    try {
      const slug = article.slug;
      if (!slug) {
        console.warn("Skipping article with missing slug");
        errorCount++;
        continue;
      }

      const existing = await collection.findOne({ slug, kind: "journal" });

      const doc = {
        slug: article.slug,
        kind: "journal",
        title: article.title,
        summary: article.excerpt,
        excerpt: article.excerpt,
        htmlBody: article.htmlBody,
        blocks: htmlToBlocks(article.htmlBody),
        coverImage: article.coverImage,
        category: article.category,
        categorySlug: article.categorySlug,
        author: article.author || "IOMA Paris Scientific Committee",
        datePublished: article.datePublished
          ? new Date(article.datePublished)
          : new Date(),
        readingTimeMinutes: article.readingTimeMinutes || 3,
        sourceUrl: article.sourceUrl,
        seoTitle: article.seoTitle || article.title,
        seoDescription: article.seoDescription || article.excerpt,
        status: "published",
        updatedAt: new Date(),
      };

      if (!existing) {
        await collection.insertOne({
          ...doc,
          createdAt: new Date(),
        });
        importedCount++;
      } else if (force) {
        await collection.updateOne({ _id: existing._id }, { $set: doc });
        updatedCount++;
      } else {
        // Safe update: don't overwrite if manual edits might exist, update core fields
        await collection.updateOne(
          { _id: existing._id },
          {
            $set: {
              coverImage: article.coverImage,
              category: article.category,
              categorySlug: article.categorySlug,
              datePublished: doc.datePublished,
              readingTimeMinutes: doc.readingTimeMinutes,
              sourceUrl: article.sourceUrl,
              htmlBody: article.htmlBody,
              updatedAt: new Date(),
            },
          },
        );
        updatedCount++;
      }
    } catch (err: any) {
      console.error(`Error processing article ${article.slug}:`, err.message);
      errorCount++;
    }
  }

  // Also ensure kind: 'magazine' alias or query indexing
  console.log("\n==================================================");
  console.log("            MIGRATION & SEED REPORT               ");
  console.log("==================================================");
  console.log(`Discovered Articles:  ${allArticles.length}`);
  console.log(`Successfully Seeded:  ${importedCount}`);
  console.log(`Updated:              ${updatedCount}`);
  console.log(`Skipped:              ${skippedCount}`);
  console.log(`Errors:               ${errorCount}`);
  console.log("==================================================\n");

  await mongoose.disconnect();
  console.log("Database connection closed. Done!");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
