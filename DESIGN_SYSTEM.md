# DESIGN_SYSTEM.md — IOMA Paris Dubai

Source of truth: `IOMA_CHARTE_GRAPHIQUE_2026_FR.pdf` (repo root, "Charte Graphique 2025/2026"), read in full 2026-08-05. Every value below is transcribed from that document; nothing here is invented. Where the charter is silent (spacing scale, radii, shadows, motion, breakpoints, z-index — these are implementation tokens a print charter doesn't specify), values are chosen to honor the charter's stated tone ("luxurious, minimal, editorial... avoid excessive rounded corners, heavy shadows, loud gradients").

## Logo

- Primary: black on light backgrounds. White version used **only** when black is not legible (dark or busy photographic backgrounds) — the charter shows a reserved dark-cartouche or photography variant for that case.
- Never recolored (the charter explicitly marks red/violet-recolored and bold-weight examples as forbidden), never restretched, proportions and typography fixed.
- Protection zone: equal to the width of the lowercase "o" in "ioma" on **every** side of the full lockup (logo alone, or logo+claim as one unit) — no text, image, or rule may enter it.
- Minimum sizes: logo alone ≥ 6mm width; logo + claim ≥ 11.4mm total height; claim type size ≥ 4.5pt (1.4mm).
- Claim: "N°1 de la Cosmétique Personnalisée*" set in **Futura Book**, positioned between the "i" of "ioma" and the "P" of "PARIS", asterisk always superscript, footnote reproduced wherever the claim is shown: _"N°1 en ventes de soins personnalisés (source : Cosmétiquemag Novembre 2018)."_ Approved translations exist for **FR / EN / IT only**. No Arabic translation is approved — the AR locale must reuse the FR or EN claim string until legal/marketing supply one (tracked in `CLIENT_REQUIREMENTS.md`); do not machine-translate it ourselves.
- Implementation note: no official SVG/EPS logo file exists in this repo yet (`CLIENT_REQUIREMENTS.md`). Until supplied, the lockup is reproduced as inline SVG matching the charter's proportions exactly (the distinctive lowercase "ioma" wordmark with dotted "i" and small-caps "PARIS" signature beneath), so it can be swapped for the official file with zero markup changes elsewhere once received.

## Color Tokens

### Brand

| Token           | Hex                          | RGB         | CMYK            | Pantone                                                           | Usage                                                                                |
| --------------- | ---------------------------- | ----------- | --------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `--ioma-black`  | `#000000`                    | 0,0,0       | C75 M70 J60 N95 | Black 6C                                                          | Primary text, logo                                                                   |
| `--ioma-white`  | `#FFFFFF`                    | 255,255,255 | —               | —                                                                 | Backgrounds, reversed logo/text                                                      |
| `--ioma-violet` | `#AA9FEB`                    | 170,159,235 | C33 M37 J0 N0   | —                                                                 | Primary accent, CTAs, focus states, diagnosis/personalization touchpoints            |
| `--ioma-silver` | `#C7C7C7` (UI approximation) | —           | —               | 877C (metallic, Kurz alufin satin gloss — has no flat equivalent) | Discreet premium accent only (dividers, secondary icons) — never a primary CTA color |

### Neutral scale (charter-silent, derived to sit between black/white per "very light neutral greys")

`--ioma-grey-50 #FAFAFA` · `--ioma-grey-100 #F5F5F4` · `--ioma-grey-200 #E8E7E5` · `--ioma-grey-400 #A8A6A2` · `--ioma-grey-600 #6B6966` · `--ioma-grey-900 #1A1A1A`

### Range colors — used only within that range's own context, never as generic UI accents

| Range    | Hex                             | RGB        | Pantone |
| -------- | ------------------------------- | ---------- | ------- |
| Hydra    | `#00639A`                       | 0,99,154   | 7691C   |
| Energize | `#E56953`                       | 229,105,83 | 7416C   |
| Renew    | `#782285` (from RGB 120,34,117) | 120,34,117 | 2356C   |
| Calm     | `#B52655`                       | 181,38,85  | 7425C   |
| Pureté   | `#B89E16`                       | 184,158,22 | 457C    |
| Matte    | `#00677F`                       | 0,103,127  | 315C    |
| Illumine | `#483A8F`                       | 72,58,143  | 2104C   |

Implementation: expose these as CSS custom properties scoped via a `data-range="hydra|energize|..."` attribute on the nearest ancestor (product card, range page hero, routine-step badge), not as global Tailwind `colors.*` entries — this keeps them from leaking into generic UI as accidental accent colors, which the charter and brief both explicitly forbid.

## Typography

Charter defines **two interchangeable institutional systems** (use one consistently per surface, don't mix) plus a distinct **product/promotional** scale.

### Institutional System 1 — Gotham

| Role                 | Weight        | Tracking |
| -------------------- | ------------- | -------- |
| Titres (H1/H2)       | Gotham Medium | +50      |
| Sous-titres/Chapeaux | Gotham Book   | +50      |
| Intertitres (H3/H4)  | Gotham Medium | 0        |
| Texte courant (body) | Gotham Book   | 0        |

### Institutional System 2 — Futura PT

| Role                 | Weight           | Tracking |
| -------------------- | ---------------- | -------- |
| Titres               | Futura PT Bold   | +50      |
| Sous-titres/Chapeaux | Futura PT Medium | +50      |
| Intertitres          | Futura PT Book   | 0        |
| Texte courant        | Futura PT Light  | 0        |

**Site-wide decision** (`DECISIONS.md`): use **System 1 (Gotham)** as the default institutional voice site-wide for consistency (Futura Book is reserved for the logo claim specifically, per the charter), with Futura PT available as a secondary/editorial voice for select storytelling sections if desired later.

### Product/Promotional scale (product pages, campaign banners)

- Product name (H1): Gotham Light, tracking −40, large size.
- Descriptif produit: Gotham Book, size = 0.3× the H1 size.
- Claim produit (H2): Gotham Book, **uppercase**, size = 0.4× the H1 size, tracking +80.

### Font substitution (no licensed files supplied yet — `CLIENT_REQUIREMENTS.md`)

Until Gotham/Futura PT license files arrive, use **visually compatible open-source substitutes** loaded via `next/font`:

- Gotham → **Manrope** (geometric grotesque, similar x-height/weight range) for institutional System 1 roles.
- Futura PT → **Jost** (geometric sans in the Futura lineage, open license) for the logo claim / System 2 roles.
- Arabic (`ar` locale) → **Cairo** (geometric Arabic sans, open license) — the charter specifies no Arabic typeface at all, so this substitute was chosen for visual consistency with Manrope/Jost rather than defaulting to a generic system Arabic font. See `DECISIONS.md`.
- All three load via `next/font/google` in `apps/web/src/app/[locale]/layout.tsx`, exposed as `--font-sans`/`--font-display` CSS variables, swapped to Cairo via an `html[lang="ar"]` override in `globals.css`. Swapping in the licensed Gotham/Futura PT files later is a single change to that one layout file — no other component code changes required.

### Fluid type scale (implementation, charter-silent on exact px)

`--text-xs 0.75rem` · `--text-sm 0.875rem` · `--text-base 1rem` · `--text-lg 1.125rem` · `--text-xl 1.375rem` · `--text-2xl clamp(1.75rem,1.4rem+1.5vw,2.5rem)` · `--text-3xl clamp(2.25rem,1.7rem+2.2vw,3.5rem)` · `--text-4xl clamp(2.75rem,1.9rem+3.5vw,5rem)` (hero headlines) — all with `letter-spacing` driven by the tracking rules above (uppercase headings get positive tracking; body stays 0).

## Spacing, Grid, Containers

`--space-1..16` on a 4px base unit (4/8/12/16/24/32/48/64/96/128px). Container max-widths: `--container-sm 640px` · `--container-md 1024px` · `--container-lg 1280px` · `--container-xl 1440px` · editorial full-bleed sections ignore the container entirely. Grid: 12-column, 24px gutter desktop / 16px mobile — used sparingly; editorial sections favor asymmetric composition over uniform card grids per the brief's explicit "must not look like a list of cards" rule.

## Borders, Radius, Shadows

Radii deliberately minimal, per "avoid excessive rounded corners": `--radius-none 0` (default for cards/sections) · `--radius-sm 2px` (inputs, buttons) · `--radius-md 4px` (rare, larger surfaces like modals). No radius exceeds 4px anywhere in the system. Shadows minimal and cool-toned, never the default Tailwind/shadcn heavy black shadow: `--shadow-sm 0 1px 2px rgba(0,0,0,0.04)` · `--shadow-md 0 4px 16px rgba(0,0,0,0.06)` — used only for floating surfaces (dropdowns, modals, toasts), never on static cards.

## Motion

Centralized Tokens (Sprint 4.6 — `apps/web/src/lib/motion-tokens.ts` & `globals.css`):

Durations:

- Instant feedback: `--motion-instant 120ms` (0.12s — button toggles, micro-feedback)
- Small controls: `--motion-control 180ms` (0.18s — checkboxes, switches, tabs)
- Menus & dropdowns: `--motion-menu 240ms` (0.24s — popovers, context menus, select options)
- Drawers & dialogs: `--motion-overlay 320ms` (0.32s — sheets, dialogs, modals)
- Page content transitions: `--motion-page 350ms` (0.35s — route content reveal)
- Large editorial media: `--motion-editorial 600ms` (0.60s — hero reveals, story highlights)

Easings:

- Standard UI easing: `--ease-standard cubic-bezier(0.4, 0, 0.2, 1)` (UI state feedback)
- Entrance easing: `--ease-entrance cubic-bezier(0, 0, 0.2, 1)` (Elements entering)
- Exit easing: `--ease-exit cubic-bezier(0.4, 0, 1, 1)` (Elements exiting)
- Editorial easing: `--ease-editorial cubic-bezier(0.16, 1, 0.3, 1)` (Luxury slow-out)

Principles & Rules:

- Motion must never delay navigation or introduce artificial loading delays.
- Animate GPU-friendly properties (`opacity`, `transform`) only; avoid animating width, height, top, left.
- All animation respects `prefers-reduced-motion: reduce` (durations collapse to ≤ 0.01ms, transforms removed).
- Overlays (drawers, dialogs) trap focus, restore focus on close, lock body scroll, and support Escape key.
- Directional transforms follow locale (`ar` RTL direction awareness).

### Cinematic Editorial Motion (Homepage Hero)

- **Pinned Container**: Pinned via CSS sticky (`h-[200vh]` desktop, `h-[140vh]` mobile) to keep user in complete control of natural scroll physics. Zero scroll hijacking.
- **Scroll-Driven Video Synchronization**: Video playback `currentTime` mapped linearly to spring-smoothed `scrollYProgress` with instant keyframe GOP (`-g 5`) for seamless scrubbing.
- **Camera Movement**: Subtle scale expansion (`1.0 -> 1.08`), Y-drift (`0 -> -25px`), and desktop pointer micro-tilt (max ±4px / ±6px, spring damped 30/120).
- **Multi-Phase Stagger**: 4 distinct narrative phases (Entrance → Scientific Precision → Transformation → Magazine Unfolding).
- **Header Coordination**: Dynamic dark-to-light header crossfade based on scroll offset.
- **Reduced Motion Fallback**: High-contrast static editorial layout with zero layout shifts.

## Breakpoints

`sm 390px` · `md 768px` · `lg 1024px` · `xl 1280px` · `2xl 1440px` — matching the five required test resolutions exactly.

## Z-Index Scale

`--z-base 0` · `--z-sticky-header 40` · `--z-dropdown 50` · `--z-drawer 60` · `--z-modal 70` · `--z-toast 80` · `--z-tooltip 90`.

## Component States

Every interactive component defines, at minimum: `default`, `hover`, `focus-visible` (2px `--ioma-violet` ring, offset 2px, never suppressed), `active`, `disabled`, `loading` (skeleton or inline spinner, never a layout-shifting spinner swap), and where relevant `error`/`success`. RTL: all directional properties (`margin-inline-*`, `padding-inline-*`, `text-align: start/end`, icon mirroring for arrows/chevrons) — no hardcoded `left`/`right`.

## What This System Explicitly Avoids

Per the brief and the charter's restrained tone: glassmorphism, neon, gradients as decoration (gradients only appear as authentic photographic/product-lighting backdrops, matching the charter's key-visual examples — never as flat UI-chrome gradients), heavy drop shadows, dense card grids for editorial content, decorative stock icon sets beyond the charter's own pictogram family, and any second animation library layered on top of Motion for the same interaction.

## Account experience

Use editorial headings, light typography, thin rules, white space and restrained violet. Shared grouped navigation is sticky on desktop and collapses behind a labelled section button below 1024px. Keep touch controls at least 44px, use logical spacing and mirror directional arrows in Arabic. Two-column forms begin at md (768px), because this project's sm is 390px. Status timelines use text plus symbols, never percentages or color alone. Personal and professional modes link between /account and /portal without another login. Entrance transitions last 200ms and inherit reduced-motion rules. Product previews use catalogue images and real prices; empty/error/loading states must remain distinct.

## Admin dashboard — September 2026

Use flat neutral panels, blue actions, clear section borders, readable operational typography and restrained motion. KPI cards include period/snapshot context and link to relevant management records. Revenue uses an SVG line/area chart with previous-period comparison, tooltips and a tabular alternative; categorical metrics use labelled bars.

Desktop navigation is sticky at 1280px and wider. Smaller widths use a modal navigation drawer; Needs Attention moves above the main charts. Tables scroll inside their own container. Charts measure their parent width. Forms use 44px controls and localized EN/FR/AR inputs, with logical spacing and RTL drawer placement. Verify 390/768/1024/1280/1440px in the running build.

Arabic admin explicitly prioritizes Cairo before any Latin fallback font. Directional navigation arrows mirror in RTL; monetary details are formatted from integer fils into localized AED values, and operational timestamps use Asia/Dubai.

## Admin editable detail pattern

A compact identity header owns View/Edit/Save/Cancel actions. Nine keyboard-accessible tabs share parent draft state; changing tabs does not reset values. Read-only sections become labelled fields in edit mode. A sticky bottom save bar remains available while editing. Errors appear next to fields and as tab counts. Language controls include completeness and Arabic RTL. Use a large primary media preview, thumbnail strip and descriptive media metadata; keep database identifiers inside Technical Information.

## Admin: catalogue import center (2026-11-06)

Functional Polaris-style admin (separate from the storefront system). Import center = connection card, catalogue counts, start-import card, preview table with status badges (New = success, Update = warning, Conflict = critical, Unchanged = neutral), a right-hand sheet for per-field differences with "Keep Dubai / Use source" selects and an explicit approval checkbox, history table, ownership matrix. Rules: destructive or bulk actions (apply, rollback) always go through a confirmation sheet that restates what will and will not change; errors are announced with `role="alert"`; no decorative motion.
