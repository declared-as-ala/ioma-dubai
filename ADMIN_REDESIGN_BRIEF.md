# IOMA Paris Dubai — Complete Admin Dashboard Redesign & Analytics Upgrade

You are continuing the production project:

C:\Users\Ala\Desktop\ioma

I want you to completely upgrade the current Admin Dashboard.

The current `/admin` dashboard is too simple, contains almost no analytics/charts, is not properly responsive, has too much empty space, and does not expose all important management modules of the IOMA platform.

This is NOT only a visual redesign.

I want:

- Complete responsive admin shell
- Real operational KPIs
- Real charts
- Complete management navigation
- Real backend/database metrics
- Actionable alerts
- Recent activity
- B2C + B2B visibility
- AI diagnosis monitoring
- Appointments
- Training
- Protocols
- Inventory
- Customers
- Content
- Security
- Role-based Admin Panel access

Do not use fake/hardcoded dashboard metrics.

Everything displayed must come from actual backend/database data.

==================================================

1. AUDIT FIRST
   \==================================================

Before modifying code, inspect:

- current `/admin`
- admin layout
- admin sidebar
- admin APIs
- MongoDB models
- orders
- customers
- products
- inventory
- B2B applications
- professionals
- partners
- appointments
- trainings
- protocols
- AI analyses
- reviews
- promotions
- CMS
- audit logs
- roles/permissions

Read:

CLAUDE.md
DESIGN_SYSTEM.md
PROGRESS.md
TODO.md
SPRINTS.md
DECISIONS.md
DATA_MODEL.md
API_SPEC.md

Identify which features already exist before creating new ones.

Do not duplicate existing modules.

================================================== 2. IMPORTANT — ADMIN PANEL IN PUBLIC NAVBAR
==================================================

When a logged-in user has an authorized Admin role, show an additional item in the PUBLIC website navbar:

ADMIN PANEL

or a compact admin icon +:

ADMIN PANEL

Click:

→ `/admin`

This link must appear ONLY for authorized admin roles.

Normal customer:
NO Admin Panel link.

Professional/B2B account:
NO Admin Panel link unless that same user actually has an admin role.

Admin:
SHOW Admin Panel link.

Super Admin:
SHOW Admin Panel link.

Do not determine this only from frontend state.

Use authenticated role/permission data.

Backend remains authoritative.

================================================== 3. ADMIN SHOULD HAVE ITS OWN SHELL
==================================================

When the admin enters `/admin`, do not continue showing the complete public ecommerce navigation as the main admin navigation.

Create a dedicated Admin Shell.

Structure:

ADMIN HEADER +
ADMIN SIDEBAR +
MAIN WORKSPACE

A small link can remain:

VIEW WEBSITE

to return to the storefront.

Admin Header:

- IOMA Admin
- Global Admin Search
- Quick Create
- Notifications / Action Center
- View Website
- Admin user
- Role
- Account menu
- Logout

The admin should feel like a professional operational system.

================================================== 4. RESPONSIVE ADMIN LAYOUT
==================================================

Current layout is not responsive enough.

Fix it properly.

Test:

1440
1280
1024
768
390

Desktop:

Sidebar visible.

Tablet:

Sidebar collapsible.

Mobile:

Sidebar becomes drawer.

No horizontal document overflow.

Cards and charts must reflow intelligently.

Tables may scroll horizontally inside their own container when genuinely necessary.

Do NOT allow the whole document to overflow.

Touch targets >= 44×44px.

================================================== 5. ADMIN SIDEBAR STRUCTURE
==================================================

Reorganize the sidebar into groups.

OVERVIEW

Dashboard

COMMERCE

Orders
Products
Inventory
Categories
Product Ranges
Promotions / Coupons
Reviews

CUSTOMERS

Customers
Skin Diagnoses
AI Analyses
Saved Routines

PROFESSIONAL / B2B

B2B Applications
Professionals
B2B Orders
Professional Pricing
Cabin Products

PARTNERS & SERVICES

Partners
Partner Locations
Appointments
Treatments
Services
Availability

TRAINING

Trainings
Training Sessions
Bookings
Protocols
Documents
Certificates

CONTENT

Pages
Homepage
Journal
FAQ
Navigation
Footer
Media Library
SEO

SYSTEM

Admin Users
Roles
Permissions
Audit Logs
Notifications
Settings

Only display modules that actually exist or are part of approved scope.

Use nested/collapsible groups where useful.

================================================== 6. DASHBOARD HEADER
==================================================

Redesign:

Platform Overview

Add date control:

TODAY
7 DAYS
30 DAYS
THIS MONTH
CUSTOM RANGE

Also allow:

COMPARE TO PREVIOUS PERIOD

Metrics and charts must update using the selected period.

================================================== 7. PRIMARY KPI CARDS
==================================================

Replace the current limited KPI area with useful metrics.

Top row:

TOTAL REVENUE
Example:
124,850 AED

Show:
+12.4% vs previous period

TOTAL ORDERS

Show:
B2C + B2B

AVERAGE ORDER VALUE

Formula:

revenue / completed orders

CUSTOMERS

Show:
new customers during period

Second row:

PENDING B2B APPLICATIONS

APPROVED PROFESSIONAL PARTNERS

APPOINTMENTS

LOW STOCK PRODUCTS

Optional if meaningful:

AI SKIN ANALYSES

FAILED AI ANALYSES

Every KPI should be clickable where useful.

Example:

Pending B2B Applications
→ `/admin/b2b-applications?status=pending`

Low Stock
→ `/admin/inventory?status=low-stock`

Do not create fake links.

================================================== 8. REVENUE CHART
==================================================

Add a major chart:

REVENUE OVER TIME

Line/area chart.

Allow:

B2C
B2B
TOTAL

Examples:

Daily revenue for 7/30-day range.

Monthly revenue for longer periods.

Show:

Revenue AED
Orders count
comparison with previous period

Data must come from completed/paid orders.

Do not count:

failed
cancelled

according to actual business logic.

================================================== 9. ORDERS CHART
==================================================

Add:

ORDERS BY STATUS

Visualize:

Pending
Confirmed
Processing
Shipped
Delivered
Cancelled
Refunded

Use actual existing statuses.

Do not invent status enums.

Use bar/donut chart according to best UX.

Clicking a status should open filtered Orders where practical.

================================================== 10. B2C VS B2B
==================================================

Add:

SALES BY CHANNEL

Show:

B2C Revenue
B2B Revenue

and:

B2C Orders
B2B Orders

This is important because IOMA has two different business channels.

================================================== 11. PRODUCT SALES
==================================================

Add:

TOP SELLING PRODUCTS

Show approximately top 5–10:

Product image
Product name
Range
Units sold
Revenue AED
Stock

Add:

VIEW PRODUCTS

Use actual completed-order data.

================================================== 12. SALES BY RANGE
==================================================

Add chart:

SALES BY IOMA RANGE

Examples:

HYDRA
ENERGIZE
RENEW
CALM
PURETÉ
MATTE
ILLUMINE
IN.LAB
COCO
HAIR

Use only ranges that exist.

Metric selector optionally:

Revenue
Units Sold

================================================== 13. INVENTORY HEALTH
==================================================

Add:

INVENTORY HEALTH

Metrics:

In Stock
Low Stock
Out of Stock
Reserved Stock

Then show:

LOW STOCK PRODUCTS

Product
SKU
Available
Reserved
Threshold

CTA:

MANAGE INVENTORY

Important:

Low stock must use configured thresholds, not arbitrary UI values.

================================================== 14. CUSTOMER ANALYTICS
==================================================

Add:

CUSTOMERS

Metrics:

Total customers
New customers
Returning customers
Customers with diagnosis
Customers with orders

Optional:

Customer acquisition trend

Do not invent retention metrics if the backend cannot calculate them reliably.

================================================== 15. AI SKIN EXPERT ANALYTICS
==================================================

Because AI Skin Expert is a major IOMA feature, add a dedicated dashboard section.

AI SKIN EXPERT

Show:

Analyses started
Analyses completed
Failed analyses
Completion rate
Average processing time
Consultations created

Optional where data exists:

Routine added to cart
Diagnosis → Purchase conversion

Do NOT estimate these values.

Use tracked events/data only.

Also show:

AI PROVIDER STATUS

Gemini:
HEALTHY / ERROR

Voice:
ElevenLabs:
HEALTHY / ERROR

Avatar provider:
HEALTHY / NOT CONFIGURED / ERROR

Never expose API keys.

================================================== 16. B2B PIPELINE
==================================================

Add:

PROFESSIONAL APPLICATION PIPELINE

Show counts for:

Submitted
Pending
Documents Requested
Approved
Rejected
Suspended

Use actual backend statuses.

This can be a funnel or horizontal status chart.

Below show:

APPLICATIONS NEEDING ATTENTION

Company
Business Type
Emirate
Submitted
Status

CTA:

REVIEW APPLICATION

================================================== 17. PROFESSIONAL / B2B METRICS
==================================================

Show:

Approved Partners
Pending Applications
B2B Orders
B2B Revenue
Professional Training Bookings

Optional:

Active Professional Accounts

only if a reliable activity definition exists.

================================================== 18. APPOINTMENTS DASHBOARD
==================================================

Add:

APPOINTMENTS

Metrics:

Today
Upcoming
Completed
Cancelled
No-show

Then:

TODAY'S APPOINTMENTS

Time
Customer
Partner
Service
Status

CTA:

MANAGE APPOINTMENTS

================================================== 19. PARTNER NETWORK
==================================================

Show:

PARTNER NETWORK

Total partners

Breakdown by type:

Spa
Clinic
Hotel
Institute
Retail
Diagnosis Center

Also optionally by Emirate:

Dubai
Abu Dhabi
Sharjah
etc.

Only use actual data.

================================================== 20. TRAINING
==================================================

Add:

PROFESSIONAL TRAINING

Metrics:

Upcoming sessions
Bookings
Available seats
Completed sessions

Then show:

UPCOMING TRAININGS

Training
Date
Trainer
Capacity
Booked
Available seats

CTA:

MANAGE TRAININGS

================================================== 21. PROTOCOLS / DOCUMENTS
==================================================

Small dashboard summary:

PROFESSIONAL CONTENT

Protocols published
Training documents
Certificates generated

Do not take excessive dashboard space.

Link to management modules.

================================================== 22. RECENT ORDERS
==================================================

Add a proper:

RECENT ORDERS

table.

Columns:

Order
Customer
Channel
Date
Total
Payment
Fulfillment
Status

Show latest approximately 5–10.

Actions:

View

Do not put many buttons in every row.

================================================== 23. RECENT ACTIVITY
==================================================

Add:

RECENT ADMIN ACTIVITY

Use AuditLog data.

Examples:

Product updated
Professional approved
Order status changed
Protocol uploaded
Partner edited
Admin login

Show:

Actor
Action
Entity
Time

CTA:

VIEW AUDIT LOG

================================================== 24. ACTION CENTER
==================================================

Create an important operational section:

NEEDS ATTENTION

Examples:

3 professional applications pending
4 low-stock products
2 failed AI analyses
5 appointments awaiting confirmation
1 payment issue

Every item must come from real data.

Click takes admin directly to the relevant filtered page.

This is more useful than decorative KPI cards.

================================================== 25. CHART TECHNOLOGY
==================================================

Inspect existing chart dependencies first.

Reuse existing chart library if available.

If none exists, choose a lightweight, maintainable React chart solution compatible with Next.js.

Do not install several chart libraries.

Create reusable chart primitives.

Charts must support:

- loading state
- empty state
- error state
- tooltip
- responsive resizing
- accessibility
- theme consistency

Avoid flashy animation.

================================================== 26. ADMIN DASHBOARD DESIGN
==================================================

Continue using IBM Carbon-inspired enterprise UX.

The dashboard should feel:

Professional
Operational
Precise
Modern
Dense but readable
Fast

Avoid:

generic SaaS gradients
glassmorphism
huge rounded cards
heavy shadows
decorative illustrations
luxury editorial public-site design

The public website is luxury.

The Admin is enterprise/operational.

================================================== 27. KPI DESIGN
==================================================

KPI cards should contain:

Label
Value
Change
Context

Example:

TOTAL REVENUE
124,850 AED
↑ 12.4%
vs previous 30 days

Use positive/negative icon/text.

Do not communicate change using color only.

================================================== 28. DATA AGGREGATION
==================================================

Create proper backend analytics endpoints/services.

Do NOT load every order into browser and calculate metrics client-side.

Preferred architecture:

AdminDashboardService
or existing analytics service

Backend performs aggregation.

Possible endpoint:

GET /admin/dashboard/overview?from=&to=

Response conceptually:

{
revenue,
orders,
aov,
customers,
b2b,
inventory,
appointments,
ai,
charts,
alerts
}

Adapt to current architecture.

Use efficient MongoDB aggregation/indexes.

================================================== 29. PERFORMANCE
==================================================

Do not execute 20 expensive independent database queries on every dashboard load if they can be optimized.

Use:

- aggregation pipelines
- parallel safe queries
- indexes
- caching where appropriate

Dashboard should load quickly.

Use skeletons while fetching.

================================================== 30. ADMIN PRODUCTS PAGE
==================================================

Ensure page exists and is professional.

Features:

Search
Filters
Pagination
Create
Edit
Archive
Stock
B2C price
B2B price
Images
Range
Category
Status

================================================== 31. ADMIN INVENTORY PAGE
==================================================

Add/verify:

Available stock
Reserved
Low stock
Out of stock
Stock movements
SKU search
Range filters

================================================== 32. ADMIN ORDERS PAGE
==================================================

Must support:

B2C / B2B
Search
Date
Status
Payment
Fulfillment
Customer
Amount
Order Detail
Status Update
Tracking
Cancellation
Refund where implemented
Invoice

================================================== 33. ADMIN CUSTOMER PAGE
==================================================

Customer list.

Customer detail:

Profile
Addresses
Orders
Appointments
Wishlist
Skin diagnoses
AI analyses
Saved routines

Respect privacy/RBAC.

================================================== 34. B2B APPROVALS
==================================================

Complete application review:

Company
Professional contact
Licence
Documents
Business type
Emirate
Status
Timeline

Actions:

Approve
Request Documents
Reject
Suspend

Use existing workflow.

================================================== 35. PROFESSIONAL ACCOUNTS
==================================================

Separate APPROVED PROFESSIONALS from applications.

Professional detail:

Company
Professional pricing
B2B orders
Documents
Trainings
Protocols
Status

================================================== 36. PARTNERS
==================================================

Admin must manage:

Partners
Locations
Coordinates
Opening hours
Services
Treatments
Diagnosis availability
Phone
WhatsApp
Images
Booking configuration

================================================== 37. APPOINTMENTS
==================================================

Provide:

List view
Calendar view if existing/planned
Filters
Confirm
Reschedule
Cancel
Complete
No-show

================================================== 38. AI ANALYSES PAGE
==================================================

Admin AI screen should show:

Analysis ID
Customer
Date
Provider
Model
Status
Processing time

Detail:

Photo status
Indicators
Skin Profile
Routine
Errors
Consent

Actions where allowed:

Retry
Delete analysis
Delete image

Never expose API key.

================================================== 39. TRAINING
==================================================

Admin pages:

Trainings
Sessions
Bookings
Attendance
Certificates

================================================== 40. PROTOCOLS
==================================================

Manage:

Protocols
Categories
Related products
PDF
Video
Access level
Status

Private files remain private.

================================================== 41. CMS
==================================================

Admin Content should include:

Homepage
Pages
Journal
FAQ
Navigation
Footer
Media
SEO

Do not create a raw JSON CMS.

================================================== 42. PROMOTIONS
==================================================

Where feature exists:

Coupons
Gift tiers
Campaigns
Start/end
Eligibility
Usage

================================================== 43. REVIEWS
==================================================

If reviews are implemented:

Pending
Approved
Rejected
Verified Purchase
Moderation

================================================== 44. ADMIN USERS / RBAC
==================================================

Create/verify:

Admin Users
Roles
Permissions

Permissions must be backend-enforced.

Examples:

Products View/Edit
Orders View/Manage
Refunds
B2B Approvals
Content
Training
AI Analysis
Admin Management

Super Admin gets full access.

================================================== 45. SETTINGS
==================================================

Admin Settings should eventually centralize appropriate operational configuration:

General
Commerce
Shipping
AI
Diagnosis
Email
Partner
B2B
Training
SEO

Never display secrets.

For API credentials show only:

Configured / Not configured

or masked metadata.

================================================== 46. GLOBAL ADMIN SEARCH
==================================================

Add global search in Admin header.

Search across appropriate entities:

Order number
Product
Customer
Professional
Partner

Do not search sensitive fields unnecessarily.

================================================== 47. QUICK CREATE
==================================================

Optional Admin header:

- CREATE

Options:

Product
Partner
Training
Protocol
Article

Only show actions allowed by current role.

================================================== 48. MOBILE ADMIN
==================================================

At 390px prioritize:

Action Center
Core KPIs
Pending B2B
Today's appointments
Recent orders

Charts should stack vertically.

Large charts should have an appropriate mobile rendering.

Do not simply shrink desktop charts until text becomes unreadable.

================================================== 49. EMPTY / ERROR / LOADING STATES
==================================================

Every dashboard section requires:

Loading
Empty
Error

Example:

No Pending Applications

"All professional applications are up to date."

Do not show:

0
inside a huge useless card without context.

================================================== 50. CLICKABLE ANALYTICS
==================================================

Dashboard must be operational.

Examples:

LOW STOCK
→ Inventory filtered low stock

FAILED AI
→ AI analyses filtered failed

PENDING B2B
→ B2B approvals pending

ORDERS TODAY
→ Orders filtered date=today

The dashboard is an operational control center, not a static report.

================================================== 51. DATE COMPARISON
==================================================

For metrics such as:

Revenue
Orders
AOV
New Customers

calculate comparison against equivalent previous period.

Example:

Selected:
Aug 1–Aug 31

Compare:
Jul 1–Jul 31

Do calculations backend-side.

Handle previous = 0 correctly.

Do not show Infinity%.

================================================== 52. SECURITY
==================================================

`/admin` must remain protected.

Test:

Guest → denied

Customer → denied

B2B partner → denied

Admin → allowed according permissions

Super Admin → allowed

The public ADMIN PANEL navbar link must follow the same auth rules.

Do not rely on hiding the link.

================================================== 53. PUBLIC NAVBAR ADMIN EXPERIENCE
==================================================

When an Admin is browsing:

Home
Shop
Product
Account
etc.

show:

ADMIN PANEL

in the public navbar.

Use a small restrained treatment.

Possible location:

near account icon

or utility bar.

Do not disturb the IOMA luxury navigation.

Click:

→ /admin

When viewing `/admin`, provide:

VIEW WEBSITE

to return to public site.

================================================== 54. RESPONSIVE REGRESSION TESTS
==================================================

Playwright:

1440
1280
1024
768
390

Test:

Dashboard
Sidebar
Charts
Tables
Action Center
Mobile drawer
Admin header
No horizontal document overflow

================================================== 55. ROLE TEST
==================================================

Create explicit test:

Normal User:
Admin Panel navbar link DOES NOT exist.

Professional:
Admin Panel DOES NOT exist.

Admin:
Admin Panel EXISTS.

Admin clicks:
→ /admin

================================================== 56. DATA ACCURACY TEST
==================================================

Do not just test UI.

Seed or identify controlled data.

Example:

3 paid orders:
100
200
300 AED

Dashboard revenue must show:

600 AED

Then cancel/non-paid order must not affect revenue according to business rules.

Test B2C/B2B separation.

================================================== 57. FINAL DASHBOARD LAYOUT RECOMMENDATION
==================================================

Desktop layout approximately:

HEADER
Platform Overview + Date Range

ROW 1
Revenue | Orders | AOV | Customers

ROW 2
Pending B2B | Approved Partners | Appointments | Low Stock

MAIN ANALYTICS

LEFT 2/3:
Revenue Over Time

RIGHT 1/3:
Orders by Status

NEXT ROW:

B2C vs B2B
Sales by Range

NEXT:

Needs Attention

NEXT:

Top Selling Products
Inventory Health

NEXT:

Professional Application Pipeline
Today's Appointments

NEXT:

AI Skin Expert Health & Usage
Upcoming Training

BOTTOM:

Recent Orders
Recent Admin Activity

Do not force every section onto the screen if data or role makes it irrelevant.

================================================== 58. DOCUMENTATION
==================================================

Update:

PROGRESS.md

Document:
Admin Dashboard redesign
Analytics
Responsive behavior
Admin Panel navbar
Tests

DECISIONS.md

Document:
Admin shell
Analytics architecture
Chart library
Aggregation strategy
Role-based navbar link

DESIGN_SYSTEM.md

Document:
Admin dashboard charts
KPI pattern
Responsive dashboard layout

TEST_PLAN.md

Update admin dashboard coverage.

================================================== 59. DEFINITION OF DONE
==================================================

This task is complete only when:

- Admin dashboard is fully responsive
- Sidebar works desktop/mobile
- Dedicated Admin Shell exists
- Real charts exist
- Revenue metrics are real
- Orders metrics are real
- B2B metrics are real
- Appointment metrics are real
- Inventory alerts are real
- AI monitoring is real
- Recent activity is real
- No fake/hardcoded metrics remain
- Every major KPI is actionable
- Required management pages exist
- Admin Panel appears in public navbar only for admins
- Non-admins cannot access `/admin`
- Charts render at all breakpoints
- No horizontal document overflow
- Loading/empty/error states exist
- Typecheck passes
- Tests pass
- Build passes
- Playwright passes

Do not stop after redesigning the visual dashboard.

Implement the backend analytics, real charts, management navigation, responsive behavior, RBAC and Admin Panel navbar integration.

Do not commit or push unless I explicitly request it.
