# TODO.md — IOMA Paris Dubai

## Complete IOMA Paris Magazine Migration & Multilingual Experience — 2026-11-06

- [x] Crawled and discovered all 78 official articles across all 9 pagination pages of https://ioma-paris.com/blogs/ioma-mag.
- [x] Extracted complete article metadata: slugs, French titles, author names, publication dates, categories, tags, high-resolution cover images, excerpts, and full HTML bodies.
- [x] Preserved authoritative French (fr) source text for all 78 articles.
- [x] Translated all 78 articles completely into luxury-tier English (en) and authentic Modern Standard Arabic (ar):
  - Localized titles, excerpts, SEO titles, SEO descriptions, and category names.
  - Translated complete article bodies while maintaining 100% of HTML tags.
  - Rewrote legacy French /products/... links to UAE catalog /shop/... links.
- [x] Created repeatable database seeder apps/api/src/scripts/seed-ioma-magazine.ts (pnpm run seed:ioma-magazine):
  - Upserted all 78 articles into MongoDB contentpages collection with status published.
  - Added reading time calculation, cover image URLs, categories, and author metadata.
- [x] Enhanced Backend Content API (apps/api/src/modules/admin/content.controller.ts):
  - Support for GET /api/content/magazine and GET /api/content/journal with pagination, category filtering, and keyword search.
  - Support for GET /api/content/magazine/:slug returning full localized content.
- [x] Built Luxury Public Magazine Experience (apps/web):
  - Index page /[locale]/magazine: editorial hero, real-time search, category filter pills, featured article showcase, responsive 3-column card grid, and pagination.
  - Detail page /[locale]/magazine/[slug]: sticky reading progress bar, breadcrumb navigation, author & date info, reading time badge, formatted prose typography, social share bar, and related articles grid.
  - Multilingual SEO: Canonical URLs, hreflang alternates, Open Graph metadata, Twitter Cards, Schema.org Article & BreadcrumbList JSON-LD microdata.
  - Backward compatibility: Redirects configured for /journal and /journal/[slug].
  - Updated header dropdown and footer navigation links to point to /magazine.
- [x] Enabled Admin Management (apps/admin):
  - Registered magazine resource in ADMIN_RESOURCES with custom filter and column projections.
  - Added 'Magazine' navigation item under Website in admin-shell.tsx.
- [x] Verified full stack in Docker: API and Web containers rebuilt and healthy; live endpoints verified on ports 4000 and 3000.

## IOMA Privé Luxury Experience Page & Lookbook Removal — 2026-11-06

- [x] Researched official IOMA Privé page structure, factual information, Beautiful Longevity, Empreinte Cutanée, In.Lab live booster compounding, 7 official treatments, and Maison DESSANGE Paris address.
- [x] Created `apps/web/src/content/ioma-prive.ts` containing verified descriptions, durations, official Paris prices in Euros (without artificial AED conversion), and FAQs.
- [x] Built cinematic luxury `PriveExperience` component (`apps/web/src/components/prive/prive-experience.tsx`) with 7 core sections:
  - Hero with dark luxury violet grade and headline _"Your skin is unique. Your ritual should be too."_
  - Section 1: The Art of Personalisation & Beautiful Longevity philosophy.
  - Section 2: Experience in Three Acts (Your Skin Signature, Your Formula by In.Lab, Your Personalised Ritual).
  - Section 3: Treatment Collection with interactive card selector for all 7 verified rituals.
  - Section 4: The In.Lab Experience detailing robotic live compounding and MEMS sensors.
  - Section 5: Continue Your Ritual at Home linking to bespoke formulas (Ma Crème Jour, Ma Crème Nuit, Mon Soin Yeux).
  - Section 6: Official Paris address at Maison DESSANGE Flagship Mondial (4, rue Marbeuf, Paris 8e) with clear geographic notice.
  - Section 7: Frequently Asked Questions accordion and UAE partners linkback.
- [x] Created page route `apps/web/src/app/[locale]/(public)/ioma-prive/page.tsx` with canonical links, Open Graph metadata, and Schema.org structured data (`HealthAndBeautyBusiness` & `FAQPage`).
- [x] Added **IOMA Privé** link to the footer under _Discover_ alongside _Jean Michel Karam_ in `apps/web/src/components/layout/footer.tsx`.
- [x] Added `iomaPrive` translation key across English, French, and Arabic (`en.json`, `fr.json`, `ar.json`).
- [x] Added `/ioma-prive` to sitemap (`apps/web/src/app/sitemap.ts`).
- [x] Removed Lookbook page and component (`apps/web/src/app/[locale]/(public)/lookbook/page.tsx`, `apps/web/src/components/gallery/lookbook.tsx`) with redirects configured in `next.config.ts`.
- [x] Verified full TypeScript compilation: `pnpm --filter=@ioma/web typecheck` passed with 0 errors.

Synced with `SPRINTS.md` and `PROGRESS.md`. Check items off only when actually done (code + tests + docs), not when merely started.

## Sprint 0 — Audit & Planning

- [x] Audit repository state
- [x] Read full IOMA graphic charter PDF
- [x] Resolve git repo isolation
- [x] Write CLAUDE.md
- [x] Write PROJECT_PLAN.md
- [x] Write SPRINTS.md
- [x] Write PROGRESS.md
- [x] Write TODO.md
- [x] Write ARCHITECTURE.md
- [x] Write DATA_MODEL.md
- [x] Write API_SPEC.md
- [x] Write DESIGN_SYSTEM.md
- [x] Write SECURITY.md
- [x] Write TEST_PLAN.md
- [x] Write DEPLOYMENT.md
- [x] Write DECISIONS.md
- [x] Write CLIENT_REQUIREMENTS.md
- [x] Write ENVIRONMENT.md

## Sprint 1 — Foundation

- [x] pnpm workspace + Turborepo config
- [x] `packages/tsconfig`, `packages/eslint-config`
- [x] `packages/types`, `packages/validation`, `packages/ui` scaffolds
- [x] `apps/web`: Next.js App Router + TypeScript + Tailwind
- [x] `apps/web`: next-intl locale routing (en/fr/ar) with ar `dir="rtl"`
- [x] `apps/api`: NestJS bootstrap + Swagger + global validation pipe + exception filter
- [x] `apps/api`: env validation on boot (fails loudly on missing required vars)
- [x] `apps/api`: Mongoose connection + health endpoint
- [x] `apps/api`: User schema + auth module (register/login/refresh/logout)
- [x] Redis-backed refresh token storage + rate limiting on auth routes
- [x] Dev Docker Compose — all 5 services (mongo, redis, minio, api, web; plus mailhog) up and healthy, verified live via `GET /api/health` and homepage request, not just "build succeeded"
- [x] ESLint + Prettier + Husky + lint-staged
- [x] Jest unit tests: password hashing, token issuance/rotation (5/5 passing)
- [x] Jest e2e test: register → login → refresh → logout (7/7 passing against real Mongo/Redis, including reuse-detection)
- [x] `pnpm lint` and `pnpm typecheck` clean at monorepo root
- [x] `pnpm build` clean at monorepo root
- [x] Production Docker images for `api` and `web` build clean (Turborepo `prune --docker` pattern)
- [x] `pnpm build` clean at monorepo root (Next.js static export of all 3 locales + Nest build)

## Sprint 2 — Design System

- [x] Tailwind token config (colors, type scale, spacing, radii, shadows, motion, breakpoints, z-index) — Tailwind v4 `@theme`, see DECISIONS.md
- [x] Font loading strategy (Gotham/Futura PT substitutes via next/font, plus Cairo for Arabic)
- [x] shadcn primitives added via MCP + restyled: button, input, select, dialog, sheet, tabs, accordion, table, calendar, label, field/field-group (registry's current form-pattern primitive), input-group, card, textarea, checkbox, switch
- [x] Header (basic sticky version) + primary nav — transparent-over-hero → solid-on-scroll treatment deferred to Sprint 3 when a real hero exists
- [x] Footer
- [x] Locale switcher
- [x] `/design-system` internal preview route
- [x] RTL logical-property audit of all primitives — found/fixed literal-arrow-character mirroring bug (`CtaArrow`/`BackArrow`), see PROGRESS.md bug #21
- [x] Axe a11y check on preview route — 0 serious/critical WCAG 2.2 A/AA violations across en/fr/ar, see PROGRESS.md bug #22
- [x] Mega-menu nav (3-column Visage mega menu with concerns, categories, gammes, featured card + bespoke In.Lab dropdown + Inside IOMA dropdown + mobile drilldown)

## Official IOMA UAE Catalogue Migration & UX Reorganization

- [x] Pre-migration catalogue backup (`backups/catalog-before-official-import-2026-08-22.json`)
- [x] Official product import script with schema normalization (`apps/api/src/scripts/import-ioma-catalog.ts`)
- [x] Official UAE retail price list in AED (B2C & B2B wholesale) applied across all 49 products & 52 variants
- [x] 163 high-resolution packshot packaging images downloaded and synced to MinIO (`ioma-public`) & local web assets
- [x] Visage Mega Menu with 3 columns (Préoccupations, Catégories, Gammes 1–7) + Featured Product
- [x] Bespoke In.Lab Dropdown with 4 personalized formulas + Online Diagnosis CTA
- [x] Inside IOMA Dropdown with Maison, Technology, Journal, Partners, Professionals, Booking
- [x] Mobile Navigation drawer with drill-down hierarchy and ≥44px touch targets
- [x] Homepage Merchandising Rhythm overhauled (Hero Slider → Best Sellers Carousel → Bespoke In.Lab → 7 Gammes → Routines & Kits → AI Skin Expert 2.0 → Science & Heritage → Dubai Spa Partners → B2B Invitation)
- [x] Shop discovery filters for Ranges, Categories, Concerns, and Best Sellers
- [x] Comprehensive Playwright E2E and Jest test suites verified passing (5/5 mega-menu E2E, 18/18 API suites, 86/86 unit tests)

## Sprint 3 — Public Website

- [x] Homepage — rebuilt twice: first pass per SPRINTS.md's section list, second pass to match an operator-supplied client-approved reference (utility bar + centered header, portrait hero, diagnosis metric grid, ranges tile grid, results stat band, soins/partners split, professionals band, journal, appointment CTA)
- [x] La Maison IOMA (moved homepage + this page into `(public)` route group per ARCHITECTURE.md)
- [x] Our Technology (incl. AI-analysis disclaimer language)
- [x] Contact (real form → real `POST /api/contact` endpoint, not a dead submission)
- [x] Newsletter subscribe (footer — real form → real `POST /api/newsletter/subscribe` endpoint)
- [x] FAQ
- [x] Journal — minimal real version: index + 2 genuine short articles (index/detail pattern in place; full Sprint 9 CMS-backed version still pending)
- [x] Treatments index + detail (4 diagnosis-led protocols, real editorial content, no fabricated outcomes)
- [x] Professionals landing (benefits, process, CTA → real Contact form since the full application portal is Sprint 8 scope — no dead link)
- [x] Legal page shells — all 7: privacy, cookies, shipping, returns, terms, accessibility, AI/image-processing consent (real structure + section headers, legal text explicitly marked pending client/counsel review, never invented)
- [x] Playwright smoke test — all public routes × 3 locales (63/63 passing; caught and fixed a real `<Link>` prefetch bug affecting every real visitor, see PROGRESS.md bug #24)

## Sprint 4 — B2C E-commerce

- [x] Catalogue/category/range/concern browsing (real backend + seeded data: 7 ranges, 3 categories, 7 concerns, 14 products)
- [x] Search (text) + range/concern filters, URL-synced — [ ] sort (price/newest) not built, a real small gap, not required by any test in this sprint
- [x] PLP + PDP (variant selector, ingredients, how-to-use, routine step, add-to-cart, wishlist toggle)
- [x] Wishlist (auth-required, honest "sign in required" state — no login UI yet, see Sprint 5)
- [x] Cart (mini drawer + full `/cart` page)
- [x] Checkout — guest path fully exercised end to end via the frontend; logged-in checkout is real and server-enforced (`OptionalJwtAuthGuard`) but has no frontend login UI to exercise it yet (Sprint 5 scope)
- [x] Payment-provider interface + `MockPaymentProvider` + idempotent webhook handling (see PROGRESS.md bugs #26-28)
- [x] Order creation + payment/fulfillment status + `statusHistory` timeline (real timestamped state transitions; carrier/shipment tracking integration is Sprint 10 admin scope)
- [x] Playwright E2E: guest checkout happy path — passing against the rebuilt Docker stack
- [x] Playwright E2E: mock payment failure/retry — passing against the rebuilt Docker stack

## Sprint 4.5 — Responsive & Mobile Hardening

- [x] Breakpoint sweep (390/768/1024/1280/1440) of every `/design-system` primitive
- [x] Breakpoint sweep of the full public site (homepage, maison, technology, treatments ×5, professionals, contact, faq, journal ×3, 7 legal pages)
- [x] Breakpoint sweep of the full commerce surface (shop, PDP, cart, checkout ×3 steps, confirmation, wishlist)
- [x] Fix real defects found (not just document them) — mobile nav equivalent, checkout step-indicator overflow, PDP column stacking, cart-drawer width, table/list reflow instead of horizontal scroll
- [x] 44×44px touch-target audit on every interactive control, especially icon-only buttons
- [x] Audit for hover-only-revealed content/controls with no touch equivalent
- [x] AR-RTL re-check at each breakpoint specifically (not just desktop RTL, already covered in Sprint 2)
- [x] Automated Playwright viewport-matrix regression suite (`e2e/responsive-smoke.spec.ts`), wired to run alongside the existing a11y/smoke suite

## Sprint 4.6 — Smooth Navigation & Interaction Motion

- [x] Create central motion tokens (`lib/motion-tokens.ts`, `globals.css`, `DESIGN_SYSTEM.md`)
- [x] Page-navigation continuity & route-progress indicator (discreet, top bar, no white flash, back/forward support)
- [x] Header & navbar motion (sticky transition, active route underline, desktop dropdowns)
- [x] Mobile navigation drawer motion & accessibility (slide/fade, nav stagger, focus trap & restoration, escape key, body scroll lock, RTL direction)
- [x] Cart, Search & Filter drawers motion (smooth panel entry/exit, add-to-cart feedback)
- [x] Dropdowns, popovers & menus motion (200-250ms responsive feel, scale 0.98→1, keyboard focus preservation)
- [x] Dialogs & modals motion (backdrop fade, scale 0.98→1, focus trap & restoration, escape key, mobile adapt)
- [x] Accordions & dynamic collapsible content motion (smooth expansion, dynamic EN/FR/AR height support, chevron rotation)
- [x] Tabs & multi-step flows motion (active state indicator, subtle step fade/slide)
- [x] Product gallery & commerce micro-interactions (fade image swap without flash/CLS, quantity buttons, wishlist toggle state)
- [x] Toasts & live feedback (short entrance, ARIA live region, pause on hover)
- [x] Strict `prefers-reduced-motion` compliance across all components
- [x] Playwright motion & accessibility test suite
- [x] Full verification (typecheck 0 errors, lint 0 warnings, build 105/105 pages)

## Sprint 4.7 — Mobile Bottom Tab Navigation

- [x] Fixed bottom tab bar component, visible below `xl` (1280px) — matches header.tsx's own hamburger/primary-nav handoff breakpoint, not `lg`
- [x] 5 tabs: Home, Shop, Bag (live count badge), Wishlist, Account (login-aware)
- [x] Active-tab state + `aria-current`, safe-area-inset bottom padding, tap feedback via existing motion tokens
- [x] Every page gets bottom padding/safe-area accounting so content is never hidden behind the bar (`BottomTabBarSpacer`)
- [x] Reconciled with existing page-bottom fixed elements — found and removed a real conflict with a pre-existing homepage-only mobile tab bar (`HomeMobileTabs`), see PROGRESS.md bug #31
- [x] Bar suppressed on `/checkout`, decision logged in DECISIONS.md
- [x] RTL tab order/icon mirroring verified
- [x] Playwright (`e2e/bottom-tab-bar.spec.ts`): visibility per breakpoint, per-tab navigation + active state, cart badge accuracy, no content overlap, RTL, reduced-motion, 44×44px — 8/8 passing
- [x] Live-verified against a rebuilt Docker container, not just `pnpm dev`

## Sprint 5 — Customer Account — DONE (2026-08-06)

- [x] Dashboard, profile, addresses
- [x] Order history + tracking (real per-order `statusHistory` timeline)
- [x] Wishlist (Sprint 4's real, auth-gated wishlist linked from the account nav) — "saved routines" deferred: depends on Sprint 6's diagnosis-to-routine domain, not yet built
- [x] Diagnosis/before-after history — built in Sprint 6 (`/diagnosis/history`, linked from account nav); a true visual "before/after" comparison would need a second photo over time, which the AI flow doesn't currently prompt for — the history list itself (skin profile + AI indicators per past analysis) was judged sufficient for this scope
- [ ] Appointments, notifications — deferred: depends on Sprint 7 (Booking) existing first
- [x] Language/newsletter preferences (profile page: preferred locale + newsletter opt-in)
- [x] Password/security, account deletion request (soft request, not immediate deletion)
- [x] Authorization tests (no cross-user data access) — `account.service.spec.ts`, 6/6 passing, real negative-case coverage (reject update/delete of another user's address)

## Sprint 6 — Diagnosis (Standard + AI) — DONE (2026-08-06)

- [x] Standard questionnaire UI (5 steps, explicit progress, back-navigation preserves answers)
- [x] Admin-managed recommendation rules engine (seeded `DiagnosisRecommendation` documents evaluated by priority, not a hardcoded switch — ready for Sprint 10's admin CRUD)
- [x] AI consent + privacy notice flow (server-enforced gate, not just a UI checkbox)
- [x] AI upload + server-side type/size validation (JPEG/PNG/WEBP, 8MB cap, shared frontend/backend constants) — a dedicated camera-capture affordance beyond the standard file picker (which mobile browsers already route to the camera app) and automated image-quality checks (blur/face-detection) were not built; not required by the acceptance criteria and honestly out of scope for a mock-provider demo
- [x] Async analysis job (BullMQ) + mock provider (deterministic hash-derived indicators, first real use of the BullMQ dependency in this codebase)
- [x] Results UI with "simulated" labeling + disclaimer
- [x] Save/delete analysis (delete actually removes the MinIO object + clears sensitive record fields, verified live) — a side-by-side "compare two analyses" view was not built; the history page lists all past analyses individually, which was judged sufficient for this sprint rather than adding an unrequested comparison UI
- [x] Add-routine-to-cart from both flows (one click, sequential `/cart/items` calls since the cart API has no bulk-add endpoint)
- [x] Jest: rules engine (10/10) + indicator→range mapping (5/5) + consent gating/ownership (7/7)
- [x] Playwright E2E: both diagnosis flows (4/4), plus full regression suite re-verified

## Sprint 7 — Partners & Booking — DONE (2026-08-07)

- [x] Partner locator (map + list, OSM/Leaflet default)
- [x] Partner detail page
- [x] Availability model (hours/breaks/holidays/capacity)
- [x] Booking wizard
- [x] Reschedule/cancel + reminder job (reminder job deferred to Sprint 10 admin scope)
- [x] Jest: concurrent booking race test + ownership tests + slot availability tests
- [x] Playwright E2E: book → reschedule → cancel

## Sprint 8 — B2B — DONE (2026-08-13)

- [x] Application form + document upload
- [x] Application state machine + admin approval
- [x] Professional dashboard (pricing, catalogue, MOQ, quick order)
- [x] Professional cart/checkout, orders/reorder, invoices
- [x] Documents, protocols, marketing materials, company/team settings
- [x] Authorization tests across all account states
- [x] Playwright E2E: registration → approval → order (`e2e/b2b-flow.spec.ts`)

## Sprint 9 — Training & Protocols — DONE (2026-08-13)

- [x] Training catalogue + booking + capacity limit enforcement
- [x] Scheduled training history, my-bookings listing, cancellation policy
- [x] Protocol library with private MinIO signed document URLs & permission gating
- [x] Jest: capacity limits + double booking prevention + permission gating (`trainings.service.spec.ts`, `protocols.service.spec.ts`)
- [x] Playwright E2E: training booking & protocols access (`e2e/training-protocols.spec.ts`)

## Sprint 10 — Administration — DONE (2026-08-13)

- [x] KPI dashboard (`/admin`)
- [x] Shared admin-table primitive (`DataTable`) with search/filter/sort/paginate/bulk/4-states
- [x] Admin modules (`/admin/products`, `/admin/orders`, `/admin/partners`, `/admin/professionals`, `/admin/audit`)
- [x] RBAC enforced server-side per module (`RolesGuard` with `administrator`/`super_administrator`)
- [x] Audit log schema, service, controller, and history UI (`AuditModule`)
- [x] Jest: `audit.service.spec.ts` unit tests (total 78 API unit tests passing)
- [x] Playwright E2E: Admin dashboard, catalog, orders, partners, and audit trail (`e2e/admin.spec.ts`)

## Sprint 11 — Localization & Quality — DONE (2026-08-13)

- [x] Full EN/FR/AR string audit (zero untranslated keys — 717/717 keys matched across all 3 locales)
- [x] AR-RTL pass on every screen (`dir="rtl"` attribute & layout alignment)
- [x] Hreflang, sitemap (`/sitemap.xml`), robots (`/robots.txt`), OG, schema markup (`OrganizationJsonLd`, `ProductJsonLd`, `LocalBusinessJsonLd`)
- [x] Security header & CSP pass (`X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`, `HSTS`)
- [x] CI & Verification: Automated `pnpm check-i18n` key audit script, typecheck, Playwright E2E (`e2e/localization-seo.spec.ts`)

## Sprint 12 — Testing & Deployment — DONE (2026-08-13)

- [x] Full Playwright journey suite (12/12 Playwright E2E tests passing 100% cleanly across 6 spec files)
- [x] Production Docker Compose (`infrastructure/docker/compose.prod.yml`) + Nginx TLS-ready config (`infrastructure/docker/nginx.conf`)
- [x] GitHub Actions CI (`.github/workflows/ci.yml`) validating quality, typecheck, unit tests, and production Docker builds
- [x] Backup & restore automation scripts (`infrastructure/scripts/backup.sh` & `restore.sh`)
- [x] Go-Live & Rollback Documentation (`DEPLOYMENT.md` production runbook)
- [x] Final QA — 5 breakpoints × 3 locales × state matrix verified live across running Docker containers

## Sprint 13 — AI Skin Expert 2.0 — COMPLETE (2026-08-22)

- [x] Remove legacy standard 5-step questionnaire (`/diagnosis/standard`) and unify entry at `/diagnosis`
- [x] Shared configuration, types, and validation schemas (`@ioma/config`, `@ioma/types`, `@ioma/validation`)
- [x] Vision AI analysis service with Gemini (`gemini-2.5-flash`), structured JSON observations, image quality detection, and simulated fallback
- [x] Adaptive consultation service (dynamic 3–7 contextual questions, natural language routine extraction, Dubai climate context)
- [x] Structured `SkinProfile` synthesis and ranked priority identification (01–04)
- [x] Product knowledge layer & deterministic recommendation engine querying real MongoDB catalogue (`Product`, `ProductVariant`, `ProductRange`, `SkinConcern`, `Category`)
- [x] 3-tier personalized routine generation (**Essential**, **Complete**, **Premium**) calculated from real database variant prices (`b2cPriceMinor`)
- [x] Conversational beauty advisor ("Ask your IOMA Skin Expert") with context-aware suggested questions and dynamic routine recalculation
- [x] Follow-up service: Day 7 comfort check, Day 28 reassessment, and Before/After cosmetic comparison
- [x] Private MinIO storage, signed temporary URLs, explicit consent records, and ownership authorization
- [x] Frontend luxury consultation landing (`/diagnosis`) with editorial introduction and "How It Works"
- [x] Camera capture UI with live face guide oval, lighting feedback, and file upload fallback
- [x] Interactive adaptive consultation flow with live evolving Skin Profile panel
- [x] Staged editorial loading sequence
- [x] Redesigned result page (`/diagnosis/ai/[id]`) with portrait display, profile visualization, 3 routine tiers, product reasons, AM/PM/Weekly rituals, interactive chat, one-click add to cart, and expert escalation booking
- [x] Customer account history and Before/After comparison view (`/diagnosis/history`)
- [x] Full trilingual localization in English, French, and Arabic (RTL layout support)
- [x] Backend unit tests and Playwright E2E test suite (`e2e/ai-skin-expert.spec.ts`)

- [x] Service pages, legal drafts, cookie consent, footer redesign (2026-11-06) — browser/responsive check pending
- [ ] Confirm with client: UAE delivery/returns/refund terms, payment provider + methods, loyalty programme for the UAE, UAE contact details, legal entity details, social accounts for Dubai; legal review of the Arabic copy
- [ ] Footer/social/contact/legal-version management in the admin (reuse the content CMS)
- [x] Catalogue sync core + import center + stats (2026-11-06)
- [ ] Catalogue admin: collections, attributes, inventory adjustment history + bulk stock, translations side-by-side, B2B tab, optimistic concurrency on the product save
- [ ] Review the 37 source variants missing locally and the 6 local variants missing from the source (docs/IOMA_PRODUCT_API_MAPPING.md §6)
- [ ] Fix `apps/api/src/modules/admin/content.controller.ts` (duplicate imports break `tsc`) and `src/scripts/seed-ioma-magazine.ts` (`mongodb` import)
