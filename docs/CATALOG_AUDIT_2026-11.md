# IOMA Paris Dubai — Catalog audit and price reconciliation (20 Nov 2026)

Read-only audit of the production database (`ioma`), the code, the three owner price files
(`prices/*.xlsx`) and the public IOMA France catalog. **Nothing in production was modified for this audit.**
Row-by-row evidence: [`catalog-reconciliation-2026-11.csv`](catalog-reconciliation-2026-11.csv).

## 1. Why the admin showed conflicting KPIs

Two different bars, two different scopes, plus rules that ignored the sales channel.

| Figure shown                            | Where it came from                                                       | What it really counts                                                                                                                                        | Verdict                                                                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 119 total                               | server (`/catalog-sync/stats`)                                           | every non-deleted product                                                                                                                                    | **Correct**                                                                                                                                                  |
| 119 active **vs 100 active**            | server bar vs browser bar                                                | the browser bar counts only the **first 100 products loaded** (`limit=100`) of 119                                                                           | **Bug** (scope). True: **119 published, 0 draft**                                                                                                            |
| 1 low stock **vs 70 low stock**         | server vs browser                                                        | server: variants at/under threshold with some stock; browser: a different formula. True low stock: **0**                                                     | **Bug** (two formulas). Real figure is 0                                                                                                                     |
| 56 out of stock (server) / 70 (browser) | max available quantity <= 0                                              | the 56 cabin products hold 0 units but allow **backorder** (not tracked), +14 products with **no variant** at all. Truly unsellable for stock reasons: **0** | **Bug** (untracked and backorder counted as out of stock)                                                                                                    |
| 70 price missing                        | browser bar: no variant with a consumer price, or availability "pending" | 56 are **B2B/cabin-only** products (no retail price by design) + 14 retail kits/routines/gift card with no variant                                           | **Bug** (channel-blind). True: **14 retail products without a price**, **0 professional products without a trade price**                                     |
| 35 missing images                       | server                                                                   | products with no image: all 35 are `b2b_cabin` (created from the cabin file with no source photo)                                                            | **Correct count**, but all professional-only; 0 retail products lack an image                                                                                |
| 48 missing translations                 | server rule: EN/AR empty or equal to the French name                     | 48 products where the EN name equals the FR name (43 retail, 5 professional). Separately, **the Arabic name equals the English name for all 119**            | **Partly correct**: the rule is inconsistent (checks AR vs FR, not AR vs EN). Real status: Arabic is not translated anywhere, needs a human translation pass |
| 56 missing SEO                          | server: no English SEO title                                             | all 56 are **professional-only** products that are never indexed                                                                                             | **Bug**: SEO does not apply to internal products. True missing SEO on retail: **0**                                                                          |
| 56 B2B only                             | server                                                                   | `visibility = b2b_cabin`                                                                                                                                     | **Correct**                                                                                                                                                  |
| 0 linked to IOMA France                 | server: `source.externalId`                                              | no product was ever synced from Shopify on production                                                                                                        | **Correct, but unmeaningful**: links never created (see section 5)                                                                                           |

Also found: **19 orphan variants** (SKUs such as `HYDRA-SERUM-INTENSE-30ML`, `qa-media-...`) whose product no longer exists. They carry the only
real stock figures (about 100 units each) and fictional prices (e.g. 380 AED). They are old seed/test data, not part of the catalog.

## 2. State of the database

- 119 products, **all published**; 127 variants = **108 live + 19 orphans**.
- Visibility: `both` 49 (retail + professional resale), `b2c` 14 (kits/routines/gift card, **no variants**), `b2b_cabin` 56.
- Retail-enabled 63, professional-enabled (resale) 49, cabin-only 56.
- 0 duplicate SKUs. EAN on 108 variants, 96 distinct (the 12 shared EANs are the In.Lab actives and their `-CAB` references, as expected).
- Gaps (full catalog): 35 products without category, 37 without concern, 45 without skin type, 36 without product type.

## 3. Price files vs database

| File                         | Rows | Found in DB                                             | Price differences |
| ---------------------------- | ---- | ------------------------------------------------------- | ----------------- |
| Public prices (AED TTC)      | 52   | 52 (all exact)                                          | **0**             |
| Professional resale (AED HT) | 64   | 64 (52 retail refs + 12 In.Lab actives)                 | **0**             |
| Cabin (AED HT)               | 44   | 44 (12 are the `-CAB` references of the In.Lab actives) | **0**             |

108 distinct references and 96 distinct EANs across the three files, as stated. 12 references (`IBP190`..`IBP216`) are stored with a size suffix (`IBP190-50ML`): matched through the
SKU alias, not by name. **The database already holds the approved November 2026 prices.**

**Needs a human decision (4 SKUs, size differs between database and the owner files):**

| SKU    | Database | Owner file |
| ------ | -------- | ---------- |
| IBP302 | 50 ml    | 30 ml      |
| IBP180 | 150 ml   | 200 ml     |
| IBP216 | 30 ml    | 15 ml      |
| IBB007 | 50 ml    | 40 ml      |

Prices are correct either way; confirm which size is right before the product page is trusted.

Products without any SKU in the files: the **14 retail kits/routines/gift card** (no variants, no price in any file). Products present only in the PDFs/Excel: **none**.

## 4. IOMA France catalog (public Shopify, verified)

| Endpoint                          | Status | Result                                                                                                                                                             |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/products.json?limit=250&page=1` | 200    | **64 products, 88 variants**, 84 with SKU, **0 barcodes** exposed; page 2 empty (the `all` collection reports 236, so the public feed is only part of the catalog) |
| `/collections.json?limit=50`      | 200    | 50 collections                                                                                                                                                     |
| `/robots.txt`, `/sitemap.xml`     | 200    | crawlable                                                                                                                                                          |

Match with our catalog: **46 of our 127 variants share an exact SKU** with a French variant; **0 EAN matches** (the feed has no barcodes). No private Admin API was used. EUR prices are **not** imported.
Use an official Shopify export for a full link (the public feed does not contain the whole catalog).

### Taxonomy mapping (France to Dubai)

| France                                                                                                                                                   | Dubai                             | Note                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------- |
| Collections `1-hydra`, `2-energize`, `3-renew`, `4-calm`, `5-purete`, `6-matte`, `7-illumine`                                                            | **Range** (`hydra` .. `illumine`) | a range is not a category                    |
| `soins-visage-*` by concern: Anti-age, Deshydratation, Fatigue, Fermete, Imperfections, Matite, Pollution, Pores dilates, Rougeurs, Sensibilite, Ridules | **Skin concern**                  | partly present (37 products have no concern) |
| `soins-visage-seche/grasse/mixte/normale/mature/sensible`                                                                                                | **Skin type**                     | 45 products have none                        |
| Product type (Serum, Creme de jour/nuit, Nettoyant, Masque, Gommage, Contour des yeux, Demaquillant, Routine, Shampooing...)                             | **Category / product type**       | `product_type` in the feed                   |
| `kits-et-routines`, `les-routines`                                                                                                                       | **Kits and routines**             | the 14 retail products without variants      |
| `soins-cheveux-haircare`, `soins-corps-gamme-cocoon`                                                                                                     | ranges `hair`, `coco`             | exist                                        |
| Promotions (`promotion-soins`, `pack-black-friday`, `french-days`)                                                                                       | not mapped                        | commercial campaigns, not taxonomy           |

## 5. Decisions that need approval (nothing was changed)

1. The 4 size conflicts above.
2. The 19 orphan seed variants: archive or delete (they distort stock and look like real SKUs).
3. Arabic names (identical to English on all 119 products): provide or approve translations.
4. Enriching content from the French catalog by SKU (descriptions, images): needs rights confirmation before any image copy; metadata only after approval.
5. Whether the 14 kits/routines/gift card get a SKU and price or stay "price on request".

## 6. What was implemented from this audit

See the repository history after this report: one server-side product statistics source with channel-aware rules, a single analytics header, correct stock states
(in stock / low / out / not tracked / no sellable variant), and the owner-price import workflow (preview, conflicts, explicit approval, history).
