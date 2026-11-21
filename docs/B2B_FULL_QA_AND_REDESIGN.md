# B2B QA, portal redesign and admin management — status report

Written 2026-11-21. Only things that were actually run are marked tested. Browser tests were done in a real Chrome
session (admin + approved-partner sessions) on production until the Chrome connection dropped; later checks use
headless Chromium device emulation (Playwright) and database queries.

## Modules (Professional / B2B admin)

| Module                | Admin CRUD                                                                                                   | Edit drawer                | Archive / delete                                | Portal sync                                                | Browser tested                           | Status                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------- | ----------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| Professionals         | list, open, edit profile, suspend/reactivate (existing detail page); new row menu (hide/show public listing) | detail page (not a drawer) | no hard delete; B2B suspension                  | n/a                                                        | row menu: hide + restore listing         | partial: no create, no archive                |
| Partner applications  | approve / reject (existing)                                                                                  | existing                   | n/a                                             | account approval                                           | opened only                              | not retested end to end                       |
| Portal home           | banner, announcements, sections (existing page)                                                              | page                       | n/a                                             | not retested                                               | opened only                              | not retested                                  |
| B2B orders            | view drawer, edit status, notes                                                                              | yes (existing)             | paid/authorised orders can no longer be removed | status Shipped shown in portal                             | full test order (see below)              | works; company name added to detail           |
| Professional pricing  | edit trade price / RRP / MOQ, preview, publish (existing)                                                    | page                       | n/a                                             | shop shows trade price                                     | opened; prices seen in portal shop       | history/restore not added                     |
| Cabin products        | product editor (Price & stock tab)                                                                           | page                       | product archive                                 | portal cabin page renders                                  | opened                                   | works                                         |
| Training videos       | create, edit, publish, unpublish, archive                                                                    | **yes (new)**              | archive (not delete)                            | create/edit/unpublish/republish/archive verified in portal | yes                                      | **done** (video + thumbnail upload, playback) |
| Cabin gallery         | list + menu                                                                                                  | yes (new)                  | archive                                         | renders                                                    | opened                                   | menu not exercised                            |
| Pro benefits          | list + menu                                                                                                  | yes (new)                  | archive                                         | empty in portal                                            | opened                                   | menu not exercised                            |
| Pro documents         | create, edit, upload / replace file, publish, archive                                                        | **yes (new)**              | archive                                         | file in private bucket; portal access check unchanged      | create, replace, archive tested in admin | portal-side download not tested               |
| Services & treatments | list + menu                                                                                                  | yes (new)                  | archive                                         | n/a                                                        | opened                                   | menu not exercised                            |
| B2B settings          | page (existing)                                                                                              | page                       | n/a                                             | not retested                                               | opened                                   | not retested                                  |

## Priority tests

1. **Video lifecycle**: done in Chrome. Created TEST video with uploaded MP4 and PNG thumbnail, published, appeared in the
   Training Academy, played (3 s), edited title and thumbnail (both showed in the portal), unpublished (gone), republished
   (back), archived (gone). Test records removed from the database.
   The Magnesium / Ashwagandha image came from the "Preparing Ma Crème" lesson, whose preview had been changed to an
   uploaded image on 2026-11-20; the original in-lab preview was restored.
2. **B2B order at trade prices**: done. 2 x Ma Crème Jour (IBP194-30ML) at the trade price AED 217.00 = AED 434.00,
   VAT 5% AED 21.70, shipping 0, total AED 455.70. Admin shows the same SKU, quantity and totals. Status changed to
   Shipped in admin and shown as Shipped in the portal. Payment is the demo workflow (no gateway, no real charge).
   Order **IOMA-20261121-2WE4R3** is a test order; it stays in the records (shipped orders cannot be cancelled).
3. **Documents**: partially. Create + upload + replace + archive verified in admin and database; portal download not tested.
4. Gallery, 5. Benefits, 6. Partner application flow, 7. Settings sync: **not tested**.

## Bugs found and fixed

- Uploaded documents could not be saved (server reference filter excluded them) and defaulted to a public bucket: fixed, private bucket.
- Admin "View website" link pointed to localhost: fixed (build argument).
- Translation review and History panels called a non-admin API path (404): fixed.
- Portal header said "Customer" for an approved partner: label changed to "Approved partner" (the level logic was correct).
- B2B order detail showed a generic "Professional Partner": company name now read from the professional profile.
- Order drawer labelled every payment "Cash on Delivery": neutral labels.
- Orders: a paid, uncancelled order could be hidden from the list: now refused (2 tests).
- Training lesson showed a supplement product image: restored.

## Portal redesign (IBM Carbon white and blue)

Implemented as scoped design tokens (`.pro-carbon` in globals.css): blue #0F62FE primary, white / #F4F4F4 surfaces,
#E0E0E0 borders, square buttons and cards, IBM Plex Sans (portal only), active-page indicator, reduced-motion respected.
Checked visually on production: overview, shop, cabin, training academy, gallery, benefits, documents, business
profile, cart, checkout. Not done: component rebuild (animated drawers, skeletons, new product card, sticky summary
redesign), responsive pass at 320/390 for the portal.

## Not done (explicit)

Professionals create/archive, orders drawer redesign, portal-home / settings sync tests, pricing history, gallery /
benefits / services lifecycle tests, bulk actions, export, optimistic concurrency, Playwright E2E for the B2B flows.
