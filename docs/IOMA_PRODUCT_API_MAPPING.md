# IOMA product API — schema, mapping and synchronisation rules

Status: written 2026-11-06 from what was actually observed. Anything not observed is marked **not verified**.

## 1. What the source really exposes

The IOMA Paris store (ioma-paris.com) is a Shopify shop. Only its public, unauthenticated storefront JSON is used. No
admin API, no credentials, no scraping of HTML, and the import never bypasses a limit.

### 1.1 Endpoints checked

| Endpoint                                          | Result                                                                                                                                               | How it was checked                                           |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `GET /products.json?limit=1`                      | **Works** (public). Shape below.                                                                                                                     | Fetched on 2026-11-06 through the assistant's web-fetch tool |
| `GET /products/{handle}.js`                       | **Works** (public), richer variant data.                                                                                                             | Same, for `eau-de-soin-lumiere`                              |
| `GET /collections/kits-et-routines/products.json` | **Works** (public): 12 products, handles and image lists matched the local catalogue.                                                                | Same                                                         |
| `GET /collections/all/products.json`              | **Not verified.** Direct requests from the development machine were answered `HTTP 429 local_rate_limited`, and the tool was not asked for this URL. | curl from the repo machine                                   |
| `GET /products.json` direct from the repo machine | `HTTP 429` at the time of writing (rate limited after repeated requests on the same day). The import center therefore also accepts a JSON file.      | curl                                                         |

Total catalogue size is **not verified live**. The only complete export in the repository is
`scratch/official-products-raw.json` (taken 2026-08-22 from `/products.json`).

### 1.2 `/products.json` fields (observed)

```
{ products: [ {
  id, title, handle, body_html, published_at, created_at, updated_at, vendor, product_type, tags,
  options:  [ { name, position, values[] } ],
  variants: [ { id, title, option1, option2, option3, sku, requires_shipping, taxable, featured_image,
                available, price, grams, compare_at_price, position, product_id, created_at, updated_at } ],
  images:   [ { id, created_at, position, updated_at, product_id, variant_ids[], src, width, height } ]
} ] }
```

### 1.3 `/products/{handle}.js` fields (observed)

Product: `id, title, handle, description, published_at, created_at, vendor, type, tags, price, price_min, price_max,
available, price_varies, compare_at_price(_min/_max/_varies), variants, images, featured_image, options, url, media,
requires_selling_plan, selling_plan_groups`.
Variant adds `name, public_title, options[], weight, inventory_management, barcode, quantity_rule{min,max,increment},
unit_price, unit_price_measurement, quantity_price_breaks, selling_plan_allocations`.
`images` is a list of URL strings; `media[]` has `alt, id, position, preview_image, aspect_ratio, height, media_type, src, width`.

### 1.4 What is NOT available (do not look for it)

- **No inventory quantity.** `inventory_quantity` is absent; only `available` (boolean) and `inventory_management`.
- **No collections** on the product, **no metafields**, **no SEO title/description fields**, **no cost price**.
- `barcode` exists only in the `.js` endpoint, not in `/products.json`.
- Prices are the French shop's **EUR** prices as strings. They are kept as reference and never become Dubai prices.
- Rich content (details, texture, results, INCI, how-to-use) is not in `body_html` for IOMA products; the earlier
  one-off import obtained it from the shop's page metafields, which this sync does not touch.

### 1.5 The export in the repository (`scratch/official-products-raw.json`)

63 products, 87 variants, 235 images; vendors: IOMA Paris 55, IOMA Haircare 8; all 63 have `body_html`;
6 products have more than one variant (options seen: `Title`, `Formule`, `Format`, `Montants`, `volume`);
4 variants have **no SKU** (the sync can neither match nor create them and ignores them); 3 variants
`available: false`; 15 variants have a `compare_at_price`. All rows carry one `updated_at` (2026-08-22T17:00:36+02:00).

## 2. Local data (audited 2026-11-06, development database)

63 products, 71 variants, 235 media assets (of which 52 lacked card/thumbnail derivatives, now generated),
all 63 products published (14 had been drafts until the kits and gift card were published for review).
Existing links to the source: `sourceUrl` and a free-form `sourceMetadata` blob (`source`, `originalType`,
`originalGamme`, `shopifyRaw` rich text, `importedAt`). Both are kept untouched.

## 3. Mapping to MongoDB

| Source                                     | Local                                                | Notes                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `id`                                       | `products.source.externalId`                         | **Stable match key.** Products that predate the sync are matched by `slug == handle` once, then linked. |
| `handle`                                   | `slug`, `source.handle`                              | Slug is never changed by a sync.                                                                        |
| `title`                                    | `name.fr`                                            | Source is French. `name.en/ar` start as the French text and are listed in `source.untranslated`.        |
| `body_html`                                | `description.fr` (plain text)                        | New products only; later changes are mixed (conflict aware).                                            |
| `vendor`, `product_type`, `tags`           | `vendor`, `productType`, `tags`                      | `productType`/`tags` are reference labels; IOMA classification stays local.                             |
| `variants[].sku`                           | `productVariants.sku`                                | Variant match key. Variants without SKU are ignored.                                                    |
| `variants[].option1..3`                    | `productVariants.size`                               | `"Default Title"` becomes `Standard`.                                                                   |
| `variants[].price`, `compare_at_price`     | not stored as a price                                | Kept in `source.raw` for reference only.                                                                |
| `variants[].available`, `grams`, `barcode` | `source.raw`                                         | Reference. UAE stock is local.                                                                          |
| `images[]`                                 | `source.knownImageIds`, optional download into MinIO | Offered once; local images are never removed.                                                           |
| whole row                                  | `source.raw`, `source.rawHash`                       | Used for change detection and the raw JSON viewer.                                                      |

New schema fields: `products.source` (object, sparse index on `source.externalId`) and the `importRuns` collection.
No existing field was removed or renamed, no data migrated, so no destructive migration is involved.

## 4. Field ownership matrix (also shown in the import center)

| Field                                                | Owner     | Approval           |
| ---------------------------------------------------- | --------- | ------------------ |
| source id / handle / url                             | Source    | –                  |
| `vendor`, `tags`                                     | Source    | –                  |
| `productType`, `name.fr`                             | Source    | required           |
| `name.en`, `name.ar`                                 | Mixed     | –                  |
| `description.fr`                                     | Mixed     | required           |
| source image list                                    | Source    | required           |
| variants: SKU, option label, source availability     | Source    | required           |
| **AED retail price, compare-at**                     | **Dubai** | never overwritten  |
| **Professional (B2B) price, MOQ**                    | **Dubai** | never overwritten  |
| **Stock, reserved, low-stock threshold, backorder**  | **Dubai** | never overwritten  |
| **`status`, `visibility`, `uaeAvailability`, `seo`** | **Dubai** | never overwritten  |
| range, categories, concerns, skin/hair types         | Dubai     | chosen at creation |
| badges, best seller, rating, complementary products  | Dubai     | –                  |
| other content (how to use, results, INCI…)           | Dubai     | –                  |

Rules enforced by `modules/catalog-sync/sync-core.ts`:

- **Source** fields update only when the source changed _and_ the local value is unchanged since the last sync.
  If both changed it is a **conflict**: local is kept unless the administrator picks the source value.
- **Mixed** fields: the source gives the first value, later local edits win.
- A product never synced before shows differences as **informational** (`diverged`): local is kept by default.
- A product that disappears from a full source file is **flagged**, never deleted or unpublished.
- New products arrive as **draft**, unpriced, `uaeAvailability = PENDING`. They are published only if the
  administrator ticks "publish immediately" for that apply.
- A stale preview (the product was edited after it) is rejected instead of overwriting the newer edit.
- Re-importing the same JSON changes nothing (`rawHash` equality).
- Historical order items are not touched: the sync has no code path to `orders`.

## 5. Interfaces

API (administrators only; reads `commerce.view`, writes `commerce.manage`; every write is audit logged):
`GET /api/catalog-sync/{overview,stats,ranges,runs,runs/:id,runs/:id/report.csv}`,
`POST /api/catalog-sync/preview`, `POST /api/catalog-sync/runs/:id/apply`, `POST /api/catalog-sync/runs/:id/rollback`.
Live fetch (`mode: "live"`) is manual only: one request every 1.5 s, stops on HTTP 429. There is no scheduler.

Admin: `/admin/products/import` (also `/admin/catalogue/imports`) — connection status, JSON upload, live fetch,
preview with per-field differences, approvals, apply, retry failed, history, CSV report, rollback, ownership matrix;
`/admin/products` shows database-counted catalogue health; the product editor's "Source / technical data" card shows
the link, sync status, still-French fields and the raw JSON.

## 6. Dry run against the real data (2026-11-06, nothing applied)

Preview of `scratch/official-products-raw.json` against the development catalogue: 63 read, 0 file errors,
0 new products (all 63 matched by handle), 63 flagged "update" because they were never synced (first-sync
differences: `description.fr` differs on 42 products, `vendor` on 8), **37 source variants have a SKU the local
catalogue does not have**, **6 local variants have a SKU absent from the export**. No conflicts. See
`scratch/sync-dryrun-result.json`.

## 7. Tests

`sync-core.spec.ts` (12 tests: parsing, ownership, diff, idempotency, conflicts) and
`catalog-sync.integration.spec.ts` (11 tests on a throw-away MongoDB: create, approvals, local edits, idempotent
re-import, conflict, stale preview, new variants/flagging, rollback, invalid file, statistics). Run with
`pnpm --filter api exec jest src/modules/catalog-sync`.

## 8. Not covered yet

Collections admin, product attributes admin, inventory adjustment history, stock bulk actions, per-field translation
side-by-side editor, B2B documents/protocol links in the editor, optimistic concurrency on the existing editor's save,
sync-conflict flag on products (`source.status`) after a preview, live pagination count, FR as an editable language
(French is no longer a served locale of the site).
