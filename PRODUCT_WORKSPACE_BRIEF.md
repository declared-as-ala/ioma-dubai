# IOMA Paris Dubai — Redesign Admin Product Detail + Inline Editing Inside Tabs

You are continuing the existing production project:

C:\Users\Ala\Desktop\ioma

I want you to redesign and improve the Admin Product Detail experience.

Current route example:

http://localhost:3000/en/admin/products/6a89bccb2c112077607ea7b7

Current separate edit route:

http://localhost:3000/en/admin/products/6a89bccb2c112077607ea7b7/edit

I DO NOT want a separate `/edit` page anymore.

I want the Product Detail page itself to become a premium, modern, smooth product-management workspace where the Admin can view AND edit the product directly inside the existing tabs.

Desired architecture:

/admin/products/[id]

= View Product

- Edit Product
- Media Management
- Price & Stock
- Classification
- Skin & Routine
- Ingredients
- SEO
- Translations
- Technical Information

all in ONE page.

Do not redirect to:

/admin/products/[id]/edit

The `/edit` route should be removed, redirected, or deprecated safely after all functionality is migrated.

==================================================

1. AUDIT CURRENT IMPLEMENTATION FIRST
   \==================================================

Before modifying code, inspect:

- `/admin/products/[id]`
- `/admin/products/[id]/edit`
- Product detail components
- Product edit form
- Tabs
- Product API
- Product DTO
- Product schema
- Product variants
- Product MediaAsset
- MinIO integration
- Pricing
- Inventory
- Categories
- Product ranges
- Skin concerns
- Ingredients
- SEO
- Translations
- Validation
- Current save/update endpoint

Do not duplicate existing edit functionality.

Reuse/refactor the current forms into the Product Detail tabs.

================================================== 2. MAIN UX CHANGE
==================================================

The Product Detail page should have two states:

VIEW MODE

and

EDIT MODE

At the top-right:

when viewing:

EDIT
DUPLICATE
ARCHIVE

When clicking:

EDIT

do NOT navigate anywhere.

Stay on:

/admin/products/[id]

The page enters:

EDIT MODE

Then header actions become:

SAVE CHANGES
CANCEL

Optional:

SAVE DRAFT

if current business logic supports it.

================================================== 3. EDIT INSIDE THE SAME TABS
==================================================

Each tab should become editable in-place.

Current tabs:

Overview
Product media
Pricing & stock
Classification
Skin & routine
Ingredients
SEO
Translations
Technical information

Keep this structure but redesign it substantially.

When Edit Mode = false:

display polished read-only information.

When Edit Mode = true:

the same tab displays editable controls.

Example:

OVERVIEW — VIEW MODE

Product Name
Duo soins du corps

Description
...

Range
3 Renew

Category
Routines & Kits

Visibility
B2C

OVERVIEW — EDIT MODE

Product Name
[input]

Short Benefit
[input]

Description
[textarea]

Range
[select]

Category
[select]

Visibility
[multi-select]

Status
[select]

Do not open another page.

================================================== 4. MODERN PRODUCT HEADER
==================================================

Redesign the top product header.

Current layout is too basic.

Create a polished product identity section:

LEFT:

Product thumbnail

CENTER:

Product name

Below:

SKU / Size / Range

Status badges:

DRAFT
B2C

Optional warning:

UAE PRICE PENDING

RIGHT:

EDIT
DUPLICATE
ARCHIVE

When editing:

SAVE CHANGES
CANCEL

The header should remain visible/sticky where useful.

Do not make it oversized.

================================================== 5. UNSAVED CHANGES
==================================================

Implement proper dirty-state tracking.

When the Admin changes something:

show:

UNSAVED CHANGES

If they try to:

- switch product
- go back
- navigate away
- close page
- exit edit mode

show a confirmation:

“You have unsaved changes.”

Options:

DISCARD CHANGES
CONTINUE EDITING

Do not lose Admin edits silently.

================================================== 6. SAVE ARCHITECTURE
==================================================

Prefer one coherent edit state across the whole product.

Admin may:

edit Overview
→ switch to Media
→ change image
→ switch to SEO
→ change title
→ Save

and all valid changes are persisted safely.

If the backend architecture requires tab-specific saves, make the UX still feel unified.

Do not force the Admin to save after every single field.

================================================== 7. TAB SWITCHING IN EDIT MODE
==================================================

Switching tabs must NOT lose changes.

Example:

Overview
→ modify name
→ Media
→ upload image
→ Pricing
→ change price
→ Overview

All unsaved values must remain.

Use proper shared form state.

Do not remount and reset forms on every tab switch.

================================================== 8. OVERVIEW TAB REDESIGN
==================================================

The Overview currently looks too flat/basic.

Create a professional two-column layout.

LEFT:

Core information

- Name
- Slug
- Short benefit
- Description

RIGHT:

Commercial summary

- Status
- Visibility
- Range
- Category
- Routine time
- Created
- Updated

Below:

PUBLISHING READINESS

Instead of simple raw bullet lines, show a clear checklist.

Example:

CONTENT
✓ Name
✓ Description
✕ Arabic translation

COMMERCE
✕ UAE price
✓ Product image

CLASSIFICATION
✓ Range
✓ Category

Then:

READY TO PUBLISH
or
3 ITEMS REQUIRED

Do not fake requirements.

Use actual validation rules.

================================================== 9. PRODUCT MEDIA TAB
==================================================

Make this one of the best-designed parts.

VIEW MODE:

Large primary product image.

Thumbnail gallery below.

Show:

Primary
Image count
Alt text

EDIT MODE:

- Drag & drop upload
- Multi-image upload
- Preview
- Upload progress
- Reorder
- Set Primary
- Replace
- Delete
- Edit alt text

Images must be stored using:

MinIO +
MediaAsset metadata in MongoDB.

Never display raw image URL as main UI.

Show actual images.

================================================== 10. PRODUCT MEDIA LAYOUT
==================================================

Suggested layout:

LEFT 60%

Large primary preview

RIGHT 40%

Media information

- Primary image
- Dimensions
- Alt
- File type
- Status

Below:

GALLERY

[image 1]
[image 2]
[image 3]
[+ Upload]

In Edit Mode allow drag-and-drop reorder.

================================================== 11. PRICING & STOCK TAB
==================================================

Redesign into meaningful blocks.

B2C PRICING

UAE Price
AED

Compare price if supported

B2B PRICING

Professional price
MOQ

Only if B2B enabled.

INVENTORY

Available
Reserved
Total
Low Stock Threshold

VARIANTS

Size
SKU
Price
Stock

Do not show:

—

without explanation.

If price missing:

UAE PRICE NOT CONFIGURED

Provide CTA/edit field.

================================================== 12. CLASSIFICATION TAB
==================================================

Show/edit:

Category
Subcategory
Product Range
Product Type
Visibility
Tags
Skin Concerns

Use searchable selectors.

Do NOT expose MongoDB ObjectIds.

Example:

Range:

3 Renew

not:

6a735a61d...

Category:

Routines & Kits

not ID.

================================================== 13. SKIN & ROUTINE TAB
==================================================

This is important for the AI Skin Expert.

Display/edit:

Suitable Skin Types

Skin Concerns

Routine Position:

- Cleanse
- Treat
- Serum
- Eye
- Moisturize
- SPF
- Mask
  etc.

Usage Period:

AM
PM
BOTH

Routine compatibility

AI Recommendation Eligibility

If there are recommendation mappings, make them understandable to Admin.

Do not expose raw scoring JSON by default.

================================================== 14. INGREDIENTS TAB
==================================================

Create structured management.

Sections:

ACTIVE INGREDIENTS

Each:

Name
Benefit
Description

FULL INGREDIENT LIST / INCI

Allow proper textarea/editor.

Do not show empty field labels only.

If empty:

“No ingredient information has been added.”

EDIT INGREDIENTS

================================================== 15. SEO TAB
==================================================

Create professional SEO editor:

SEO TITLE

META DESCRIPTION

SLUG

CANONICAL if configurable

INDEXABLE

OG IMAGE

PREVIEW

Show Google-style preview.

Warn:

Title too long
Description missing

Do not over-engineer.

================================================== 16. TRANSLATIONS TAB
==================================================

Create language tabs:

EN
FR
AR

For each:

Name
Short benefit
Description
How to use
SEO title
SEO description

Show translation completeness.

Example:

EN
100%

FR
100%

AR
65%

Arabic editor must use RTL.

Do not create separate translation pages.

================================================== 17. TECHNICAL INFORMATION TAB
==================================================

Technical data can include:

Product ID
Created
Updated
Source
Source URL
Media object references
External import metadata

This is the only place where technical identifiers such as MongoDB IDs may appear.

Do NOT show ObjectIds throughout the normal UI.

Add copy buttons where useful.

================================================== 18. INLINE EDIT COMPONENTS
==================================================

Build/reuse common admin components such as:

AdminField
AdminEditableField
AdminSection
AdminSelect
AdminStatus
AdminMediaUploader
AdminSaveBar

But do NOT over-engineer.

Only create abstractions that remove real duplication.

================================================== 19. STICKY SAVE BAR
==================================================

When Edit Mode is active and there are unsaved changes:

show a subtle sticky bottom bar:

Unsaved changes

CANCEL
SAVE CHANGES

This should remain visible while moving between tabs.

Do not obstruct content.

Mobile-safe.

================================================== 20. SMOOTH TRANSITIONS
==================================================

Make transitions polished.

Entering Edit Mode:

read-only fields
→ editable fields

Use subtle:

opacity
translateY 2–4px

150–200ms

Tab changes:

small fade.

Saving:

button shows progress.

Success:

small success notification.

Do NOT use flashy animation.

================================================== 21. SAVE SUCCESS
==================================================

After successful save:

remain on:

/admin/products/[id]

Do NOT redirect elsewhere.

Return to VIEW MODE.

Show:

PRODUCT UPDATED

Then update all displayed data immediately.

No full page reload if unnecessary.

================================================== 22. SAVE FAILURE
==================================================

If update fails:

remain in Edit Mode.

Do NOT lose form state.

Show:

Unable to save product.

Include useful field/API error.

Allow retry.

Never silently fail.

================================================== 23. FIELD VALIDATION
==================================================

Use existing Zod/validation architecture.

Show validation near relevant field.

Example:

UAE price must be >= 0

not one giant error at top only.

Also show tab-level error indicator:

Overview
●

Pricing & Stock
2 errors

so the Admin knows where invalid fields exist.

================================================== 24. REMOVE SEPARATE EDIT ROUTE
==================================================

Once all editing functionality works inside:

/admin/products/[id]

deprecate:

/admin/products/[id]/edit

Preferred behavior:

if someone opens old `/edit` URL:

redirect to:

/admin/products/[id]?mode=edit

or equivalent.

Do not leave two different Product Edit implementations.

Maintain backwards compatibility for old links.

================================================== 25. OPTIONAL EDIT MODE URL
==================================================

If useful:

/admin/products/[id]?mode=edit

can initialize Edit Mode.

But primary Edit button should remain on the same page.

Browser Back behavior should remain sensible.

================================================== 26. PRODUCT LIST → PRODUCT DETAIL
==================================================

From `/admin/products`:

clicking a row/product should open:

/admin/products/[id]

Do not require tiny “View” link only.

Still keep actions where appropriate.

Make row interaction obvious and accessible.

================================================== 27. PRODUCT LIST VISUAL IMPROVEMENT
==================================================

Ensure table shows:

Image
Product
SKU
Range
Category
AED Price
Stock
Status
Visibility
Updated
Actions

Product thumbnail must be real.

No raw image URLs.

No raw ObjectIds.

================================================== 28. CREATE PRODUCT SHOULD USE SAME SYSTEM
==================================================

Where practical, make Product Create use the same form sections/components.

Create flow:

General
Media
Pricing
Classification
Skin & Routine
Ingredients
SEO
Translations

Avoid completely separate form design.

================================================== 29. ARCHIVE ACTION
==================================================

Archive should show confirmation.

Explain:

“Archived products will no longer be available for normal storefront purchase.”

Use actual business behavior.

Do not permanently delete by mistake.

================================================== 30. DUPLICATE
==================================================

Duplicate product should copy appropriate fields.

Do NOT blindly copy:

Product ID
SKU if must be unique
inventory
order references

Media copying depends on current reference architecture.

Document behavior.

================================================== 31. PRODUCT PREVIEW
==================================================

For published products, add:

VIEW ON WEBSITE

Button.

Open real PDP.

If product is Draft:

optionally show:

PREVIEW

only if existing preview architecture supports it.

================================================== 32. RESPONSIVE
==================================================

Test:

1440
1280
1024
768
390

At mobile:

Product header stacks.

Tabs become horizontally scrollable or appropriate selector.

Sticky save bar remains usable.

Media uploader works.

Forms remain readable.

No document horizontal overflow.

================================================== 33. ACCESSIBILITY
==================================================

Ensure:

Tabs keyboard accessible.

Form labels.

Error association.

Focus management.

Save feedback.

Media action labels.

44px touch areas mobile.

Color is not only status indicator.

================================================== 34. PERFORMANCE
==================================================

Do not refetch whole product after every field change.

Do not upload same image twice unnecessarily.

Do not render full-resolution product image for small thumbnails.

Avoid unnecessary rerenders while typing.

Use current query/cache architecture correctly.

================================================== 35. REAL BROWSER VERIFICATION
==================================================

Test real flow:

Products
→ choose Duo soins du corps
→ Product Detail
→ click Edit

URL remains:

/admin/products/[id]

NOT:

/edit

Edit Overview.

Switch Media.

Upload image.

Switch Pricing.

Set AED price.

Switch Classification.

Change category.

Return Overview.

All changes still exist.

Click Save.

Verify:

API update
MongoDB update
MinIO media
Product Detail update

Refresh page.

Changes remain.

================================================== 36. PLAYWRIGHT REGRESSION TEST
==================================================

Add E2E:

Admin
→ Products
→ Product Detail

Assert:

Edit button exists.

Click Edit.

Assert URL did not navigate to `/edit`.

Update product name.

Switch tab.

Change another field.

Switch back.

First edit still present.

Save.

Reload.

Both changes persisted.

================================================== 37. MEDIA TEST
==================================================

Admin Product
→ Edit
→ Product Media
→ Upload real test image
→ preview appears
→ Save
→ reload
→ same image displayed

Verify MinIO object exists through backend/integration test.

================================================== 38. OLD EDIT ROUTE TEST
==================================================

Open:

/admin/products/[id]/edit

Verify it redirects safely to:

/admin/products/[id]?mode=edit

or chosen same-page editing behavior.

Do not return 404 if existing bookmarks may use it.

================================================== 39. DOCUMENTATION
==================================================

Update:

PROGRESS.md

Document:

- Product Detail redesign
- Same-page edit mode
- Tabs
- Product Media UX
- Validation
- Old edit route migration
- Tests

DECISIONS.md:

Document:

"Product Detail is the canonical product management workspace; separate Edit route deprecated."

DESIGN_SYSTEM.md:

Document Admin editable-detail pattern if reusable.

TEST_PLAN.md:

Add same-page edit E2E.

================================================== 40. FINAL EXPERIENCE
==================================================

I want:

Products
→ select product

Then ONE premium workspace.

I can:

see product
edit product
upload images
set prices
manage stock
change category
change range
configure skin concerns
manage ingredients
edit SEO
translate content

without leaving:

/admin/products/[id]

The page should feel like a modern ecommerce back-office, not a basic CRUD record screen.

It should feel:

modern
fast
smooth
clear
professional
enterprise-grade

Do not redesign only the Overview tab.

Enhance the COMPLETE Product Management workspace.

================================================== 41. FINAL REPORT
==================================================

When finished tell me:

1. Existing Product Detail/Edit architecture found
2. Files refactored
3. Separate edit route behavior
4. Same-page Edit Mode implementation
5. Shared form-state solution
6. Unsaved changes handling
7. Overview redesign
8. Media redesign
9. Pricing/Stock redesign
10. Classification redesign
11. Skin/Routine redesign
12. Ingredients redesign
13. SEO redesign
14. Translations redesign
15. Technical tab redesign
16. MinIO upload verification
17. Mobile verification
18. Playwright result
19. Typecheck/lint/build result
20. Remaining issues

Do not commit or push unless I explicitly ask.

Start by auditing the existing Product Detail + Product Edit implementations, then merge them into one polished same-route Product Management workspace.
