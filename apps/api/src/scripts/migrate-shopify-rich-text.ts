import mongoose from "mongoose";
import {
  normalizeShopifyRichText,
  isEmptyContent,
  isShopifyRichText,
} from "@ioma/validation";

async function run() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isDryRun = !isApply;

  console.log("==================================================================");
  console.log("   IOMA PARIS DUBAI — SHOPIFY RICH TEXT NORMALIZATION MIGRATION   ");
  console.log("==================================================================");
  console.log(
    `Execution Mode : ${isApply ? ">>> APPLY (Writing to MongoDB) <<<" : "DRY RUN (Validation only)"}`,
  );

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ioma";
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;
  if (!db) throw new Error("Could not access MongoDB database");

  const productCollection = db.collection("products");
  const products = await productCollection.find({}).toArray();

  console.log(`Found ${products.length} products to check for raw Shopify rich text.`);

  let totalProductsUpdated = 0;
  let totalFieldsCleaned = 0;

  function cleanField(raw: any): { en: string; fr: string; ar: string } | null {
    if (!raw) return null;
    if (typeof raw === "string") {
      if (isEmptyContent(raw)) return null;
      const cleaned = normalizeShopifyRichText(raw);
      return cleaned ? { en: cleaned, fr: cleaned, ar: cleaned } : null;
    }
    if (typeof raw === "object") {
      const frVal = raw.fr;
      const enVal = raw.en;
      const arVal = raw.ar;

      const frClean = isEmptyContent(frVal) ? "" : normalizeShopifyRichText(frVal);
      const enClean = isEmptyContent(enVal) ? frClean : normalizeShopifyRichText(enVal);
      const arClean = isEmptyContent(arVal) ? frClean : normalizeShopifyRichText(arVal);

      if (!frClean && !enClean && !arClean) return null;
      return {
        fr: frClean || enClean,
        en: enClean || frClean,
        ar: arClean || frClean,
      };
    }
    return null;
  }

  for (const p of products) {
    let changed = false;
    const rawBackup: Record<string, any> = {};
    const updates: Record<string, any> = {};

    // 1. howToUse
    if (
      p.howToUse &&
      (isShopifyRichText(p.howToUse.fr) ||
        isShopifyRichText(p.howToUse.en) ||
        isShopifyRichText(p.howToUse.ar))
    ) {
      rawBackup.howToUse = p.howToUse;
      const cleaned = cleanField(p.howToUse) || {
        fr: "Appliquer quotidiennement selon le protocole de soin IOMA.",
        en: "Apply daily following the IOMA skincare ritual.",
        ar: "يُوضع يومياً باتباع بروتوكول العناية من إيوما.",
      };
      updates.howToUse = cleaned;
      changed = true;
      totalFieldsCleaned++;
    }

    // 2. details
    if (
      p.details &&
      (isShopifyRichText(p.details.fr) ||
        isShopifyRichText(p.details.en) ||
        isShopifyRichText(p.details.ar) ||
        isEmptyContent(p.details.fr))
    ) {
      rawBackup.details = p.details;
      updates.details = cleanField(p.details);
      changed = true;
      totalFieldsCleaned++;
    }

    // 3. texture
    if (
      p.texture &&
      (isShopifyRichText(p.texture.fr) ||
        isShopifyRichText(p.texture.en) ||
        isShopifyRichText(p.texture.ar) ||
        isEmptyContent(p.texture.fr))
    ) {
      rawBackup.texture = p.texture;
      updates.texture = cleanField(p.texture);
      changed = true;
      totalFieldsCleaned++;
    }

    // 4. results
    if (
      p.results &&
      (isShopifyRichText(p.results.fr) ||
        isShopifyRichText(p.results.en) ||
        isShopifyRichText(p.results.ar) ||
        isEmptyContent(p.results.fr))
    ) {
      rawBackup.results = p.results;
      updates.results = cleanField(p.results);
      changed = true;
      totalFieldsCleaned++;
    }

    // 5. fullIngredientsText (INCI)
    if (
      p.fullIngredientsText &&
      (isShopifyRichText(p.fullIngredientsText.fr) ||
        isShopifyRichText(p.fullIngredientsText.en) ||
        isShopifyRichText(p.fullIngredientsText.ar))
    ) {
      rawBackup.fullIngredientsText = p.fullIngredientsText;
      const cleaned = cleanField(p.fullIngredientsText) || {
        fr: "Formulation exclusive IOMA Paris.",
        en: "Exclusive IOMA Paris formulation.",
        ar: "تركيبة حصرية من إيوما باريس.",
      };
      updates.fullIngredientsText = cleaned;
      changed = true;
      totalFieldsCleaned++;
    }

    // 6. description
    if (
      p.description &&
      (isShopifyRichText(p.description.fr) ||
        isShopifyRichText(p.description.en) ||
        isShopifyRichText(p.description.ar))
    ) {
      rawBackup.description = p.description;
      updates.description = cleanField(p.description);
      changed = true;
      totalFieldsCleaned++;
    }

    // 7. activeIngredientsList
    if (p.activeIngredientsList && p.activeIngredientsList.length > 0) {
      let actifsChanged = false;
      const cleanedActifs = p.activeIngredientsList.map((act: any) => {
        if (
          act.description &&
          (isShopifyRichText(act.description) || isEmptyContent(act.description))
        ) {
          actifsChanged = true;
          totalFieldsCleaned++;
          const cleanDesc = isEmptyContent(act.description)
            ? undefined
            : normalizeShopifyRichText(act.description);
          return {
            ...act,
            description: cleanDesc,
          };
        }
        return act;
      });

      if (actifsChanged) {
        rawBackup.activeIngredientsList = p.activeIngredientsList;
        updates.activeIngredientsList = cleanedActifs;
        changed = true;
      }
    }

    if (changed) {
      totalProductsUpdated++;
      if (isApply) {
        await productCollection.updateOne(
          { _id: p._id },
          {
            $set: {
              ...updates,
              "sourceMetadata.shopifyRaw": {
                ...(p.sourceMetadata?.shopifyRaw || {}),
                ...rawBackup,
                migratedAt: new Date(),
              },
              updatedAt: new Date(),
            },
          },
        );
      }
      console.log(
        `[${isApply ? "UPDATED" : "DRY-RUN"}] Product: ${p.slug} (${Object.keys(updates).join(", ")})`,
      );
    }
  }

  console.log("\n==================================================================");
  console.log(`Summary: ${totalProductsUpdated}/${products.length} products normalized.`);
  console.log(`Total rich-text fields cleaned: ${totalFieldsCleaned}.`);
  console.log("==================================================================");

  if (isDryRun) {
    console.log("To apply changes to MongoDB, run with: --apply");
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
