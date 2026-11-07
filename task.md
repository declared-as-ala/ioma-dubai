# IOMA Paris Dubai — Master Catalogue & UI Modernization Task List

This task list tracks all implementation tasks for the **Master Catalogue & Product Management Refactor** and **Modern UX/UI Redesign** across both the public website and the admin dashboard.

---

## 1. Database & Catalogue Ingestion

- [x] **1.1 Execute Catalogue Import (`--apply`)**: Run `import-shopify-catalog.ts` in apply mode to populate 63 products, 20 categories, 10 ranges, 30 concerns, 8 skin types, 20 product types, and match 49 AED prices. _(Verified in MongoDB: 63 total products, 49 published, 14 drafts, 10 ranges, 235 media assets synced to MinIO)_.
- [x] **1.2 Verify Unpriced & Draft Products**: Ensure the 14 unpriced products (routines, gift card, patch kit) are stored in `status: 'draft'` and `priceStatus: 'pending_uae_price'`. _(Verified in MongoDB: 14 draft products)_.
- [x] **1.3 Verify Media Derivative Contract**: Ensure all product media references follow the `/api/media/products/:id/:variant` MinIO contract. _(Verified: 235 media assets stored in MinIO bucket `ioma-public`)_.

---

## 2. Admin Back Office Redesign (Shopify Workflow + IBM Carbon UI)

- [x] **2.1 Redesign Admin Product List (`/admin/products`)**:
  - [x] Add KPI summary ribbon (Total Products, Active Storefront, Pending UAE Price, Sur Mesure, Haircare, Low Stock).
  - [x] Add Shopify-style operational saved views (_All Products_, _Active Storefront_, _Pending UAE Price_, _Sur Mesure_, _Haircare_, _Low Stock_, _Drafts_, _Archived_).
  - [x] Implement instant debounced search and multi-facet filtering (Range, Category, Type, Concern, Stock status, Price status).
  - [x] High-density Carbon data table with thumbnails, product title + subtitle/slug, status chip, stock level, product type, category, range chip with official charter color dot, channels (`B2C`, `B2B`), and AED retail price.
  - [x] Bulk actions toolbar (Publish/Unpublish, Assign Range, Delete, Export CSV).
- [x] **2.2 Redesign Admin Product Editor (`/admin/products/[id]`)**:
  - [x] Two-column modern layout: 70% Main Canvas + 30% Organization Sidebar.
  - [x] Main Canvas: Core Identity (Title, Accroche, Body HTML), Media Manager with primary/secondary/third badges and drag-and-drop reordering, Formulation Accordions (_Détails_, _Texture_, _Résultats_, _Conseils d'utilisation_), Active Ingredients (Actifs 1..5) & Full INCI, Commercial Configuration (AED B2C retail, Compare-at, B2B wholesale, MOQ, Stock), Variants, and SEO preview.
  - [x] Organization Sidebar: Publishing Status toggle with **Publishing Readiness Checklist** (Official content, Media, Range, AED Price, Translations), Sales Channels (B2C, B2B, Cabin), Product Organization (Category tree, Product Type, Range, Vendor), Skin Intelligence (Concerns, Skin types, Hair types), and Translation Matrix (EN/FR/AR progress).
- [x] **2.3 Redesign Admin Taxonomy Managers**:
  - [x] `/admin/categories`: Hierarchical category tree view (Visage -> Crèmes, Sérums, Masques, Nettoyants; Corps; Cheveux; Soins sur mesure; Routines) with product counts and visibility toggles.
  - [x] `/admin/product-ranges`: 10 official gammes with official charter colors, range numbers, hero badges, and mapped products.
  - [x] `/admin/skin-concerns`: 30 skin concerns with filter toggles and mapped product counts.
  - [x] `/admin/product-types`: 20 official product types with category associations.

---

## 3. Storefront Modern Luxury Redesign (Website)

- [x] **3.1 Modern Luxury MegaMenu & Navigation**:
  - [x] VISAGE 3-pillar menu layout (_Vos Préoccupations_, _Nos Catégories_, _Nos Gammes_ with their charter colors + featured innovation card).
  - [x] `UV & PROTECTION` direct link.
  - [x] `SOINS SUR MESURE` bespoke franchise dropdown (_Ma Crème Jour_, _Ma Crème Nuit_, _Mon Sérum_, _Mon Soin Yeux_, _Diagnostic_).
  - [x] `CORPS`, `CHEVEUX`, `KITS & ROUTINES`, `INSIDE IOMA`.
  - [x] Animated luxury pill for `AI SKIN EXPERT 2.0`.
- [x] **3.2 Modern Luxury Homepage**:
  - [x] Cinematic hero with dual luxury CTAs (_Découvrir la collection_, _Diagnostic de peau_).
  - [x] **Nos Meilleures Ventes (Best Sellers)** carousel with official packshots, Range chips, star ratings, and verified AED prices.
  - [x] **Soin Sur Mesure Featurette** highlighting _Ma Crème Jour_ and _Ma Crème Nuit_ with bespoke diagnostic linking.
  - [x] **AI Skin Expert 2.0 Interactive Card** (luxury glassmorphism/dark aesthetic showcasing Éléonore AI consultation).
  - [x] **Explore by Range (Nos Gammes)** visual grid with official charter accent colors and range numbers.
  - [x] **Nos Routines & Kits** showcase with 3-step targeted protocols.
  - [x] **Clinical Science & Technology** (Jean Michel Karam story, patented MEMS sensors).
  - [x] **Customer Reviews & Social Proof** (Certified IOMA Paris ratings).
- [x] **3.3 Modern Luxury Product Detail Page (PDP) (`/shop/[slug]`) — Exact Replica of ioma-paris.com & Full Excel Metadata Integration**:
  - [x] **Left Column — High-End Media Packshot & Clinical Accordions (Directly under packshots)**:
    - [x] **Vertical Thumbnail Strip**: Left-aligned thumbnail rail showing packshot angles, jar texture, packaging, and open product with active state indicator.
    - [x] **Central High-Resolution Packshot Gallery**: Clean white/neutral luxury background with smooth pan-zoom on hover and swipe gesture on mobile.
    - [x] **Under-Image Clinical Accordions (Matching ioma-paris.com live layout)**:
      - [x] `+ Détails`: Clinical mechanism of action, cellular cellular renewal, deep biological effects (from Excel `custom.d_tails`).
      - [x] `+ Les préformulés` (for bespoke products): Full explanation of the base formulation and active capsule concentrations (from Excel `custom.les_preformules`).
      - [x] `+ Texture`: Sensory profile, absorption speed, non-greasy finish, skin sensation (from Excel `custom.texture`).
      - [x] `+ Résultats`: Clinical trials data, measured percentages, and efficacy statistics (from Excel `custom.r_sultats_chiffr_s_ou_non_`).
      - [x] `+ Conseils d'utilisation`: Morning/evening ritual, dosage, application gestures, frequency & zone (from Excel `custom.conseils_d_utilisation`, `custom.frequence`, `custom.zone_d_application`, `custom.moment_d_application`).
      - [x] `+ Actifs et composition`:
        - [x] Highlights of key active ingredients (Actifs 1 through 5 with descriptions from Excel `custom.actif_1`, `custom.actif_2`, `custom.actif_3`, `custom.actif_4`, `custom.actif_5`).
        - [x] Complete INCI regulatory list formatted for pharmaceutical transparency (from Excel `custom.inci`).
  - [x] **Right Column — Commercial Merchandising & Conversion Stack**:
    - [x] **Range Tag**: Numbered range chip with official charter color code (e.g., `3 - Renew` in `#782285`, `1 - Hydra` in `#00639A`, `7 - Illumine` in `#483A8F` from Excel `custom.gamme`).
    - [x] **Product Title & Benefit Subtitle**: Full title + clinical sub-benefit (e.g. `Crème Sublime Revitalisante – Soin anti-âge expert` from Excel `Title`).
    - [x] **Merchandising Badges**: Pill tags (e.g. `MEILLEURE VENTE` black badge, `NOUVEAUTÉ`, `INNOVATION BREVETÉE` from Excel `Tags`).
    - [x] **Customer Rating Score**: Purple stars `★★★★★ 4.8 (64)` with link jumping down to verified reviews.
    - [x] **Editorial Accroche (Short Summary)**: Concise clinical summary paragraph (from Excel `custom.accroche`).
    - [x] **Price & Unit Price in AED**: Client-verified UAE retail price (e.g. `968 AED`) + unit price calculation (e.g. `1 936 AED / 100ml`).
    - [x] **Loyalty Points Counter**: `🎁 + {price} Points de fidélité` (earning 1 point per AED spent for the IOMA Club Privilège).
    - [x] **Contenance / Size Indicator**: Exact packaging volume badge (e.g. `50 ml / 1.7 fl. oz.` from Excel `custom.contenance` and `Variant Grams`).
    - [x] **Bespoke Predefined Formula Selector** (for bespoke franchise like _Ma Crème Jour_, _Ma Crème Nuit_): Diagnostic code selector / base selector with instant formula preview.
    - [x] **Primary Luxury CTA**: Full-width rounded pill button `AJOUTER AU PANIER` (in charter purple `#AA9FEB` / `#782285` or hover charcoal) with instant drawer feedback.
    - [x] **Delivery & Service Promise**: Free UAE express delivery ticker with truck icon (`Livraison standard offerte dès 300 AED — Votre livraison estimée sous 24/48h à Dubai & EAU`).
    - [x] **"Disponible en routine" Cross-Sell Card**:
      - [x] Displays linked routine bundle from Excel `custom.routine` (e.g., `Routine Sublime Anti-âge`).
      - [x] Shows routine bundle thumbnail, title, package price vs compare-at price in AED, and single-click `AJOUTER AU PANIER` button.
  - [x] **Bottom Section — Certified Customer Reviews ("Avis Clients")**:
    - [x] Score badge: `★ 4.8` `64 avis` `[✓ Vérifié]` with certified audit badges.
    - [x] Customer photo gallery showing real user unboxing and texture swatches.
    - [x] _"Les clients disent"_ AI-synthesized verified review summary (`✨ Résumé des avis généré par IA basé sur les avis clients récents`).
    - [x] CTAs: `Écrire un avis` (purple pill) + sorting and filter buttons.
- [x] **3.4 Modern Shop / Collection Page (`/shop`)**:
  - [x] Facet filters drawer: Range (with charter color dots), Category, Concern, Skin Type, Product Type.
  - [x] Modern product cards with hover animations, range badges, and quick-add drawer.

---

## 4. Verification & Testing

- [x] **4.1 API & Endpoints Verification**: Ensure `/api/products`, `/api/categories`, `/api/product-ranges`, `/api/skin-concerns`, `/api/product-types` return normalized data. _(Verified: All endpoints tested and active, returning full Shopify rich metadata, clinical fields, active ingredients 1..5, and AED prices)_.
- [x] **4.2 Build & Typecheck**: Verify `pnpm --filter @ioma/web typecheck` and `pnpm --filter @ioma/api typecheck` pass with zero errors. _(Verified: `turbo run typecheck` passed 8/8 packages and apps with 0 errors)_.
- [x] **4.3 Browser E2E Verification**: Validate Storefront and Admin on desktop and mobile viewports. _(Verified: Homepage `/fr`, Shop `/fr/shop`, PDP `/fr/shop/creme-sublime-revitalisante`, and Admin Products `/fr/admin/products` all verified with HTTP 200 OK and live browser rendering)_.

---

## 5. PDP Content Normalization & Product Information Accordions

- [x] **5.1 Shopify Rich-Text AST Normalization**: Built `@ioma/validation` parser converting Shopify JSON blocks (`root`, `paragraph`, `list-item`, bold/italic) into clean editorial text.
- [x] **5.2 MongoDB Data Migration**: Migrated all 63 products in MongoDB, converting 271 raw JSON fields into clean text and backing up raw AST to `sourceMetadata.shopifyRaw`.
- [x] **5.3 Backend API Resilience**: In-memory sanitization via `cleanLocalized` and multi-candidate slug resolution in `CatalogService` (e.g. `/shop/lip-lift` and `/shop/ioma-lip-lift`).
- [x] **5.4 Editorial Skincare Accordions (`PdpInformationSections`)**: Replaced raw tabs with numbered `01..06` editorial accordion system, clinical trial cards, active ingredients cards, and collapsible INCI block. Automatically hides empty sections.

---

## 6. Product Card Hover Secondary Image Reveal (ioma-paris.com UX)

- [x] **6.1 Reusable `ProductCardMedia` Component**: Centralized stable `relative aspect-[3/4]` container managing Primary and Secondary image layers.
- [x] **6.2 Dual-Layer Smooth Animation**: Primary image transitions `1 -> 0` while Secondary transitions `0 -> 1` and `scale-[1.015] -> 1` over `300ms ease-in-out`. Supports `prefers-reduced-motion`.
- [x] **6.3 Media Asset Authority**: Utilizes real `product.media` / `product.images` ordering (`order: 0` / primary vs `order: 1` / secondary).
- [x] **6.4 Single Image Fallback**: Automatically preserves primary image without blank frames or broken icons when only one image exists.
- [x] **6.5 Overlay & Mobile Stability**: `z-10` badges (`★ Best-Seller`) and quick-action buttons remain on top. `pointer-events-none` on secondary image preserves single-tap mobile navigation.
- [x] **6.6 Storefront Integration & Verification**: Deployed across `ProductCard` (Shop, Range, Concern, Category, Search) and `BestSellersCarousel`. Verified live via browser subagent.

---

## 7. Cinematic Public Storefront Redesign (apps/web only — admin untouched)

Status key: [x] complete = layout substantially redesigned + design system + motion + desktop & mobile + functionality kept (colour/spacing tweaks alone never count) · [~] partial · [ ] not started. Browser verification is OFF by instruction: "unverified" notes mark what still needs a visual check. Tasks are completed strictly in this order.

- [~] **7.1 Phase 1 — Homepage navbar (mandatory)**: transparent over hero with light text + same logo as other pages, full link row and mega menus visible, frosted/solid on scroll or menu open, always above hero video. _(Implemented in `header.tsx`; not browser-tested per instruction.)_
- [x] **7.2 Storefront design system**: pearl / ivory / platinum / silver / champagne / charcoal / black tokens scoped to the public site (no admin impact). _(`--color-sf-*` tokens + shadcn vars remapped in web `globals.css`; admin has its own stylesheet, untouched.)_
- [~] **7.3 Shared components**: mega menus, mobile nav, footer, buttons, links, inputs, tabs, accordions, modals, drawers, toasts, loading/empty states. _(Buttons, sheet, dialog, footer (charcoal), mobile nav (display-type links) restyled; mega menu, inputs, tabs, toasts not individually rebuilt.)_
- [x] **7.4 Motion architecture**: GSAP ScrollTrigger + Motion helpers, reduced-motion, no scroll hijacking. _(New `components/motion/cine.tsx`: MaskText, Reveal, ImageReveal, Parallax, ScrubText, StaggerGrid on GSAP ScrollTrigger + matchMedia reduced-motion; pinned only ≥768px.)_
- [x] **7.5 Homepage redesign** _(Full-bleed hero with scroll push-in/fade, scroll-lit manifesto, pinned 3-scene GSAP story, masked headings, image-curtain reveals, device band, charcoal partner CTA. Desktop pinned / mobile stacked. Unverified visually.)_
- [x] **7.6 Technology page** (6 GSAP chapters, tested)
- [x] **7.7 Collections / product listing + filters + search** _(Ivory editorial header with masked display title, batch-staggered product grid re-triggering on filter change. Unverified visually.)_
- [x] **7.8 Product detail page + gallery** _(Ivory curtain-reveal gallery stage, masked title, charcoal/champagne purchase controls, sticky buy column. Unverified visually.)_
- [x] **7.9 Cart drawer, cart page, checkout** _(Cart: editorial header, ivory tiles, charcoal sticky summary; drawer tiles/CTA; checkout step panel with step-in animation. Unverified visually.)_
- [~] **7.10 Partners / professionals / B2B application** _(Partners hero + filters restyled; /professionals landing restyled (purple removed); partner detail and pro forms not rebuilt.)_
- [~] **7.11 Auth + account screens** _(Login already two-column; register rebuilt as card; account dashboards only inherit tokens.)_
- [~] **7.12 Remaining public routes (booking, gallery, lookbook, legal…)** _(Maison, contact, FAQ, journal, treatments rebuilt on shared `PageHero` + reveal kit; booking/gallery/lookbook/legal still on old layouts → partial.)_
- [~] **7.13 Seamless page transitions** (stable navbar, scroll restoration, back/forward) _(Opacity-only route enter; no shared-element or exit transitions yet.)_
- [~] **7.14 Mobile pass** _(Pinned/scrubbed effects disabled <768px; mobile nav restyled; no device-level visual check.)_
- [~] **7.15 SEO / performance / a11y check** _(Metadata/structured data untouched; no perf or a11y audit run.)_
- [~] **7.16 Tests (tsc, lint, browser) + confirm admin unchanged + final report** _(tsc passes; eslint 0 errors; browser tests NOT run by instruction; apps/admin not modified.)_
