# CLAUDE.md — IOMA Paris Dubai Digital Platform

> Start each session with [AGENTS.md](AGENTS.md) and [PROJECT_BRIEF.md](PROJECT_BRIEF.md). The user brief preserved on 2026-09-06 supersedes conflicting older guidance below, including admin styling and independent standard diagnosis requirements. See `AGENTS.md` for the documentation reading workflow and precedence rules.

This file governs how work is done in this repository. It overrides default behavior. Read it before touching any code.

## Project Context

IOMA Paris ("N°1 de la Cosmétique Personnalisée") is a French luxury personalized-skincare house. This repository builds its **official digital flagship for Dubai / UAE**: a luxury public website, B2C e-commerce, personalized diagnosis (standard + AI), appointment booking, an interactive partner locator, a full B2B professional portal (registration → approval → ordering → training), and a complete admin back office. Trilingual: English, French, Arabic (full RTL).

The repository started **empty** (audited 2026-08-05 — no prior frontend/backend/infra code). Everything here was built from scratch against this spec and the official `IOMA_CHARTE_GRAPHIQUE_2026_FR.pdf` (charter, at repo root — do not delete, it is the design source of truth).

Git: this project has its **own** repo rooted at `C:\Users\Ala\Desktop\ioma`, deliberately isolated from the user's home-directory repo. Never run git commands that reach outside this directory.

## Business Objectives

- Sell an _experience_ before a product: French elegance, scientific credibility, visible results.
- Convert two distinct audiences from one platform: B2C retail customers and B2B professionals (spas, clinics, hotels, distributors), without the B2B portal ever looking like a generic SaaS dashboard.
- Every diagnosis/AI-analysis touchpoint must funnel toward either a cart (routine) or a booked appointment.
- Zero tolerance for anything that reads as unfinished, templated, or fake in front of the client.

## Technology Stack

| Layer          | Choice                                                             | Notes                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | Next.js (App Router) + React + TypeScript                          | Server Components by default; Client Components only where interactivity requires it                                                                      |
| Styling        | Tailwind CSS v4 (CSS-first `@theme` config) + shadcn/ui (restyled) | See `DESIGN_SYSTEM.md` — never ship default shadcn look; v4 chosen over v3 per `DECISIONS.md` since the shadcn CLI/MCP toolchain generates v4-only syntax |
| Animation      | Motion (Framer Motion successor)                                   | Aceternity for a _small_ number of editorial hero/storytelling sections only                                                                              |
| Forms          | React Hook Form + Zod                                              | Shared Zod schemas live in `packages/validation`                                                                                                          |
| Server state   | TanStack Query                                                     | All API reads/writes go through it, no ad hoc `fetch` in components                                                                                       |
| Client state   | Zustand                                                            | Only for genuinely client-only state (cart drawer open/closed, wizard step) — never for server data                                                       |
| i18n           | next-intl                                                          | `en`, `fr`, `ar` with `ar` fully RTL (`dir="rtl"`, logical CSS properties, mirrored icons)                                                                |
| Backend        | NestJS + TypeScript                                                | Modular monolith, REST + OpenAPI/Swagger                                                                                                                  |
| DB             | MongoDB + Mongoose                                                 | Indexed, soft-deleted where relevant, audited (`createdAt/updatedAt/createdBy/updatedBy/deletedAt`)                                                       |
| Object storage | MinIO (S3-compatible)                                              | Private buckets + signed URLs for anything not meant to be public                                                                                         |
| Cache/queues   | Redis + BullMQ                                                     | Sessions, rate limits, background jobs (email, image processing, notifications)                                                                           |
| Search         | MongoDB text search now, Meilisearch-ready adapter                 | Swappable without UI rewrite                                                                                                                              |
| Infra          | Docker Compose (dev + prod), Nginx/Caddy reverse proxy             | No DB/Redis/private MinIO ports exposed publicly                                                                                                          |
| CI             | GitHub Actions                                                     | lint → typecheck → test → build → docker build                                                                                                            |
| Testing        | Jest (API), Vitest (web unit), Playwright (E2E)                    |                                                                                                                                                           |

Monorepo: pnpm workspaces + Turborepo. Structure fixed by `ARCHITECTURE.md` — do not restructure without a `DECISIONS.md` entry.

## Code Conventions

- TypeScript strict mode everywhere. No `any` without a `// TODO(reason)` comment that is also logged in `TODO.md`.
- Functional React components only. No class components.
- Backend: one NestJS module per bounded domain (see `ARCHITECTURE.md` module list). Controllers thin, logic in services, DTOs validated with `class-validator`, guards for auth/roles, interceptors for logging/transform, exception filters for consistent error shape.
- Shared types live in `packages/types` and are generated from / kept in sync with the OpenAPI contract — the frontend never imports a Mongoose model or backend-internal type directly.
- Naming: `kebab-case` files, `PascalCase` components/classes, `camelCase` variables/functions, Mongo collections `camelCase` plural (e.g. `productVariants`).
- Prefer composition over inheritance; prefer editing an existing shared component over duplicating markup.

## Folder Conventions

```
apps/web/app/[locale]/(public)/...      luxury public site route groups
apps/web/app/[locale]/(shop)/...        B2C commerce
apps/web/app/[locale]/(account)/...     customer account (auth-gated)
apps/web/app/[locale]/(pro)/...         B2B portal (professional-approved-gated)
apps/web/app/[locale]/admin/...         admin dashboard (RBAC-gated, not locale-prefixed content-wise but URL keeps locale for consistency)
apps/api/src/modules/<domain>/          one folder per bounded module (dto, entities, service, controller, module)
packages/ui                             restyled shadcn primitives + IOMA composite components
packages/validation                     Zod schemas shared by RHF forms and (mirrored) NestJS DTOs
packages/types                          shared API/domain types generated/hand-synced from OpenAPI
infrastructure/docker                   Dockerfiles + compose files
infrastructure/nginx                    reverse proxy config
infrastructure/scripts                  seed, backup, bucket-init scripts
```

## UI Rules

- No default shadcn styling ships to production. Every component is restyled against `DESIGN_SYSTEM.md` tokens before use.
- No glassmorphism, neon, cheap gradients, heavy drop shadows, excessive rounded corners, or crowded card grids. Luxury comes from typography, whitespace, photography, and restraint — not decoration.
- One animation system per interaction. Do not stack Motion + Aceternity + CSS transitions on the same element.
- Full-bleed imagery on marketing sections; the B2B portal and admin get denser, calmer, still-premium layouts — never "generic SaaS."

## IOMA Branding Rules (from `IOMA_CHARTE_GRAPHIQUE_2026_FR.pdf`)

- Logo: black on light backgrounds; white **only** when black is unreadable (dark/busy backgrounds). Never recolored, stretched, or reproportioned. The "PARIS" signature is never moved or restyled separately.
- Protection zone: no text/image/border may enter the zone equal to the width of the lowercase "o" in "ioma" around the full lockup.
- Minimum size: 6mm width for the logo alone; 11.4mm total height when paired with the claim; claim text minimum 4.5pt/1.4mm.
- Claim "N°1 de la Cosmétique Personnalisée*" sits between the "i" of ioma and the "P" of PARIS, set in Futura Book, asterisk always superscript, with the sourced footnote reproduced wherever the claim appears. **No approved Arabic translation of the claim exists yet — do not translate it ourselves; use the French/English claim in AR contexts until legal/marketing supplies an approved AR string** (tracked in `CLIENT_REQUIREMENTS.md`).
- Colors: exact values in `DESIGN_SYSTEM.md`. Range colors (Hydra/Energize/Renew/Calm/Pureté/Matte/Illumine) are used **only** in the context of that specific product range — never as generic UI accent colors.
- Typography: Gotham (primary institutional) or Futura PT (secondary institutional) per the charter's role table; product/promotional copy uses the distinct Gotham Light/Book promotional scale. See `DESIGN_SYSTEM.md` for the full mapping and the open-source substitution used until licensed font files are supplied.
- Never invent clinical claims, percentages, or "N ans" style stats — these are all CMS-editable and must stay empty/marked "à compléter par le client" until real content is supplied, never filled with invented numbers.

## UX Requirements

- Every multi-step flow (diagnosis, AI analysis, booking, checkout, B2B registration) shows explicit progress and allows back-navigation without data loss.
- Every destructive or hard-to-reverse action (cancel booking, delete account, remove professional access) requires confirmation.
- Every async action has loading, empty, error, and success states — no exceptions, no bare spinners with no eventual state.

## Accessibility Requirements

- Target WCAG 2.2 AA. Semantic HTML first; ARIA only to fill real gaps.
- All interactive elements keyboard-operable with a visible focus ring (never `outline: none` without a replacement).
- `prefers-reduced-motion` must disable/shorten all non-essential animation.
- Color is never the only signal (stock status, form errors, price changes all carry text/icon too).
- Touch targets ≥ 44×44px on mobile.

## Security Rules

- No secrets committed, ever. All config through `.env`, validated at boot (see `ENVIRONMENT.md`); missing required vars must fail startup loudly, not silently degrade.
- Passwords hashed with Argon2id (or bcrypt cost ≥ 12 if Argon2 unavailable in the environment). Refresh tokens rotated and stored hashed.
- Every mutating endpoint validates input with DTOs + Zod-mirrored rules; every protected endpoint enforces both authentication and role/permission — never hide an action in the UI without also guarding it server-side.
- File uploads: type allow-list + size limit enforced server-side, private MinIO bucket + signed URL for anything user- or document-related (professional licences, diagnosis images).
- Full detail in `SECURITY.md`.

## Testing Requirements

- No merged feature without: at minimum one backend unit/service test, one API/integration test if it touches a new endpoint, and (for user-facing flows) a Playwright happy-path test.
- New forms get a validation test (invalid input is rejected with the right message, in all three locales where copy differs).
- See `TEST_PLAN.md` for the full matrix (resolutions, locales, states).

## Git and Commit Rules

- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`). One logical change per commit.
- Never `--no-verify`, never force-push, never commit `.env` or anything under `infrastructure/docker/volumes/`.
- Commit only when explicitly asked, per the operator's standing instructions for this session — batches of work are presented for review, then committed.

## Rules for Updating PROGRESS.md

- Update `PROGRESS.md` after every meaningful task (a completed feature slice, not every file edit): current sprint, current task, completed/in-progress lists, blockers, tests run, remaining work, and the date.
- `TODO.md` checkboxes must stay in sync with `SPRINTS.md` and `PROGRESS.md` — a task is not "done" in one file while still unchecked in another.
- Architectural or product decisions get a dated entry in `DECISIONS.md` with the "why," not just the "what."

## Rules Against Placeholders, Fake Interactions and Unfinished Pages

- No Lorem ipsum, no dead buttons, no `onClick={() => {}}`, no hardcoded fake data presented as if it were real/live.
- Where official content or credentials are genuinely unavailable (real product photography, licensed fonts, payment gateway keys, AI provider keys, Google Maps key, Arabic claim translation), build the real interface against a documented mock/adapter, and log the gap in `CLIENT_REQUIREMENTS.md` + `ENVIRONMENT.md` + `PROGRESS.md`. The mock must be clearly labeled as such in the UI where a user could otherwise mistake it for real (e.g., AI analysis demo mode banner) — everything else must function end-to-end.
- Every page reachable from navigation must render a real, finished layout in EN/FR/AR before being considered part of a completed sprint.
