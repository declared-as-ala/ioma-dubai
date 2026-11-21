# B2B QA, portal redesign and admin management: final status

Updated 2026-11-21. "Tested" means it was run against production (real Chrome sessions earlier; later through the real API and
headless Chromium with real device emulation). Test records were removed afterwards; settings and portal content were restored.

## Modules (Professional / B2B admin)

| Module                | Admin management                                                                 | Drawer      | Archive / delete              | Portal sync                                                    | Tested on production             |
| --------------------- | -------------------------------------------------------------------------------- | ----------- | ----------------------------- | -------------------------------------------------------------- | -------------------------------- |
| Professionals         | list, open and edit, suspend / reactivate, show / hide public listing (row menu) | detail page | no hard delete (suspension)   | n/a                                                            | row menu hide + restore          |
| Partner applications  | approve / reject (existing)                                                      | existing    | n/a                           | account approval                                               | opened                           |
| Portal home           | banner, announcements, sections                                                  | page        | n/a                           | **headline edit reached the portal home**                      | yes (restored)                   |
| B2B orders            | detail drawer, edit status, notes                                                | yes         | paid orders cannot be removed | status Shipped shown in portal                                 | full test order                  |
| Professional pricing  | trade price, RRP, MOQ, preview, publish                                          | page        | n/a                           | shop shows trade price                                         | prices seen in portal            |
| Cabin products        | product editor (Price & stock)                                                   | page        | archive                       | portal cabin page                                              | opened                           |
| Training videos       | create, edit, publish, unpublish, archive, video + thumbnail upload              | **yes**     | archive                       | **create, edit, play, unpublish, republish, archive**          | yes                              |
| Cabin gallery         | create, edit, reorder, archive                                                   | **yes**     | archive                       | **create, order, reorder, archive**                            | yes                              |
| Pro benefits          | create, edit, publish, unpublish, archive                                        | **yes**     | archive                       | **full lifecycle**                                             | yes                              |
| Pro documents         | create, upload, replace file, publish, archive                                   | **yes**     | archive                       | private bucket; link needs a signed-in partner (401 otherwise) | create, replace, archive, access |
| Services & treatments | list, row menu                                                                   | yes         | archive                       | n/a                                                            | list loads                       |
| B2B settings          | page                                                                             | page        | n/a                           | **team contact edit reached the partner portal**               | yes (restored)                   |

Permissions: a partner cannot create admin content (403) or edit the portal home (403).

## Priority tests

1. Video lifecycle: done. 2. B2B order at trade prices: done (2 x AED 217.00 = AED 434.00, VAT AED 21.70, total AED 455.70;
   order IOMA-20261121-2WE4R3 is a test order that stays on file, as shipped orders cannot be cancelled).
2. Documents: create / replace / archive / access verified; portal download by a partner not exercised.
3. Gallery: done. 5. Benefits: done. 6. Partner application flow: not run end to end. 7. Settings sync: done.

## Portal redesign (IBM Carbon white and blue)

Scoped design tokens (`.pro-carbon`), IBM Plex Sans (portal only), blue #0F62FE, square buttons and cards, reduced-motion
respected. Rebuilt shell: slide-in navigation drawer on phones, cart with count badge, account menu (company, status,
business profile, sign out), breadcrumbs, skip link, page fade on every navigation. Shop: image-led product tiles with
hover zoom, trade price with RRP, quantity and add controls that never overflow, card skeletons and a route-level loading
state. Measured with real device emulation: no horizontal overflow on any of the 10 portal pages at 320, 390 and 1360px
(it was 516px wide in a 390px window before).

## Customer reviews and translations (separate deliveries, tested on production)

Real moderated reviews with photos, verified purchase only from paid and delivered orders, admin moderation and replies
(22 API checks + customer UI on a 390px phone). Translation drafts: 63 English and 63 Arabic stored for review, bulk
approval with verification and rollback (publish and rollback tested; nothing published).

## Product page

No sideways scroll at 320 to 768px in English and Arabic. English and Arabic never show French (untranslated copy is hidden
until approved). On phones the title, price and Add to cart come before the accordions.

## Automated tests

API 292 (Jest), web 19 (Vitest), Playwright specs: product page overflow and language, B2B lifecycle
(`e2e/b2b-lifecycle.spec.ts`, needs E2E_* credentials), plus the existing suite.

## Completed since the last revision (all verified on production)

- **Manual professional accounts**: Admin > Professionals > Add professional. New person gets an approved account and an email to
  choose a password; an existing customer gains access; a duplicate is refused (409). 3 unit tests + production test.
- **Pricing history**: every manual price, recommended retail or minimum-order change records who, when, from and to; Price history
  drawer (also shows price-list imports); Export prices (CSV).
- **Bulk actions and export**: Professionals (select, show/hide listing, export all or selected); content lists gained bulk Archive;
  Services got bulk Activate/Archive.
- **Professional application, end to end** (production): visitor applies, admin attaches the trade licence (validation is refused
  without it), approves (a second approval is refused), the professional signs in at level "validated", trade price AED 217.00
  computed on the server, order placed, visible to the professional and to the admin. 17 checks, test records removed.
- **Optimistic concurrency**: saving a record sends the version it loaded; if someone else saved first the save is refused (409).
- **Admin on phones**: audited 21 pages at 390 and 320px. 13 pages scrolled sideways (screen-reader labels inside tables escaped the
  table frame); fixed at the source, now none do.
- **Storefront audit**: 35 pages x 3 languages x 2 sizes plus products. Fixed: failed wishlist request on every product page for
  visitors, French pages overflowing on phones (loyalty, FAQ, cookie preferences, switch touch area), Arabic title and unit-price
  word order.
- **Translations published**: 63 English and 63 Arabic product translations (514 texts) after an independent review that produced
  32 corrections (31 Arabic, 1 English); backup taken first; bulk rollback available.

## Genuinely remaining

- The email a new professional receives (set-password link) was not read by a human here; account creation and sending were
  verified, delivery to the inbox was not.
- Real payment gateway: checkout still runs in demo mode (no gateway keys supplied).
- Hair-care and other categories' translations beyond the 63 shop products and the 56 cabin products' copy (cabin descriptions
  are not translated; they are professional-only).
- Review photos are stored but not re-compressed; very large images are limited to 5 MB.
