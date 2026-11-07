# PROJECT — IOMA PARIS DUBAI

You are working on a real production client project named:

IOMA Paris Dubai

This project is the official UAE digital platform for IOMA Paris.

It is NOT a simple ecommerce website.

The objective is to build a luxury digital ecosystem combining:

- Premium brand website
- B2C ecommerce
- Personalized skincare
- Standard skin diagnosis
- AI photo-based skin analysis
- AI Skin Expert
- Personalized product routines
- Partner locator
- Appointment booking
- B2B professional portal
- Cabin products
- Professional protocols
- Professional training
- Customer accounts
- Complete administration dashboard
- EN / FR / AR
- Arabic RTL
- Production deployment

==================================================

1. PROJECT POSITIONING
   \==================================================

IOMA Paris is positioned around:

- French luxury skincare
- Skin intelligence
- Scientific personalization
- High-tech skin diagnosis
- Personalized routines
- Visible skincare results
- Premium beauty experience

The Dubai website must feel comparable in execution quality to international luxury skincare houses.

References include:

- IOMA Paris official website
- Maison Valmont
- Dior Beauty
- La Prairie
- Augustinus Bader
- Sisley Paris
- Luxury spa experiences in Dubai

Do not blindly copy these brands.

Use them only as UX, merchandising and luxury-quality references.

The official IOMA graphic charter is always the visual source of truth.

================================================== 2. TARGET MARKET
==================================================

Primary market:

Dubai and United Arab Emirates.

Primary currency:

AED

Main audiences:

B2C:

- individual skincare customers
- luxury beauty customers
- customers looking for personalized routines
- customers looking for skin diagnosis
- customers booking treatments

B2B:

- spas
- aesthetic clinics
- luxury hotels
- beauty institutes
- professional treatment centers
- retail partners
- distributors

================================================== 3. TECHNOLOGY STACK
==================================================

Frontend:

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn-based accessible primitives where useful
- Motion and/or GSAP for carefully controlled animation
- Responsive design
- EN / FR / AR
- RTL Arabic

Backend:

- NestJS
- TypeScript
- REST API
- Swagger/OpenAPI where configured

Database:

- MongoDB
- Mongoose

Storage:

- MinIO
- S3-compatible architecture
- Public media where appropriate
- Private documents/images using signed URLs

Infrastructure:

- Docker
- Docker Compose
- Reverse proxy
- VPS production deployment

Additional infrastructure:

- Redis where required
- background jobs/queues where required

Testing:

- Jest
- Playwright E2E
- TypeScript typecheck
- lint
- production builds
- Docker verification

================================================== 4. CMS / ADMINISTRATION
==================================================

The project does NOT use WordPress or Shopify.

It has a custom-built administration system.

Admin UX has been redesigned using IBM Carbon Design System principles.

Admin manages:

- Dashboard KPIs
- Products
- Categories
- Product ranges
- Skin concerns
- Ingredients
- Product media
- Inventory
- B2C pricing
- B2B pricing
- Customers
- Professionals
- B2B approvals
- Orders
- Payments
- Partners
- Appointments
- Treatments
- Trainings
- Protocols
- Documents
- AI analyses
- CMS pages
- Journal
- FAQ
- SEO
- Users
- Roles
- Permissions
- Audit logs
- Settings

================================================== 5. BRAND / DESIGN
==================================================

Visual direction:

- Luxury
- Minimal
- Scientific
- Editorial
- Elegant
- Calm
- Sophisticated
- Bright
- Timeless

Avoid:

- generic SaaS styling
- neon
- glassmorphism
- excessive gradients
- excessive rounded cards
- huge shadows
- cheap visual effects
- random stock aesthetics

Luxury should come from:

- typography
- photography
- whitespace
- composition
- precision
- restrained motion
- high-quality product presentation

================================================== 6. IOMA BRAND COLORS
==================================================

Primary:

Black:
RGB 0, 0, 0

White:
RGB 255, 255, 255

IOMA violet:
RGB 170, 159, 235

Range colors:

Hydra:
RGB 0, 99, 154

Energize:
RGB 229, 105, 83

Renew:
RGB 120, 34, 117

Calm:
RGB 181, 38, 85

Pureté:
RGB 184, 158, 22

Matte:
RGB 0, 103, 127

Illumine:
RGB 72, 58, 143

Use range colors only in appropriate product contexts.

================================================== 7. MAIN PUBLIC NAVIGATION
==================================================

The navigation organization should follow the information architecture quality of the official IOMA Paris website.

Main commerce navigation:

- UV & Protection
- Soins sur Mesure
- Visage
- Corps
- Cheveux
- Kits & Routines
- Inside IOMA

Important service entries:

- Skin Diagnosis
- AI Skin Expert
- Find a Partner
- Book Appointment
- Professionals

VISAGE mega menu should organize products by:

VOS PRÉOCCUPATIONS

Examples:

- Déshydratation
- Anti-âge
- Ridules
- Rides
- Fermeté
- Rougeurs
- Sensibilité
- Teint terne
- Taches
- Imperfections
- Pores
- Matité

NOS CATÉGORIES

Examples:

- Démaquillant
- Nettoyant
- Gommage
- Masque
- Crème Jour
- Crème Nuit
- Sérum
- Contour des yeux
- Protection solaire

NOS GAMMES

- Best Sellers
- Hydra
- Energize
- Renew
- Calm
- Pureté
- Matte
- Illumine

Navigation must be database/config driven where possible.

================================================== 8. HOMEPAGE
==================================================

Homepage should be cinematic and premium.

Main organization:

1. Cinematic Hero
2. Best Sellers
3. Personalized Skincare / Diagnosis
4. Product Ranges
5. Routines & Kits
6. AI Skin Expert
7. Science / Technology
8. Treatments / Partners
9. Inside IOMA / Journal
10. B2B / Professionals
11. Newsletter
12. Premium Footer

Hero:

- cinematic luxury video
- scroll-linked animation
- subtle pinning / parallax
- refined transitions
- premium typography
- elegant transition into next section
- mobile-specific simplified behavior
- reduced-motion support

================================================== 9. PRODUCT CATALOGUE
==================================================

The previous demo products are being replaced by real IOMA products from:

https://ioma-paris.com/

Official public product information and authorized imagery are used as source references.

Product images are stored in MinIO where authorized.

UAE prices are manually supplied in AED.

Do not use French EUR prices.

Do not convert prices automatically.

Main product families include:

- IN.LAB
- HYDRA
- ENERGIZE
- RENEW
- CALM
- PURETÉ
- MATTE
- ILLUMINE
- COCO
- HAIR

The product database is authoritative for:

- product ID
- name
- range
- category
- price AED
- stock
- size
- ingredients
- concerns
- usage
- AM/PM
- product media
- availability

================================================== 10. B2C ECOMMERCE
==================================================

Features:

- product catalogue
- search
- filters
- sorting
- product ranges
- categories
- concerns
- PDP
- product gallery
- image zoom
- product video
- size/variant selection
- AED pricing
- stock
- wishlist
- Add to Bag
- cart drawer
- cart
- promo codes
- checkout
- guest checkout
- customer checkout
- UAE address
- delivery
- payment-provider abstraction
- order confirmation
- order history
- order tracking

================================================== 11. CUSTOMER ACCOUNT
==================================================

Customer account includes:

- Dashboard
- Profile
- Addresses
- Orders
- Order details
- Order tracking
- Wishlist
- Saved routines
- Standard diagnosis history
- AI diagnosis history
- Appointments
- Notifications
- Preferences
- Security/password

================================================== 12. STANDARD SKIN DIAGNOSIS
==================================================

There is a deterministic questionnaire-based diagnosis.

This must work independently from AI.

Questionnaire data can include:

- skin type
- sensitivity
- lifestyle
- current skincare routine
- goals
- sun exposure
- air conditioning exposure
- product preference
- budget

The deterministic engine must:

- be backend-driven
- be versioned
- be testable
- return consistent results
- map recommendations only to real MongoDB products

================================================== 13. AI SKIN EXPERT
==================================================

The AI experience is one of the most important features.

It must NOT feel like:

photo
→ random scores
→ products

It should feel like:

a private IOMA digital beauty consultation.

Desired flow:

Photo
→ Vision AI
→ Photo-derived skin indicators
→ AI explanation
→ Adaptive consultation
→ Skin Profile
→ Real MongoDB product retrieval
→ Personalized routine
→ Female AI Expert conversation
→ Save consultation
→ Follow-up

================================================== 14. IMPORTANT AI RULE
==================================================

Visual skin indicators must come ONLY from photo/Vision analysis.

Questionnaire answers MUST NOT change visual skin scores.

Photo indicators:

PHOTO
→ VISION AI
→ STRUCTURED SKIN INDICATORS

Questionnaire/lifestyle:

USER ANSWERS
→ recommendation refinement only

Example:

Same photo + different questionnaire answers

must produce:

same photo-derived indicators

but may produce:

different product recommendations.

================================================== 15. AI SKIN INDICATORS
==================================================

Only include indicators technically supportable by the configured Vision model.

Potential cosmetic observations:

- visible hydration appearance
- visible pores
- fine lines
- wrinkles
- visible redness
- pigmentation/spots
- texture
- radiance
- imperfections
- visible oiliness/dryness

Do not claim medical diagnosis.

Do not fake precision.

Do not diagnose dermatological diseases.

================================================== 16. AI PRODUCT GROUNDING
==================================================

The LLM must NEVER invent IOMA products.

Required architecture:

Vision Analysis
→ Skin Indicators
→ Skin Profile
→ Product Candidate Retrieval
→ Deterministic Eligibility Rules
→ MongoDB Products
→ LLM Explanation

MongoDB/backend remains authoritative for:

- product existence
- price
- stock
- ingredients
- usage
- compatibility
- product status

================================================== 17. PERSONALIZED ROUTINES
==================================================

AI can produce:

ESSENTIAL

Simple routine with core products.

COMPLETE

Balanced complete routine.

PREMIUM

Most complete suitable IOMA routine.

All totals must be calculated from real database AED prices.

User can ask:

- simplify my routine
- make it cheaper
- build under 500 AED
- keep my current cleanser
- what do I use in the morning?
- why this serum?

================================================== 18. AI CHAT
==================================================

The AI Skin Expert must provide real contextual conversation.

It must understand:

- Vision analysis
- Skin Profile
- current routine
- previous conversation
- recommended products
- MongoDB catalogue
- prices
- current user goals

It must NOT return static/fallback generic answers silently.

If AI provider fails:

return a clear controlled unavailable state.

================================================== 19. AI FEMALE CONSULTANT
==================================================

The client wants a visible female AI beauty consultant.

Current character:

Éléonore — IOMA Paris

She should:

- have a stable female face
- speak naturally
- use lip sync
- explain skin results
- answer follow-up questions
- have subtitles
- support voice interaction where enabled

She is the FACE/VOICE.

The backend AI/LLM remains the BRAIN.

================================================== 20. AI LANGUAGES
==================================================

For the talking AI consultant:

English
Arabic

If route is English:

- female English voice
- English subtitles
- English conversation

If route is Arabic:

- female Arabic voice
- Arabic subtitles
- Arabic conversation
- RTL

================================================== 21. AI PROVIDERS
==================================================

Current AI stack includes:

Gemini:

- Vision / AI reasoning / chatbot where configured

ElevenLabs:

- premium female voice / TTS

Talking avatar architecture can support:

- HeyGen LiveAvatar
- Tavus
- D-ID

Preferred concept:

Gemini
→ response
→ ElevenLabs
→ Female Talking Avatar

Provider abstractions must remain configurable.

Do not expose API keys to frontend.

================================================== 22. PARTNER LOCATOR
==================================================

Interactive map/list of partners across Dubai/UAE.

Partner types:

- Spa
- Clinic
- Hotel
- Beauty Institute
- Retail Point
- Diagnosis Center
- Distributor

Features:

- Map
- List
- Emirate filter
- City filter
- Type filter
- Service filter
- Diagnosis availability
- Opening hours
- Phone
- WhatsApp
- Directions
- Partner page
- Booking CTA

================================================== 23. APPOINTMENT BOOKING
==================================================

Booking flow:

Partner
→ Service
→ Treatment/Diagnosis
→ Date
→ Available slot
→ Customer
→ Confirmation

System supports:

- working hours
- blocked dates
- holidays
- availability
- rescheduling
- cancellation
- appointment history

Double booking must be prevented.

Concurrent booking attempts must not create duplicate appointments.

================================================== 24. B2B PROFESSIONAL ACCOUNT
==================================================

B2B is for:

- spas
- clinics
- hotels
- institutes
- distributors
- professional partners

Professional registration includes:

- company info
- contact person
- business type
- licence/company documents
- email
- phone
- UAE address
- emirate/city
- website
- partnership information

Application states:

- Draft
- Submitted
- Pending
- Documents Requested
- Approved
- Rejected
- Suspended

Only approved professionals can enter B2B portal.

================================================== 25. B2B ADVANTAGES
==================================================

Approved professionals can access:

- professional pricing
- cabin products
- MOQ
- stock
- quick ordering
- B2B cart
- B2B orders
- tracking
- reorder
- invoices
- protocols
- technical documents
- marketing materials
- training
- certificates
- company settings
- support

MOQ means:

Minimum Order Quantity.

Example:

MOQ = 6

Professional must order at least 6 units.

================================================== 26. CABIN PRODUCTS
==================================================

Cabin products are professional-only.

They may contain:

- B2B price
- MOQ
- technical details
- cabin usage
- related treatment protocol
- related retail products

Public customers must not access restricted products.

================================================== 27. PROFESSIONAL TRAINING
==================================================

Training module allows professionals to:

- browse training catalogue
- see trainer
- date/time
- location
- online/physical
- duration
- capacity
- seats available
- book a seat
- cancel
- access materials
- view training history
- download certificates where available

Capacity and duplicate bookings must be protected.

================================================== 28. PROFESSIONAL PROTOCOLS
==================================================

Protocols are practical treatment instructions for professionals.

A protocol may contain:

- title
- objective
- duration
- required products
- step-by-step treatment instructions
- PDF
- video
- related training
- related cabin products

Private documents/videos use signed MinIO URLs.

================================================== 29. ADMIN DESIGN
==================================================

Admin uses IBM Carbon Design System principles.

It must feel:

- enterprise
- professional
- structured
- dense but readable
- accessible
- operational

Not luxury-editorial like public website.

Admin contains:

- Carbon-style sidebar
- structured tables
- filters
- forms
- drawers
- modals
- tags
- notifications
- responsive administration

================================================== 30. MULTILINGUAL
==================================================

Main website languages:

- English
- French
- Arabic

Arabic requires:

- real RTL
- correct icons
- correct forms
- correct navigation
- correct checkout
- correct tables
- correct drawers
- correct mixed text

No hardcoded untranslated UI strings.

================================================== 31. SECURITY
==================================================

Required:

- password hashing
- secure sessions/JWT
- RBAC
- backend permission enforcement
- DTO validation
- rate limiting
- secure MinIO
- signed URLs
- private diagnosis images
- user-level ownership checks
- audit logs
- secure API keys
- no secrets in frontend
- no secrets in Git
- no raw provider errors shown to users

User A must never access User B:

- orders
- addresses
- diagnosis
- skin image
- appointment
- B2B documents

================================================== 32. SEO
==================================================

SEO includes:

- titles
- descriptions
- canonical URLs
- sitemap
- robots
- Open Graph
- hreflang
- Product schema
- Article schema
- LocalBusiness schema
- FAQ schema
- Organization schema
- Breadcrumb schema

Target concepts include:

- Luxury Skincare Dubai
- Personalized Skincare UAE
- French Luxury Skincare
- Skin Analysis Dubai
- High-Tech Skincare Dubai
- Professional Skincare UAE

================================================== 33. RESPONSIVE
==================================================

Always test:

390px
768px
1024px
1280px
1440px

Rules:

- no horizontal document overflow
- mobile navigation works
- drawers fit
- checkout usable
- diagnosis usable
- admin usable
- touch targets >= 44x44px
- Arabic RTL tested

================================================== 34. MOTION
==================================================

Motion should be:

- subtle
- premium
- controlled
- responsive
- performant

Hero can use stronger cinematic scroll animation.

Other sections should use lighter effects.

No bounce.

No excessive parallax.

No scroll hijacking.

Respect prefers-reduced-motion.

================================================== 35. TESTING PHILOSOPHY
==================================================

Never claim a feature works only because:

- route exists
- TypeScript compiles
- UI looks correct
- Docker says Up

Use real evidence:

- Playwright
- API requests
- database verification
- MinIO verification
- browser interactions

Critical journeys:

B2C Purchase

Home
→ Shop
→ PDP
→ Cart
→ Checkout
→ Payment
→ Confirmation

Standard Diagnosis

Diagnosis
→ Questions
→ Result
→ Routine
→ Cart

AI Diagnosis

Photo
→ Real Vision Analysis
→ Skin Profile
→ Female AI Expert
→ Real IOMA Products
→ Routine
→ Save

Booking

Partner
→ Service
→ Slot
→ Confirmation

B2B

Professional Registration
→ Admin Approval
→ Portal
→ B2B Order

Training

Professional
→ Training
→ Booking

Admin

Login
→ Products
→ Orders
→ Professional Approval
→ Booking Management

================================================== 36. PROJECT DOCUMENTATION RULE
==================================================

Before major work always inspect:

CLAUDE.md
SPRINTS.md
TODO.md
PROGRESS.md
DECISIONS.md
DESIGN_SYSTEM.md
ARCHITECTURE.md
DATA_MODEL.md
API_SPEC.md
SECURITY.md
TEST_PLAN.md
DEPLOYMENT.md
ENVIRONMENT.md

Continuously update:

PROGRESS.md
TODO.md
SPRINTS.md

Record real architecture decisions in:

DECISIONS.md

Do not mark a feature complete without real verification.

================================================== 37. DEVELOPMENT RULES
==================================================

Do not:

- create a disconnected prototype
- replace working architecture blindly
- fake backend behavior
- fake AI results in production
- invent products
- invent product prices
- invent clinical claims
- add unnecessary libraries
- add secrets to source
- commit/push unless explicitly requested

When credentials are missing:

- create provider abstraction
- document the exact required variable
- continue implementing everything else

================================================== 38. CURRENT PROJECT GOAL
==================================================

The final product should feel like:

the official IOMA Paris digital flagship for Dubai and the UAE.

Public website:

luxury, editorial, scientific, emotional.

AI:

personalized, intelligent, conversational.

B2B:

professional and operational.

Admin:

enterprise and efficient.

Technology:

production-grade, scalable, secure and maintainable.

Every future change must preserve this vision.
