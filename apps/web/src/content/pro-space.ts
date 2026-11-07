// Copy for the B2B landing page and the pro space ("espace pro"), from the client brief
// "IOMA Dubai — B2B Professionals v2" (three access levels). Items the brief leaves to IEVA
// (trade prices, minimum first order, delivery terms, files) are NOT invented here: the UI
// shows a "to be confirmed" state until the back office supplies them.

export type L = { en: string; ar: string };
const l = (en: string, ar: string): L => ({ en, ar });

export const LANDING = {
  kicker: l("IOMA Pro", "IOMA Pro"),
  title: l("Trade access for beauty professionals.", "وصول مهني لمحترفي الجمال."),
  body: l(
    "Register in one minute. We will call you to validate your account. Once approved, you can see the trade prices and order online.",
    "سجّل في دقيقة واحدة. سنتصل بك للتحقق من حسابك. بعد الموافقة يمكنك رؤية الأسعار المهنية والطلب عبر الإنترنت.",
  ),
  bullets: [
    l("See the trade prices", "اطّلع على الأسعار المهنية"),
    l(
      "Order retail and cabin products online",
      "اطلب منتجات التجزئة والكابينة عبر الإنترنت",
    ),
    l(
      "Access training videos and cabin inspiration",
      "احصل على مقاطع التدريب وإلهام الكابينة",
    ),
  ],
  form: {
    title: l("Request trade access", "اطلب الوصول المهني"),
    subtitle: l("Five fields, then we call you.", "خمسة حقول، ثم نتصل بك."),
    firstName: l("First name", "الاسم الأول"),
    lastName: l("Last name", "اسم العائلة"),
    company: l("Company name", "اسم الشركة"),
    phone: l("Phone number", "رقم الهاتف"),
    email: l("Email", "البريد الإلكتروني"),
    submit: l("Request trade access", "اطلب الوصول المهني"),
    sending: l("Sending…", "جارٍ الإرسال…"),
    consent: l(
      "By submitting this form, you agree to be contacted by IOMA to complete your file. Trade prices are shown once your account is validated.",
      "بإرسال هذا النموذج، فإنك توافق على أن تتصل بك IOMA لاستكمال ملفك. تظهر الأسعار المهنية بعد التحقق من حسابك.",
    ),
    successTitle: l("Thank you. We will call you.", "شكراً. سنتصل بك."),
    successBody: l(
      "Our team received your request. We will call you to ask for your Trade License and Tax Registration Number (TRN) and to validate your account. A confirmation was sent to your email.",
      "استلم فريقنا طلبك. سنتصل بك لطلب الرخصة التجارية ورقم التسجيل الضريبي (TRN) وللتحقق من حسابك. أُرسل تأكيد إلى بريدك الإلكتروني.",
    ),
    error: l(
      "We could not send your request. Please check the fields and try again.",
      "تعذّر إرسال طلبك. يرجى التحقق من الحقول والمحاولة مجدداً.",
    ),
    rateLimited: l(
      "Too many attempts. Please wait a minute and try again.",
      "محاولات كثيرة. يرجى الانتظار دقيقة والمحاولة مجدداً.",
    ),
    signIn: l("Already validated?", "تمت الموافقة على حسابك؟"),
    signInLink: l("Sign in", "تسجيل الدخول"),
    invalidPhone: l("Enter a valid phone number.", "أدخل رقم هاتف صالحاً."),
    invalidEmail: l("Enter a valid email address.", "أدخل بريداً إلكترونياً صالحاً."),
    required: l("This field is required.", "هذا الحقل مطلوب."),
  },
  how: {
    kicker: l("How it works", "كيف يعمل"),
    title: l("From registration to your first order.", "من التسجيل إلى طلبك الأول."),
    steps: [
      {
        title: l("You register", "تسجّل"),
        body: l(
          "Fill in the short form: name, company, phone and email.",
          "املأ النموذج القصير: الاسم والشركة والهاتف والبريد.",
        ),
      },
      {
        title: l("We call you", "نتصل بك"),
        body: l(
          "We ask for your Trade License and your Tax Registration Number (TRN), and answer your questions.",
          "نطلب رخصتك التجارية ورقم تسجيلك الضريبي (TRN) ونجيب عن أسئلتك.",
        ),
      },
      {
        title: l("Your account is validated", "يتم التحقق من حسابك"),
        body: l(
          "Our team approves your account. You see the trade prices and can order.",
          "يوافق فريقنا على حسابك. ترى الأسعار المهنية ويمكنك الطلب.",
        ),
      },
      {
        title: l("Your first order unlocks the rest", "طلبك الأول يفتح الباقي"),
        body: l(
          "Training videos, the cabin gallery and your benefits open once your first order is placed.",
          "تُفتح مقاطع التدريب ومعرض الكابينة ومزاياك بعد تقديم طلبك الأول.",
        ),
      },
    ],
    note: l(
      "Documents and delay of validation are confirmed by our team when it calls you.",
      "يؤكد فريقنا المستندات ومدة التحقق عند الاتصال بك.",
    ),
  },
  inside: {
    kicker: l("Inside your pro space", "داخل مساحتك المهنية"),
    title: l("Two steps to open everything.", "خطوتان لفتح كل شيء."),
    note: l(
      "Trade prices and ordering open when your account is validated. Training, the gallery and your benefits unlock with your first order.",
      "تُفتح الأسعار المهنية والطلب عند التحقق من حسابك. ويُفتح التدريب والمعرض ومزاياك مع طلبك الأول.",
    ),
    afterValidation: l("After validation", "بعد التحقق"),
    afterFirstOrder: l("After your first order", "بعد طلبك الأول"),
    cards: [
      {
        key: "shop",
        unlock: "validation",
        title: l("Shop retail products", "تسوّق منتجات التجزئة"),
        body: l(
          "Order the IOMA range for sale at trade prices.",
          "اطلب تشكيلة IOMA للبيع بأسعار مهنية.",
        ),
      },
      {
        key: "cabin",
        unlock: "validation",
        title: l("Cabin products", "منتجات الكابينة"),
        body: l(
          "Professional products and treatment kits for your cabin.",
          "منتجات مهنية وحقائب علاجات لكابينتك.",
        ),
      },
      {
        key: "documents",
        unlock: "validation",
        title: l("Price list and order form", "قائمة الأسعار ونموذج الطلب"),
        body: l("Everything you need to place an order.", "كل ما تحتاجه لتقديم طلب."),
      },
      {
        key: "videos",
        unlock: "order",
        title: l("Training videos", "مقاطع التدريب"),
        body: l(
          "Sales, sales techniques, treatments and protocols.",
          "المبيعات وتقنيات البيع والعلاجات والبروتوكولات.",
        ),
      },
      {
        key: "gallery",
        unlock: "order",
        title: l("Cabin gallery", "معرض الكابينة"),
        body: l(
          "Photos of beautiful IOMA cabins and spaces, for inspiration.",
          "صور لكابينات ومساحات IOMA الجميلة، للإلهام.",
        ),
      },
      {
        key: "benefits",
        unlock: "order",
        title: l("Your benefits", "مزاياك"),
        body: l(
          "Protocol guides, brand book, your IOMA contact and more.",
          "أدلة البروتوكولات وكتيّب العلامة وجهة اتصالك في IOMA وغير ذلك.",
        ),
      },
    ],
  },
  faq: {
    kicker: l("Questions", "أسئلة"),
    title: l("Before you register.", "قبل التسجيل."),
    items: [
      {
        q: l("Who can register?", "من يمكنه التسجيل؟"),
        a: l(
          "Beauty professionals such as boutiques, institutes and clinics. Our team confirms eligibility when it calls you.",
          "محترفو الجمال مثل البوتيكات والمعاهد والعيادات. يؤكد فريقنا الأهلية عند الاتصال بك.",
        ),
      },
      {
        q: l(
          "Do I see the prices before my account is validated?",
          "هل أرى الأسعار قبل التحقق من حسابي؟",
        ),
        a: l(
          "No. Trade prices appear once your account is validated by the IOMA team.",
          "لا. تظهر الأسعار المهنية بعد أن يتحقق فريق IOMA من حسابك.",
        ),
      },
      {
        q: l("When can I order?", "متى يمكنني الطلب؟"),
        a: l(
          "As soon as your account is validated, you can see the trade prices and place your first order online.",
          "فور التحقق من حسابك يمكنك رؤية الأسعار المهنية وتقديم طلبك الأول عبر الإنترنت.",
        ),
      },
      {
        q: l(
          "Do I need to order to see the training videos?",
          "هل يجب أن أطلب لأرى مقاطع التدريب؟",
        ),
        a: l(
          "Yes. Validation opens prices and ordering; your first order unlocks the training videos, the cabin gallery and your benefits. The documents needed to order are open from validation.",
          "نعم. يفتح التحقق الأسعار والطلب؛ ويفتح طلبك الأول مقاطع التدريب ومعرض الكابينة ومزاياك. المستندات اللازمة للطلب مفتوحة منذ التحقق.",
        ),
      },
      {
        q: l("Which documents will you ask for?", "ما المستندات التي ستطلبونها؟"),
        a: l(
          "Your Trade License and, if your business is VAT-registered, your Tax Registration Number (TRN). Some activities, such as clinics, may need extra health licences. We confirm the exact list when we call.",
          "رخصتك التجارية، ورقم التسجيل الضريبي (TRN) إن كانت منشأتك مسجلة في ضريبة القيمة المضافة. قد تحتاج بعض الأنشطة، مثل العيادات، إلى تراخيص صحية إضافية. نؤكد القائمة الدقيقة عند الاتصال.",
        ),
      },
      {
        q: l(
          "Can I order cabin products and retail products?",
          "هل يمكنني طلب منتجات الكابينة ومنتجات التجزئة؟",
        ),
        a: l(
          "Yes. Once validated, you can order both at trade prices from your pro space.",
          "نعم. بعد التحقق يمكنك طلب كليهما بأسعار مهنية من مساحتك المهنية.",
        ),
      },
    ],
  },
};

export const SHELL = {
  badge: "PRO",
  nav: {
    overview: l("Overview", "نظرة عامة"),
    shop: l("Shop", "المتجر"),
    cabin: l("Cabin products", "منتجات الكابينة"),
    videos: l("Training videos", "مقاطع التدريب"),
    gallery: l("Cabin gallery", "معرض الكابينة"),
    benefits: l("Your benefits", "مزاياك"),
    documents: l("Documents", "المستندات"),
  },
  locked: l("Locked until your first order", "مقفل حتى طلبك الأول"),
  chipValidated: l("Validated · no order yet", "تم التحقق · بلا طلب بعد"),
  chipCustomer: l("Customer", "عميل"),
  order: l("Order", "الطلب"),
  signOut: l("Sign out", "تسجيل الخروج"),
  help: l("Need help?", "تحتاج مساعدة؟"),
  helpTeam: l("IOMA Pro team", "فريق IOMA Pro"),
  yourContact: l("Your IOMA contact", "جهة اتصالك في IOMA"),
  contactSoon: l("Your IOMA team will contact you.", "سيتواصل معك فريق IOMA."),
  menu: l("Pro menu", "قائمة المساحة المهنية"),
  loading: l("Loading your pro space…", "جارٍ تحميل مساحتك المهنية…"),
  review: {
    title: l("Your request is being reviewed", "طلبك قيد المراجعة"),
    body: l(
      "Our team will call you to validate your account. Once approved, you will see the trade prices and can order.",
      "سيتصل بك فريقنا للتحقق من حسابك. بعد الموافقة سترى الأسعار المهنية ويمكنك الطلب.",
    ),
    cta: l("Back to the B2B page", "العودة إلى صفحة الأعمال"),
  },
};

export const LOCK = {
  firstOrderCta: l("Start your first order", "ابدأ طلبك الأول"),
  unlockedByFirst: l("Unlocked by your first order", "يُفتح بطلبك الأول"),
  rule: (aed: number, unlockOn: "confirmed" | "paid"): L =>
    l(
      `Minimum first order: AED ${aed.toLocaleString("en")}. Unlocks once the order is ${unlockOn === "paid" ? "paid" : "confirmed"}.`,
      `الحد الأدنى للطلب الأول: ${aed.toLocaleString("en")} درهم. يُفتح عند ${unlockOn === "paid" ? "دفع" : "تأكيد"} الطلب.`,
    ),
  ruleNoMin: (unlockOn: "confirmed" | "paid"): L =>
    l(
      `Unlocks once your first order is ${unlockOn === "paid" ? "paid" : "confirmed"}.`,
      `يُفتح عند ${unlockOn === "paid" ? "دفع" : "تأكيد"} طلبك الأول.`,
    ),
  comingSoon: l("Coming soon", "قريباً"),
  duration: (m: number): L => l(`${m} min`, `${m} دقيقة`),
};

export const OVERVIEW = {
  validatedKicker: l("Account validated", "تم التحقق من الحساب"),
  customerKicker: l("Customer", "عميل"),
  welcome: (name: string): L => l(`Welcome, ${name}.`, `مرحباً، ${name}.`),
  welcomeBack: (name: string): L =>
    l(`Welcome back, ${name}.`, `مرحباً بعودتك، ${name}.`),
  validatedBody: l(
    "You can now see the trade prices and place your first order. Your first order unlocks the training videos, the cabin gallery and your benefits.",
    "يمكنك الآن رؤية الأسعار المهنية وتقديم طلبك الأول. يفتح طلبك الأول مقاطع التدريب ومعرض الكابينة ومزاياك.",
  ),
  customerBody: l(
    "Training videos, the cabin gallery and your benefits are open. Order again whenever you need.",
    "مقاطع التدريب ومعرض الكابينة ومزاياك مفتوحة. اطلب مجدداً متى احتجت.",
  ),
  startOrder: l("Start an order", "ابدأ طلباً"),
  reorder: l("Reorder", "إعادة الطلب"),
  continueTraining: l("Continue training", "تابع التدريب"),
  steps: [
    l("Account validated", "تم التحقق من الحساب"),
    l("First order", "الطلب الأول"),
    l("Training and benefits", "التدريب والمزايا"),
  ],
  cards: {
    shop: l(
      "Order retail products at trade prices.",
      "اطلب منتجات التجزئة بأسعار مهنية.",
    ),
    cabin: l("Professional products and treatment kits.", "منتجات مهنية وحقائب علاجات."),
    documents: l(
      "Price list, order form and more.",
      "قائمة الأسعار ونموذج الطلب وغيرها.",
    ),
    videos: l(
      "Sales, techniques, treatments, protocols.",
      "المبيعات والتقنيات والعلاجات والبروتوكولات.",
    ),
    gallery: l("Beautiful cabins, for inspiration.", "كابينات جميلة، للإلهام."),
    benefits: l(
      "Guides, brand book, your IOMA contact.",
      "الأدلة وكتيّب العلامة وجهة اتصالك في IOMA.",
    ),
    firstOrder: l("First order", "الطلب الأول"),
  },
  previewTitle: l("Unlocked by your first order", "يُفتح بطلبك الأول"),
  previewBody: l(
    "A preview of your training videos.",
    "نظرة على مقاطع التدريب الخاصة بك.",
  ),
  continueLearning: l("Continue learning", "تابع التعلّم"),
  yourOrders: l("Your orders", "طلباتك"),
  noOrders: l(
    "No order yet. Your first order will appear here.",
    "لا يوجد طلب بعد. سيظهر طلبك الأول هنا.",
  ),
  cols: {
    order: l("Order", "الطلب"),
    date: l("Date", "التاريخ"),
    amount: l("Amount", "المبلغ"),
    status: l("Status", "الحالة"),
  },
  view: l("View", "عرض"),
};

export const SHOP = {
  title: l("Shop", "المتجر"),
  subtitle: l("Retail products at trade prices.", "منتجات التجزئة بأسعار مهنية."),
  tabs: {
    all: l("All", "الكل"),
    bespoke: l("Bespoke In.Lab", "In.Lab المصمم خصيصاً"),
    ranges: l("Ranges", "التشكيلات"),
    body: l("Body", "الجسم"),
  },
  rrp: l("RRP", "السعر الاسترشادي"),
  trade: l("Trade price", "السعر المهني"),
  priceTbc: l("Trade price to be confirmed", "السعر المهني قيد التأكيد"),
  add: l("Add to order", "أضف إلى الطلب"),
  added: l("Added", "تمت الإضافة"),
  unavailable: l("Unavailable", "غير متوفر"),
  moq: (n: number): L => l(`Minimum ${n}`, `الحد الأدنى ${n}`),
  qty: l("Quantity", "الكمية"),
  summary: l("Order summary", "ملخص الطلب"),
  noItem: l("No item yet.", "لا توجد عناصر بعد."),
  minOrder: l("Minimum order", "الحد الأدنى للطلب"),
  delivery: l("Delivery", "التسليم"),
  tbc: l("To be confirmed", "قيد التأكيد"),
  review: l("Review order", "راجع الطلب"),
  search: l("Search products", "ابحث عن منتج"),
  noProducts: l("No products found.", "لم يتم العثور على منتجات."),
  browse: l("Browse the range", "تصفّح التشكيلة"),
  total: l("Subtotal", "المجموع الفرعي"),
  error: l("Something went wrong. Please try again.", "حدث خطأ. يرجى المحاولة مجدداً."),
};

export const CABIN = {
  title: l("Cabin products & treatments", "منتجات الكابينة والعلاجات"),
  subtitle: l(
    "Professional protocols and the products to perform them.",
    "بروتوكولات مهنية والمنتجات اللازمة لتنفيذها.",
  ),
  protocols: l("Treatment protocols", "بروتوكولات العلاج"),
  products: l("Cabin products", "منتجات الكابينة"),
  face: l("Face", "الوجه"),
  body: l("Body", "الجسم"),
  viewProtocol: l("View protocol", "عرض البروتوكول"),
  orderKit: l("Order the kit", "اطلب الحقيبة"),
  noProducts: l(
    "Cabin products and treatment kits are being added.",
    "تتم إضافة منتجات الكابينة وحقائب العلاجات.",
  ),
  note: l(
    "Treatment names and durations come from the IOMA brand book.",
    "أسماء العلاجات ومدتها مأخوذة من كتيّب علامة IOMA.",
  ),
  // From the brand book: name + duration only (the products used are not invented).
  catalogue: [
    { area: "face", minutes: 30, name: "Mon Soin IOMA Éclat" },
    { area: "face", minutes: 45, name: "Mon Soin IOMA Urbain" },
    { area: "face", minutes: 60, name: "Mon Soin IOMA Expert" },
    { area: "face", minutes: 90, name: "Mon Soin IOMA Excellence" },
    { area: "body", minutes: 45, name: "Soin Cocoon Douceur" },
    { area: "body", minutes: 60, name: "Soin Cocoon Évasion" },
    { area: "body", minutes: 90, name: "Soin Cocoon Absolu" },
  ],
};

export const VIDEOS = {
  title: l("Training videos", "مقاطع التدريب"),
  lockedSubtitle: l(
    "Place your first order to learn how to sell, to treat and to personalise with IOMA.",
    "قدّم طلبك الأول لتتعلم كيف تبيع وتعالج وتخصّص مع IOMA.",
  ),
  subtitle: l(
    "Learn to sell, to treat and to personalise.",
    "تعلّم كيف تبيع وتعالج وتخصّص.",
  ),
  tabs: {
    all: l("All", "الكل"),
    sales: l("Sales", "المبيعات"),
    treatments: l("Treatments & protocols", "العلاجات والبروتوكولات"),
    diagnosis_inlab: l("Diagnosis & In.Lab", "التشخيص وIn.Lab"),
  } as Record<string, L>,
  preview: l("A preview of what you will find", "نظرة على ما ستجده"),
  empty: l("Training videos are being prepared.", "يجري إعداد مقاطع التدريب."),
  videoSoon: l("This video will be available soon.", "سيتوفر هذا المقطع قريباً."),
  play: l("Play", "تشغيل"),
  close: l("Close", "إغلاق"),
};

export const GALLERY = {
  title: l("Cabin gallery", "معرض الكابينة"),
  lockedSubtitle: l(
    "The cabin gallery unlocks with your first order.",
    "يُفتح معرض الكابينة مع طلبك الأول.",
  ),
  subtitle: l(
    "Beautiful IOMA cabins and spaces, to inspire your own.",
    "كابينات ومساحات IOMA الجميلة، لإلهام مساحتك.",
  ),
  tabs: {
    all: l("All", "الكل"),
    cabins: l("Cabins", "الكابينات"),
    corners: l("Corners", "الأركان"),
    spaces: l("Spaces", "المساحات"),
  } as Record<string, L>,
  empty: l("Photos are being added.", "تتم إضافة الصور."),
  credit: l(
    "Photos from the IEVA Group presentation (2024): rights and HD files to be confirmed.",
    "الصور من عرض مجموعة IEVA (2024): الحقوق والملفات عالية الدقة قيد التأكيد.",
  ),
};

export const BENEFITS = {
  title: l("Your benefits", "مزاياك"),
  lockedSubtitle: l(
    "Training, inspiration, documents and a dedicated contact: all open as soon as your first order is placed.",
    "التدريب والإلهام والمستندات وجهة اتصال مخصصة: كلها تُفتح فور تقديم طلبك الأول.",
  ),
  subtitle: l("What your account gives you.", "ما يمنحك إياه حسابك."),
  locked: l("Locked", "مقفل"),
  unlocked: l("Unlocked", "مفتوح"),
  cards: [
    {
      key: "videos",
      href: "/portal/videos",
      title: l("Training videos", "مقاطع التدريب"),
      body: l(
        "Sales, sales techniques, treatments and protocols.",
        "المبيعات وتقنيات البيع والعلاجات والبروتوكولات.",
      ),
    },
    {
      key: "gallery",
      href: "/portal/gallery",
      title: l("Cabin gallery", "معرض الكابينة"),
      body: l(
        "Photos of IOMA cabins and spaces, for inspiration.",
        "صور لكابينات ومساحات IOMA، للإلهام.",
      ),
    },
    {
      key: "guides",
      href: "/portal/documents",
      title: l("Protocol guides and brand book", "أدلة البروتوكولات وكتيّب العلامة"),
      body: l(
        "Everything to perform the IOMA treatments.",
        "كل ما يلزم لتنفيذ علاجات IOMA.",
      ),
    },
    {
      key: "contact",
      href: null,
      title: l("Your IOMA contact", "جهة اتصالك في IOMA"),
      body: l(
        "A dedicated person for your orders and training.",
        "شخص مخصص لطلباتك وتدريبك.",
      ),
    },
  ],
  contactTitle: l("Your IOMA contact", "جهة اتصالك في IOMA"),
  contactTbc: l(
    "Your contact will be introduced by the IOMA Pro team.",
    "سيعرّفك فريق IOMA Pro بجهة اتصالك.",
  ),
  open: l("Open", "فتح"),
};

export const DOCUMENTS = {
  title: l("Documents", "المستندات"),
  subtitle: l(
    "The documents you need to order are open. The rest unlocks with your first order.",
    "المستندات اللازمة للطلب مفتوحة. والباقي يُفتح مع طلبك الأول.",
  ),
  subtitleCustomer: l("All your documents are open.", "جميع مستنداتك مفتوحة."),
  download: l("Download", "تنزيل"),
  locked: l("Locked", "مقفل"),
  unlocksWithOrder: l("Unlocks with your first order", "يُفتح مع طلبك الأول"),
  fileSoon: l("File to be supplied", "الملف قيد التزويد"),
  kinds: {
    price_list: l("Trade price list", "قائمة الأسعار المهنية"),
    order_form: l("Order form", "نموذج الطلب"),
    terms_of_sale: l("Terms of sale", "شروط البيع"),
    catalogue: l("Product catalogue", "كتالوج المنتجات"),
    protocol_guides: l("Treatment protocol guides", "أدلة بروتوكولات العلاج"),
    brand_book: l("Brand book", "كتيّب العلامة"),
  } as Record<string, L>,
  empty: l("Documents are being prepared.", "يجري إعداد المستندات."),
  error: l(
    "The file could not be opened. Please try again.",
    "تعذّر فتح الملف. يرجى المحاولة مجدداً.",
  ),
};

/** Order fulfilment status labels shown in the pro space. */
export const ORDER_STATUS: Record<string, L> = {
  pending: l("Pending", "قيد الانتظار"),
  processing: l("Processing", "قيد التجهيز"),
  shipped: l("Shipped", "تم الشحن"),
  delivered: l("Delivered", "تم التسليم"),
  cancelled: l("Cancelled", "ملغى"),
};
export const orderStatusLabel = (status: string): L =>
  ORDER_STATUS[status] ?? l(status, status);
