# IOMA Paris Dubai — Complete Account Area Redesign

## Customer Account + Professional / Partner Account

You are continuing the existing production project:

C:\Users\Ala\Desktop\ioma

I want you to completely redesign and enhance the existing `/account` experience.

The current account page works functionally, but visually and structurally it is too simple and does not clearly distinguish:

1. NORMAL CUSTOMER ACCOUNT
2. PROFESSIONAL / B2B PARTNER ACCOUNT

This is a real production client project.

Do NOT create a disconnected prototype.

Do NOT break current authentication, orders, diagnosis, appointments, wishlist, or B2B logic.

The goal is to create a premium, modern, smooth, intelligent account area that feels appropriate for IOMA Paris Dubai.

==================================================

1. FIRST AUDIT THE CURRENT ACCOUNT
   \==================================================

Before changing anything, inspect:

- current `/account` layout
- sidebar
- dashboard
- profile
- addresses
- orders
- appointments
- wishlist
- diagnosis history
- AI diagnosis history
- security
- delete account
- professional application
- B2B approval/status logic
- professional portal
- training
- protocols
- B2B orders
- professional pricing
- documents
- roles/guards
- account API endpoints
- authentication/session logic

Read:

- CLAUDE.md
- DESIGN_SYSTEM.md
- PROGRESS.md
- TODO.md
- SPRINTS.md
- DECISIONS.md
- DATA_MODEL.md
- API_SPEC.md

Do not redesign blindly.

First understand what exists.

================================================== 2. CORE ACCOUNT ARCHITECTURE
==================================================

Use ONE authenticated identity/account system.

Do not create duplicated customer and professional users unless the current backend architecture already requires it.

Preferred concept:

User +
CustomerProfile +
Optional ProfessionalProfile / ProfessionalApplication

A professional can still be a normal IOMA customer.

This means:

A partner can still have:

- personal orders
- wishlist
- skin diagnoses
- appointments

AND additionally:

- professional pricing
- B2B orders
- protocols
- training
- documents
- professional company profile

Keep personal and professional data clearly separated in UI.

================================================== 3. ACCOUNT TYPES
==================================================

The UI must distinguish clearly between:

NORMAL CUSTOMER

and

PROFESSIONAL PARTNER

Possible professional states:

- NOT_APPLIED
- DRAFT
- SUBMITTED
- PENDING
- DOCUMENTS_REQUESTED
- APPROVED
- REJECTED
- SUSPENDED

Use the ACTUAL backend enum names already present.

Do not create duplicate status systems.

================================================== 4. NORMAL CUSTOMER ACCOUNT EXPERIENCE
==================================================

For a normal customer, the dashboard should focus on:

MY IOMA

Sections:

- Welcome / account summary
- My Skin
- My Routine
- Orders
- Appointments
- Wishlist
- Addresses
- Profile
- Security

Do not show professional-only modules as empty menu items.

Instead, show one premium card:

BECOME AN IOMA PROFESSIONAL PARTNER

with short explanation and CTA:

APPLY FOR PROFESSIONAL ACCESS

================================================== 5. CUSTOMER DASHBOARD — REDESIGN
==================================================

The current dashboard is too empty.

Redesign it into an elegant personalized overview.

Suggested dashboard:

HEADER

Welcome back, Ala

Small contextual message:

“Your IOMA space brings together your skincare journey, appointments and orders.”

Then create meaningful sections.

================================================== 6. MY SKIN JOURNEY
==================================================

Create an important account section:

MY SKIN JOURNEY

Show:

- Latest skin diagnosis
- Latest AI diagnosis
- Date
- Main priorities
- Latest selected routine
- Next recommended reassessment date

Actions:

VIEW MY ANALYSIS

START A NEW DIAGNOSIS

ASK MY IOMA SKIN EXPERT

If no diagnosis exists:

“Discover what your skin needs.”

CTA:

START MY SKIN DIAGNOSIS

================================================== 7. MY PERSONALIZED ROUTINE
==================================================

Show the customer’s latest saved routine.

Example:

YOUR CURRENT IOMA RITUAL

Morning:
3 products

Evening:
4 products

Show:

- product thumbnails
- current total AED
- availability
- routine name/type

Actions:

VIEW ROUTINE

ADD ROUTINE TO BAG

ASK AI TO ADJUST

If no routine:

CREATE MY PERSONALIZED ROUTINE

================================================== 8. ORDERS OVERVIEW
==================================================

On account dashboard show:

RECENT ORDERS

For each:

- order number
- date
- total
- status
- channel B2C
- delivery state

Actions:

VIEW ORDER

TRACK ORDER

REORDER

Do not show 20 orders on dashboard.

Show latest 2–3.

Full history remains in Orders page.

================================================== 9. APPOINTMENTS OVERVIEW
==================================================

Show:

NEXT APPOINTMENT

- partner
- service
- date
- time
- location
- status

Actions:

VIEW

RESCHEDULE

CANCEL

GET DIRECTIONS

If no appointment:

BOOK A SKIN CONSULTATION

================================================== 10. WISHLIST OVERVIEW
==================================================

Show a small wishlist preview.

- 3–4 latest products
- image
- name
- price
- availability

Actions:

VIEW WISHLIST

ADD TO BAG

================================================== 11. ACCOUNT NAVIGATION — NORMAL CUSTOMER
==================================================

Recommended personal navigation:

OVERVIEW

- Dashboard

MY SKIN

- Skin Diagnoses
- AI Skin Expert
- Saved Routines

SHOPPING

- Orders
- Wishlist

SERVICES

- Appointments

ACCOUNT

- Profile
- Addresses
- Notifications
- Security

At bottom:

- Delete Account
- Sign Out

Do not create 15 flat navigation items.

Use grouped navigation.

================================================== 12. PROFESSIONAL / PARTNER ACCOUNT
==================================================

If the user has a ProfessionalApplication or ProfessionalProfile:

show a clear PROFESSIONAL area.

The user must immediately understand:

- whether they are approved
- application status
- what they need to do next
- what professional features they currently have access to

================================================== 13. PARTNER STATUS CARD
==================================================

This is very important.

At the top of the account dashboard, show:

PROFESSIONAL PARTNER STATUS

Possible statuses:

APPLICATION NOT STARTED

DRAFT

APPLICATION SUBMITTED

UNDER REVIEW

DOCUMENTS REQUIRED

APPROVED PARTNER

APPLICATION DECLINED

ACCOUNT SUSPENDED

Use:

- text
- icon
- status label

Color must not be the only signal.

================================================== 14. PARTNER APPLICATION PROGRESS
==================================================

For pending applications, show a premium progress/timeline.

Example:

1. APPLICATION
   Completed

2. DOCUMENTS
   Completed / Action required

3. IOMA REVIEW
   In progress

4. APPROVAL
   Pending

Do not show fake percentages.

Use actual backend status.

================================================== 15. PENDING PROFESSIONAL
==================================================

If status is:

SUBMITTED / PENDING

Show:

“Your professional application is under review.”

Display:

- application reference
- submitted date
- company name
- business type
- current status

Actions:

VIEW APPLICATION

VIEW DOCUMENTS

UPDATE CONTACT INFORMATION

CONTACT IOMA

Do not expose B2B pricing before approval.

================================================== 16. DOCUMENTS REQUESTED
==================================================

If status is:

DOCUMENTS_REQUESTED

Show a high-priority action:

ACTION REQUIRED

“IOMA requires additional documentation to continue reviewing your application.”

Display:

- documents requested
- admin message if available
- deadline if actually stored
- current uploaded documents

CTA:

UPLOAD REQUESTED DOCUMENTS

Use private MinIO.

After upload:

update application state according to existing business rules.

================================================== 17. APPROVED PARTNER
==================================================

If status is:

APPROVED

The dashboard should visibly become richer.

Show:

IOMA PROFESSIONAL PARTNER

with:

- company name
- partner type
- approved date
- professional account/reference
- professional price list if applicable

Primary CTA:

ENTER PROFESSIONAL PORTAL

or integrate the professional modules directly inside `/account`.

Choose the approach that fits current architecture best.

================================================== 18. PERSONAL / PROFESSIONAL MODE
==================================================

For approved partners, consider a premium mode switch:

PERSONAL
PROFESSIONAL

or:

MY IOMA
IOMA PROFESSIONAL

This should NOT create separate logins.

Same authenticated user.

Personal mode shows:

- personal orders
- skin
- appointments
- wishlist

Professional mode shows:

- professional catalogue
- professional orders
- protocols
- training
- documents
- company information

Do not mix B2C orders with B2B orders in one confusing list.

================================================== 19. PROFESSIONAL DASHBOARD
==================================================

For APPROVED partners show operational information:

PROFESSIONAL OVERVIEW

Possible cards:

- B2B Orders
- Current B2B Cart
- Professional Price List
- Upcoming Training
- Protocols
- Documents
- Company
- Support

Also show:

RECENT PROFESSIONAL ORDERS

UPCOMING TRAINING

RECENTLY UPDATED PROTOCOLS

Do not turn this into an admin dashboard.

It is a premium partner portal.

================================================== 20. PROFESSIONAL CATALOGUE
==================================================

Approved professional only.

Show:

PROFESSIONAL SHOP

Access to:

- professional pricing
- cabin products
- retail products
- MOQ
- professional availability
- quick order

Never expose professional prices publicly.

Backend authorization required.

================================================== 21. PROFESSIONAL ORDERS
==================================================

Create:

MY PROFESSIONAL ORDERS

Show:

- B2B order number
- date
- company
- items
- total
- status
- invoice
- tracking

Actions:

VIEW

REORDER

DOWNLOAD INVOICE

TRACK

================================================== 22. QUICK REORDER
==================================================

A useful B2B feature:

QUICK REORDER

Show frequently/recently purchased products.

Professional can:

- choose quantity
- respect MOQ
- add quickly to B2B cart

Do not mix with customer cart.

================================================== 23. COMPANY PROFILE
==================================================

Approved professional should have:

COMPANY PROFILE

Fields:

- company name
- trade name
- business type
- professional contact
- email
- phone
- address
- emirate
- city
- trade licence
- VAT/TRN where applicable
- website
- social links

Sensitive/legal fields should follow backend authorization rules.

================================================== 24. PROFESSIONAL DOCUMENTS
==================================================

Create:

MY DOCUMENTS

Categories:

- trade licence
- agreement
- invoices
- certificates
- technical documents
- marketing documents

Use private MinIO signed URLs.

Do not expose permanent private URLs.

================================================== 25. TRAINING
==================================================

Approved professional account should display:

MY TRAINING

Show:

- upcoming training
- completed training
- certificates
- available courses

Actions:

BOOK TRAINING

VIEW COURSE

CANCEL BOOKING

DOWNLOAD CERTIFICATE

================================================== 26. PROTOCOLS
==================================================

Approved professionals should access:

PROTOCOL LIBRARY

Show:

- protocol name
- category
- related products
- duration
- PDF
- video

Actions:

VIEW PROTOCOL

OPEN PDF

WATCH VIDEO

Only authorized professional users.

================================================== 27. PROFESSIONAL CERTIFICATES
==================================================

Create:

MY CERTIFICATES

if the training module supports certificates.

Display:

- training
- completion date
- certificate ID
- download

Do not invent certificate data.

================================================== 28. TEAM MEMBERS
==================================================

If current B2B requirements support company team management:

create:

TEAM

Company owner/admin can:

- invite team member
- assign B2B role
- remove member
- restrict permissions

Do not implement if backend has no concept of B2B teams unless it is clearly part of approved scope.

If missing, mark as optional/future.

================================================== 29. PROFESSIONAL SUPPORT
==================================================

Create:

PROFESSIONAL SUPPORT

Possible actions:

CONTACT IOMA

REQUEST PRODUCT ASSISTANCE

TRAINING SUPPORT

ORDER SUPPORT

PARTNERSHIP SUPPORT

If no ticket system exists, integrate cleanly with existing contact system.

================================================== 30. REJECTED APPLICATION
==================================================

If status is:

REJECTED

Show respectfully:

“Your professional application could not be approved at this time.”

If backend stores an admin-safe public reason:

show it.

Do not expose internal admin notes.

Actions:

CONTACT IOMA

REVIEW APPLICATION

REAPPLY

only if current policy permits reapplication.

================================================== 31. SUSPENDED PROFESSIONAL
==================================================

If status is:

SUSPENDED

Remove/deny B2B protected access.

Show:

PROFESSIONAL ACCESS TEMPORARILY SUSPENDED

Provide:

CONTACT IOMA

Do not show professional price access.

Do not rely only on frontend hiding.

Backend guards must block access.

================================================== 32. ACCOUNT VISUAL REDESIGN
==================================================

The current account page is too plain.

Redesign it completely.

The design must feel:

- modern
- premium
- elegant
- smooth
- calm
- precise
- editorial
- personal

This is CUSTOMER/PARTNER experience.

Do NOT use IBM Carbon admin styling here.

Do NOT make it look like an enterprise admin dashboard.

Use IOMA luxury design language.

================================================== 33. ACCOUNT PAGE DESIGN DIRECTION
==================================================

Use:

- large editorial page headings
- generous whitespace
- clean grid
- thin borders
- restrained IOMA violet
- real product images
- subtle skin imagery
- intelligent cards
- clear hierarchy
- polished typography

Avoid:

- generic SaaS cards
- strong shadows
- 20 boxes
- glassmorphism
- neon
- excessive rounded corners
- dashboards filled with useless KPI widgets

================================================== 34. SIDEBAR REDESIGN
==================================================

Redesign the account sidebar.

Current version looks too basic.

Make it:

- grouped
- elegant
- sticky on desktop where useful
- collapsible on tablet/mobile
- clear active state
- subtle transitions

Suggested groups:

MY IOMA

Dashboard

SKIN

Diagnoses
AI Skin Expert
Saved Routines

SHOP

Orders
Wishlist

SERVICES

Appointments

ACCOUNT

Profile
Addresses
Notifications
Security

PROFESSIONAL

only visible when relevant:

Partner Status
Professional Portal
B2B Orders
Training
Protocols
Documents
Company

Bottom:

Sign Out
Delete Account

================================================== 35. MOBILE ACCOUNT
==================================================

At mobile:

do not keep a huge permanent sidebar.

Use:

- account navigation drawer
  or
- compact section selector

The dashboard should stack cleanly.

Test:

390px
768px

Touch targets >=44px.

No horizontal overflow.

================================================== 36. SMOOTH ANIMATIONS
==================================================

Make account interactions feel polished.

Use subtle animation for:

- page transitions
- sidebar active state
- cards entering
- account mode switch
- Partner Status timeline
- status update
- drawers
- modal
- expanding sections

Keep animation approximately:

150–300ms UI

Do not use playful effects.

Respect reduced motion.

================================================== 37. PERSONALIZED DASHBOARD
==================================================

Do not show the same dashboard to every user.

Dashboard content should depend on real user state.

Example:

New customer:

Start Diagnosis
Explore IOMA
Create Routine

Existing customer:

Latest Skin Analysis
Current Routine
Recent Order
Next Appointment

Pending Partner:

Professional Application Status
Action Required
Recent Personal Activity

Approved Partner:

Professional Status
Recent B2B Order
Upcoming Training
Protocols
Personal Skin Journey

================================================== 38. EMPTY STATES
==================================================

Every module needs an intentional empty state.

Example:

No Orders:

“You haven't placed an IOMA order yet.”

SHOP IOMA

No Diagnosis:

“Your personalized skin journey starts here.”

START DIAGNOSIS

No Appointment:

“Meet an IOMA expert.”

BOOK APPOINTMENT

No B2B Order:

“Your professional catalogue is ready.”

EXPLORE PROFESSIONAL PRODUCTS

================================================== 39. NOTIFICATIONS / ACTION CENTER
==================================================

Consider adding:

ACTION CENTER

Show only useful actions:

- additional professional documents requested
- appointment tomorrow
- B2B application update
- training upcoming
- payment issue
- diagnosis follow-up

Do not create fake notifications.

Use real backend events.

================================================== 40. PROFESSIONAL STATUS NOTIFICATIONS
==================================================

Important B2B changes should appear inside account:

Application submitted

Documents requested

Application approved

Application rejected

Professional account suspended

Training confirmed

Use real data.

================================================== 41. ACCOUNT HEADER
==================================================

Create a more premium account header.

Example:

MY IOMA

Welcome back, Ala.

Then contextual status:

CUSTOMER

or:

IOMA PROFESSIONAL PARTNER

For approved B2B:

display a restrained badge:

PROFESSIONAL PARTNER

Do not over-brand it.

================================================== 42. SECURITY
==================================================

Critical.

Frontend account type is not security.

Backend must enforce:

Normal Customer:

cannot access B2B prices.

Pending Professional:

cannot access B2B prices.

Rejected:

cannot access B2B portal.

Suspended:

cannot access B2B portal.

Approved:

can access allowed B2B resources.

Test direct API calls.

================================================== 43. CUSTOMER DATA ISOLATION
==================================================

Test:

User A cannot view:

- User B profile
- addresses
- orders
- diagnoses
- AI analysis
- appointments
- wishlist
- routines
- professional documents

================================================== 44. URL STRUCTURE
==================================================

Use current routing conventions.

Possible structure:

/account
/account/profile
/account/addresses
/account/orders
/account/orders/[id]
/account/appointments
/account/wishlist
/account/diagnosis
/account/routines
/account/security

Professional:

/account/professional
/account/professional/application
/account/professional/orders
/account/professional/company
/account/professional/documents
/account/professional/training
/account/professional/protocols

But first inspect existing routes.

Reuse existing `/portal` routes if they are already established and working.

Do not duplicate the same B2B pages under two routing systems.

================================================== 45. IMPORTANT ROUTING DECISION
==================================================

If `/portal` already contains:

- trainings
- protocols
- B2B catalogue
- B2B orders

then `/account` should provide a premium gateway/status overview and link to the existing professional portal.

Do NOT duplicate those modules.

Example:

/account
→ Professional Partner card
→ ENTER PROFESSIONAL PORTAL
→ /portal

Document this architecture decision.

================================================== 46. I18N
==================================================

Everything must work in:

EN
FR
AR

The current screenshot is English.

Audit all account strings.

No hardcoded language.

Arabic:

- RTL
- navigation direction
- status timeline
- cards
- buttons
- mixed product names

================================================== 47. TEST NORMAL CUSTOMER
==================================================

Create E2E scenario:

Normal customer login
→ `/account`
→ sees Customer dashboard
→ no B2B protected modules
→ sees optional Apply for Professional Access CTA
→ profile works
→ orders work
→ diagnosis works
→ appointments work

================================================== 48. TEST PENDING PARTNER
==================================================

Login as user with PENDING application.

Verify:

- personal account still works
- professional status visible
- application timeline visible
- current status correct
- B2B catalogue inaccessible
- professional pricing inaccessible

================================================== 49. TEST DOCUMENTS REQUESTED
==================================================

Verify:

- Action Required appears
- requested documents displayed
- upload works
- MinIO remains private
- application update works

================================================== 50. TEST APPROVED PARTNER
==================================================

Approved partner:

Login
→ Account
→ Professional Partner status
→ Enter Professional Portal
→ B2B prices
→ Cabin Products
→ B2B Orders
→ Training
→ Protocols
→ Documents

All must work.

================================================== 51. TEST SUSPENDED PARTNER
==================================================

Suspended professional:

- Account visible
- personal customer functions still available where policy allows
- professional status shows Suspended
- professional portal access denied
- professional APIs return 403
- contact support available

================================================== 52. PLAYWRIGHT
==================================================

Add/extend E2E tests for:

NORMAL CUSTOMER

PENDING PARTNER

DOCUMENTS REQUESTED

APPROVED PARTNER

REJECTED PARTNER

SUSPENDED PARTNER

At:

1440px
390px

Also test Arabic RTL for at least:

normal customer
approved partner

================================================== 53. FUNCTIONAL TESTING
==================================================

Do not consider a page finished because it renders.

Actually test:

Profile update

Address create/edit/delete

Order detail

Wishlist

Diagnosis history

AI diagnosis history

Appointment

Professional status

Professional document upload

Portal access

B2B authorization

Sign out

Delete account confirmation

================================================== 54. DESIGN VERIFICATION
==================================================

Use Playwright screenshots at:

1440×900
1280×800
768×1024
390×844

Check:

- hierarchy
- whitespace
- sidebar
- status timeline
- product/routine previews
- partner status
- mobile
- Arabic RTL

================================================== 55. DOCUMENTATION
==================================================

Update:

PROGRESS.md

Record:

- Account redesign
- Customer dashboard
- Partner status UX
- Partner mode
- responsive fixes
- tests

DECISIONS.md

Record:

- single identity / dual customer-professional experience
- `/account` vs `/portal` responsibility
- application status UX
- role/access logic

DESIGN_SYSTEM.md

Add Account Experience patterns if needed.

TODO.md / SPRINTS.md

Keep synchronized.

================================================== 56. FINAL RECOMMENDED ACCOUNT FEATURES
==================================================

CUSTOMER ACCOUNT SHOULD INCLUDE:

- Dashboard
- Profile
- Addresses
- Orders
- Tracking
- Wishlist
- Skin Diagnoses
- AI Skin Expert history
- Saved Routines
- Appointments
- Notifications
- Security
- Delete Account
- Sign Out
- Professional Application CTA

PROFESSIONAL ACCOUNT SHOULD ADD:

- Professional Status
- Application Timeline
- Documents Requested
- Application Detail
- Company Profile
- Professional Catalogue
- Professional Pricing
- Cabin Products
- MOQ
- Quick Order
- B2B Orders
- Reorder
- Invoices
- Professional Documents
- Protocols
- Training
- Certificates
- Professional Support
- Team Members only if supported
- Enter Professional Portal

================================================== 57. FINAL EXPECTED EXPERIENCE
==================================================

NORMAL CUSTOMER:

I log in.

I immediately understand:

- my latest skin analysis
- my current IOMA routine
- my latest order
- my next appointment
- my wishlist
- how to apply as a professional if relevant

PENDING PARTNER:

I log in.

I see:

PROFESSIONAL APPLICATION — UNDER REVIEW

I understand exactly where my application is in the process.

I can see whether I need to provide documents.

I cannot see professional prices yet.

APPROVED PARTNER:

I log in.

I see:

IOMA PROFESSIONAL PARTNER

I can still use my personal customer features.

I also have clear access to:

- professional catalogue
- professional prices
- B2B orders
- training
- protocols
- documents

This should feel like IOMA knows whether I am:

a customer
or
a professional partner

without forcing me into two disconnected accounts.

================================================== 58. FINAL REPORT
==================================================

When complete tell me:

1. Account architecture found.
2. Customer vs professional logic.
3. Pages redesigned.
4. New account features.
5. Professional application states implemented.
6. Pending-partner UX.
7. Approved-partner UX.
8. Rejected/suspended UX.
9. `/account` vs `/portal` decision.
10. Backend access-control verification.
11. EN result.
12. FR result.
13. AR result.
14. Mobile result.
15. Playwright result.
16. Remaining optional features.

Do not stop after redesigning the main dashboard.

Audit and enhance the entire authenticated account experience.

Do not commit or push unless I explicitly request it.
