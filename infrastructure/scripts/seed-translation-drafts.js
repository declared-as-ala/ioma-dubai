// Idempotent. Stores English and Arabic translation DRAFTS (products.enDraft / products.arDraft) for the
// shop products whose English/Arabic fields still contain French. Live text is never changed here:
// an administrator reviews and approves each draft in the product editor (More options > Translation review).
// Drafts already approved or rejected are left alone. Names already drafted are kept.
// Run (inside the mongo container, with the JSON copied next to it):
//   mongosh <db> --eval 'var APPLY=true; var DATA="/tmp/product-translation-drafts.json"' seed-translation-drafts.js
// Without APPLY it only reports.
const fs = require("fs");
const APPLY = typeof globalThis.APPLY !== "undefined" ? globalThis.APPLY : false;
const DATA = typeof globalThis.DATA !== "undefined" ? globalThis.DATA : "/tmp/product-translation-drafts.json";
const drafts = JSON.parse(fs.readFileSync(DATA, "utf8"));
const out = { apply: APPLY, products: 0, en: 0, ar: 0, skippedDecided: 0, unknown: [] };
const SRC = "Draft translation to be reviewed by a human";
for (const [slug, d] of Object.entries(drafts)) {
  const p = db.products.findOne({ slug }, { enDraft: 1, arDraft: 1 });
  if (!p) { out.unknown.push(slug); continue; }
  out.products++;
  for (const lang of ["en", "ar"]) {
    const key = lang + "Draft";
    const existing = p[key];
    if (existing && existing.status && existing.status !== "draft") { out.skippedDecided++; continue; }
    const fields = Object.assign({}, existing ? existing.fields : {}, d[lang]);
    out[lang]++;
    if (APPLY)
      db.products.updateOne(
        { _id: p._id },
        { $set: { [key]: { status: "draft", source: SRC, draftedAt: existing ? existing.draftedAt || new Date() : new Date(), fields } } },
      );
  }
}
print(JSON.stringify(out));
