# DATA_MODEL.md — IOMA Paris Dubai

Account checkout index correction (2026-09-06): `Order.guestToken` remains nullable, but uniqueness applies only to string tokens through the `unique_guest_order_token` partial index. Apply `infrastructure/scripts/migrate-account-order-index.js` to replace the legacy sparse unique index; see DEPLOYMENT.md. Order ownership filters explicitly use ObjectId to match stored account orders.

MongoDB + Mongoose. Conventions: every collection has `createdAt`/`updatedAt` (Mongoose timestamps), audit fields `createdBy`/`updatedBy` (ObjectId ref `User`, nullable for system/seed writes) where the entity is user-mutable, and `deletedAt: Date | null` for soft deletion where a hard delete would break referential history (orders, appointments, documents, users). Collection names are `camelCase` plural. All monetary fields stored as integer minor units (fils, 1 AED = 100 fils) to avoid float rounding.

## Identity & Access

**User** — `email` (unique, indexed), `passwordHash`, `emailVerifiedAt`, `roles: Role[]`, `locale`, `status` (`active|locked|deleted`), `lastLoginAt`. Index: `{ email: 1 }` unique.

**Role** — `name` (`guest|customer|professional_pending|professional_approved|professional_suspended|partner_manager|content_editor|customer_support|order_manager|training_manager|administrator|super_administrator`), `permissions: Permission[]`.

**Permission** — `key` (e.g. `orders:read`, `products:write`, `professionals:approve`), `description`.

**CustomerProfile** — `userId` (ref, unique, indexed), `firstName`, `lastName`, `phone`, `dateOfBirth?`, `skinConcerns: string[]`, `newsletterOptIn`, `preferredLocale`.

**ProfessionalProfile** — `userId` (ref, unique, indexed), `applicationId` (ref `ProfessionalApplication`), `companyName`, `businessType`, `emirate`, `city`, `status` (`approved|suspended`), `priceListId` (ref `PriceList`), `teamMembers: {userId, role}[]`.

**ProfessionalApplication** — `companyName`, `contactPerson`, `businessType`, `tradeLicenceNumber`, `vatNumber?`, `email`, `phone`, `address`, `emirate`, `city`, `website?`, `socialMedia?`, `locationsCount`, `expectedOrderVolume`, `message`, `documents: DocumentId[]`, `status` (`draft|submitted|pending_review|documents_requested|approved|rejected|suspended`), `reviewedBy` (ref `User`), `reviewNotes`. Index: `{ status: 1, createdAt: -1 }`.

2026-09-06 application workflow: drafts permit incomplete company fields; shared Zod validation enforces complete submissions at the API boundary. Added nullable `termsAcceptedAt`, `submittedAt`, and `requestedDocumentsCount` (document count at the latest request). A partial unique index on `userId` permits one non-rejected application per user; rejected records remain history and permit a new application. Submission uses an atomic status/version predicate, and reviews use optimistic concurrency. Before applying this index to an existing production database, check for conflicting non-rejected records and resolve them explicitly; never silently delete application history. The local database was checked and had no conflicts.

**Address** — `userId` (ref, indexed), `type` (`shipping|billing`), `label`, `line1`, `line2?`, `emirate`, `city`, `phone`, `isDefault`.

## Catalog & Commerce

**ProductRange** — `slug` (unique), `name: {en,fr,ar}`, `colorKey` (`hydra|energize|renew|calm|purete|matte|illumine`), `description: {en,fr,ar}`, `heroMediaId`.

**Category** — `slug` (unique), `name: {en,fr,ar}`, `parentId?` (self-ref, indexed).

**SkinConcern** — `slug` (unique), `name: {en,fr,ar}`, `icon`.

**Ingredient** — `slug` (unique), `name: {en,fr,ar}`, `description: {en,fr,ar}`, `inciName?`.

**Product** — `slug` (unique, indexed), `rangeId` (ref, indexed), `categoryIds: ObjectId[]`, `concernIds: ObjectId[]`, `name: {en,fr,ar}`, `shortBenefit: {en,fr,ar}`, `description: {en,fr,ar}`, `howToUse: {en,fr,ar}`, `routineStep` (`morning|evening|both`), `activeIngredientIds: ObjectId[]`, `fullIngredientsText: {en,fr,ar}`, `visibility` (`b2c|b2b_cabin|both`), `status` (`draft|published|archived`), `mediaIds: ObjectId[]`. Index: `{ status: 1, rangeId: 1 }`, text index on `name.*`/`shortBenefit.*`.

**ProductVariant** — `productId` (ref, indexed), `sku` (unique), `size`, `b2cPriceMinor` (AED fils), `b2bPriceMinor?`, `moq?` (B2B minimum order qty), `barcode?`.

**InventoryItem** — `variantId` (ref, unique, indexed), `quantityOnHand`, `quantityReserved`, `lowStockThreshold`, `backorderAllowed`.

**PriceList** — `name`, `type` (`b2c_default|b2b_tier`), `entries: {variantId, priceMinor}[]` — professional-specific overrides layer on top of `ProductVariant.b2bPriceMinor`.

**Cart** — `userId?` (ref, indexed, nullable for guest), `sessionId?` (indexed, for guest carts), `type` (`b2c|b2b`), `items: {variantId, qty, priceMinorSnapshot}[]`, `promoCode?`, `expiresAt` (TTL index for abandoned guest carts).

**Wishlist** — `userId` (ref, unique, indexed), `variantIds: ObjectId[]`.

**Coupon** — `code` (unique, indexed), `type` (`percent|fixed`), `value`, `minOrderMinor?`, `validFrom`, `validTo`, `usageLimit?`, `usedCount`, `appliesTo` (`b2c|b2b|both`).

**Order** — `orderNumber` (unique, indexed), `userId?` (ref, indexed), `type` (`b2c|b2b`), `items: OrderItem[]`, `subtotalMinor`, `taxMinor`, `shippingMinor`, `totalMinor`, `currency` (`AED`), `shippingAddress`, `billingAddress`, `paymentStatus` (`pending|authorized|paid|failed|refunded|partially_refunded`), `fulfillmentStatus` (`pending|processing|shipped|delivered|cancelled`), `couponCode?`, `adminNotes?`, `statusHistory: {status, at, by?}[]`. Index: `{ userId: 1, createdAt: -1 }`, `{ orderNumber: 1 }` unique.

**OrderItem** (embedded in Order) — `variantId`, `productNameSnapshot`, `qty`, `unitPriceMinorSnapshot`, `totalMinor`.

**Payment** — `orderId` (ref, indexed), `provider` (`mock|stripe|...`), `providerReference`, `amountMinor`, `status` (`pending|succeeded|failed|refunded`), `idempotencyKey` (unique, indexed), `webhookEventsReceived: string[]`.

**Refund** — `paymentId` (ref, indexed), `amountMinor`, `reason`, `status` (`pending|processed|failed`).

**Shipment** — `orderId` (ref, indexed), `carrier?`, `trackingNumber?`, `status` (`pending|dispatched|in_transit|delivered|failed`), `events: {status, at, note?}[]`.

## Partners, Services, Booking

**Partner** — `slug` (unique), `type` (`spa|clinic|beauty_institute|hotel|retail|diagnostic_center|distributor`), `name`, `description: {en,fr,ar}`, `mediaIds`, `emirate`, `city`, `address`, `coordinates: {lat,lng}` (2dsphere index), `phone`, `whatsapp?`, `email?`, `serviceIds: ObjectId[]`, `diagnosisAvailable`, `status` (`active|inactive`). Index: `{ coordinates: '2dsphere' }`, `{ emirate: 1, city: 1, type: 1 }`.

**PartnerLocation** — used when a `Partner` operates multiple physical sites: `partnerId` (ref, indexed), plus the same address/coordinates/hours shape as `Partner`.

**Service** — `slug`, `name: {en,fr,ar}`, `durationMinutes`, `category` (`diagnosis|treatment|training`).

**Treatment** — `slug` (unique), `name: {en,fr,ar}`, `description: {en,fr,ar}`, `durationMinutes`, `relatedProductIds`, `mediaIds`.

**Availability** — `resourceType` (`partner|specialist`), `resourceId` (indexed), `weeklyHours: {day, open, close}[]`, `breaks: {day, start, end}[]`, `blockedDates: Date[]`, `capacityPerSlot`.

**Appointment** — `userId` (ref, indexed), `partnerId` (ref, indexed), `serviceId` (ref), `specialistId?`, `startsAt` (indexed), `endsAt`, `status` (`confirmed|rescheduled|cancelled|completed|no_show`), `notes?`, `diagnosisId?` (ref), `treatmentId?` (ref). Unique compound index `{ partnerId: 1, specialistId: 1, startsAt: 1 }` enforced at the application layer with a transactional slot-reservation check (see `ARCHITECTURE.md` booking race test) to prevent double-booking.

## Training

**Training** — `slug`, `name: {en,fr,ar}`, `description: {en,fr,ar}`, `trainerId` (ref `User` or a lightweight `Trainer` sub-doc), `mode` (`online|physical`), `requiredLevel`, `includedMaterials`.

**TrainingSession** — `trainingId` (ref, indexed), `startsAt`, `endsAt`, `location?`, `capacity`, `seatsBooked`, `priceMinor?`.

**TrainingBooking** — `sessionId` (ref, indexed), `professionalProfileId` (ref, indexed), `attendeeUserId` (ref), `status` (`booked|cancelled|attended|no_show`), `paymentId?` (ref), `certificateDocumentId?` (ref `Document`).

**Protocol** — `slug`, `title: {en,fr,ar}`, `objective: {en,fr,ar}`, `durationMinutes`, `requiredVariantIds: ObjectId[]`, `steps: {order, instruction: {en,fr,ar}}[]`, `contraindications?: {en,fr,ar}`, `pdfDocumentId?`, `videoDocumentId?`, `relatedTrainingIds`, `accessLevel` (`professional_approved`).

**Document** — `bucket` (`ioma-public|ioma-private`), `objectKey`, `mimeType`, `sizeBytes`, `ownerType` (`professional_application|training|protocol|order|ai_analysis|cms`), `ownerId`, `uploadedBy` (ref `User`).

## Diagnosis & AI

**StandardDiagnosis** — `userId?` (ref, indexed, nullable for guest-taken then claimed), `answers: DiagnosisAnswer[]`, `resultProfile` (`{skinType, priorityConcerns, hydrationScore, ...}`), `recommendedRangeId` (ref), `morningRoutine: variantId[]`, `eveningRoutine: variantId[]`.

**DiagnosisAnswer** (embedded) — `questionKey`, `value`.

**DiagnosisRecommendation** (admin-managed rules engine document, not code) — `conditions: {questionKey, operator, value}[]`, `resultRangeId`, `resultConcernIds`, `priority` — evaluated in priority order against a submitted `StandardDiagnosis.answers` to populate `resultProfile`/routines without hardcoding logic in UI components.

**AIConsent** — `userId` (ref, indexed), `consentedAt`, `consentVersion`, `ipAddress` (hashed), `withdrawnAt?`.

**AIAnalysis** — `userId` (ref, indexed), `consentId` (ref, required), `imageDocumentId` (ref `Document`, `ioma-private`), `provider` (`mock|...`), `status` (`queued|processing|completed|failed`), `indicators: {hydration, fineLines, wrinkles, pores, spots, unevenTone, redness, imperfections, texture, radiance, firmness}` (0-100 each), `isSimulated: boolean`, `resultVersion`, `recommendedRoutineRefs`, `deletedAt?` (image + record purge workflow sets this and removes the MinIO object).

## Content & CMS

**Article** — `slug` (unique), `categoryId` (ref), `tags: string[]`, `title: {en,fr,ar}`, `excerpt: {en,fr,ar}`, `body: {en,fr,ar}` (rich content), `authorId` (ref `User`), `heroMediaId`, `status` (`draft|published`), `publishedAt?`, `seo: SeoFields`.

**ArticleCategory** — `slug`, `name: {en,fr,ar}`.

**Page** — `slug` (unique, indexed, e.g. `homepage`, `maison`, `technology`, `privacy-policy`), `sections: {type, content: {en,fr,ar}, mediaIds, order}[]`, `status` (`draft|published`), `revisionHistory: {editedBy, editedAt, snapshot}[]`, `seo: SeoFields`.

**Translation** — `namespace`, `key`, `en`, `fr`, `ar` — for high-volume UI/email/validation strings not owned by a `Page`/`Article`.

**MediaAsset** — `documentId` (ref `Document`, bucket `ioma-public`), `altText: {en,fr,ar}`, `usageContext`.

**EmailTemplate** — `key` (unique, e.g. `order_confirmation`), `subject: {en,fr,ar}`, `body: {en,fr,ar}`, `variables: string[]`.

## System

**Notification** — `userId` (ref, indexed), `type`, `title: {en,fr,ar}`, `body: {en,fr,ar}`, `readAt?`, `relatedEntity?: {type, id}`.

**AuditLog** — `actorId` (ref `User`, indexed), `action`, `entityType`, `entityId` (indexed), `before?`, `after?`, `at` (indexed).

**Setting** — `key` (unique), `value` (mixed), `category`.

**ContactMessage** — `name`, `email` (indexed), `subject`, `message`, `locale`, `status` (`new|read|archived`). Built ahead of the full Notification/EmailTemplate system (Sprint 26 territory) specifically so the public Contact page's form is real, not a dead submission — see `DECISIONS.md`. Visible to staff once the Sprint 10 admin panel exists; a real email notification on submit is a drop-in addition once an `EmailProvider` adapter lands.

**NewsletterSubscriber** — `email` (unique, indexed), `locale`, `status` (`subscribed|unsubscribed`). Upserted by email on subscribe (idempotent — resubscribing after a past unsubscribe just flips status back).

## Seed & Migration Strategy

`infrastructure/scripts/seed.ts` populates demo data for every collection above (dev/staging only, gated behind `NODE_ENV !== 'production'`) so every screen is reviewable before real client content exists. `infrastructure/scripts/migrate.ts` runs versioned migration scripts from `apps/api/src/migrations/*.ts` tracked in a `_migrations` collection — no ad hoc production data edits.

## Account experience refinements — 2026-09-06

Cart lookup includes the existing type field alongside userId/sessionId. One user can retain a personal b2c cart and a separate b2b cart; adding an item never converts one into the other. Orders persist the checkout cart's type. Existing legacy cart contents are not silently deleted or rewritten.

ProfessionalApplication adds nullable applicantMessage. New document requests/rejections explicitly record applicant-facing messages separately from internal reviewNotes and statusHistory notes. No fake application state, progress percentage or deadline is stored.

TrainingBooking's existing certificateDocumentId is the source of certificate availability; only attended bookings with a real attachment expose a download. Capacity reservation and cancellation use conditional atomic MongoDB updates, and the existing session/attendee unique index blocks duplicate bookings.

## Admin analytics and managed content additions (2026-09-06)

`contentpages`: unique `(kind, slug)`, localized title/summary/SEO, typed text/image/link/FAQ blocks, draft/published status and timestamps. `stockmovements`: variantId, SKU, signed integer delta, reason, resulting quantity, actorId and timestamp; stock itself remains authoritative in productvariants. Existing audit records capture management action, actor and resource reference.

AIAnalysis adds processingStartedAt, completedAt, processingMs and providerModel. Historical missing timing/model fields remain unavailable, not estimated. Protocol adds relatedProductIds; existing private PDF/video document references and applicableRangeKeys remain. Admin validates references against existing records and does not introduce a second customer or professional identity.

## Product media extension (2026-09-06)

Product adds media: [{assetId: ObjectId -> MediaAsset, alt: {en,fr,ar}}], mediaRevision: number (default 0), and seo: {title: localized, description: localized}. Order of media is authoritative; first is primary. images is a deprecated materialized stable-URL compatibility projection, atomically updated with media.

MediaAsset (mediaassets): productId (original upload owner), bucket (logical public storage class), objectKey, originalKey, cardKey, thumbnailKey, originalFilename, mimeType, width, height, size, checksum, sourceUrl, uploadedBy, createdAt, updatedAt. Unique compound index (productId, checksum). No image bytes or expiring URLs. A duplicate product may reference the original immutable asset. Detached assets are retained to preserve historical references.
