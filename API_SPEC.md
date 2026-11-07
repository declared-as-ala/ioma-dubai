# API_SPEC.md — IOMA Paris Dubai

Base URL: `/api/v1`. Full interactive contract served at `/api/docs` (Swagger UI) generated from NestJS decorators — this file documents conventions and the endpoint map; the Swagger output is the source of truth for exact request/response shapes once each module lands.

## Conventions

- **Auth**: `Authorization: Bearer <accessToken>` for protected routes; refresh via `POST /auth/refresh` using the httpOnly refresh cookie. Public routes need no header.
- **Pagination**: `?page=1&limit=20`, response envelope `{ data: T[], meta: { page, limit, total, totalPages } }`.
- **Filtering/sorting**: `?filter[field]=value&sort=-createdAt`.
- **Errors**: `{ statusCode, message, errorCode, details? }` from the global exception filter — never a raw stack trace or Mongoose error to the client.
- **Idempotency**: mutating payment/webhook endpoints accept `Idempotency-Key` header; duplicate keys return the original result without reprocessing.
- **Localization**: `Accept-Language: en|fr|ar` selects which locale field of a translatable resource is returned as `label`/`title`/etc. in list views (detail views return the full `{en,fr,ar}` object for editing contexts like admin).
- **Versioning**: URL-prefixed (`/api/v1`); breaking changes get `/api/v2`, old version kept until the frontend fully migrates.

## Endpoint Map by Module

### Auth (`/auth`)

`POST /register` · `POST /login` · `POST /refresh` · `POST /logout` · `POST /verify-email` · `POST /forgot-password` · `POST /reset-password` · `GET /me`

### Users & Profiles (`/users`, `/customer-profiles`, `/professional-profiles`, `/addresses`)

`GET/PATCH /customer-profiles/me` · `GET/POST/PATCH/DELETE /addresses` (own only) · `GET /professional-profiles/me` · `PATCH /professional-profiles/me/team` (admin/owner)

### Professional Applications (`/professional-applications`)

**Implementation update (2026-09-06):** the existing deployed controller uses `/api/professional`, not the planned paths below. Applicant routes: `GET /applications`, `POST /applications/draft`, `GET /applications/:id`, `POST /applications/:id/upload`, `POST /applications/:id/submit`. Submission validates the shared application schema, requires `termsAccepted: true` and a previously uploaded private document, and records `submittedAt`/`termsAcceptedAt`. Existing non-rejected applications are reused; only drafts and documents-requested applications can be submitted. Resubmission after a document request requires a new uploaded document. Duplicate submission races return a controlled 400/409.

Admin routes under the same prefix: `GET /admin/applications`, `GET /admin/applications/:id`, `GET /admin/applications/:id/documents/:documentId` (short-lived signed URL), `PATCH /admin/applications/:id/approve|reject|request-documents`, `GET /admin/profiles` (approved profiles), and `PATCH /admin/profiles/:id/suspend`. Rejection/document requests require `reviewNotes`; suspension requires `reason`. Admin routes require administrator or super-administrator roles. The retained metadata attachment route verifies private-document ownership and rejects duplicate attachments.

`POST /` (submit) · `GET /me` · `PATCH /:id` (draft edit, own) · `POST /:id/documents` (signed upload) · Admin: `GET /` (filterable by status) · `PATCH /:id/status` (approve/reject/request-documents/suspend)

### Catalog (`/products`, `/product-ranges`, `/categories`, `/skin-concerns`, `/ingredients`, `/product-variants`)

`GET /products` (filters: range, category, concern, search `q`) · `GET /products/:slug` · Admin CRUD on all catalog resources, `POST /product-variants/:id/media`

### Inventory & Pricing (`/inventory`, `/price-lists`)

Admin: `GET/PATCH /inventory/:variantId` · `GET/POST/PATCH /price-lists`

### Cart & Wishlist (`/cart`, `/wishlist`)

`GET /cart` · `POST /cart/items` · `PATCH /cart/items/:variantId` · `DELETE /cart/items/:variantId` · `POST /cart/apply-coupon` · `GET/POST/DELETE /wishlist`

### Orders, Payments, Shipments (`/orders`, `/payments`, `/shipments`)

`POST /orders` (checkout) · `GET /orders` (own, or admin all) · `GET /orders/:id` · `POST /orders/:id/cancel` · `POST /payments/intent` · `POST /payments/webhook/:provider` (signature-verified, idempotent) · Admin: `PATCH /orders/:id/fulfillment-status`, `POST /refunds`, `PATCH /shipments/:id`

### Partners & Booking (`/partners`, `/services`, `/treatments`, `/availability`, `/appointments`)

`GET /partners` (geo/filter query) · `GET /partners/:slug` · `GET /availability/:resourceId/slots?date=` · `POST /appointments` · `PATCH /appointments/:id/reschedule` · `POST /appointments/:id/cancel` · `GET /appointments/me` · Admin: full CRUD on partners/services/treatments/availability

### B2B Ordering (`/pro/catalog`, `/pro/cart`, `/pro/orders`)

Guarded by `ProfessionalApprovedGuard`. `GET /pro/catalog` (cabin + retail, professional pricing/MOQ) · `POST /pro/cart/items` · `POST /pro/orders` · `GET /pro/orders` · `POST /pro/orders/:id/reorder`

### Training (`/trainings`, `/training-sessions`, `/training-bookings`)

`GET /trainings` · `GET /training-sessions?trainingId=` · `POST /training-bookings` (professional-gated) · `GET /training-bookings/me` · `POST /training-bookings/:id/cancel` · Admin: CRUD trainings/sessions, `GET /training-bookings` (all), attendance marking

### Protocols & Documents (`/protocols`, `/documents`)

`GET /protocols` (professional-gated) · `GET /protocols/:slug` · `GET /documents/:id/signed-url` (ownership/permission-checked) · Admin: protocol CRUD, document upload

### Diagnosis & AI (`/diagnosis`, `/ai-analysis`, `/ai-consent`)

`POST /diagnosis` (submit answers → result) · `GET /diagnosis/me` · Admin: `GET/POST/PATCH /diagnosis-recommendations` (rules engine entries) · `POST /ai-consent` · `POST /ai-analysis` (upload + enqueue) · `GET /ai-analysis/:id` (poll status) · `GET /ai-analysis/me` (history) · `DELETE /ai-analysis/:id` (purges image + record)

### Content/CMS (`/content/pages`, `/articles`, `/article-categories`, `/faq`, `/translations`, `/navigation`, `/seo`)

Public `GET` by slug/locale; Admin CRUD + `POST /content/pages/:id/publish`, revision history endpoints

### Notifications (`/notifications`)

`GET /notifications/me` · `PATCH /notifications/:id/read` · Admin: `POST /notifications/broadcast`, `GET/PATCH /email-templates`

### Contact & Newsletter (`/contact`, `/newsletter`)

`POST /contact` (rate-limited, 5/min) — stores a `ContactMessage`, no auth required · `POST /newsletter/subscribe` (rate-limited, 5/min) — upserts a `NewsletterSubscriber` by email, idempotent. Both built ahead of the full CMS/notification system specifically so the public Contact page and footer newsletter form are real, functioning endpoints rather than dead UI — see `DECISIONS.md`.

### Search (`/search`)

`GET /search?q=&types=products,articles,partners,treatments,trainings,protocols`

### Admin (`/admin/*`)

`GET /admin/kpis` · `GET/POST/PATCH /admin/users`, `/admin/roles`, `/admin/permissions`, `/admin/settings` · `GET /admin/audit-logs`

## OpenAPI & Typed Client

NestJS's `@nestjs/swagger` decorators generate `/api/docs-json`. `packages/types` consumes that JSON at build time (via `openapi-typescript` or an equivalent codegen step wired into Sprint 4+ once the first non-auth modules stabilize) to produce the frontend's typed request/response types — the frontend never imports backend Mongoose types directly, per `CLAUDE.md`.

## Account experience additions — 2026-09-06

- GET /api/orders/my returns only the authenticated user's b2c orders. GET /api/orders/pro/list returns only their b2b orders and requires professional approval.
- GET /api/cart/pro and DELETE /api/cart/pro/items/:sku operate on the separate owned b2b cart and require approval. POST /api/orders/pro/checkout checks approval and checks out that cart. Ordinary cart/checkout endpoints always use b2c.
- GET /api/professional/profile returns the current identity's optional professional profile.
- GET /api/professional/applications/:id/documents/:documentId checks applicant ownership, attachment membership and document ownership, returning a temporary private URL.
- PATCH /api/professional/applications/:id/contact validates and updates only contactPerson, email and phone for the owning applicant. It cannot change legal identity, status, roles or company approval.
- Applicant application reads return applicantMessage, strip reviewNotes/reviewedBy, and omit internal notes from statusHistory. The admin review interface identifies which messages are shared with applicants.
- Training and protocol endpoints enforce RequireProfessional at controller level. GET /api/trainings/my-bookings/:id/certificate additionally verifies attendee ownership, attended status and a real certificate attachment before signing.
- Personal profile, address, wishlist, diagnosis/AI history and appointment endpoints retain ownership checks; frontend identity is never authorization.

## Admin API (2026-09-06)

All `/api/admin/*` routes require JWT and server-resolved permissions. `/access` returns the permitted resource metadata, roles and permission strings. `/dashboard/overview?from=YYYY-MM-DD&to=YYYY-MM-DD` returns scoped aggregates and Dubai period/comparison metadata. `/resources/:key` supports GET pagination/search/filter and POST creation where allowed; `/resources/:key/:id` supports detail GET and validated PATCH. `/references/:key` returns minimal selection data; `/search?q=` returns permission-filtered global results.

Dedicated actions: POST `/inventory/:id/adjust`, PATCH `/orders/:id`, PATCH `/appointments/:id`, PATCH `/training-bookings/:id`, POST `/ai-analyses/:id/action`, multipart POST `/documents/upload`, GET `/documents/:id/url`, POST `/users/roles`, GET `/roles`, GET `/settings`. The fixed allowlist rejects arbitrary collections and unknown write fields. Role assignment requires super-administrator permissions.

Public structured CMS reads: GET `/api/content/:kind/:slug` returns a published entry or null; GET `/api/content/journal` lists published journal entries. No private document keys or configuration secrets are returned. See ADMIN_IMPLEMENTATION.md for reporting and storage semantics.

## Product media endpoints (2026-09-06)

- POST /api/admin/products/:id/media — JWT commerce.manage; multipart file, JPEG/PNG/WebP, 10 MiB. Returns media DTO after validated MinIO storage.
- PUT /api/admin/products/:id/media — JWT commerce.manage; {revision, media:[{assetId,alt:{en,fr,ar}}]}. Ordered gallery; 409 on stale revision, 400 on unknown/unrelated or duplicate asset. First member is primary.
- POST /api/admin/products/:id/duplicate — JWT commerce.manage; creates a draft sharing immutable media, without stock/SKUs.
- GET /api/media/products/:assetId/:variant — public, variant main/card/thumbnail; WebP bytes with immutable cache headers. No private-document access or arbitrary object-key parameter.
- Product catalogue DTOs add media and primaryImage with URL, thumbnail/card URLs, dimensions, localized alt, order and isPrimary. images remains compatible. Admin list returns human-readable range/category records.

## Bulk deletion

POST /api/admin/products/bulk-delete and POST /api/admin/orders/bulk-delete accept {ids: string[]} (1–100 valid Mongo IDs), require commerce.manage, validate all IDs before mutation, and return {deletedCount}. Product deletion archives/hides; order deletion hides only in management. Both retain history and write audit events.
