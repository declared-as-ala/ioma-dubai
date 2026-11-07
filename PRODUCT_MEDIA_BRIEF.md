# IOMA Paris Dubai — Admin Navigation + Professional Product Management + MinIO Media UX

You are continuing the existing production project:

C:\Users\Ala\Desktop\ioma

I want you to improve two important areas of the Admin:

1. Make navigation between Admin pages smooth, fast and polished.
2. Completely improve Product Management, especially PRODUCT IMAGES.

The current Product Admin is too raw.

Problems visible now:

- Product list has no useful product thumbnails.
- Product detail shows raw database values and IDs.
- `image URLs` are displayed as plain text URLs.
- Product media management is not professional.
- Product create/edit UX is too basic.
- Navigation between Admin pages feels abrupt.
- Empty states like Stock Adjustments are too plain.
- Raw MongoDB IDs are exposed where human-readable labels should appear.

This must become a professional production-grade Product Management experience.

Do NOT rebuild the whole Admin from scratch.

Keep the current Carbon-inspired Admin architecture and improve it systematically.

Do not commit or push unless I explicitly ask.

==================================================

1. AUDIT FIRST
   \==================================================

Before touching code, inspect:

- Admin layout
- Admin sidebar
- Admin navigation
- Products list
- Product detail page
- Product create/edit page
- Product schema
- ProductVariant schema
- MediaAsset schema
- MinIO service
- Current image uploader
- Product seed/import logic
- Existing image URL fields
- Public product cards
- PDP image gallery
- B2B product pages
- AI recommendation product cards
- Cart/order product snapshots

Read:

CLAUDE.md
DESIGN_SYSTEM.md
PROGRESS.md
TODO.md
SPRINTS.md
DECISIONS.md
DATA_MODEL.md
API_SPEC.md

Find out how media is currently stored before changing the architecture.

================================================== 2. IMPORTANT MEDIA ARCHITECTURE
==================================================

Do NOT store raw image binary inside MongoDB.

Correct architecture:

Browser
→ NestJS upload endpoint
→ MinIO
→ MediaAsset metadata in MongoDB
→ Product references MediaAsset(s)

MongoDB should store things such as:

- mediaAssetId
- objectKey
- bucket
- MIME type
- width
- height
- alt text
- order
- primary flag
- original filename
- checksum if useful

MinIO stores the actual image file.

Product should reference MediaAsset records.

Do NOT permanently store temporary signed URLs in MongoDB.

URLs should be generated from the object key/media asset when needed.

================================================== 3. PRODUCT IMAGE UPLOAD
==================================================

I want Admin to be able to upload product images directly.

In Product Create/Edit:

Add a professional:

PRODUCT MEDIA

section.

Features:

- Drag & drop
- File picker
- Multi-image upload
- Upload progress
- Preview before save
- Upload error state
- Retry
- Remove
- Reorder
- Set primary image
- Alt text
- Image position/order

Accepted formats should follow the project's policy, ideally:

JPEG
PNG
WEBP

Validate:

- MIME type
- extension
- maximum size
- corrupted files
- dimensions where appropriate

Do not trust client MIME type only.

================================================== 4. MINIO STORAGE
==================================================

Every uploaded product image must be uploaded to MinIO.

Use an organized object structure, for example:

products/{productId}/{uuid}.webp

or follow the existing MinIO convention.

Do not create random object paths.

Where useful, preserve original upload separately or create optimized derivatives.

Do not expose MinIO credentials to frontend.

Frontend uploads only through our backend/API or a properly controlled signed-upload mechanism.

================================================== 5. IMAGE OPTIMIZATION
==================================================

Before or during storage, optimize product images where architecture supports it.

Keep:

- high visual quality
- correct aspect ratio
- transparency where needed

Generate sensible web-ready images.

Do not aggressively compress luxury product photography.

Store useful dimensions.

Avoid uploading huge 15–30 MB originals and serving them directly to customers.

================================================== 6. PRODUCT LIST MUST SHOW REAL IMAGES
==================================================

Current `/admin/products` list needs a major UX improvement.

Add a thumbnail column.

Example:

IMAGE | PRODUCT | RANGE | STATUS | VISIBILITY | PRICE | STOCK | ACTIONS

The image column must render the REAL image.

Do NOT show:

https://...
objectKey
Mongo URL string

Render an actual thumbnail.

If no image exists:

show a polished neutral placeholder:

NO IMAGE

Do not use broken browser image icons.

================================================== 7. PRODUCT TABLE REDESIGN
==================================================

Improve `/admin/products`.

Recommended columns:

Image
Product
SKU
Range
Category
Visibility
Status
Price
Stock
Updated
Actions

Product cell:

thumbnail
product name
size/variant summary

Range should display human-readable:

HYDRA

not Mongo ID:

6a735a...

Category should display:

Body Care

not ObjectId.

Price:

AED 421

Stock:

24 available

Status:

Published / Draft / Archived

Visibility:

B2C / B2B / Both

================================================== 8. NEVER SHOW RAW DATABASE IDS AS NORMAL UI
==================================================

In the screenshot, Range currently shows values such as:

6a73...

This is not acceptable for normal Admin UX.

Resolve references server-side or through populated DTOs.

Display:

Range:
HYDRA

Category:
Body Care

Concern:
Hydration

Keep technical Object IDs only inside a dedicated:

TECHNICAL INFORMATION

section if genuinely useful for debugging/admin.

================================================== 9. PRODUCT DETAIL PAGE REDESIGN
==================================================

The current:

Products · Record details

page looks like a raw database inspector.

Redesign it into a real Product Detail Admin page.

Header:

[Product thumbnail]

Duo soins du corps

DRAFT
B2C

Actions:

EDIT
DUPLICATE
ARCHIVE

Then organize sections/tabs:

OVERVIEW
MEDIA
PRICING & STOCK
CLASSIFICATION
SKIN & ROUTINE
INGREDIENTS
SEO
TRANSLATIONS
TECHNICAL

================================================== 10. PRODUCT OVERVIEW
==================================================

Overview should show clean fields:

Product name
Slug
Short benefit
Description
Range
Category
Visibility
Status
Routine time
Size
SKU

Do not dump database field/value rows.

Use readable structured sections.

================================================== 11. PRODUCT MEDIA TAB
==================================================

This is critical.

Show a REAL image gallery.

Primary image:

large preview.

Secondary images:

thumbnail grid.

Actions:

UPLOAD IMAGES

REORDER

SET AS PRIMARY

EDIT ALT TEXT

REMOVE

REPLACE

Click thumbnail:

open larger preview/lightbox.

Do not display image URLs as plain text.

================================================== 12. REMOVE RAW IMAGE URL DISPLAY
==================================================

Everywhere the Admin currently shows:

Image URLs:
https://...

replace this with actual image previews.

If an Admin needs technical information, optionally provide:

View source URL

inside an overflow/details action.

But the main UI must show the image.

================================================== 13. EXISTING EXTERNAL PRODUCT IMAGES
==================================================

Some imported products may currently reference remote Shopify/IOMA URLs.

Audit those records.

If the project has permission to store those official assets:

migrate them into MinIO.

Process:

remote authorized image
→ download safely server-side
→ validate
→ upload to MinIO
→ MediaAsset
→ replace external reference

Keep source URL only as traceability metadata if needed.

Do NOT hotlink production product media when local MinIO media exists.

Do not bypass protected or unauthorized remote assets.

================================================== 14. PRODUCT CREATE PAGE
==================================================

Create Product must become a professional workflow.

Suggested sections:

1. General
2. Media
3. Pricing & Inventory
4. Classification
5. Skin Concerns
6. Ingredients
7. Routine
8. Visibility
9. SEO
10. Translations

Use:

Save Draft

Publish

Cancel

Show:

unsaved changes state.

Prevent duplicate submissions.

================================================== 15. PRODUCT EDIT PAGE
==================================================

Product Edit must allow:

- modify product
- add/remove/reorder images
- primary image
- price
- stock
- B2C/B2B visibility
- category
- range
- concern mapping
- ingredients
- usage
- SEO
- translations

Use the same component/system as Create where possible.

Do not create two inconsistent form architectures.

================================================== 16. PRODUCT IMAGE DELETE SAFETY
==================================================

This project must not accidentally remove unrelated images.

When deleting one product image:

1. Remove correct Product ↔ MediaAsset reference.
2. Delete only intended MinIO object when safe.
3. Do NOT delete two images.
4. Do NOT delete image used by another product unless reference count/business rules permit it.

Add regression test.

================================================== 17. PUBLIC WEBSITE IMAGE RENDERING
==================================================

After fixing Product Media, verify the actual storefront.

Real product images must appear in:

Homepage Best Sellers

Shop

Product Cards

Product Detail Page

Search results

Wishlist

Cart

Checkout

Order details

Saved routines

AI Skin Expert recommendations

Standard Diagnosis recommendations

B2B catalogue

Professional orders

Admin

No feature should display raw image URL instead of the actual image.

================================================== 18. CENTRAL PRODUCT IMAGE COMPONENT
==================================================

Where appropriate, create/reuse a consistent ProductImage component.

It should accept:

MediaAsset
or product media DTO

Handle:

image URL resolution
fallback
alt text
responsive sizes
loading
error state
object-fit

Do not recreate image URL logic separately in 15 components.

================================================== 19. MEDIA URL RESOLUTION
==================================================

Create/verify a proper backend/frontend strategy.

For PUBLIC product images:

either:

- stable public MinIO/CDN URL

or:

- backend media endpoint

depending on current architecture.

For PRIVATE assets:

use signed URLs.

Do not use signed 5-minute URLs for public product images if that causes broken cached product cards.

Keep private/public bucket responsibilities clear.

================================================== 20. PRODUCT IMAGE DTO
==================================================

The API should return useful media data.

Example concept:

{
"id": "...",
"url": "...",
"alt": "...",
"width": 1200,
"height": 1200,
"isPrimary": true
}

Product:

{
...
"media": [...],
"primaryImage": {...}
}

Do not force every frontend page to understand MinIO object keys.

================================================== 21. PRODUCT PRICE AND STOCK
==================================================

The screenshot currently shows empty:

Prices and stock

for some products.

Improve this.

Display meaningful information:

B2C Price:
AED ...

B2B Price:
AED ...

Available:
...

Reserved:
...

Total:
...

Low Stock Threshold:
...

If UAE price is pending:

show:

UAE PRICE PENDING

not an empty dash without explanation.

================================================== 22. DRAFT PRODUCTS
==================================================

Many current products appear as:

Draft

Improve Draft UX.

Admin should immediately know why it cannot publish.

Potential validation:

Missing UAE price
Missing image
Missing category
Missing required translation
Missing stock configuration

Add:

PUBLISHING CHECKLIST

Example:

✓ Product name
✓ Description
✕ AED Price
✕ Product image
✓ Category

Do not invent requirements; use actual business rules.

================================================== 23. SMOOTH ADMIN NAVIGATION
==================================================

Navigation between Admin pages currently feels abrupt.

Make Admin interactions smooth and professional.

Improve:

Sidebar navigation
List → Detail
Detail → Edit
Back to list
Tabs
Drawers
Dialogs
Filters

Use subtle motion only.

Recommended:

Page content:
opacity 0 → 1
translateY 4–8px → 0

Duration:
150–220ms

Do NOT make Admin navigation slow.

================================================== 24. KEEP ADMIN SHELL STABLE
==================================================

When navigating:

Products
→ Inventory
→ Orders
→ Customers

the Admin Header and Sidebar should remain stable.

Only main content should change.

Avoid:

full-page white flash

sidebar remount flicker

scroll jump

layout shift

unnecessary loading screen

Use Next.js layouts correctly.

================================================== 25. ROUTE LOADING
==================================================

Add appropriate route-level loading states.

Use Carbon-inspired skeletons.

Examples:

Table skeleton

Product detail skeleton

Product edit skeleton

Do NOT show a giant centered spinner.

================================================== 26. ADMIN LINK FEEDBACK
==================================================

When clicking Sidebar item:

give immediate visual active/pressed feedback.

If route takes noticeable time:

use subtle progress/loading feedback.

Do not artificially delay routing for animation.

================================================== 27. SMOOTH TABLE INTERACTION
==================================================

For filters/search/pagination:

avoid entire screen flashing.

Keep:

header
filters
table structure

stable.

Update rows smoothly.

Use skeleton/opacity state when necessary.

================================================== 28. IMAGE UPLOAD UX
==================================================

When uploading:

show each image individually.

Example:

product-1.jpg
Uploading 65%

Then:

✓ Uploaded

If one fails:

✕ Failed
RETRY

Do not fail all uploads because one file failed unless transaction rules require it.

================================================== 29. DRAG-AND-DROP REORDERING
==================================================

Allow Admin to reorder product gallery images.

Persist order in database.

Example:

1 PRIMARY
2
3
4

Reordering must survive page refresh.

================================================== 30. PRIMARY IMAGE
==================================================

Every product should have at most one primary image.

When changing primary image:

update atomically/safely.

Product cards should automatically use the primary image.

PDP gallery should display primary first.

================================================== 31. IMAGE ALT TEXT
==================================================

Allow Admin to provide localized or appropriate alt text.

At minimum store useful alt text.

If none exists:

use safe fallback based on product name.

Do not expose meaningless filenames as alt text.

================================================== 32. CATEGORY ADMIN
==================================================

Current Categories table should also be improved.

Show:

Name
Slug
Parent Category
Product Count
Status
Actions

Do not show raw ObjectIds.

If categories can have image/hero media:

show real preview.

================================================== 33. PRODUCT RANGE ADMIN
==================================================

Improve Product Ranges.

Show:

Range name
Range number
Official color indicator
Products count
Hero/media
Status

Examples:

1 HYDRA
2 ENERGIZE
3 RENEW

Range references across Product Admin should always be human-readable.

================================================== 34. INVENTORY / STOCK ADJUSTMENTS
==================================================

Current empty Stock Adjustments screen is too basic.

If no records:

show:

NO STOCK ADJUSTMENTS YET

“Manual inventory corrections will appear here.”

CTA if authorized:

CREATE STOCK ADJUSTMENT

When records exist show:

Date
Product image
Product
SKU
Previous stock
Adjustment
New stock
Reason
Admin
Reference

================================================== 35. SEARCH
==================================================

Product search should search:

Name
SKU
Slug
Range
Category

Search results must include thumbnail.

Do not label every search field:

"Search orders, products and people"

inside Products page.

Use contextual placeholder:

Search products by name, SKU or slug

Orders:

Search orders by number or customer

Categories:

Search categories

Global Admin search can retain cross-entity search.

================================================== 36. ACTIONS
==================================================

Instead of only:

View

use appropriate row actions:

View
Edit
Duplicate
Archive

Secondary actions can live inside overflow menu.

Do not overload every row.

================================================== 37. PRODUCT PREVIEW
==================================================

Add:

VIEW ON WEBSITE

from Product Detail/Edit for published products.

Open the actual PDP.

Admin can immediately verify how the product looks publicly.

================================================== 38. PRODUCT IMAGE PREVIEW IN ORDERS
==================================================

Orders Admin should also show small item/product thumbnails when viewing an order.

Order list does not necessarily need every item image.

Order Detail should show:

image
name
variant
SKU
quantity
unit price

================================================== 39. B2B PRODUCT MEDIA
==================================================

Professional Catalogue / Cabin Products must use the same real MediaAsset system.

Do not create separate image fields for B2B unless business requirements require separate professional imagery.

================================================== 40. AI SKIN EXPERT PRODUCT IMAGES
==================================================

This is critical.

When AI recommends an IOMA product:

show the actual product image from the database/MinIO.

Pipeline:

AI recommendation returns Product ID

→ Backend retrieves real Product

→ MediaAsset

→ actual product image

Do NOT let LLM produce image URLs.

================================================== 41. MIGRATE EXISTING IMAGE DATA
==================================================

Inspect existing product records.

Some currently contain:

imageUrls: ["https://..."]

Create a safe migration if needed:

1. Backup product/media data.
2. Discover existing external images.
3. Download authorized images.
4. Validate.
5. Upload into MinIO.
6. Create MediaAsset.
7. Attach to product.
8. Set primary image.
9. Verify.
10. Remove/deprecate old raw URL field only when no longer required.

Make migration idempotent.

Do not duplicate images on repeated runs.

================================================== 42. DO NOT DESTROY EXISTING CATALOGUE
==================================================

Do not blindly remove current images or products.

Before migration:

backup.

After migration:

verify counts.

If image migration fails:

keep original source metadata and report it.

================================================== 43. RESPONSIVE ADMIN
==================================================

Verify all enhanced Product Admin screens at:

1440
1280
1024
768
390

At mobile:

Product table may adapt or horizontally scroll inside controlled container.

Product thumbnail remains visible.

Image uploader works.

Media gallery works.

Edit form works.

No document horizontal overflow.

================================================== 44. ACCESSIBILITY
==================================================

Image actions must have accessible labels.

Examples:

Set Duo soins du corps image as primary

Remove image

Move image left/right

Upload product image

Keyboard users must be able to operate media controls.

Do not make drag-and-drop the only reordering method.

================================================== 45. PERFORMANCE
==================================================

Do not load full-resolution 4K product images as 48px Admin thumbnails.

Use optimized thumbnail sizes.

Use Next.js Image or existing optimized media layer correctly.

Avoid N+1 media queries on product table.

Backend should return primary image efficiently.

================================================== 46. CACHE INVALIDATION
==================================================

When Admin changes:

Product image
Primary image
Price
Stock
Product name

ensure storefront data/cache updates correctly.

The Admin must not show new image while Shop continues showing old image indefinitely.

Use existing Next.js/cache invalidation architecture.

================================================== 47. API TESTING
==================================================

Add tests for:

Product image upload

Multiple images

Invalid MIME

Oversized image

Media persistence

Set primary

Reorder

Delete one image

Ownership/product relation

Product DTO returns primary image

Product list returns thumbnail

MinIO failure

================================================== 48. PLAYWRIGHT PRODUCT FLOW
==================================================

Create/extend E2E:

Admin Login

→ Products

→ Create Product

→ Upload image

→ preview appears

→ Save Draft

→ refresh

→ image still appears

→ Edit

→ upload second image

→ set second primary

→ reorder

→ save

→ Product list shows new primary thumbnail

→ View Product

→ actual image shown

→ View on Website

→ PDP shows same image

This test is important.

================================================== 49. EXISTING PRODUCT TEST
==================================================

Take at least one current imported product.

Verify:

Admin product list:
real thumbnail

Admin product detail:
real gallery

Admin edit:
media manageable

Shop:
same product image

PDP:
same image

Wishlist:
same image

Cart:
same image

AI recommendation:
same image

B2B:
same image where appropriate

================================================== 50. NAVIGATION TEST
==================================================

Playwright:

Products
→ Category
→ Orders
→ Product Ranges
→ Products

Verify:

Sidebar remains stable.

No page flash.

Active state correct.

No horizontal overflow.

No runtime errors.

================================================== 51. DOCUMENTATION
==================================================

Update PROGRESS.md:

- Admin navigation smoothing
- Product Management redesign
- MinIO product media
- Product image migration
- Image rendering changes
- Tests

Update DECISIONS.md:

- MediaAsset architecture
- MinIO object strategy
- Public product URL strategy
- Product primary image rules
- Admin navigation motion strategy

Update DATA_MODEL.md if schema changes.

Update TEST_PLAN.md.

================================================== 52. IMPORTANT FINAL RULE
==================================================

I do NOT want to see raw image URLs as the normal user-facing representation anywhere.

If a record contains:

https://cdn.shopify.com/...

the UI should render:

[ACTUAL PRODUCT IMAGE]

not:

https://cdn.shopify.com/...

URLs are implementation details.

Images must look like images.

================================================== 53. FINAL RESULT
==================================================

I want the Product Admin to feel like a real professional ecommerce back-office.

PRODUCT LIST:

thumbnail
name
range
price
stock
status

PRODUCT DETAIL:

large product image
gallery
clear business data
pricing/stock
classification
SEO

PRODUCT EDIT:

beautiful media uploader
drag/drop
preview
reorder
primary image
real forms

EVERYWHERE:

real images instead of URL text.

And while navigating Admin:

Products
→ Orders
→ Inventory
→ Categories

the experience should feel:

fast
smooth
stable
professional

not like separate raw pages loading abruptly.

================================================== 54. FINAL REPORT
==================================================

When complete tell me:

1. Current media architecture found
2. Product schema changes
3. MediaAsset changes
4. MinIO storage strategy
5. Existing external images migrated
6. Products with failed/missing images
7. Admin Product List redesign
8. Product Detail redesign
9. Product Edit redesign
10. Upload/reorder/primary functionality
11. Public product image verification
12. AI recommendation image verification
13. B2B image verification
14. Navigation smoothness changes
15. Responsive result
16. Typecheck
17. Tests
18. Build
19. Playwright
20. Remaining issues

Do not stop after changing CSS.

Implement the complete Product Media lifecycle from Admin upload → MinIO → MongoDB MediaAsset → API → Admin preview → public Shop/PDP/Cart/AI/B2B.

Do not commit or push unless I explicitly request it.
