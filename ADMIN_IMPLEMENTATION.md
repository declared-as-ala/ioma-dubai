# Admin implementation and operating guide

Read `ADMIN_REDESIGN_BRIEF.md` and `ADMIN_AUDIT.md` with this guide. The brief is the requirement; verification evidence belongs in `PROGRESS.md`.

## Access

The public header asks `/api/admin/access` for current database permissions. The dedicated `/[locale]/admin` shell removes storefront chrome. Every management API checks permissions independently; changing browser state cannot grant access. Super administrators can assign existing staff roles to registered users. Ordinary administrators cannot grant roles. Customers and professional accounts do not receive admin permissions.

The role matrix lives in `packages/config/src/admin.ts`; the resource allowlist and form definitions live in `packages/config/src/admin-resources.ts`. Staff see only their permitted domains. Customer support has read access, including customer/order/appointment context; it cannot perform management mutations. AI images require the separate AI permission.

## Reporting definitions

- Dates use Asia/Dubai, inclusive calendar dates, with an exclusive next-day endpoint. Default: 30 days. Previous comparison covers the same number of immediately preceding days. A zero baseline displays no invented percentage.
- Revenue is gross paid AED order value in integer fils, excluding cancelled fulfillment and refunded/failed/pending payments. It includes recorded shipping and VAT. AOV divides this revenue by eligible paid orders. Product/range revenue uses order lines and therefore excludes shipping.
- Order count includes all orders created in the period. Current and previous chart series are zero-filled on the server. More than 90 days uses monthly buckets. B2C/B2B is the stored order channel.
- Stock uses on-hand minus reserved, with each variant's configured low-stock threshold. Stock, pending applications, approved accounts, upcoming bookings and provider configuration are current snapshots, labelled separately from period metrics.
- Returning buyers are current-period paid buyers with a qualifying order before the selected start. Customer diagnosis counts include standard or AI diagnoses. Training certificates count actual attached documents for attended bookings.
- AI elapsed times and model names are recorded for new processing jobs. Historical unmeasured jobs remain unavailable. Provider configuration is never presented as an active health probe. Last observed outcomes and timestamps appear when recorded; no external paid provider call is made merely to load admin.
- Permission-scoped aggregation responses have a bounded 30-second cache, invalidated by admin mutations. Lists use server pagination (default 25, maximum 100), filters and search. Sensitive storage keys, passwords and guest order tokens are omitted.

## Management

Products can be created, edited and archived through status. Inventory variants manage AED prices, MOQ and thresholds; quantity adjustments require a reason and record a stock ledger while protecting reserved units. Orders use validated fulfillment transitions and tracking. Cancellation does not create a payment refund. The repository has no invoice/refund workflow, promotions subsystem or review subsystem; no fake actions were added.

B2B application review retains the existing private-document review, approval/rejection/document-request/suspension workflow. Approved professional profiles have their own list and scoped related records.

Partners, services, treatments, hours, breaks and blocked dates are editable. Appointment rescheduling validates available Dubai slots and reuses the existing capacity protection. Attendance is recorded after a session ends. Uploaded attendee certificates must belong to that booking and remain private.

Protocol PDFs, MP4 videos, range keys and related products are editable. Uploads accept validated PDF/PNG/JPEG/WebP/MP4 up to 10 MB. Training/protocol documents use private storage and signed access; CMS media uses public storage. Deleting AI images or analyses requires confirmation; retries require a failed job, its image and active consent.

## Structured CMS

Create translated title/summary, typed content blocks, SEO title/description and draft/published status. There is no raw JSON editor or arbitrary HTML execution.

Reserved entries: `homepage/home`, `navigation/main`, `footer/main`, `faq/faq`. Public page entries can override `contact`, `maison`, `technology`, or appear at `/[locale]/pages/<slug>`. Journal entries appear at `/[locale]/journal/<slug>` and in the journal index. Unconfigured content retains existing public content. SEO metadata is server-rendered for custom pages and journal detail; managed overrides also update the browser title.

CMS uploads return a reusable public URL. Training/protocol uploads choose an existing owner; certificate uploads use the current booking automatically. API settings return configuration flags only, never keys. Existing runtime environment variables remain server-only; this upgrade adds no required secret.

## Verification artifacts

- `scratch/admin-integration.cjs`: controlled revenue fixtures, nine role checks, catalog write validation, stock reservation invariant and adjustment ledger. Cleans its inserted business records.
- `scratch/admin-smoke.cjs`: dashboard and every allowed admin resource list.
- `apps/api/src/modules/admin/*.spec.ts`: Dubai dates, comparison, strict management validation and permission boundaries.
- `apps/web/e2e/admin-experience.spec.ts`: locale/viewport matrix, management navigation, CMS publishing and guest denial.

Do not treat a successful typecheck as completion. Run the production build and browser checks after changes; record actual outcomes and limitations in the progress documents.
