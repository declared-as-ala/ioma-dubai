# Account redesign handoff — 2026-09-06

1. **Architecture:** Existing User identity, CustomerProfile and owned records, with optional ProfessionalApplication/ProfessionalProfile. Preserved the monorepo and domain APIs.
2. **Customer/professional logic:** One login with personal access throughout; approved professional access is additive and enforced by current database roles.
3. **Pages:** Dashboard, profile, addresses, orders/detail, appointments/reschedule, wishlist, diagnoses, AI history, routines, action center, security/deletion, partner status/contact/documents, and portal dashboard/catalog/cart/checkout/orders/training/protocols/company/support.
4. **Account features:** Real overview data, standard diagnosis restored, current routine prices/stock/images, cart actions, owned histories, actionable partner state, private document downloads and editable professional contact details.
5. **Application states:** Not applied, draft, submitted, pending_review, documents_requested, approved, rejected and suspended. Existing stored enum retained.
6. **Pending:** Actual company/reference/submission information, progress and document requests, applicant-facing messages and contact/support actions. No professional prices.
7. **Approved:** Personal/professional mode switch, operational portal, separate B2B cart/checkout/history, quantity/MOQ handling and reorder, training and private content.
8. **Rejected/suspended:** Clear explanation and reapplication/support path as appropriate. Suspended accounts retain personal features; protected professional APIs deny access immediately.
9. **Routing:** `/account` is personal plus application management; `/portal` reuses the approved B2B modules. Locale retained.
10. **Backend verification:** Cross-user denials for owned records/documents, private MinIO signing, professional guards, separated checkout/history, current-role enforcement, duplicate training rejection and seat recovery. Internal review notes are stripped from applicant responses.
11. **English:** Real customer operations and all eight account states verified at desktop/mobile sizes.
12. **French:** Customer/approved layouts and complete B2B application/admin journey verified.
13. **Arabic:** RTL customer/approved layouts and full application journey verified; mobile and tablet screenshots visually inspected.
14. **Responsive:** Tested 390, 768, 1024, 1280 and 1440px; no document overflow in asserted layouts. Collapsed mobile navigation, logical spacing and 44px controls.
15. **Verification:** 41 targeted browser cases passed across resumed runs; 113 API tests, 14 web tests, typecheck, lint, 1,141-key EN/FR/AR parity and Docker production builds passed. Evidence in PROGRESS.md. The guest-token index migration was applied locally and documented for deployment.
16. **Optional/integration gaps:** Invoice issuance, certificate issuance workflow (attached certificate download works), agreement/marketing ingestion, team invitations/permissions and a persistent event inbox do not yet exist. No invented reassessment deadlines. Existing mock payment provider remains explicitly labelled. Live AI provider output was not revalidated by this account test suite.

No commit or push. Subsequent admin changes have their own audit and verification record.
