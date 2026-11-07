# TEST_PLAN.md — IOMA Paris Dubai

## Test Layers

| Layer                   | Tool                                  | Scope                                                            |
| ----------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| Backend unit/service    | Jest (`apps/api`)                     | Services, guards, rules engine, pricing/tax math, token rotation |
| Backend integration/API | Jest + Supertest                      | Real Mongo (test container) + Redis, hits actual controllers     |
| Frontend component      | Vitest + Testing Library (`apps/web`) | Restyled UI primitives, forms, RTL mirroring                     |
| Accessibility           | axe (CI sweep)                        | Every route, both LTR and RTL                                    |
| End-to-end              | Playwright                            | Full user journeys against a running dev stack                   |
| Performance             | Lighthouse CI                         | Homepage, PLP, PDP, checkout                                     |

## Required E2E Journeys (Playwright)

1. Customer registration → email verification (mock) → login
2. Product discovery (browse/filter/search) → add to cart
3. Guest checkout → mock payment success → confirmation → order tracking
4. Mock payment failure → retry → success
5. Standard skin diagnosis → routine → add routine to cart
6. AI diagnosis (mock provider) → consent → upload → results (labeled simulated) → save → compare
7. Appointment booking via partner locator → reschedule → cancel
8. Professional application submission → (simulated) admin approval → professional login
9. B2B order (professional-priced, MOQ-respecting) → reorder
10. Training catalogue → booking → confirmation
11. Arabic RTL navigation across homepage, shop, checkout, account

## Test Resolutions

1440px · 1280px · 1024px · 768px · 390px — every journey above is spot-checked at all five at least once per sprint that touches its screens; full matrix run in Sprint 11/12.

## Locale/State Matrix

Every screen reviewed in **English, French, Arabic (RTL)**, and in each of: loading, empty, error, success, unauthorized (401), forbidden (403) where that state is reachable. This matrix is the actual acceptance bar referenced by `CLAUDE.md`'s "Definition of Done" — a feature isn't done until this matrix passes for it, not just its happy path.

## Authorization Test Matrix (backend)

For every RBAC-guarded module (professional portal, admin, protocol library, training booking): a test asserting each of `guest / customer / professional_pending / professional_approved / professional_suspended / administrator` gets the correct 200/401/403 outcome per endpoint. This is the single highest-value test category given the platform's dual B2C/B2B/admin surface — it is written alongside the guard, not deferred.

## CI Gate (GitHub Actions, see `DEPLOYMENT.md`)

`lint` → `typecheck` → `unit+integration tests` → `build` → `docker build` must all pass before merge. Playwright E2E and Lighthouse CI run on a scheduled/nightly job plus on-demand for release branches (too slow to gate every commit).

## What "Tested" Does Not Mean

A green CI run is necessary but not sufficient. Per `CLAUDE.md`, UI features additionally require a manual pass confirming: no console errors, no visible layout shift, correct RTL mirroring, and that the feature reads as finished rather than templated — these are logged in `PROGRESS.md`, not just inferred from passing automated tests.

## Account and professional area regression (2026-09-06)

Run against the current local Docker API/web with seeded catalogue/admin and browser-reachable private storage URLs:

```powershell
pnpm --filter @ioma/web exec playwright test e2e/account-experience.spec.ts e2e/account-isolation.spec.ts e2e/account-navigation.spec.ts e2e/account-appointments.spec.ts e2e/b2b-application.spec.ts e2e/b2b-application-validation.spec.ts --workers=1 --reporter=line --output=../../scratch/account-final-results
```

- Account state fixtures use actual registration, application upload/submission, admin approval/rejection/document requests and suspension. Signup/login provisioning respects server rate limits.
- Exercise owned customer operations and foreign-account denials for profiles, addresses, orders, appointments, standard/AI history, wishlist and private documents. Verify unsigned MinIO access fails.
- Check separate personal/professional carts, checkouts, histories and UI reorder. Verify restricted catalogue, cart, orders, protocols and training return 403 before approval and after suspension.
- Book a real QA appointment, reschedule using live availability, cancel with confirmation, and confirm persisted state. Dates use Dubai time.
- Create a clearly labelled local QA training session, book/cancel/rebook through the approved API/UI, check seat recovery, duplicate rejection and certificate ownership/unavailability.
- Capture status/locale layouts and assert no horizontal overflow at 390/768/1024/1280/1440px. Inspect representative screenshots manually.
- AI ownership coverage uses a clearly labelled failed QA record, without sending images to an external provider. This suite does not claim to validate live provider output, payments or certificate issuance.

Do not run concurrent suites into the same output directory. Preserve screenshots and log paths in PROGRESS.md after the run.

## Admin redesign coverage — September 2026

Run admin period/validation Jest tests, the controlled Mongo/API integration in scratch/admin-integration.cjs, the workflow checks in scratch/admin-workflows.cjs, and apps/web/e2e/admin-experience.spec.ts against the production Docker build. Verify eligible paid AED revenue, excluded payment states, AOV, previous-period comparisons, B2C/B2B series, staff/domain isolation, strict mutation fields, stock reservation boundaries and audit records. Browser coverage includes three locales, all five target widths, sidebar/drawer behavior, resource lists/details, CMS publication, guest denial and public Admin Panel access. Record results in PROGRESS.md; these instructions are not a claim that checks passed.

The CMS response regression is covered by content.controller.spec.ts: missing entries serialize as JSON null, and draft entries stay unpublished. Public smoke checks must include the existing journal articles, not only newly created CMS pages. Admin browser coverage also checks forged browser roles and mobile inventory price display/editing.

## Product media acceptance (2026-09-06)

- Jest product-media.service.spec.ts covers real image decode/transparency/derivative dimensions, MIME/extension/corruption/size rejection, relation safety, repeated references, gallery revision conflicts and MinIO partial-failure compensation.
- scratch/product-media-integration.cjs checks the running API, all 531 migrated derivative bytes, unchanged catalogue count, upload deduplication and safe shared relation removal.
- e2e/product-media.spec.ts covers list/detail/editor at 390/768/1024/1280/1440 in EN/FR/AR, persistent sidebar/header navigation, create/upload/save/refresh/primary/reorder/publish/PDP, and imported image continuity through shop/wishlist/cart/checkout/order/routines/diagnosis/AI/B2B. Browser results must be recorded after execution, not inferred from test presence.
- QA data is explicitly temporary and must be removed after acceptance; never run a paid AI provider for these image rendering checks.

Final product/media acceptance is recorded in PRODUCT_MEDIA_COMPLETION.md. Run the admin acceptance suite separately from the product matrix to avoid overlapping high-volume admin-access requests against the normal rate limit. Do not disable production rate limits for tests.

## Product workspace acceptance

product-workspace.spec.ts exercises same-route edit, draft persistence across Overview/Media/Pricing/Classification/SEO, multi-step save, real derivative retrieval, old-edit redirect, validation, cancellation, navigation protection, API failure/retry and shared creation. EN/FR/AR × five widths exercises all nine edit tabs and overflow. Existing product-media tests retain lifecycle and commerce/AI/B2B image coverage. Product fixture data is temporary and removed after verification.
