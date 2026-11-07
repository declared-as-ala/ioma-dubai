# SPRINTS.md — IOMA Paris Dubai

## Cinematic homepage redesign - **DONE** (2026-11-05)

Reference-based header/hero composition implemented using official assets and existing footage. Responsive EN/AR checks at all five required widths, playback/menu/scroll interactions, and TypeScript verified. Live API integration remains a separate verification item in TODO.md; French route behavior remains unchanged.

Status legend: `NOT STARTED` · `IN PROGRESS` · `DONE`. This file is kept in sync with `TODO.md` and `PROGRESS.md` — a sprint is `DONE` only when every acceptance criterion is checked in `TODO.md`.

## Homepage video framing - **DONE** (verified 2026-11-05)

Superseded by the cinematic homepage redesign above. Video/poster cover fitting and responsive layouts are verified in EN/AR at 390, 768, 1024, 1280 and 1440 pixels.

---

## Documentation maintenance — **DONE** (2026-09-06)

Preserved the user brief in `PROJECT_BRIEF.md`, established repository-wide session reading rules in `AGENTS.md`, and linked them from `CLAUDE.md`. Verified source fidelity and local documentation links. This documentation task does not change feature sprint completion or establish runtime verification.

## Sprint 8 follow-up — B2B application CTA — **DONE** (2026-09-06)

Bug #42 repairs the existing login/application journey, authenticated submission, private professional documents, admin review, duplicate protection and immediate suspension enforcement. The 16-case Playwright suite and backend/web unit tests pass; the final mobile layout and admin suspension UI passed the latest Docker build verification (16/16 cases). See `PROGRESS.md` for evidence and scope.

## Account experience follow-up — **DONE** (2026-09-06)

Implemented the supplied `ACCOUNT_REDESIGN_BRIEF.md`, retaining one identity and existing `/portal` modules. Verified 41 targeted browser cases, 113 API tests, 14 web tests, typecheck, lint, translation parity and production builds. Scope and optional integrations are recorded in `ACCOUNT_AUDIT.md`, `ACCOUNT_COMPLETION.md` and `PROGRESS.md`.

## Admin dashboard and analytics follow-up — **IN PROGRESS** (2026-09-06)

Implement `ADMIN_REDESIGN_BRIEF.md`: dedicated responsive shell, permission-scoped backend analytics and management, accessible charts, action center, role-based storefront link and controlled-data verification. Audit actual implementation in `ADMIN_AUDIT.md`; do not assume the old roadmap reflects working admin modules.

## Sprint 0 — Audit & Planning — **DONE** (2026-08-05)

**Objective**: Establish ground truth before writing any product code.

**Tasks**: audit repo (found empty), read `IOMA_CHARTE_GRAPHIQUE_2026_FR.pdf` in full (30 pages), resolve git isolation, write all 15 root docs, confirm toolchain (Node 24 / pnpm 10 / Docker 29 present).

**Acceptance criteria**: all 15 docs exist with real content (no empty stubs); charter colors/typography/logo rules verified and recorded in `DESIGN_SYSTEM.md`; git repo isolated to `ioma/`.

**Definition of done**: this file, plus `PROGRESS.md`, reflect the above. ✅

---

## Sprint 1 — Foundation — **DONE** (2026-08-05)

**Objective**: A running, dockerized, typed monorepo skeleton with auth foundations — nothing product-specific yet, but real and buildable.

**Tasks**:

- pnpm workspace + Turborepo (`apps/web`, `apps/api`, `packages/ui|types|validation|config|eslint-config|tsconfig`)
- `apps/web`: Next.js App Router + TS + Tailwind, `[locale]` routing via next-intl scaffold (en/fr/ar)
- `apps/api`: NestJS + Mongoose connection, config module with startup env validation, health endpoint, Swagger
- Docker Compose (dev): mongo, redis, minio, api, web, with healthchecks and named volumes; no host ports on mongo/redis/minio beyond localhost dev convenience
- ESLint + Prettier + Husky + lint-staged, conventional-commit friendly
- Auth foundation: User schema, password hashing, JWT access + rotating refresh token, register/login/refresh/logout endpoints, rate limiting on auth routes

**Technical notes**: shared types flow `packages/types` ← hand-synced from NestJS DTOs for now (OpenAPI-generated client is a Sprint 1 stretch goal, formalized once the first real modules exist in Sprint 4+). Redis used for refresh-token/session storage from day one so Sprint 5+ doesn't need a storage migration.

**Dependencies**: none (first sprint).

**Acceptance criteria**: `docker compose up` brings up all 5 services healthy; `GET /api/health` returns 200; `POST /auth/register` → `/auth/login` → `/auth/refresh` → `/auth/logout` works end to end against a real Mongo instance; `pnpm lint`, `pnpm typecheck` clean across the monorepo.

**Tests**: Jest unit tests for password hashing + token issuance/rotation; one Jest e2e test hitting the four auth endpoints in sequence.

**Status**: DONE — see `PROGRESS.md` Sprint 1 for the full build log and bug list.

---

## Sprint 2 — Design System — **DONE** (2026-08-05)

**Objective**: Every visual primitive the rest of the build depends on, restyled to the IOMA charter — no default shadcn look ships past this sprint.

**Tasks**: Tailwind token config (colors incl. 7 range colors scoped via data-attribute/CSS var, not global Tailwind color slots; type scale; spacing; radii — deliberately small/near-zero per "no excessive rounded corners"; shadows — minimal; motion durations/easing; breakpoints; z-index scale). Font loading strategy (Gotham/Futura PT substitutes via `next/font`). Base shadcn primitives added via shadcn MCP then restyled (button, input, select, dialog, sheet, tabs, accordion, table, calendar, form). Header (transparent-over-hero → solid on scroll), mega-menu navigation, footer, locale switcher, RTL logical-property audit of every primitive.

**Dependencies**: Sprint 1 (Tailwind/Next app must exist).

**Acceptance criteria**: a `/design-system` internal preview route renders every token and restyled primitive in both LTR and RTL, light-mode only (no dark mode requested by client); Lighthouse a11y ≥ 95 on that route; zero default-shadcn-gray components remain.

**Tests**: Vitest component tests for restyled primitives (renders, keyboard nav, RTL mirroring where directional); axe accessibility check in CI on the preview route.

---

## Sprint 3 — Public Luxury Website — **DONE** (2026-08-05)

**Objective**: Every marketing/editorial page live, CMS-editable, in EN/FR/AR.

**Tasks**: Homepage (cinematic hero, philosophy, technology teaser, ranges, shop-by-concern, routine teaser, featured products, results storytelling, treatments teaser, partner teaser, B2B teaser, journal highlights, appointment CTA, newsletter), La Maison IOMA, Our Technology, Treatments + Treatment detail, Journal + Article detail, Professionals landing, Contact, FAQ, legal page shells (privacy/cookies/shipping/returns/T&Cs/accessibility/AI consent) with counsel-pending copy clearly flagged in CMS, not fabricated.

**Dependencies**: Sprint 2.

**Acceptance criteria**: every listed page reachable from nav, renders real (not lorem) editorial copy sourced from CMS seed content, passes responsive check at 1440/1280/1024/768/390, EN/FR/AR-RTL all reviewed.

**Tests**: Playwright smoke test visiting every public route in all 3 locales, checking no console errors and correct `dir` attribute for `ar`.

---

## Sprint 4 — B2C E-commerce — **DONE** (2026-08-06)

**Objective**: Full retail purchase path, mock-payment complete.

**Tasks**: catalogue/category/range/concern browsing, search + filters + sort, PLP with premium cards (hover image, badges), PDP (gallery, variants, ingredients, routine step, related/complete-the-routine), wishlist, cart (mini + full), checkout (guest + logged-in, UAE address w/ emirate/city, delivery method, payment step), payment-provider interface + mock provider + webhook/idempotency plumbing, order creation + status + tracking timeline, order confirmation/failure/retry states.

**Dependencies**: Sprints 1 (auth), 2 (UI), 3 (site shell/nav/footer reused).

**Acceptance criteria**: guest can browse → add to cart → checkout → mock-pay → see confirmation → (if registered) see order in account; admin can see the order (stub list acceptable until Sprint 10 builds full admin).

**Tests**: Playwright E2E "guest checkout happy path" + "mock payment failure/retry" + Jest tests for cart pricing/tax math and idempotent webhook handling.

---

## Sprint 4.5 — Responsive & Mobile Hardening — **DONE** (2026-08-06)

Numbered 4.5, not 5, deliberately — inserted into the existing backlog without renumbering Sprints 5–12 (and every cross-reference to them already written in `TODO.md`, `PROGRESS.md`, `DECISIONS.md`, and prior handoff prompts). Responsiveness was never _absent_ from Sprints 0–4 (every page was built against `DESIGN_SYSTEM.md`'s breakpoint scale and spot-checked), but it was never the sole focus of a pass either — this sprint is a dedicated, systematic sweep across everything shipped so far, before the surface area grows further with Sprint 5+.

**Objective**: Every component and every page built in Sprints 0–4 is verified — not assumed — to work correctly at all 5 required breakpoints, in all 3 locales (including AR-RTL), with no horizontal scroll, no overlap/clipping/truncation, no sub-44×44px touch targets, and no desktop-only interaction pattern (hover-only reveals, etc.) that has no mobile equivalent.

**Tasks**:

- Systematic breakpoint sweep at exactly `390 / 768 / 1024 / 1280 / 1440` (`DESIGN_SYSTEM.md`'s `sm/md/lg/xl/2xl` scale) across: every `/design-system` primitive, the full public site (homepage, La Maison, Technology, Treatments ×5, Professionals, Contact, FAQ, Journal ×3, all 7 legal pages), and the full Sprint 4 commerce surface (`/shop`, `/shop/[slug]`, `/cart`, `/checkout`'s 3 steps, `/checkout/confirmation/[orderNumber]`, `/wishlist`).
- Fix real defects found, don't just document them: the homepage's tile grids, the PDP's two-column layout collapsing correctly at `md`, the checkout wizard's step indicator not wrapping/overflowing at `390`, the cart drawer's width on narrow viewports, the Header's primary nav (currently `hidden lg:flex` — confirm the mobile equivalent, a menu trigger, actually exists and is reachable, not just hidden with nothing replacing it), table-like layouts (order line items, address cards) reflowing instead of forcing horizontal scroll.
- Confirm every interactive element meets the 44×44px touch-target minimum on touch viewports (`CLAUDE.md` accessibility rule) — icon buttons (`icon-sm`/`icon-xs` variants in `button.tsx`) are the likely offenders, worth auditing directly against the rendered CSS `size-*` values, not assuming.
- Confirm nothing depends on `:hover` alone to reveal necessary content or controls (no touch equivalent) — audit `group-hover:` usage across product cards, nav items, etc.
- AR-RTL at every breakpoint too, not just desktop — logical properties (`ms-`/`me-`/`ps-`/`pe-`) were already audited for correctness in Sprint 2, but never specifically re-checked under narrow-viewport wrapping, where RTL layout bugs most often actually surface.
- Add an automated regression net so this doesn't silently regress as Sprints 5+ land: Playwright viewport-matrix coverage (see Tests below), not just a manual pass that's never re-run.

**Dependencies**: Sprints 0–4 (this sprint audits and fixes what they built; it doesn't add new features).

**Acceptance criteria**: every route live at the time of this sprint renders with zero horizontal overflow and zero clipped/overlapping content at all 5 breakpoints in all 3 locales; every interactive control is ≥44×44px on touch viewports; the Playwright viewport-matrix suite (see below) is green and wired to run alongside the existing a11y/smoke suite, not as a one-off.

**Tests**: extend `apps/web/e2e/public-smoke.spec.ts`'s pattern (or a new `responsive-smoke.spec.ts`) to run each route at each of the 5 breakpoints via Playwright's `page.setViewportSize`, asserting `document.documentElement.scrollWidth <= viewport width` (the cheapest reliable proxy for "nothing is overflowing") plus a handful of targeted assertions (mobile nav trigger is visible and reachable at `390`, checkout step indicator doesn't overflow at `390`, PDP columns actually stack at `md` and below). Manual visual review (screenshots at each breakpoint) for anything the automated checks can't assert structurally.

---

## Sprint 4.6 — Smooth Navigation & Interaction Motion — **DONE** (2026-08-06)

**Objective**: Create a consistent, elegant, fast, and accessible motion system across navigation, header, drawers, menus, dialogs, accordions, tabs, route transitions, and commerce micro-interactions across desktop, tablet, and mobile in EN, FR, and AR (RTL).

**Tasks**:

- Centralize motion tokens (durations 120ms–600ms, standard/entrance/exit/editorial easings, reusable motion variants in `@ioma/web` `lib/motion-tokens.ts`)
- Page navigation continuity & route progress indicator (subtle brand top bar, instant feedback, no flash, back/forward support)
- Header state transition, navigation underline, active route motion, desktop dropdowns
- Mobile navigation drawer, Cart drawer, Search drawer/modal, Filter/Sort panels (backdrop fade, slide/fade, stagger nav items, focus management, body scroll lock, Escape key support)
- Dialogs, dropdowns, popovers, select menus (scale 0.98→1, short opacity, fast exit)
- Accordions & dynamic collapsible content (smooth expansion, dynamic EN/FR/AR height support, chevron rotation)
- Tabs & multi-step flows (active underline/pill indicator, subtle step fade/slide)
- Product gallery & commerce micro-interactions (fade image transitions without layout shift, quantity button feedback, subtle wishlist toggle state, loading skeletons with pulse)
- Toasts & feedback notifications (live regions, short entrance/exit, pause on hover)
- Strict `prefers-reduced-motion` compliance across all components
- Playwright automated motion & accessibility test suite

**Dependencies**: Sprints 0–4.5.

**Acceptance criteria**: Navigation feels smooth without artificial delay; shared layout remains stable; route progress never gets stuck; overlays trap focus, lock body scroll, restore focus on close, and support Escape; reduced-motion mode works; AR RTL directionality is correct; typecheck, lint, build, Docker rebuild, and Playwright test suite pass clean.

**Tests**: Playwright tests for drawer open/close, focus containment, focus restoration, escape key, route progress bar, accordions, dialogs, RTL overlays, and reduced motion.

---

## Sprint 4.7 — Mobile Bottom Tab Navigation — **DONE** (2026-08-06)

Numbered 4.7 for the same reason as 4.5/4.6 — inserted without renumbering Sprints 5–12. Distinct from 4.5 (which audits/fixes existing responsive layout) and 4.6 (which added the motion system) — this sprint adds a navigation pattern that doesn't exist yet: a persistent, native-app-style bottom tab bar for mobile viewports, alongside (not replacing) the Sprint 4.6 hamburger drawer for full site navigation.

**Objective**: On mobile viewports, the site feels like a real mobile app to navigate — a fixed bottom tab bar with the handful of destinations a returning customer actually needs constantly (Home, Shop, Bag, Wishlist, Account), always reachable in one tap, never requiring the hamburger drawer for routine navigation.

**Tasks**:

- Fixed bottom tab bar (`components/layout/bottom-tab-bar.tsx`), visible only below the `lg` (1024px) breakpoint where the header's primary nav is hidden, `position: fixed`/`sticky` to the viewport bottom, `z-drawer` or higher per `DESIGN_SYSTEM.md`'s z-index scale (`--z-drawer 60`) so it never sits under the cart/search drawers incorrectly, but must yield to actual open modals/drawers/toasts.
- 5 tabs: Home (`/`), Shop (`/shop`), Bag (`/cart`, live item-count badge — reuse the existing badge logic in `cart-trigger-button.tsx`), Wishlist (`/wishlist`), Account (`/account` if logged in else `/login` — reuse `account-link.tsx`'s existing logic rather than duplicating it). Each tab: icon + short label, active-tab state (filled icon or accent underline/pill, consistent with the existing header's `layoutId` active-underline pattern from Sprint 4.6), `aria-current="page"` on the active tab.
- Real native-app details, not just 5 icons in a row: safe-area-inset padding for iOS home-indicator (`env(safe-area-inset-bottom)`), a subtle top border/shadow separating it from page content, tap feedback (scale/opacity on press, respecting `prefers-reduced-motion` per the Sprint 4.6 motion-tokens system — reuse `lib/motion-tokens.ts`, don't invent a second motion system), and — critically — **page content must never be hidden behind the bar**: every page needs bottom padding/safe-area accounting equal to the bar's height on mobile viewports (a real, easy-to-miss bug: content or a page's own fixed/sticky footer elements getting obscured).
- Reconcile with what already exists at the bottom of the viewport on mobile: check the checkout page's submit/continue buttons, the PDP's add-to-cart button, and any other page-bottom fixed elements for overlap with the new tab bar and fix any conflicts.
- Hide the bottom tab bar (or don't render it) on routes where it doesn't make sense — the checkout flow is the main candidate (a competing bottom-fixed element, the step navigation, would fight the tab bar for the same screen real estate); use judgment and state the reasoning in `DECISIONS.md`.
- RTL: confirm the tab order and any directional icons mirror correctly under `dir="rtl"`.

**Dependencies**: Sprint 4.6 (motion tokens, active-route detection pattern), Sprint 4.5 (should land after or alongside — this sprint's own Playwright checks should assume 4.5's touch-target/overflow fixes are already in place).

**Acceptance criteria**: bottom tab bar renders on every page below `lg` in all 3 locales, all 5 tabs navigate correctly with accurate active-state, cart badge count matches the real cart, no page content is ever obscured by the bar, 44×44px+ touch targets on every tab, keyboard/screen-reader reachable (not just tap-only), `prefers-reduced-motion` respected, verified live against a rebuilt Docker container at 390px and 768px.

**Tests**: Playwright — bar visible below `lg` / absent at `lg`+, each tab navigates to the right route and shows correct active state, cart badge reflects real cart count after an add-to-cart, no vertical scroll-body overlap between the bar and page content (assert the last focusable/visible element on a long page isn't covered by the bar's bounding box), RTL tab order, reduced-motion.

---

## Sprint 5 — Customer Account — **DONE** (2026-08-06)

**Objective**: Authenticated customer hub.

**Tasks**: dashboard, profile, addresses CRUD, order history + tracking, wishlist, saved routines, diagnosis/before-after history, appointments list, notifications, language/newsletter preferences, password/security, account deletion request workflow.

**Dependencies**: Sprint 1 auth, Sprint 4 orders/wishlist data to display.

**Acceptance criteria**: every account subsection has real backend-backed CRUD (no static mock data left after this sprint), account deletion request creates an auditable admin-visible record rather than silently deleting.

**Tests**: Jest service tests for profile/address CRUD authorization (a user can never read/write another user's data); Playwright test for the full account navigation.

---

## Sprint 6 — Diagnosis (Standard + AI) — **DONE** (2026-08-06)

**Objective**: Personalized routine engine, both non-AI questionnaire and AI-mock pipeline.

**Tasks**: standard questionnaire UI + admin-managed rules engine (not hardcoded recommendations) producing skin profile → routine; AI flow (consent → privacy notice → upload/camera → quality validation → async job via BullMQ → mock provider analysis → results, clearly labeled simulated → routine → save/compare/delete); AI provider interface with pluggable real-provider adapter point; consent record model; image-retention policy + delete workflow.

**Dependencies**: Sprint 1 (queues/storage foundation), Sprint 4 (routine → cart), Sprint 5 (history storage location).

**Acceptance criteria**: both flows produce a routine that can be added to cart in one action; AI results UI cannot be mistaken for a real medical diagnosis (explicit disclaimer, "simulated" badge while mock provider active); user can delete their analysis images/results and the underlying MinIO objects are actually removed.

**Tests**: Jest tests for the rules engine (given inputs → expected recommendation) and consent-gating (no analysis proceeds without a recorded consent); Playwright E2E for both diagnosis flows.

---

## Sprint 7 — Partners & Booking — **DONE** (2026-08-07)

**Objective**: Locate a partner, book a real slot, no double-booking.

**Tasks**: partner locator (map + list, OSM/Leaflet default provider behind a map-provider interface, filters by emirate/city/type/service/diagnosis availability), partner detail page, availability model (working hours, breaks, holidays, capacity, service duration), booking wizard (service → diagnosis/treatment → specialist → date/slot → details → confirm), reschedule/cancel with policy, reminder job.

**Dependencies**: Sprint 1 (queues for reminders), Sprint 6 (diagnosis/treatment selection step reuses that data).

**Acceptance criteria**: booking the last available slot for a resource makes it unavailable to a second concurrent booking attempt (server-enforced, not just UI-disabled); map renders with zero API key required by default.

**Tests**: Jest test simulating concurrent booking requests for the same slot (only one succeeds); Playwright E2E full booking → reschedule → cancel.

**Status**: DONE — see `PROGRESS.md` Sprint 7 for the full build log.

---

## Sprint 8 — B2B — **DONE**

**Objective**: Professional registration through to a live, luxuriously-designed ordering portal.

**Tasks**: application form (company/trade licence/docs upload to private MinIO), application state machine (draft → submitted → pending → docs requested → approved/rejected/suspended), admin manual approval flow, professional dashboard (pricing, cabin + retail catalogue, MOQs, quick order, professional cart/checkout, orders/reorder, invoices, documents, protocols/technical sheets, marketing materials, company settings, team members).

**Dependencies**: Sprint 1 (auth/RBAC), Sprint 4 (cart/checkout patterns reused with a professional price list + MOQ layer).

**Acceptance criteria**: an unapproved professional cannot see B2B pricing or place an order (server-enforced); admin approval/rejection/suspension actually flips portal access; portal visually distinct from generic admin/SaaS chrome (uses the same luxury design system as the public site, denser layout).

**Tests**: Jest authorization tests for every professional-portal endpoint across all account states (pending/approved/suspended/rejected); Playwright E2E registration → (simulated) admin approval → professional login → order.

---

## Sprint 9 — Training & Protocols — **DONE (2026-08-13)**

**Objective**: Training catalogue + booking + protocol library for approved professionals.

**Tasks**: training catalogue (session model reusing Sprint 7 availability/capacity primitives), booking + payment-when-required + confirmation/invitation download, training history, cancellation policy, certificate download when supplied; protocol library (title/objective/duration/products/steps/contraindications/PDF/video/related training) with permission-gated access.

**Dependencies**: Sprint 7 (scheduling primitives), Sprint 8 (professional gating).

**Acceptance criteria**: a non-professional account cannot see or book training; protocol PDFs/videos served via signed MinIO URLs, never public.

**Tests**: Jest tests for capacity limits (can't overbook a session) and permission gating on protocol access; Playwright E2E training booking.

---

## Sprint 10 — Administration — **DONE (2026-08-13)**

**Objective**: One dashboard to run the whole business.

**Tasks**: KPI dashboard; modules for products/categories/ranges/concerns/ingredients/variants/media/inventory/B2C+B2B pricing, customers, professionals + approvals, orders/payments/refunds/shipments, partners/locations/services/treatments, appointments/availability, trainings/attendees, protocols/documents, diagnostics/AI analyses, content/pages/journal/FAQ/translations/SEO, promotions, notifications/email templates, users/roles/permissions, settings, audit logs. Consistent search/filter/sort/pagination/bulk actions/confirmation dialogs/all-4-states pattern across every module (built once as a shared admin-table primitive, reused everywhere — not rebuilt per module).

**Dependencies**: Sprints 4, 6, 7, 8, 9 (admin manages entities they create).

**Acceptance criteria**: every entity created by every prior sprint is fully manageable (create/read/update/appropriate-delete) from admin; RBAC enforced server-side per module, not just hidden nav items; audit log records who changed what.

**Tests**: Jest authorization matrix tests per role × module; Playwright E2E for the professional-approval and product-CRUD admin flows specifically (highest business risk).

---

## Sprint 11 — Localization & Quality — **DONE (2026-08-13)**

**Objective**: Close every EN/FR/AR-RTL, accessibility, performance, and SEO gap opened by Sprints 3–10.

**Tasks**: full string audit (zero untranslated keys), AR-RTL pass on every screen built so far (forms, tables, checkout, account, B2B, admin-where-enabled), hreflang + sitemap + robots + OG + schema (Product/Article/LocalBusiness/FAQ/Organization), Core Web Vitals pass, security header/CSP pass.

**Dependencies**: everything before it (this sprint audits, not builds, new features).

**Acceptance criteria**: no untranslated string found in an EN/FR/AR crawl of every route; Lighthouse SEO ≥ 95, a11y ≥ 95, performance targets met on the homepage/PDP/checkout; security checklist in `SECURITY.md` fully checked.

**Tests**: automated i18n key-coverage check in CI; Lighthouse CI budget; axe CI sweep.

---

## Sprint 12 — Testing & Deployment — **DONE (2026-08-13)**

**Objective**: Ship-ready.

**Tasks**: complete the Playwright journey suite (all journeys from §35 of the brief), production Docker Compose + Nginx/Caddy TLS-ready config, GitHub Actions CI (lint/typecheck/test/build/docker build), backup/restore scripts (Mongo dump, MinIO bucket sync), rollback documentation, final QA pass across the 5 breakpoints × 3 locales × the state matrix in `TEST_PLAN.md`.

**Dependencies**: all prior sprints.

**Acceptance criteria**: `docker compose -f infrastructure/docker/compose.prod.yml up` builds and serves the full app; CI green on a clean clone; every item in `DEPLOYMENT.md`'s go-live checklist ticked or explicitly logged as a pending client-provided credential.

**Tests**: full Playwright suite green; production Docker build succeeds with zero TypeScript errors.

---

## Sprint 13 — AI Skin Expert 2.0 — **IN PROGRESS** (2026-08-22)

**Objective**: Completely upgrade the existing AI Skin Diagnosis into a luxury digital beauty consultation ("IOMA AI Skin Expert") backed by real vision AI, adaptive consultation, Dubai climate awareness, real MongoDB product grounding, deterministic 3-tier routine building (Essential, Complete, Premium), conversational AI advisory, follow-up/rescan comparisons, and human expert escalation.

**Tasks**:

- Remove the legacy 5-step standard questionnaire (`/diagnosis/standard`) in favor of the unified AI Skin Expert flagship flow at `/diagnosis`.
- Vision AI with Gemini (`gemini-2.5-flash` / `gemini-3.7-flash`), structured JSON schema observations, image quality detection, and cosmetic advisory boundaries.
- Photography guidance and camera capture UI with live face guide and file upload fallback.
- Adaptive multi-turn consultation (3–7 contextual questions based on visual signals, current skincare routine ingestion, Dubai climate context, lifestyle goals, routine complexity, budget preference).
- Complete synthesized `SkinProfile` and ranked priorities (01–04).
- Real MongoDB catalogue retrieval & deterministic recommendation engine generating Essential (3 products), Complete (4-5 products), and Premium (5-7 products) routines calculated from real database variant prices (`b2cPriceMinor`).
- "Why This Product?", "When to Use", "How to Use", and AM/PM/Weekly ritual timelines.
- Interactive post-results conversational beauty advisor ("Ask your IOMA Skin Expert") with context-aware suggested questions and dynamic routine adaptation.
- One-click "Add Complete Routine to Bag" + individual product add with stock & database price checks.
- Private MinIO storage with signed temporary URLs, explicit consent records, and ownership authorization.
- Consultation saving to customer account (`/diagnosis/history`), Day 7 comfort follow-up, Day 28 reassessment invitation, Before/After cosmetic comparison, and human expert escalation to partner clinic/spa bookings.
- Multilingual translation across English, French, and Arabic (full RTL layout support).
- Automated tests: unit tests for profile/adaptive/recommendation/advisor services, integration tests for catalog retrieval and security authorization, and Playwright E2E suites across breakpoints (390px–1440px).

**Dependencies**: Sprints 1 (auth/storage), 4 (commerce/cart), 6 (diagnosis baseline), 7 (expert appointment booking).

**Acceptance criteria**: End-to-end user journey works against live MongoDB catalogue and Gemini vision provider; legacy questionnaire cleanly deprecated; 3 tiers generated with real database prices; chat provides interactive advice with suggested pills; add-to-cart adds exact variants; follow-up and before-after comparisons functional; passes full typecheck, lint, build, and Playwright test suite.

**Tests**: Unit tests for all AI services (`vision-analysis`, `adaptive-consultation`, `recommendation-engine`, `ai-beauty-advisor`, `follow-up`); Playwright E2E journey in `e2e/ai-skin-expert.spec.ts`.

## Product media extension — 2026-09-06

Status: **COMPLETE** (final evidence below). Product media architecture, migration, dedicated administration and content-only navigation transitions are implemented. 63 products/177 images migrated; 531 derivative bytes verified; 138 API unit tests passed. Browser acceptance and final deployed-build checks remain. This extends the prior Carbon admin/dashboard checkpoint.

## Product management completion — 2026-09-07

Final local acceptance (2026-09-07): 19 product/media/bulk-action Playwright tests passed, 21 admin tests passed on an isolated rerun, and 64 public/account tests passed in the broader run. The initial concurrent run had an admin-access failure and skipped later admin tests; the isolated rerun passed all 21. API: 147 tests / 27 suites. All eight workspaces typecheck; lint has zero errors (74 existing warnings); EN/FR/AR have 1614 matching keys. Docker API/web build passed; both containers healthy and the fresh web rewrite targets http://api:4000. All 531 migrated derivatives decoded successfully. QA cleanup restored 63 products, 70 variants and 177 assets.

Completed subsequent requests: product/order multiple selection and confirmed bulk deletion; inventory, stock movements and skin concerns consolidated into Product Management tabs. See [PRODUCT_MEDIA_COMPLETION.md](PRODUCT_MEDIA_COMPLETION.md). No commit or push.

## Remove Needs attention page — 2026-09-07

Removed the standalone admin notifications/Needs attention page, sidebar entry and header bell link across all locales. The former /[locale]/admin/notifications route explicitly resolves to not-found. Removed the unused attention-only dashboard rendering branch. Included in the successful local web build. Removal of links and the former route was verified across EN/FR/AR before testing was stopped.

## Same-page product workspace — 2026-09-07

Implemented and deployed locally. Product Detail now shares a single editor with Create, nine view/edit tabs, staged variant pricing, existing MediaAsset uploads, localized fields, search selectors, SEO preview, readiness checks, discard protection and immediate audited stock adjustment. The old /edit URL redirects to ?mode=edit. The Needs attention removal is included in this release. See PRODUCT_WORKSPACE_BRIEF.md and PRODUCT_WORKSPACE_AUDIT.md. The final web build succeeded. Further testing was stopped at the user's request; full browser acceptance remains incomplete. See PRODUCT_WORKSPACE_COMPLETION.md for completed checks and limitations.
