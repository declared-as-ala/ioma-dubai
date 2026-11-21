// Copy for the B2B landing page and the pro space ("espace pro"), from the client brief
// "IOMA Dubai — B2B Professionals v2" (three access levels). Items the brief leaves to IEVA
// (trade prices, minimum first order, delivery terms, files) are NOT invented here: the UI
// shows a "to be confirmed" state until the back office supplies them.

export type L = { en: string; fr: string; ar: string };
const l = (en: string, ar: string, fr: string = en): L => ({ en, fr, ar });

export const LANDING = {
  kicker: l("IOMA Pro", "IOMA Pro", "IOMA Pro"),
  title: l(
    "Trade access for beauty professionals.",
    "وصول مهني لمحترفي الجمال.",
    "Un accès professionnel pour les experts de la beauté.",
  ),
  body: l(
    "Register in one minute. We will call you to validate your account. Once approved, you can see the trade prices and order online.",
    "سجّل في دقيقة واحدة. سنتصل بك للتحقق من حسابك. بعد الموافقة يمكنك رؤية الأسعار المهنية والطلب عبر الإنترنت.",
    "Inscrivez-vous en une minute. Nous vous appelons pour valider votre compte. Une fois celui-ci approuvé, vous accédez aux tarifs professionnels et commandez en ligne.",
  ),
  bullets: [
    l(
      "See the trade prices",
      "اطّلع على الأسعار المهنية",
      "Consultez les tarifs professionnels",
    ),
    l(
      "Order retail and cabin products online",
      "اطلب منتجات التجزئة والكابينة عبر الإنترنت",
      "Commandez produits de vente et produits cabine en ligne",
    ),
    l(
      "Access training videos and cabin inspiration",
      "احصل على مقاطع التدريب وإلهام الكابينة",
      "Accédez aux vidéos de formation et à l'inspiration cabine",
    ),
  ],
  form: {
    title: l(
      "Request trade access",
      "اطلب الوصول المهني",
      "Demander l'accès professionnel",
    ),
    subtitle: l(
      "Five fields, then we call you.",
      "خمسة حقول، ثم نتصل بك.",
      "Cinq champs, puis nous vous appelons.",
    ),
    firstName: l("First name", "الاسم الأول", "Prénom"),
    lastName: l("Last name", "اسم العائلة", "Nom"),
    company: l("Company name", "اسم الشركة", "Nom de l'entreprise"),
    phone: l("Phone number", "رقم الهاتف", "Numéro de téléphone"),
    email: l("Email", "البريد الإلكتروني", "E-mail"),
    submit: l(
      "Request trade access",
      "اطلب الوصول المهني",
      "Demander l'accès professionnel",
    ),
    sending: l("Sending…", "جارٍ الإرسال…", "Envoi en cours…"),
    consent: l(
      "By submitting this form, you agree to be contacted by IOMA to complete your file. Trade prices are shown once your account is validated.",
      "بإرسال هذا النموذج، فإنك توافق على أن تتصل بك IOMA لاستكمال ملفك. تظهر الأسعار المهنية بعد التحقق من حسابك.",
      "En envoyant ce formulaire, vous acceptez d'être contacté(e) par IOMA pour compléter votre dossier. Les tarifs professionnels s'affichent une fois votre compte validé.",
    ),
    successTitle: l(
      "Thank you. We will call you.",
      "شكراً. سنتصل بك.",
      "Merci. Nous vous appelons.",
    ),
    successBody: l(
      "Our team received your request. We will call you to ask for your Trade License and Tax Registration Number (TRN) and to validate your account. A confirmation was sent to your email.",
      "استلم فريقنا طلبك. سنتصل بك لطلب الرخصة التجارية ورقم التسجيل الضريبي (TRN) وللتحقق من حسابك. أُرسل تأكيد إلى بريدك الإلكتروني.",
      "Notre équipe a bien reçu votre demande. Nous vous appelons pour vous demander votre licence commerciale et votre numéro d'immatriculation fiscale (TRN) et pour valider votre compte. Une confirmation a été envoyée à votre adresse e-mail.",
    ),
    error: l(
      "We could not send your request. Please check the fields and try again.",
      "تعذّر إرسال طلبك. يرجى التحقق من الحقول والمحاولة مجدداً.",
      "Nous n'avons pas pu envoyer votre demande. Veuillez vérifier les champs et réessayer.",
    ),
    rateLimited: l(
      "Too many attempts. Please wait a minute and try again.",
      "محاولات كثيرة. يرجى الانتظار دقيقة والمحاولة مجدداً.",
      "Trop de tentatives. Veuillez patienter une minute et réessayer.",
    ),
    signIn: l("Already validated?", "تمت الموافقة على حسابك؟", "Compte déjà validé ?"),
    signInLink: l("Sign in", "تسجيل الدخول", "Se connecter"),
    invalidPhone: l(
      "Enter a valid phone number.",
      "أدخل رقم هاتف صالحاً.",
      "Saisissez un numéro de téléphone valide.",
    ),
    invalidEmail: l(
      "Enter a valid email address.",
      "أدخل بريداً إلكترونياً صالحاً.",
      "Saisissez une adresse e-mail valide.",
    ),
    required: l(
      "This field is required.",
      "هذا الحقل مطلوب.",
      "Ce champ est obligatoire.",
    ),
  },
  how: {
    kicker: l("How it works", "كيف يعمل", "Comment ça marche"),
    title: l(
      "From registration to your first order.",
      "من التسجيل إلى طلبك الأول.",
      "De l'inscription à votre première commande.",
    ),
    steps: [
      {
        title: l("You register", "تسجّل", "Vous vous inscrivez"),
        body: l(
          "Fill in the short form: name, company, phone and email.",
          "املأ النموذج القصير: الاسم والشركة والهاتف والبريد.",
          "Remplissez le court formulaire : nom, entreprise, téléphone et e-mail.",
        ),
      },
      {
        title: l("We call you", "نتصل بك", "Nous vous appelons"),
        body: l(
          "We ask for your Trade License and your Tax Registration Number (TRN), and answer your questions.",
          "نطلب رخصتك التجارية ورقم تسجيلك الضريبي (TRN) ونجيب عن أسئلتك.",
          "Nous vous demandons votre licence commerciale et votre numéro d'immatriculation fiscale (TRN), et répondons à vos questions.",
        ),
      },
      {
        title: l(
          "Your account is validated",
          "يتم التحقق من حسابك",
          "Votre compte est validé",
        ),
        body: l(
          "Our team approves your account. You see the trade prices and can order.",
          "يوافق فريقنا على حسابك. ترى الأسعار المهنية ويمكنك الطلب.",
          "Notre équipe approuve votre compte. Vous accédez aux tarifs professionnels et pouvez commander.",
        ),
      },
      {
        title: l(
          "Your first order unlocks the rest",
          "طلبك الأول يفتح الباقي",
          "Votre première commande débloque le reste",
        ),
        body: l(
          "Training videos, the cabin gallery and your benefits open once your first order is placed.",
          "تُفتح مقاطع التدريب ومعرض الكابينة ومزاياك بعد تقديم طلبك الأول.",
          "Les vidéos de formation, la galerie cabine et vos avantages s'ouvrent dès que votre première commande est passée.",
        ),
      },
    ],
    note: l(
      "Documents and delay of validation are confirmed by our team when it calls you.",
      "يؤكد فريقنا المستندات ومدة التحقق عند الاتصال بك.",
      "Les documents et le délai de validation sont confirmés par notre équipe lors de son appel.",
    ),
  },
  inside: {
    kicker: l("Inside your pro space", "داخل مساحتك المهنية", "Dans votre espace pro"),
    title: l(
      "Two steps to open everything.",
      "خطوتان لفتح كل شيء.",
      "Deux étapes pour tout ouvrir.",
    ),
    note: l(
      "Trade prices and ordering open when your account is validated. Training, the gallery and your benefits unlock with your first order.",
      "تُفتح الأسعار المهنية والطلب عند التحقق من حسابك. ويُفتح التدريب والمعرض ومزاياك مع طلبك الأول.",
      "Les tarifs professionnels et la commande s'ouvrent lorsque votre compte est validé. La formation, la galerie et vos avantages se débloquent avec votre première commande.",
    ),
    afterValidation: l("After validation", "بعد التحقق", "Après la validation"),
    afterFirstOrder: l(
      "After your first order",
      "بعد طلبك الأول",
      "Après votre première commande",
    ),
    cards: [
      {
        key: "shop",
        unlock: "validation",
        title: l(
          "Shop retail products",
          "تسوّق منتجات التجزئة",
          "Boutique produits de vente",
        ),
        body: l(
          "Order the IOMA range for sale at trade prices.",
          "اطلب تشكيلة IOMA للبيع بأسعار مهنية.",
          "Commandez la gamme IOMA destinée à la vente aux tarifs professionnels.",
        ),
      },
      {
        key: "cabin",
        unlock: "validation",
        title: l("Cabin products", "منتجات الكابينة", "Produits cabine"),
        body: l(
          "Professional products and treatment kits for your cabin.",
          "منتجات مهنية وحقائب علاجات لكابينتك.",
          "Produits professionnels et kits de soins pour votre cabine.",
        ),
      },
      {
        key: "documents",
        unlock: "validation",
        title: l(
          "Price list and order form",
          "قائمة الأسعار ونموذج الطلب",
          "Liste de prix et bon de commande",
        ),
        body: l(
          "Everything you need to place an order.",
          "كل ما تحتاجه لتقديم طلب.",
          "Tout ce qu'il faut pour passer commande.",
        ),
      },
      {
        key: "videos",
        unlock: "order",
        title: l("Training videos", "مقاطع التدريب", "Vidéos de formation"),
        body: l(
          "Sales, sales techniques, treatments and protocols.",
          "المبيعات وتقنيات البيع والعلاجات والبروتوكولات.",
          "Vente, techniques de vente, soins et protocoles.",
        ),
      },
      {
        key: "gallery",
        unlock: "order",
        title: l("Cabin gallery", "معرض الكابينة", "Galerie cabine"),
        body: l(
          "Photos of beautiful IOMA cabins and spaces, for inspiration.",
          "صور لكابينات ومساحات IOMA الجميلة، للإلهام.",
          "Photos de belles cabines et espaces IOMA, pour vous inspirer.",
        ),
      },
      {
        key: "benefits",
        unlock: "order",
        title: l("Your benefits", "مزاياك", "Vos avantages"),
        body: l(
          "Protocol guides, brand book, your IOMA contact and more.",
          "أدلة البروتوكولات وكتيّب العلامة وجهة اتصالك في IOMA وغير ذلك.",
          "Guides de protocoles, book de marque, votre contact IOMA et bien plus.",
        ),
      },
    ],
  },
  faq: {
    kicker: l("Questions", "أسئلة", "Questions"),
    title: l("Before you register.", "قبل التسجيل.", "Avant de vous inscrire."),
    items: [
      {
        q: l("Who can register?", "من يمكنه التسجيل؟", "Qui peut s'inscrire ?"),
        a: l(
          "Beauty professionals such as boutiques, institutes and clinics. Our team confirms eligibility when it calls you.",
          "محترفو الجمال مثل البوتيكات والمعاهد والعيادات. يؤكد فريقنا الأهلية عند الاتصال بك.",
          "Les professionnels de la beauté : boutiques, instituts et cliniques. Notre équipe confirme l'éligibilité lors de son appel.",
        ),
      },
      {
        q: l(
          "Do I see the prices before my account is validated?",
          "هل أرى الأسعار قبل التحقق من حسابي؟",
          "Vois-je les prix avant la validation de mon compte ?",
        ),
        a: l(
          "No. Trade prices appear once your account is validated by the IOMA team.",
          "لا. تظهر الأسعار المهنية بعد أن يتحقق فريق IOMA من حسابك.",
          "Non. Les tarifs professionnels apparaissent une fois votre compte validé par l'équipe IOMA.",
        ),
      },
      {
        q: l("When can I order?", "متى يمكنني الطلب؟", "Quand puis-je commander ?"),
        a: l(
          "As soon as your account is validated, you can see the trade prices and place your first order online.",
          "فور التحقق من حسابك يمكنك رؤية الأسعار المهنية وتقديم طلبك الأول عبر الإنترنت.",
          "Dès que votre compte est validé, vous voyez les tarifs professionnels et pouvez passer votre première commande en ligne.",
        ),
      },
      {
        q: l(
          "Do I need to order to see the training videos?",
          "هل يجب أن أطلب لأرى مقاطع التدريب؟",
          "Dois-je commander pour voir les vidéos de formation ?",
        ),
        a: l(
          "Yes. Validation opens prices and ordering; your first order unlocks the training videos, the cabin gallery and your benefits. The documents needed to order are open from validation.",
          "نعم. يفتح التحقق الأسعار والطلب؛ ويفتح طلبك الأول مقاطع التدريب ومعرض الكابينة ومزاياك. المستندات اللازمة للطلب مفتوحة منذ التحقق.",
          "Oui. La validation ouvre les prix et la commande ; votre première commande débloque les vidéos de formation, la galerie cabine et vos avantages. Les documents nécessaires pour commander sont accessibles dès la validation.",
        ),
      },
      {
        q: l(
          "Which documents will you ask for?",
          "ما المستندات التي ستطلبونها؟",
          "Quels documents demandez-vous ?",
        ),
        a: l(
          "Your Trade License and, if your business is VAT-registered, your Tax Registration Number (TRN). Some activities, such as clinics, may need extra health licences. We confirm the exact list when we call.",
          "رخصتك التجارية، ورقم التسجيل الضريبي (TRN) إن كانت منشأتك مسجلة في ضريبة القيمة المضافة. قد تحتاج بعض الأنشطة، مثل العيادات، إلى تراخيص صحية إضافية. نؤكد القائمة الدقيقة عند الاتصال.",
          "Votre licence commerciale et, si votre activité est assujettie à la TVA, votre numéro d'immatriculation fiscale (TRN). Certaines activités, comme les cliniques, peuvent exiger des autorisations sanitaires supplémentaires. Nous confirmons la liste exacte lors de notre appel.",
        ),
      },
      {
        q: l(
          "Can I order cabin products and retail products?",
          "هل يمكنني طلب منتجات الكابينة ومنتجات التجزئة؟",
          "Puis-je commander des produits cabine et des produits de vente ?",
        ),
        a: l(
          "Yes. Once validated, you can order both at trade prices from your pro space.",
          "نعم. بعد التحقق يمكنك طلب كليهما بأسعار مهنية من مساحتك المهنية.",
          "Oui. Une fois validé, vous pouvez commander les deux aux tarifs professionnels depuis votre espace pro.",
        ),
      },
    ],
  },
};

export const SHELL = {
  badge: "PRO",
  nav: {
    overview: l("Overview", "نظرة عامة", "Vue d'ensemble"),
    shop: l("Shop", "المتجر", "Boutique"),
    cabin: l("Cabin products", "منتجات الكابينة", "Produits cabine"),
    videos: l("Training videos", "مقاطع التدريب", "Vidéos de formation"),
    gallery: l("Cabin gallery", "معرض الكابينة", "Galerie cabine"),
    benefits: l("Your benefits", "مزاياك", "Vos avantages"),
    documents: l("Documents", "المستندات", "Documents"),
  },
  locked: l(
    "Locked until your first order",
    "مقفل حتى طلبك الأول",
    "Verrouillé jusqu'à votre première commande",
  ),
  chipValidated: l(
    "Approved partner · first order pending",
    "شريك معتمد · الطلب الأول قيد الانتظار",
    "Partenaire validé · première commande à venir",
  ),
  chipCustomer: l("Approved partner", "شريك معتمد", "Partenaire validé"),
  order: l("Order", "الطلب", "Commande"),
  signOut: l("Sign out", "تسجيل الخروج", "Se déconnecter"),
  help: l("Need help?", "تحتاج مساعدة؟", "Besoin d'aide ?"),
  helpTeam: l("IOMA Pro team", "فريق IOMA Pro", "Équipe IOMA Pro"),
  yourContact: l("Your IOMA contact", "جهة اتصالك في IOMA", "Votre contact IOMA"),
  contactSoon: l(
    "Your IOMA team will contact you.",
    "سيتواصل معك فريق IOMA.",
    "Votre équipe IOMA vous contactera.",
  ),
  menu: l("Pro menu", "قائمة المساحة المهنية", "Menu pro"),
  loading: l(
    "Loading your pro space…",
    "جارٍ تحميل مساحتك المهنية…",
    "Chargement de votre espace pro…",
  ),
  review: {
    title: l(
      "Your request is being reviewed",
      "طلبك قيد المراجعة",
      "Votre demande est en cours d'examen",
    ),
    body: l(
      "Our team will call you to validate your account. Once approved, you will see the trade prices and can order.",
      "سيتصل بك فريقنا للتحقق من حسابك. بعد الموافقة سترى الأسعار المهنية ويمكنك الطلب.",
      "Notre équipe vous appellera pour valider votre compte. Une fois celui-ci approuvé, vous verrez les tarifs professionnels et pourrez commander.",
    ),
    cta: l("Back to the B2B page", "العودة إلى صفحة الأعمال", "Retour à la page B2B"),
  },
};

export const LOCK = {
  firstOrderCta: l(
    "Start your first order",
    "ابدأ طلبك الأول",
    "Commencer votre première commande",
  ),
  unlockedByFirst: l(
    "Unlocked by your first order",
    "يُفتح بطلبك الأول",
    "Débloqué par votre première commande",
  ),
  rule: (aed: number, unlockOn: "confirmed" | "paid"): L =>
    l(
      `Minimum first order: AED ${aed.toLocaleString("en")}. Unlocks once the order is ${unlockOn === "paid" ? "paid" : "confirmed"}.`,
      `الحد الأدنى للطلب الأول: ${aed.toLocaleString("en")} درهم. يُفتح عند ${unlockOn === "paid" ? "دفع" : "تأكيد"} الطلب.`,
      `Première commande minimum : ${aed.toLocaleString("fr-FR")} AED. Se débloque dès que la commande est ${unlockOn === "paid" ? "payée" : "confirmée"}.`,
    ),
  ruleNoMin: (unlockOn: "confirmed" | "paid"): L =>
    l(
      `Unlocks once your first order is ${unlockOn === "paid" ? "paid" : "confirmed"}.`,
      `يُفتح عند ${unlockOn === "paid" ? "دفع" : "تأكيد"} طلبك الأول.`,
      `Se débloque dès que votre première commande est ${unlockOn === "paid" ? "payée" : "confirmée"}.`,
    ),
  comingSoon: l("Coming soon", "قريباً", "Bientôt disponible"),
  duration: (m: number): L => l(`${m} min`, `${m} دقيقة`, `${m} min`),
};

export const OVERVIEW = {
  validatedKicker: l("Account validated", "تم التحقق من الحساب", "Compte validé"),
  customerKicker: l("Approved partner", "شريك معتمد", "Partenaire validé"),
  welcome: (name: string): L =>
    l(`Welcome, ${name}.`, `مرحباً، ${name}.`, `Bienvenue, ${name}.`),
  welcomeBack: (name: string): L =>
    l(`Welcome back, ${name}.`, `مرحباً بعودتك، ${name}.`, `Bon retour, ${name}.`),
  validatedBody: l(
    "You can now see the trade prices and place your first order. Your first order unlocks the training videos, the cabin gallery and your benefits.",
    "يمكنك الآن رؤية الأسعار المهنية وتقديم طلبك الأول. يفتح طلبك الأول مقاطع التدريب ومعرض الكابينة ومزاياك.",
    "Vous pouvez désormais consulter les tarifs professionnels et passer votre première commande. Celle-ci débloque les vidéos de formation, la galerie cabine et vos avantages.",
  ),
  customerBody: l(
    "Training videos, the cabin gallery and your benefits are open. Order again whenever you need.",
    "مقاطع التدريب ومعرض الكابينة ومزاياك مفتوحة. اطلب مجدداً متى احتجت.",
    "Les vidéos de formation, la galerie cabine et vos avantages sont ouverts. Recommandez dès que vous en avez besoin.",
  ),
  startOrder: l("Start an order", "ابدأ طلباً", "Commencer une commande"),
  reorder: l("Reorder", "إعادة الطلب", "Recommander"),
  continueTraining: l("Continue training", "تابع التدريب", "Poursuivre la formation"),
  steps: [
    l("Account validated", "تم التحقق من الحساب", "Compte validé"),
    l("First order", "الطلب الأول", "Première commande"),
    l("Training and benefits", "التدريب والمزايا", "Formation et avantages"),
  ],
  cards: {
    shop: l(
      "Order retail products at trade prices.",
      "اطلب منتجات التجزئة بأسعار مهنية.",
      "Commandez des produits de vente aux tarifs professionnels.",
    ),
    cabin: l(
      "Professional products and treatment kits.",
      "منتجات مهنية وحقائب علاجات.",
      "Produits professionnels et kits de soins.",
    ),
    documents: l(
      "Price list, order form and more.",
      "قائمة الأسعار ونموذج الطلب وغيرها.",
      "Liste de prix, bon de commande et plus encore.",
    ),
    videos: l(
      "Sales, techniques, treatments, protocols.",
      "المبيعات والتقنيات والعلاجات والبروتوكولات.",
      "Vente, techniques, soins, protocoles.",
    ),
    gallery: l(
      "Beautiful cabins, for inspiration.",
      "كابينات جميلة، للإلهام.",
      "De belles cabines, pour vous inspirer.",
    ),
    benefits: l(
      "Guides, brand book, your IOMA contact.",
      "الأدلة وكتيّب العلامة وجهة اتصالك في IOMA.",
      "Guides, book de marque, votre contact IOMA.",
    ),
    firstOrder: l("First order", "الطلب الأول", "Première commande"),
  },
  previewTitle: l(
    "Unlocked by your first order",
    "يُفتح بطلبك الأول",
    "Débloqué par votre première commande",
  ),
  previewBody: l(
    "A preview of your training videos.",
    "نظرة على مقاطع التدريب الخاصة بك.",
    "Un aperçu de vos vidéos de formation.",
  ),
  continueLearning: l("Continue learning", "تابع التعلّم", "Poursuivre l'apprentissage"),
  yourOrders: l("Your orders", "طلباتك", "Vos commandes"),
  noOrders: l(
    "No order yet. Your first order will appear here.",
    "لا يوجد طلب بعد. سيظهر طلبك الأول هنا.",
    "Aucune commande pour le moment. Votre première commande apparaîtra ici.",
  ),
  cols: {
    order: l("Order", "الطلب", "Commande"),
    date: l("Date", "التاريخ", "Date"),
    amount: l("Amount", "المبلغ", "Montant"),
    status: l("Status", "الحالة", "Statut"),
  },
  view: l("View", "عرض", "Voir"),
};

export const SHOP = {
  title: l("Shop", "المتجر", "Boutique"),
  subtitle: l(
    "Retail products at trade prices.",
    "منتجات التجزئة بأسعار مهنية.",
    "Produits de vente aux tarifs professionnels.",
  ),
  tabs: {
    all: l("All", "الكل", "Tout"),
    bespoke: l("Bespoke In.Lab", "In.Lab المصمم خصيصاً", "In.Lab sur mesure"),
    ranges: l("Ranges", "التشكيلات", "Gammes"),
    body: l("Body", "الجسم", "Corps"),
  },
  rrp: l("RRP", "السعر الاسترشادي", "Prix public conseillé"),
  trade: l("Trade price", "السعر المهني", "Prix professionnel"),
  priceTbc: l(
    "Trade price to be confirmed",
    "السعر المهني قيد التأكيد",
    "Prix professionnel à confirmer",
  ),
  add: l("Add to order", "أضف إلى الطلب", "Ajouter à la commande"),
  added: l("Added", "تمت الإضافة", "Ajouté"),
  unavailable: l("Unavailable", "غير متوفر", "Indisponible"),
  moq: (n: number): L => l(`Minimum ${n}`, `الحد الأدنى ${n}`, `Minimum ${n}`),
  qty: l("Quantity", "الكمية", "Quantité"),
  summary: l("Order summary", "ملخص الطلب", "Récapitulatif de la commande"),
  noItem: l("No item yet.", "لا توجد عناصر بعد.", "Aucun article pour le moment."),
  minOrder: l("Minimum order", "الحد الأدنى للطلب", "Commande minimum"),
  delivery: l("Delivery", "التسليم", "Livraison"),
  tbc: l("To be confirmed", "قيد التأكيد", "À confirmer"),
  review: l("Review order", "راجع الطلب", "Vérifier la commande"),
  search: l("Search products", "ابحث عن منتج", "Rechercher un produit"),
  noProducts: l(
    "No products found.",
    "لم يتم العثور على منتجات.",
    "Aucun produit trouvé.",
  ),
  browse: l("Browse the range", "تصفّح التشكيلة", "Parcourir la gamme"),
  total: l("Subtotal", "المجموع الفرعي", "Sous-total"),
  error: l(
    "Something went wrong. Please try again.",
    "حدث خطأ. يرجى المحاولة مجدداً.",
    "Une erreur est survenue. Veuillez réessayer.",
  ),
};

export const CABIN = {
  title: l(
    "Cabin products & treatments",
    "منتجات الكابينة والعلاجات",
    "Produits cabine et soins",
  ),
  subtitle: l(
    "Professional protocols and the products to perform them.",
    "بروتوكولات مهنية والمنتجات اللازمة لتنفيذها.",
    "Protocoles professionnels et produits pour les réaliser.",
  ),
  protocols: l("Treatment protocols", "بروتوكولات العلاج", "Protocoles de soins"),
  products: l("Cabin products", "منتجات الكابينة", "Produits cabine"),
  face: l("Face", "الوجه", "Visage"),
  body: l("Body", "الجسم", "Corps"),
  viewProtocol: l("View protocol", "عرض البروتوكول", "Voir le protocole"),
  orderKit: l("Order the kit", "اطلب الحقيبة", "Commander le kit"),
  noProducts: l(
    "Cabin products and treatment kits are being added.",
    "تتم إضافة منتجات الكابينة وحقائب العلاجات.",
    "Les produits cabine et les kits de soins sont en cours d'ajout.",
  ),
  note: l(
    "Treatment names and durations come from the IOMA brand book.",
    "أسماء العلاجات ومدتها مأخوذة من كتيّب علامة IOMA.",
    "Les noms et durées des soins proviennent du book de marque IOMA.",
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
  title: l("Training videos", "مقاطع التدريب", "Vidéos de formation"),
  lockedSubtitle: l(
    "Place your first order to learn how to sell, to treat and to personalise with IOMA.",
    "قدّم طلبك الأول لتتعلم كيف تبيع وتعالج وتخصّص مع IOMA.",
    "Passez votre première commande pour apprendre à vendre, à soigner et à personnaliser avec IOMA.",
  ),
  subtitle: l(
    "Learn to sell, to treat and to personalise.",
    "تعلّم كيف تبيع وتعالج وتخصّص.",
    "Apprenez à vendre, à soigner et à personnaliser.",
  ),
  tabs: {
    all: l("All", "الكل", "Tout"),
    sales: l("Sales", "المبيعات", "Vente"),
    treatments: l(
      "Treatments & protocols",
      "العلاجات والبروتوكولات",
      "Soins et protocoles",
    ),
    diagnosis_inlab: l("Diagnosis & In.Lab", "التشخيص وIn.Lab", "Diagnostic et In.Lab"),
  } as Record<string, L>,
  preview: l(
    "A preview of what you will find",
    "نظرة على ما ستجده",
    "Un aperçu de ce que vous trouverez",
  ),
  empty: l(
    "Training videos are being prepared.",
    "يجري إعداد مقاطع التدريب.",
    "Les vidéos de formation sont en préparation.",
  ),
  videoSoon: l(
    "This video will be available soon.",
    "سيتوفر هذا المقطع قريباً.",
    "Cette vidéo sera bientôt disponible.",
  ),
  play: l("Play", "تشغيل", "Lire"),
  close: l("Close", "إغلاق", "Fermer"),
};

export const GALLERY = {
  title: l("Cabin gallery", "معرض الكابينة", "Galerie cabine"),
  lockedSubtitle: l(
    "The cabin gallery unlocks with your first order.",
    "يُفتح معرض الكابينة مع طلبك الأول.",
    "La galerie cabine se débloque avec votre première commande.",
  ),
  subtitle: l(
    "Beautiful IOMA cabins and spaces, to inspire your own.",
    "كابينات ومساحات IOMA الجميلة، لإلهام مساحتك.",
    "De belles cabines et espaces IOMA, pour inspirer les vôtres.",
  ),
  tabs: {
    all: l("All", "الكل", "Tout"),
    cabins: l("Cabins", "الكابينات", "Cabines"),
    corners: l("Corners", "الأركان", "Espaces dédiés"),
    spaces: l("Spaces", "المساحات", "Espaces"),
  } as Record<string, L>,
  empty: l(
    "Photos are being added.",
    "تتم إضافة الصور.",
    "Les photos sont en cours d'ajout.",
  ),
  credit: l(
    "Photos from the IEVA Group presentation (2024): rights and HD files to be confirmed.",
    "الصور من عرض مجموعة IEVA (2024): الحقوق والملفات عالية الدقة قيد التأكيد.",
    "Photos issues de la présentation du Groupe IEVA (2024) : droits et fichiers HD à confirmer.",
  ),
};

export const BENEFITS = {
  title: l("Your benefits", "مزاياك", "Vos avantages"),
  lockedSubtitle: l(
    "Training, inspiration, documents and a dedicated contact: all open as soon as your first order is placed.",
    "التدريب والإلهام والمستندات وجهة اتصال مخصصة: كلها تُفتح فور تقديم طلبك الأول.",
    "Formation, inspiration, documents et contact dédié : tout s'ouvre dès que votre première commande est passée.",
  ),
  subtitle: l(
    "What your account gives you.",
    "ما يمنحك إياه حسابك.",
    "Ce que vous apporte votre compte.",
  ),
  locked: l("Locked", "مقفل", "Verrouillé"),
  unlocked: l("Unlocked", "مفتوح", "Déverrouillé"),
  cards: [
    {
      key: "videos",
      href: "/portal/videos",
      title: l("Training videos", "مقاطع التدريب", "Vidéos de formation"),
      body: l(
        "Sales, sales techniques, treatments and protocols.",
        "المبيعات وتقنيات البيع والعلاجات والبروتوكولات.",
        "Vente, techniques de vente, soins et protocoles.",
      ),
    },
    {
      key: "gallery",
      href: "/portal/gallery",
      title: l("Cabin gallery", "معرض الكابينة", "Galerie cabine"),
      body: l(
        "Photos of IOMA cabins and spaces, for inspiration.",
        "صور لكابينات ومساحات IOMA، للإلهام.",
        "Photos de cabines et d'espaces IOMA, pour vous inspirer.",
      ),
    },
    {
      key: "guides",
      href: "/portal/documents",
      title: l(
        "Protocol guides and brand book",
        "أدلة البروتوكولات وكتيّب العلامة",
        "Guides de protocoles et book de marque",
      ),
      body: l(
        "Everything to perform the IOMA treatments.",
        "كل ما يلزم لتنفيذ علاجات IOMA.",
        "Tout pour réaliser les soins IOMA.",
      ),
    },
    {
      key: "contact",
      href: null,
      title: l("Your IOMA contact", "جهة اتصالك في IOMA", "Votre contact IOMA"),
      body: l(
        "A dedicated person for your orders and training.",
        "شخص مخصص لطلباتك وتدريبك.",
        "Une personne dédiée à vos commandes et à votre formation.",
      ),
    },
  ],
  contactTitle: l("Your IOMA contact", "جهة اتصالك في IOMA", "Votre contact IOMA"),
  contactTbc: l(
    "Your contact will be introduced by the IOMA Pro team.",
    "سيعرّفك فريق IOMA Pro بجهة اتصالك.",
    "Votre contact vous sera présenté par l'équipe IOMA Pro.",
  ),
  open: l("Open", "فتح", "Ouvrir"),
};

export const DOCUMENTS = {
  title: l("Documents", "المستندات", "Documents"),
  subtitle: l(
    "The documents you need to order are open. The rest unlocks with your first order.",
    "المستندات اللازمة للطلب مفتوحة. والباقي يُفتح مع طلبك الأول.",
    "Les documents nécessaires pour commander sont ouverts. Le reste se débloque avec votre première commande.",
  ),
  subtitleCustomer: l(
    "All your documents are open.",
    "جميع مستنداتك مفتوحة.",
    "Tous vos documents sont ouverts.",
  ),
  download: l("Download", "تنزيل", "Télécharger"),
  locked: l("Locked", "مقفل", "Verrouillé"),
  unlocksWithOrder: l(
    "Unlocks with your first order",
    "يُفتح مع طلبك الأول",
    "Se débloque avec votre première commande",
  ),
  fileSoon: l("File to be supplied", "الملف قيد التزويد", "Fichier à fournir"),
  kinds: {
    price_list: l(
      "Trade price list",
      "قائمة الأسعار المهنية",
      "Liste de prix professionnels",
    ),
    order_form: l("Order form", "نموذج الطلب", "Bon de commande"),
    terms_of_sale: l("Terms of sale", "شروط البيع", "Conditions de vente"),
    catalogue: l("Product catalogue", "كتالوج المنتجات", "Catalogue produits"),
    protocol_guides: l(
      "Treatment protocol guides",
      "أدلة بروتوكولات العلاج",
      "Guides des protocoles de soins",
    ),
    brand_book: l("Brand book", "كتيّب العلامة", "Book de marque"),
  } as Record<string, L>,
  empty: l(
    "Documents are being prepared.",
    "يجري إعداد المستندات.",
    "Les documents sont en préparation.",
  ),
  error: l(
    "The file could not be opened. Please try again.",
    "تعذّر فتح الملف. يرجى المحاولة مجدداً.",
    "Le fichier n'a pas pu être ouvert. Veuillez réessayer.",
  ),
};

/** Order fulfilment status labels shown in the pro space. */
export const ORDER_STATUS: Record<string, L> = {
  pending: l("Pending", "قيد الانتظار", "En attente"),
  processing: l("Processing", "قيد التجهيز", "En préparation"),
  shipped: l("Shipped", "تم الشحن", "Expédiée"),
  delivered: l("Delivered", "تم التسليم", "Livrée"),
  cancelled: l("Cancelled", "ملغى", "Annulée"),
};
export const orderStatusLabel = (status: string): L =>
  ORDER_STATUS[status] ?? l(status, status);
