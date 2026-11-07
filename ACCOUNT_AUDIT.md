# Account experience audit — 2026-09-06

Read alongside ACCOUNT_REDESIGN_BRIEF.md. This records actual implementation findings, not historical sprint claims. Running-build verification completed at the account checkpoint; see ACCOUNT_COMPLETION.md and PROGRESS.md.

## Existing architecture

One User identity, a CustomerProfile, owned addresses/orders/wishlist/diagnoses/appointments and optional ProfessionalApplication/ProfessionalProfile. Auth uses bearer access tokens and rotated refresh tokens; the frontend stores its session using the existing Zustand persistence. The established professional modules live under /portal.

## Findings and repairs

- Account dashboard was a flat quick-link grid. New overview reads actual profile, diagnosis/AI history, routines, recent personal orders, next appointment, wishlist and professional application state.
- Grouped account navigation covers the full personal area and shows professional navigation only for an applicant. Approved partners can switch between personal and professional modes.
- Personal orders were not filtered by channel. A professional add changed the existing personal cart's type. Cart ownership now includes type, histories are separated, and professional checkout is guarded.
- Training and protocol guards lacked the metadata that activates approval enforcement. Both controllers now require approval. Training seat reservations/cancellations use atomic updates; duplicate bookings do not consume extra seats.
- Appointment statuses/translations were missing, its reschedule link was wrong, and the reschedule page had no slots. Reuse availability and ownership-checked rescheduling.
- Standard diagnosis API and translations existed but routes had been removed. Restore the independent questionnaire and result routes, and list standard and AI histories separately.
- Internal application notes were exposed on applicant reads. New applicant messages are separate and public reads strip reviewer/audit notes. Requested documents and rejected applications show only explicit applicant messages.
- Private document downloads check application ownership and attachment membership before signing. Certificates are downloadable only when a completed booking has a real attached certificate.
- Login/registration/logout clear query caches to prevent stale data from another identity appearing.
- Real dual-channel checkout exposed a legacy unique/sparse guest-token index that allowed only one signed-in order with a null token. The replacement partial index preserves uniqueness for actual string tokens; its idempotent migration is documented in DEPLOYMENT.md.
- Order history queries now explicitly use ObjectId ownership, matching stored orders. The existing Mongoose path is Mixed and did not cast string user IDs, hiding successfully created orders from both histories.
- Booking availability, booking submission and rescheduling now consistently use Dubai's UTC+04:00 offset; displayed times use Asia/Dubai.

## Routes

- /account: personalized overview and partner gateway.
- /account/profile, addresses, orders, orders/[id], appointments, appointments/reschedule/[id], wishlist, diagnosis, ai, routines, notifications, security, delete.
- /account/professional: actual application status/timeline; documents and contact subpages reuse the same application.
- /professionals/apply: the existing application and document-resubmission flow.
- /portal: approved workspace; catalog, cart, checkout, orders, orders/[id], trainings, protocols, documents, company and support. No duplicate B2B modules under /account.

## Data that must not be invented

- No persisted next reassessment deadline exists; the overview does not invent one.
- No issued invoice attachment/generator exists. Order details show actual order lines, totals and tracking; invoice issuance remains a backend integration task.
- Training has certificateDocumentId but no certificate-issuance workflow. Show downloads for real attached certificates only.
- No agreement/marketing document ingestion or category workflow exists. Show actual application documents and the existing private protocol library.
- A teamMembers field exists but no invitation/permission-management API. Team management remains optional future work.
- Support uses the existing contact flow, not a fabricated ticket system.
- No notification/event inbox exists. The action center derives useful status and upcoming appointments from real records.
- Payments retain the existing explicitly labelled mock provider until a real gateway is configured.

## Verification

See PROGRESS.md for current results. New tests cover state/layout combinations, personal/professional cart and order separation, private documents and ownership. Existing account, booking and B2B journeys remain regression checks. Test data is explicitly labelled QA; no client records are edited.
