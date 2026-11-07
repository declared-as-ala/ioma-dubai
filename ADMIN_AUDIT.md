# Admin redesign audit — 2026-09-06

Read with ADMIN_REDESIGN_BRIEF.md. Implementation is in progress; historical roadmap entries are not evidence of working management APIs.

## Current findings

- `/admin` displays literal KPI values (3, 14, 5, 14), with no analytics endpoint or chart dependency.
- Its sidebar has six entries, fixed width and public storefront chrome around the workspace. Links use unlocalized Next links.
- Product and partner controllers expose public reads, not administrative mutations. Orders expose an unpaginated administrator list; detail and cancellation remain owner-only. The existing B2B application review, private document access and suspension workflow works and must be reused.
- MongoDB contains operational schemas for orders, products/variants/ranges/categories, users/profiles/addresses, applications/profiles, partners/services/treatments/availability, appointments, training/sessions/bookings, protocols, documents, diagnoses/AI/consent and audit logs.
- No live promotions, review-moderation or CMS controller/schema exists despite historical roadmap claims. Promotions/reviews are conditional in the brief; omit unsupported navigation. Structured content management is explicitly approved new scope.
- Roles already include administrator, super_administrator, content_editor, customer_support, order_manager, partner_manager and training_manager. JWT authentication reads current roles from MongoDB. Granular admin permission mapping and management are missing.
- Orders have `paymentStatus` and `fulfillmentStatus`, not a generic status. Revenue must use paid AED orders excluding cancelled fulfillment and refunded payments. Product line revenue differs from order gross revenue (tax/shipping).
- AI records lack reliable processing timestamps/model telemetry. Add explicit measurements for future jobs; existing missing measurements remain unavailable. Provider configuration is not proof of health.
- Training certificates can reference a real document, but issuance is absent. Invoice/refund integrations are absent; do not fabricate an invoice or mark a payment refunded without provider confirmation.

## Implementation approach

Reuse domain collections and the existing B2B workflow. Add a protected admin module for backend aggregation, permission-scoped management, search, uploads and audit events. Public admin navigation uses a server-returned access response. Separate storefront chrome from the admin shell. Use reusable accessible React/SVG charts (no chart package exists), consistent Carbon-style panels and forms, local table overflow and a mobile drawer. Implement structured content fields rather than raw JSON editing.

## Verification required

Controlled revenue/channel fixtures; date comparison including zero baseline; anonymous/customer/professional denial and staff permission scoping; management mutations and audit records; document privacy; all five breakpoints, mobile drawer, filtered KPI navigation and public Admin Panel link. Recheck existing account/B2B flows after integration.

## Implementation follow-up (2026-09-06)

The historical gaps above have been addressed by the dedicated admin module and shell. See ADMIN_IMPLEMENTATION.md for the implemented architecture and operating definitions, and PROGRESS.md for actual verification. Native Mongo aggregation replaces the literal dashboard metrics. Server permissions protect resource lists, forms, actions, private files and role assignment. Providers remain explicitly configured/unverified or show a recorded outcome; no live-health result is fabricated. Final verification is tracked separately from implementation.
