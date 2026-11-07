# Product media audit — 2026-09-06

This records the pre-implementation baseline. See PRODUCT_MEDIA_IMPLEMENTATION.md and PRODUCT_MEDIA_COMPLETION.md for subsequent changes and verification.

The local MongoDB catalogue contains 63 products (49 published, 14 drafts), 70 variants and 177 image references: 163 local paths and 14 Shopify CDN URLs. No MediaAsset collection or product-media references exist. This is an audit, not proof that every image is valid.

The official catalogue importer copies some images to MinIO but saves local public-directory paths on products; unmatched official products retain external URLs. Existing originals must remain recoverable until migration is verified. No catalogue re-import is required for media migration.

The generic admin resource list/detail/form exposes product image strings and reference identifiers. There is no dedicated product uploader, primary-image operation, gallery ordering or shared-media deletion policy. Variant inventory adjustments already have a guarded, audited ledger and must remain the authority for stock changes.

Catalog, cart, wishlist, diagnosis and recommendation generation consume Product.images. Saved AI routines retain image snapshots. Order lines have no image presentation. Public product images need stable URLs; private diagnosis and professional documents must retain separate authorization/signed-access rules.

The root PageTransition keys its entire descendant tree by pathname, remounting the admin shell on navigation. Admin needs a persistent shell and a short transition restricted to its main content. Existing generic queries also replace tables during loading.

Implementation target: dedicated MediaAsset metadata, validated JPEG/PNG/WebP decoded and resized into immutable MinIO originals/main/card/thumbnail objects, ordered product references with the first as primary, stable API image URLs, a shared product editor, batch DTO resolution, safe detach semantics, and a backed-up idempotent migration. Verification and completion remain pending.
