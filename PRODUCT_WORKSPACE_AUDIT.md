# Product workspace audit — 2026-09-07

Before this change, AdminProductDetail rendered nine read-only tabs. AdminProductEditor rendered a separate long form at /admin/products/[id]/edit. Both lived in admin-products.tsx. Media already used ordered MediaAsset relations, revision checks and MinIO derivatives; these operations must be reused. Pricing used separate inventory links and an immediate variant-create dialog. The product API supports localized content, range/categories/concerns, usage period, visibility/status/availability, ingredient text, benefits, texture and localized SEO. Variant prices are integer AED minor units; stock changes must use the guarded adjustment endpoint.

The product schema has no independent canonical/indexable/OG override, tags, product-type, skin-type or routine-position fields. Recommendation knowledge derives suitability and positioning through the existing engine. Do not expose dummy editable settings. Active ingredients currently use localized descriptive text, alongside full INCI and benefits; there is no independent ingredient entity catalogue.

Current user brief is preserved in PRODUCT_WORKSPACE_BRIEF.md. The canonical management route becomes /admin/products/[id], with optional ?mode=edit. The old edit URL redirects safely. Creation reuses the same state and sections.
