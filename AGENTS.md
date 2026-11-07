# IOMA Paris Dubai — Repository Instructions

These instructions apply throughout this repository.

## Read at the start of every session

Read this file, [PROJECT_BRIEF.md](PROJECT_BRIEF.md), and [CLAUDE.md](CLAUDE.md) before working. Consult [PROGRESS.md](PROGRESS.md) and [TODO.md](TODO.md) for the recorded state. Revisit the relevant guidance when task scope changes; do not rely on memory from previous sessions.

Before major work, also inspect [SPRINTS.md](SPRINTS.md), [DECISIONS.md](DECISIONS.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_MODEL.md](DATA_MODEL.md), [API_SPEC.md](API_SPEC.md), [SECURITY.md](SECURITY.md), [TEST_PLAN.md](TEST_PLAN.md), [DEPLOYMENT.md](DEPLOYMENT.md), and [ENVIRONMENT.md](ENVIRONMENT.md). Consult [CLIENT_REQUIREMENTS.md](CLIENT_REQUIREMENTS.md) for client-supplied assets, content, and configuration gaps.

For account or professional portal work, also read [ACCOUNT_REDESIGN_BRIEF.md](ACCOUNT_REDESIGN_BRIEF.md) and [ACCOUNT_AUDIT.md](ACCOUNT_AUDIT.md). The account brief supersedes conflicting historical account descriptions.

For administration work, also read [ADMIN_REDESIGN_BRIEF.md](ADMIN_REDESIGN_BRIEF.md) and [ADMIN_AUDIT.md](ADMIN_AUDIT.md). Verify real database metrics and permission enforcement; do not infer implemented modules from historical roadmap documents.

## Authority and current requirements

- Follow current user instructions. The full user brief preserved in `PROJECT_BRIEF.md` on 2026-09-06 supersedes conflicting older project guidance. Retain existing conventions where compatible.
- The official `IOMA_CHARTE_GRAPHIQUE_2026_FR.pdf` remains the visual source of truth. Preserve its logo, typography, claim, and range-color rules.
- Treat feature lists and statements in the brief as requirements, not proof of implementation. Verify actual code and runtime behavior before claiming completion. Historical progress and test results are not current verification.
- The public site is luxury, editorial, and scientific. The B2B portal is professional and operational. The admin follows IBM Carbon Design System principles: structured, accessible, dense but readable, and efficient. This supersedes older instructions applying public luxury styling to admin.
- Standard questionnaire diagnosis must work independently of AI. Older notes deprecating its entry point do not cancel this requirement; assess the implementation when working on diagnosis.
- Talking consultant requirements specify English and Arabic. The main website still requires English, French, and Arabic with full RTL.

## Product and implementation rules

- Build the official UAE platform: public brand site, B2C commerce, diagnosis, AI Skin Expert, real product routines, partners, booking, B2B, training, protocols, accounts, and custom administration. Preserve the existing monorepo and modular architecture; no disconnected prototype, WordPress, or Shopify replacement.
- Use the existing Next.js/React/TypeScript frontend, NestJS API, MongoDB/Mongoose, MinIO, Redis/BullMQ, and Docker infrastructure. Check manifests for installed versions. Reuse existing components, data hooks, validation, and provider abstractions before adding dependencies.
- MongoDB/backend is authoritative for products, eligibility, stock, ingredients, usage, and prices. Use client-supplied AED prices; never import French EUR prices, automatically convert them, or invent products or clinical claims.
- Photo-derived indicators come only from Vision analysis. Questionnaire/lifestyle answers refine recommendations and must not alter photo-derived scores. Keep stored visual observations separate from recommendation inputs.
- Ground AI recommendations in real product candidates and deterministic eligibility rules. Calculate Essential/Complete/Premium totals from database AED prices. Keep chat contextual; provider failures need controlled unavailable states, never silent generic answers or fabricated production results.
- Éléonore is the stable female consultant face/voice; backend AI remains responsible for reasoning. Keep Gemini, ElevenLabs, and avatar providers configurable, with keys exclusively on the server.
- Enforce ownership and roles on the backend, including private skin images/documents, approved professional access, cabin products, B2B pricing, and MOQ. Prevent concurrent double booking and training capacity/duplicate-booking errors.
- Use real EN/FR/AR translations, logical CSS, mirrored directional icons, and correct mixed-text RTL. Test affected interfaces at 390, 768, 1024, 1280, and 1440 pixels; avoid document overflow and maintain at least 44×44px touch targets.
- Keep motion restrained, performant, and responsive; respect reduced motion. No bounce, scroll hijacking, or excessive parallax. Prefer the existing Motion implementation; the brief's allowance for GSAP is not a requirement to add it.
- Keep secrets out of source, Git, frontend bundles, and logs. If configuration is missing, document exact variable names and continue independent work through provider abstractions.

## Verification and handoff

- Inspect the affected implementation before changing it. Verify actual user journeys with appropriate tests, API requests, browser interactions, and database/storage checks when relevant. A route, successful typecheck, attractive UI, or running container alone does not establish a working feature.
- Use existing Jest, Vitest, Playwright, lint, typecheck, build, and Docker checks as appropriate to the task. Report what was actually verified and any remaining gaps.
- Keep `PROGRESS.md`, `TODO.md`, and `SPRINTS.md` synchronized after meaningful completed work. Record architectural/product decisions with rationale in `DECISIONS.md`; distinguish requirements from completed implementation.
- Do not commit or push unless explicitly requested. Keep Git operations within this repository.

For admin implementation details and metric definitions, also consult [ADMIN_IMPLEMENTATION.md](ADMIN_IMPLEMENTATION.md). It distinguishes configured providers from observed outcomes and documents structured CMS entry points.

For product management or media work, also read [PRODUCT_MEDIA_BRIEF.md](PRODUCT_MEDIA_BRIEF.md), [PRODUCT_MEDIA_AUDIT.md](PRODUCT_MEDIA_AUDIT.md), and [PRODUCT_MEDIA_IMPLEMENTATION.md](PRODUCT_MEDIA_IMPLEMENTATION.md). These describe the ordered gallery, derivative URL contract, migration backup, and image-retention rules.

For the verified product/media and bulk-management handoff, consult [PRODUCT_MEDIA_COMPLETION.md](PRODUCT_MEDIA_COMPLETION.md).
