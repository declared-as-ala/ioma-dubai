/**
 * Service and legal pages: copy for IOMA Paris Dubai (EN + AR; French is no longer a served locale).
 * Sources: the official IOMA Paris pages for the loyalty programme, contact, delivery/returns, secure payment,
 * the IEVA Group site, and the structure of the four legal pages. The official terms are FRENCH commercial terms:
 * their figures (fees, delays, discount caps, legal entity, jurisdiction) are deliberately NOT carried over to
 * the UAE site. Wherever UAE information is not confirmed, the copy says so and nothing is invented.
 * Arabic text was written for this build and needs marketing/legal review before it is relied on.
 */
export type Loc = "en" | "ar";
export type L = Record<Loc, string>;
const l = (en: string, ar: string): L => ({ en, ar });

export const COMMON = {
  pending: l("Pending approval", "بانتظار الاعتماد"),
  info: l("Information", "معلومات"),
  toConfirm: l("To be confirmed for the UAE", "يُحدَّد لدولة الإمارات"),
  contactUs: l("Contact us", "تواصلوا معنا"),
  faq: l("Questions", "أسئلة"),
  reference: l("France reference", "مرجع فرنسا"),
};

// ───────────────────────────── Loyalty ─────────────────────────────
export const LOYALTY = {
  seo: {
    title: l(
      "IOMA & Moi loyalty programme | IOMA Paris Dubai",
      "برنامج الولاء IOMA & Moi | آيوما باريس دبي",
    ),
    description: l(
      "How the IOMA & Moi loyalty programme works at IOMA Paris, and where it stands for the UAE.",
      "كيف يعمل برنامج الولاء IOMA & Moi لدى آيوما باريس، ووضعه في دولة الإمارات.",
    ),
  },
  hero: {
    kicker: l("Loyalty programme", "برنامج الولاء"),
    title: l("IOMA & Moi", "IOMA & Moi"),
    line: l("The tailored loyalty programme.", "برنامج الولاء المصمَّم على قياسكِ."),
    image: "/images/brand/maison-portrait.webp",
    alt: l("An IOMA Paris portrait", "صورة من آيوما باريس"),
  },
  status: {
    label: l("Information only", "للاطلاع فقط"),
    text: l(
      "IOMA & Moi is the loyalty programme run by IOMA Paris in France. Its availability, rules and rewards for the UAE have not been announced. Nothing can be earned or redeemed on this site yet.",
      "IOMA & Moi هو برنامج الولاء الذي تديره آيوما باريس في فرنسا. لم يُعلَن بعد عن توفّره وقواعده ومكافآته في دولة الإمارات، ولا يمكن حاليًا كسب أي نقاط أو استبدالها على هذا الموقع.",
    ),
  },
  howTitle: l("How the programme works in France", "كيف يعمل البرنامج في فرنسا"),
  steps: [
    {
      n: "01",
      title: l("Create your account", "أنشئوا حسابكم"),
      text: l(
        "Members create an IOMA Paris account, or log in, to join the programme.",
        "ينضم الأعضاء بإنشاء حساب في آيوما باريس أو بتسجيل الدخول.",
      ),
    },
    {
      n: "02",
      title: l("Collect points", "اجمعوا النقاط"),
      text: l(
        "For every €1 spent, a member collects 1 point in their balance. Points can also be earned by following IOMA on social media and by celebrating a birthday with the brand.",
        "عن كل 1 يورو يُنفَق يجمع العضو نقطة واحدة في رصيده. ويمكن كسب النقاط أيضًا بمتابعة آيوما على وسائل التواصل وبالاحتفال بعيد الميلاد مع العلامة.",
      ),
    },
    {
      n: "03",
      title: l("Spend them", "استبدلوها"),
      text: l(
        "Points convert into a voucher for a future order: an immediate discount of up to 20% on the next order.",
        "تتحوّل النقاط إلى قسيمة لطلب لاحق: خصم فوري يصل إلى 20% على الطلب التالي.",
      ),
    },
  ],
  benefitsTitle: l("What members gain", "ما يكسبه الأعضاء"),
  benefits: [
    {
      title: l("A balance that grows", "رصيد ينمو"),
      text: l(
        "Every purchase adds to the member's points balance.",
        "كل عملية شراء تضيف إلى رصيد نقاط العضو.",
      ),
    },
    {
      title: l("Vouchers for future orders", "قسائم للطلبات القادمة"),
      text: l(
        "Points are exchanged for a voucher on a following order.",
        "تُستبدل النقاط بقسيمة على طلب لاحق.",
      ),
    },
    {
      title: l("Exclusive statuses", "مراتب حصرية"),
      text: l(
        "Accumulating points unlocks exclusive statuses and additional rewards. IOMA Paris has not published their names or thresholds.",
        "يفتح تجميع النقاط مراتب حصرية ومكافآت إضافية. ولم تنشر آيوما باريس أسماءها أو حدودها.",
      ),
    },
  ],
  undefinedTitle: l("Not yet defined for the UAE", "لم يُحدَّد بعد لدولة الإمارات"),
  undefined: [
    l(
      "Whether and when the programme opens in the UAE",
      "هل سيُفتح البرنامج في الإمارات ومتى",
    ),
    l(
      "The value of a point in AED and how points are earned",
      "قيمة النقطة بالدرهم وطريقة كسبها",
    ),
    l(
      "Redemption limits and the validity of points",
      "حدود الاستبدال ومدة صلاحية النقاط",
    ),
    l(
      "Status names, thresholds and extra rewards",
      "أسماء المراتب وحدودها والمكافآت الإضافية",
    ),
  ],
  faq: [
    {
      q: l("Can I earn points in Dubai today?", "هل يمكنني كسب النقاط في دبي اليوم؟"),
      a: l(
        "Not yet. The UAE programme has not been announced, so no points are earned or redeemed on this site.",
        "ليس بعد. لم يُعلَن عن البرنامج في الإمارات، لذلك لا تُكسَب نقاط ولا تُستبدل على هذا الموقع.",
      ),
    },
    {
      q: l("How does the programme work in France?", "كيف يعمل البرنامج في فرنسا؟"),
      a: l(
        "Members collect 1 point per €1 spent and can exchange points for a voucher, up to a 20% discount, on a future order. Expiry, status thresholds and the value of social-media points are not stated by IOMA Paris.",
        "يجمع الأعضاء نقطة عن كل 1 يورو، ويمكنهم استبدال النقاط بقسيمة، بخصم يصل إلى 20%، على طلب لاحق. ولا تذكر آيوما باريس مدة الانتهاء ولا حدود المراتب ولا قيمة نقاط وسائل التواصل.",
      ),
    },
    {
      q: l("Do I need an account?", "هل أحتاج إلى حساب؟"),
      a: l(
        "Yes. The programme is tied to an IOMA Paris account. You can create a Dubai account now; it does not carry a points balance.",
        "نعم. البرنامج مرتبط بحساب في آيوما باريس. يمكنكم إنشاء حساب في دبي الآن، لكنه لا يحمل رصيد نقاط.",
      ),
    },
    {
      q: l("How will I know when it launches?", "كيف سأعرف عند إطلاقه؟"),
      a: l(
        "Subscribe to the newsletter below and we will tell you when there is news.",
        "اشتركوا في النشرة البريدية أدناه وسنُعلمكم عند صدور أي جديد.",
      ),
    },
  ],
  ctaAccount: l("Create your account", "أنشئوا حسابكم"),
  ctaNews: l("Be the first to know", "كونوا أول من يعلم"),
  newsText: l(
    "Leave your email: we will write when the UAE programme is announced.",
    "اتركوا بريدكم الإلكتروني وسنراسلكم عند الإعلان عن البرنامج في الإمارات.",
  ),
};

// ───────────────────────────── Contact ─────────────────────────────
export const CONTACT = {
  seo: {
    title: l("Contact | IOMA Paris Dubai", "تواصلوا معنا | آيوما باريس دبي"),
    description: l(
      "Write to the IOMA Paris Dubai team about an order, a product, a return or a partnership.",
      "راسلوا فريق آيوما باريس دبي بشأن طلب أو منتج أو إرجاع أو شراكة.",
    ),
  },
  hero: {
    kicker: l("Customer care", "خدمة العملاء"),
    title: l("We would love to hear from you.", "يسعدنا أن نسمع منكم."),
    lede: l(
      "Tell us how we can help. We reply by email.",
      "أخبرونا كيف نساعدكم. نردّ عبر البريد الإلكتروني.",
    ),
  },
  categories: [
    { value: "order", label: l("An order or delivery", "طلب أو توصيل") },
    { value: "return", label: l("A return or refund", "إرجاع أو استرداد") },
    { value: "product", label: l("Product advice", "نصيحة حول المنتجات") },
    { value: "account", label: l("My account", "حسابي") },
    { value: "pro", label: l("Professional or partnership", "مهني أو شراكة") },
    { value: "other", label: l("Something else", "شيء آخر") },
  ],
  form: {
    category: l("What is it about?", "ما موضوع رسالتكم؟"),
    name: l("Your name", "الاسم"),
    email: l("Email", "البريد الإلكتروني"),
    order: l("Order reference (optional)", "رقم الطلب (اختياري)"),
    orderHint: l(
      "You will find it in your confirmation email.",
      "تجدونه في رسالة تأكيد الطلب.",
    ),
    subject: l("Subject", "الموضوع"),
    message: l("Your message", "رسالتكم"),
    send: l("Send message", "إرسال الرسالة"),
    sending: l("Sending…", "جارٍ الإرسال…"),
    successTitle: l(
      "Thank you, your message is on its way.",
      "شكرًا، رسالتكم في طريقها إلينا.",
    ),
    successBody: l(
      "Our team will reply by email.",
      "سيردّ فريقنا عبر البريد الإلكتروني.",
    ),
    again: l("Send another message", "إرسال رسالة أخرى"),
    errorTitle: l("Your message could not be sent.", "تعذّر إرسال رسالتكم."),
    errorBody: l(
      "Please try again in a moment. If this keeps happening, wait a minute: too many attempts are paused for a short while.",
      "حاولوا مجددًا بعد قليل. وإن تكرّر الأمر فانتظروا دقيقة: تُوقَف المحاولات الكثيرة لفترة قصيرة.",
    ),
    required: l("This field is required.", "هذا الحقل مطلوب."),
    badEmail: l("Enter a valid email address.", "أدخلوا بريدًا إلكترونيًا صحيحًا."),
    shortMessage: l("Please write at least 10 characters.", "اكتبوا 10 أحرف على الأقل."),
  },
  sideTitle: l("Before you write", "قبل أن تكتبوا"),
  side: [
    l(
      "For a return, add your order reference so we can find it quickly.",
      "لإرجاع منتج، أضيفوا رقم طلبكم لنجده بسرعة.",
    ),
    l(
      "Please do not send card numbers or passwords.",
      "لا ترسلوا أرقام البطاقات أو كلمات المرور.",
    ),
    l(
      "Professionals can also reach us through the professional space.",
      "يمكن للمهنيين التواصل معنا أيضًا عبر المساحة المهنية.",
    ),
  ],
  detailsNote: l(
    "UAE telephone and address details will appear here once confirmed.",
    "ستظهر هنا بيانات الهاتف والعنوان في الإمارات فور اعتمادها.",
  ),
};

// ───────────────────────────── Shipping, returns, refunds ─────────────────────────────
export const SHIPPING = {
  seo: {
    title: l(
      "Shipping, returns & refunds | IOMA Paris Dubai",
      "الشحن والإرجاع والاسترداد | آيوما باريس دبي",
    ),
    description: l(
      "How delivery, returns and refunds work at IOMA Paris Dubai, and what is still being confirmed for the UAE.",
      "كيف يعمل التوصيل والإرجاع والاسترداد لدى آيوما باريس دبي، وما لا يزال قيد الاعتماد لدولة الإمارات.",
    ),
  },
  hero: {
    kicker: l("Customer information", "معلومات العملاء"),
    title: l("Shipping, returns & refunds", "الشحن والإرجاع والاسترداد"),
    lede: l(
      "The journey of an order, from our hands to yours, and back if you need it.",
      "رحلة الطلب من أيدينا إلى أيديكم، وعودته إن احتجتم.",
    ),
    image: "/images/gallery/kits/08.webp",
    alt: l(
      "IOMA routine products on a white pedestal",
      "منتجات روتين آيوما على منصة بيضاء",
    ),
  },
  status: {
    label: l("Pending approval", "بانتظار الاعتماد"),
    text: l(
      "The delivery, return and refund terms for the UAE are being finalised and have not been approved yet. This page describes how the journey works. The figures below (zones, times, fees, eligibility, refund delay) will be published once confirmed. The French terms of IOMA Paris do not apply to orders in the UAE.",
      "شروط التوصيل والإرجاع والاسترداد في دولة الإمارات قيد الإعداد ولم تُعتمد بعد. تصف هذه الصفحة كيف تسير الرحلة، وستُنشر الأرقام أدناه (المناطق والمدد والرسوم والأهلية ومهلة الاسترداد) فور اعتمادها. ولا تسري الشروط الفرنسية لآيوما باريس على الطلبات في الإمارات.",
    ),
  },
  overviewTitle: l("What this page will confirm", "ما ستؤكده هذه الصفحة"),
  overview: [
    {
      title: l("Delivery zones", "مناطق التوصيل"),
      text: l("Where we deliver in the UAE.", "أين نوصّل داخل الإمارات."),
    },
    {
      title: l("Delivery times", "مدد التوصيل"),
      text: l("How long an order takes to arrive.", "كم يستغرق وصول الطلب."),
    },
    {
      title: l("Delivery fees", "رسوم التوصيل"),
      text: l(
        "What delivery costs, and any free-delivery threshold.",
        "تكلفة التوصيل، وأي حد للتوصيل المجاني.",
      ),
    },
    {
      title: l("Returns eligibility", "أهلية الإرجاع"),
      text: l(
        "Which products can be returned and for how long.",
        "المنتجات التي يمكن إرجاعها ومدّة ذلك.",
      ),
    },
  ],
  journeyTitle: l("If you need to return an order", "إن احتجتم إلى إرجاع طلب"),
  journey: [
    {
      n: "01",
      title: l("Contact us", "تواصلوا معنا"),
      text: l(
        "Send a request through the contact form with your order reference.",
        "أرسلوا طلبًا عبر نموذج التواصل مع رقم طلبكم.",
      ),
    },
    {
      n: "02",
      title: l("Receive the instructions", "استلموا التعليمات"),
      text: l(
        "Our team replies with the steps to follow.",
        "يردّ فريقنا بالخطوات المطلوبة.",
      ),
    },
    {
      n: "03",
      title: l("Send the product back", "أعيدوا المنتج"),
      text: l(
        "Return it as instructed. Please do not send a parcel before we have replied.",
        "أعيدوه وفق التعليمات. يُرجى عدم إرسال أي طرد قبل أن نردّ.",
      ),
    },
    {
      n: "04",
      title: l("We check it", "نفحصه"),
      text: l(
        "The product is checked when it reaches us.",
        "يُفحص المنتج عند وصوله إلينا.",
      ),
    },
    {
      n: "05",
      title: l("Your refund", "استردادكم"),
      text: l(
        "If the return is accepted, the refund follows. The method and the delay will be confirmed for the UAE.",
        "إن قُبل الإرجاع يتبعه الاسترداد. وستُحدَّد الطريقة والمهلة لدولة الإمارات.",
      ),
    },
  ],
  damagedTitle: l("A damaged or incorrect order", "طلب تالف أو غير صحيح"),
  damagedText: l(
    "Tell us through the contact form with your order reference and, if you can, a photo. We will come back to you.",
    "أخبرونا عبر نموذج التواصل مع رقم طلبكم، وصورة إن أمكن، وسنعود إليكم.",
  ),
  faq: [
    {
      q: l("When will delivery details be published?", "متى ستُنشر تفاصيل التوصيل؟"),
      a: l(
        "As soon as the UAE terms are approved. Until then no delivery time or fee is promised on this site.",
        "فور اعتماد شروط الإمارات. وحتى ذلك الحين لا يَعِد الموقع بأي مدة أو رسم توصيل.",
      ),
    },
    {
      q: l("How do I start a return?", "كيف أبدأ عملية إرجاع؟"),
      a: l(
        "Use the contact form and give your order reference. Our team replies with the steps. Please wait for our reply before sending anything back.",
        "استخدموا نموذج التواصل واذكروا رقم طلبكم. سيردّ فريقنا بالخطوات. يُرجى انتظار ردّنا قبل إعادة أي شيء.",
      ),
    },
    {
      q: l("What if my order arrives damaged?", "ماذا لو وصل طلبي تالفًا؟"),
      a: l(
        "Write to us with your order reference and a photo if possible, and we will come back to you.",
        "راسلونا مع رقم طلبكم وصورة إن أمكن، وسنعود إليكم.",
      ),
    },
    {
      q: l(
        "Do French delivery terms apply to me?",
        "هل تسري عليّ شروط التوصيل الفرنسية؟",
      ),
      a: l(
        "No. The terms published by IOMA Paris in France apply to orders in France only.",
        "لا. الشروط التي تنشرها آيوما باريس في فرنسا تسري على الطلبات داخل فرنسا فقط.",
      ),
    },
  ],
};

// ───────────────────────────── Secure payment ─────────────────────────────
export const PAYMENT = {
  seo: {
    title: l("Secure payment | IOMA Paris Dubai", "الدفع الآمن | آيوما باريس دبي"),
    description: l(
      "How payment works at IOMA Paris Dubai and how your card details are protected.",
      "كيف يعمل الدفع لدى آيوما باريس دبي وكيف تُحمى بيانات بطاقتكم.",
    ),
  },
  hero: {
    kicker: l("Trust & payment", "الثقة والدفع"),
    title: l("Secure payment", "الدفع الآمن"),
    lede: l(
      "What we do, and do not do, with your payment details.",
      "ما نفعله وما لا نفعله ببيانات الدفع الخاصة بكم.",
    ),
  },
  status: {
    label: l("Payment gateway not yet connected", "بوابة الدفع غير موصولة بعد"),
    text: l(
      "Checkout currently runs in demonstration mode: no real payment is taken. The payment provider for the UAE has not been connected yet, so the payment methods and the security certifications of the live service will be listed here once it is.",
      "يعمل الدفع حاليًا في وضع تجريبي: لا يُقتطع أي مبلغ حقيقي. لم يُربط مزوّد الدفع في الإمارات بعد، لذلك ستُدرج هنا طرق الدفع وشهادات الأمان للخدمة الفعلية فور ربطه.",
    ),
  },
  principlesTitle: l("Our commitments", "التزاماتنا"),
  principles: [
    {
      title: l("No card details stored", "لا نحفظ بيانات البطاقة"),
      text: l(
        "IOMA Paris Dubai does not store your full card number, expiry date or security code on its own servers.",
        "لا تحفظ آيوما باريس دبي رقم بطاقتكم الكامل أو تاريخ انتهائها أو رمز الأمان على خوادمها.",
      ),
    },
    {
      title: l("An encrypted connection", "اتصال مشفّر"),
      text: l(
        "The live site is served over HTTPS, so what you send and receive is encrypted in transit.",
        "يُقدَّم الموقع الفعلي عبر HTTPS، فيكون ما تُرسلونه وتستقبلونه مشفّرًا أثناء النقل.",
      ),
    },
    {
      title: l("Payment handled by a provider", "الدفع عبر مزوّد متخصص"),
      text: l(
        "Card payments will be processed by a payment provider, not by this site. We will name it here when it is connected.",
        "ستُعالج مدفوعات البطاقات عبر مزوّد دفع لا عبر هذا الموقع، وسنذكر اسمه هنا عند ربطه.",
      ),
    },
    {
      title: l("Help with a payment", "مساعدة بشأن الدفع"),
      text: l(
        "If a payment looks wrong, write to us with your order reference and we will look into it.",
        "إن بدا لكم أي دفع غير صحيح فراسلونا مع رقم طلبكم وسننظر فيه.",
      ),
    },
  ],
  flowTitle: l("How checkout will work", "كيف سيعمل الدفع"),
  flow: [
    {
      n: "01",
      title: l("Review your order", "راجعوا طلبكم"),
      text: l(
        "Check your items, address and delivery choice.",
        "تحقّقوا من منتجاتكم وعنوانكم وخيار التوصيل.",
      ),
    },
    {
      n: "02",
      title: l("Pay with the provider", "ادفعوا عبر المزوّد"),
      text: l(
        "You enter payment details on the provider's secure payment step.",
        "تُدخلون بيانات الدفع في خطوة الدفع الآمنة لدى المزوّد.",
      ),
    },
    {
      n: "03",
      title: l("Confirmation", "التأكيد"),
      text: l(
        "You receive an order confirmation once the payment is accepted.",
        "تتلقون تأكيد الطلب بعد قبول الدفع.",
      ),
    },
  ],
  methodsTitle: l("Payment methods", "طرق الدفع"),
  methodsText: l(
    "Accepted payment methods will be listed here once the UAE provider is connected. No payment-method logo is shown before then.",
    "ستُدرج هنا طرق الدفع المقبولة فور ربط مزوّد الإمارات، ولا يُعرض أي شعار طريقة دفع قبل ذلك.",
  ),
  cta: l("Questions about payment? Write to us", "أسئلة حول الدفع؟ راسلونا"),
};

// ───────────────────────────── Careers ─────────────────────────────
export const CAREERS_URL = "https://ievagroup.com/job/";
export const CAREERS = {
  seo: {
    title: l("Careers | IOMA Paris Dubai", "الوظائف | آيوما باريس دبي"),
    description: l(
      "Join the IEVA Group ecosystem behind IOMA Paris: science, technology and beauty.",
      "انضموا إلى منظومة مجموعة IEVA وراء آيوما باريس: العلم والتقنية والجمال.",
    ),
  },
  hero: {
    kicker: l("Careers", "الوظائف"),
    title: l("Build beauty with science.", "ابنوا الجمال بالعلم."),
    lede: l(
      "IOMA Paris belongs to IEVA Group, which applies precision engineering, micro-measurement and data to beauty and well-being.",
      "تنتمي آيوما باريس إلى مجموعة IEVA التي تطبّق الهندسة الدقيقة والقياس المجهري والبيانات على الجمال والعافية.",
    ),
    cta: l("Explore opportunities", "استكشفوا الفرص"),
    external: l(
      "opens the IEVA Group website in a new tab",
      "يفتح موقع مجموعة IEVA في نافذة جديدة",
    ),
    image: "/images/technology/i-diag.jpg",
    alt: l("An IOMA diagnostic device", "جهاز تشخيص من آيوما"),
  },
  groupTitle: l("The IEVA Group ecosystem", "منظومة مجموعة IEVA"),
  groupText: l(
    "IEVA Group was founded and is led by Jean Michel Karam, who holds a doctorate in micro-technologies. The group offers diagnostic technologies, personalisation platforms, brands and experiences designed to follow people throughout their lives, around a vision called Beautiful Longevity.",
    "أسّس مجموعة IEVA ويقودها جان ميشال كرم، الحاصل على دكتوراه في التقنيات الدقيقة. تقدّم المجموعة تقنيات تشخيص ومنصات تخصيص وعلامات وتجارب مصمّمة لمرافقة الناس طوال حياتهم، حول رؤية تُسمّى الجمال الدائم (Beautiful Longevity).",
  ),
  brandsTitle: l("Brands of the group", "علامات المجموعة"),
  brands: [
    "myIEVA",
    "IOMA Paris",
    "IOMA Haircare",
    "L'Atelier du Sourcil & Boudoir du Regard",
    "My Little Box",
    "Made with Care",
    "My Little Paris",
    "Gambettes Box",
    "ELENATURE",
  ],
  valuesTitle: l("What guides the group", "ما يوجّه المجموعة"),
  values: [
    {
      title: l("Precision", "الدقة"),
      text: l(
        "Engineering and measurement at the service of beauty.",
        "الهندسة والقياس في خدمة الجمال.",
      ),
    },
    {
      title: l("Beautiful Longevity", "الجمال الدائم"),
      text: l(
        "A lasting and measurable approach centred on longevity and respect for each person.",
        "نهج دائم وقابل للقياس يتمحور حول طول العمر واحترام كل شخص.",
      ),
    },
    {
      title: l("Rigour and responsibility", "الصرامة والمسؤولية"),
      text: l(
        "Demanding standards in the way the teams work.",
        "معايير عالية في طريقة عمل الفرق.",
      ),
    },
  ],
  note: l(
    "Opportunities are published on the IEVA Group website. We do not list or collect applications on this site.",
    "تُنشر الفرص على موقع مجموعة IEVA. لا نعرض الوظائف ولا نستقبل الطلبات على هذا الموقع.",
  ),
};

// ───────────────────────────── Legal drafts (UAE) ─────────────────────────────
export type LegalDoc = {
  seo: { title: L; description: L };
  kicker: L;
  title: L;
  version: string;
  status: L;
  intro: L;
  sections: { id: string; heading: L; text: L; missing: L[] }[];
};

const draftStatus = l(
  "Draft — awaiting legal and client approval, not yet in force",
  "مسودة — بانتظار الاعتماد القانوني واعتماد العميل، وليست سارية بعد",
);

export const LEGAL_COMMON = {
  statusLabel: l("Status", "الحالة"),
  versionLabel: l("Version", "الإصدار"),
  missingTitle: l("Information needed before publication", "معلومات مطلوبة قبل النشر"),
  onThisPage: l("On this page", "في هذه الصفحة"),
  banner: l(
    "This document is an editable UAE draft prepared from the structure of the official IOMA Paris documents. It does not copy French legal terms, entities, addresses or jurisdiction clauses, and it contains no legal text that has not been confirmed. It is not yet in force.",
    "هذه الوثيقة مسودة قابلة للتعديل خاصة بالإمارات أُعدّت وفق بنية وثائق آيوما باريس الرسمية. لا تنسخ الشروط القانونية الفرنسية ولا الكيانات ولا العناوين ولا بنود الاختصاص القضائي، ولا تتضمّن أي نص قانوني غير مؤكَّد. وهي غير سارية بعد.",
  ),
};

export const TERMS: LegalDoc = {
  seo: {
    title: l(
      "Terms & conditions | IOMA Paris Dubai",
      "الشروط والأحكام | آيوما باريس دبي",
    ),
    description: l(
      "Terms and conditions of sale for IOMA Paris Dubai (draft pending approval).",
      "شروط وأحكام البيع لدى آيوما باريس دبي (مسودة بانتظار الاعتماد).",
    ),
  },
  kicker: l("Legal", "قانوني"),
  title: l("Terms & conditions", "الشروط والأحكام"),
  version: "Draft 0.1",
  status: draftStatus,
  intro: l(
    "The sections below follow the coverage of IOMA Paris's terms of sale, adapted to the UAE operation. Each lists what must be confirmed before the text can be written and published.",
    "تتبع الأقسام أدناه نطاق شروط البيع لدى آيوما باريس، مكيَّفة للعمل في الإمارات. ويُبيّن كل قسم ما يجب تأكيده قبل كتابة النص ونشره.",
  ),
  sections: [
    {
      id: "seller",
      heading: l("1. Seller and scope", "1. البائع والنطاق"),
      text: l(
        "Who sells, to whom, and where these terms apply.",
        "من يبيع، ولمن، وأين تسري هذه الشروط.",
      ),
      missing: [
        l(
          "Legal name of the UAE operating entity",
          "الاسم القانوني للكيان المشغّل في الإمارات",
        ),
        l(
          "Trade licence number and licensing authority",
          "رقم الرخصة التجارية والجهة المانحة",
        ),
        l("Registered address and contact details", "العنوان المسجّل وبيانات التواصل"),
        l("Territories delivered to", "المناطق التي يُوصَّل إليها"),
      ],
    },
    {
      id: "ordering",
      heading: l("2. Ordering and account", "2. الطلب والحساب"),
      text: l(
        "How an order is placed, confirmed and, if needed, refused.",
        "كيف يُقدَّم الطلب ويُؤكَّد ويُرفض عند الحاجة.",
      ),
      missing: [l("Order acceptance and cancellation rules", "قواعد قبول الطلب وإلغائه")],
    },
    {
      id: "prices",
      heading: l("3. Prices and payment", "3. الأسعار والدفع"),
      text: l(
        "Prices in AED, taxes, accepted payment methods and when payment is due.",
        "الأسعار بالدرهم والضرائب وطرق الدفع المقبولة وموعد استحقاقه.",
      ),
      missing: [
        l(
          "VAT treatment and tax registration number",
          "المعاملة الضريبية ورقم التسجيل الضريبي",
        ),
        l("Confirmed payment provider and methods", "مزوّد الدفع وطرقه المؤكَّدة"),
      ],
    },
    {
      id: "delivery",
      heading: l("4. Delivery", "4. التوصيل"),
      text: l(
        "Delivery zones, times, fees and what happens with a damaged or missing parcel.",
        "مناطق التوصيل ومدده ورسومه وما يحدث عند تلف الطرد أو فقده.",
      ),
      missing: [
        l(
          "Approved delivery zones, times and fees",
          "مناطق التوصيل ومدده ورسومه المعتمدة",
        ),
        l("Carrier(s)", "شركة أو شركات الشحن"),
      ],
    },
    {
      id: "returns",
      heading: l("5. Returns and refunds", "5. الإرجاع والاسترداد"),
      text: l(
        "Whether and how products can be returned, and how refunds are made.",
        "هل يمكن إرجاع المنتجات وكيف، وكيف يتم الاسترداد.",
      ),
      missing: [
        l(
          "Return period and eligibility under UAE consumer law",
          "مدة الإرجاع والأهلية وفق قانون المستهلك الإماراتي",
        ),
        l("Products excluded from return", "المنتجات المستثناة من الإرجاع"),
        l("Refund method and delay", "طريقة الاسترداد ومهلته"),
      ],
    },
    {
      id: "liability",
      heading: l("6. Warranty and liability", "6. الضمان والمسؤولية"),
      text: l(
        "Product conformity, events outside our control, and limits of liability.",
        "مطابقة المنتجات والأحداث الخارجة عن إرادتنا وحدود المسؤولية.",
      ),
      missing: [
        l(
          "Warranty terms and liability wording approved by counsel",
          "شروط الضمان وصياغة المسؤولية المعتمدة من المستشار القانوني",
        ),
      ],
    },
    {
      id: "data",
      heading: l("7. Personal data", "7. البيانات الشخصية"),
      text: l(
        "How personal data is handled, with a link to the privacy policy.",
        "كيفية معالجة البيانات الشخصية، مع رابط إلى سياسة الخصوصية.",
      ),
      missing: [
        l(
          "Aligned with the approved privacy policy",
          "مواءمة مع سياسة الخصوصية المعتمدة",
        ),
      ],
    },
    {
      id: "ip",
      heading: l("8. Intellectual property", "8. الملكية الفكرية"),
      text: l(
        "Ownership of the site content, trademarks and packaging.",
        "ملكية محتوى الموقع والعلامات والتغليف.",
      ),
      missing: [
        l("Trademark owner and permitted uses", "مالك العلامة والاستخدامات المسموح بها"),
      ],
    },
    {
      id: "general",
      heading: l(
        "9. General, governing law and disputes",
        "9. أحكام عامة والقانون الواجب التطبيق والنزاعات",
      ),
      text: l(
        "Governing law, competent courts, electronic acceptance and severability.",
        "القانون الواجب التطبيق والمحاكم المختصة والقبول الإلكتروني وقابلية الفصل.",
      ),
      missing: [
        l(
          "Governing law and jurisdiction (to be set by counsel, not copied from the French terms)",
          "القانون الواجب التطبيق والاختصاص القضائي (يحدّدهما المستشار القانوني ولا يُنسخان من الشروط الفرنسية)",
        ),
      ],
    },
  ],
};

export const LEGAL_NOTICE: LegalDoc = {
  seo: {
    title: l("Legal notice | IOMA Paris Dubai", "إشعار قانوني | آيوما باريس دبي"),
    description: l(
      "Legal notice for IOMA Paris Dubai (draft pending approval).",
      "الإشعار القانوني لدى آيوما باريس دبي (مسودة بانتظار الاعتماد).",
    ),
  },
  kicker: l("Legal", "قانوني"),
  title: l("Legal notice", "إشعار قانوني"),
  version: "Draft 0.1",
  status: draftStatus,
  intro: l(
    "The legal notice identifies who publishes and operates the site. It cannot be completed until the UAE entity details are confirmed.",
    "يحدّد الإشعار القانوني من ينشر الموقع ويشغّله، ولا يمكن إكماله قبل تأكيد بيانات الكيان في الإمارات.",
  ),
  sections: [
    {
      id: "publisher",
      heading: l("1. Publisher", "1. الناشر"),
      text: l(
        "The company that publishes the site, its legal form, licence and registered office.",
        "الشركة الناشرة للموقع وشكلها القانوني ورخصتها ومقرّها المسجّل.",
      ),
      missing: [
        l(
          "Legal name, legal form and trade licence number",
          "الاسم القانوني والشكل القانوني ورقم الرخصة التجارية",
        ),
        l("Registered office", "المقر المسجّل"),
        l("Publication director", "مدير النشر"),
      ],
    },
    {
      id: "operator",
      heading: l("2. Site operation", "2. تشغيل الموقع"),
      text: l(
        "Who operates the site and for which audience it is intended.",
        "من يشغّل الموقع وإلى أي جمهور يتوجّه.",
      ),
      missing: [
        l("Operating entity and intended territory", "الكيان المشغّل والإقليم المقصود"),
      ],
    },
    {
      id: "hosting",
      heading: l("3. Hosting", "3. الاستضافة"),
      text: l("The company that hosts the site.", "الشركة التي تستضيف الموقع."),
      missing: [l("Hosting provider name and address", "اسم مزوّد الاستضافة وعنوانه")],
    },
    {
      id: "ip",
      heading: l("4. Intellectual property", "4. الملكية الفكرية"),
      text: l(
        "Ownership of content, trademarks and copyright, and permitted uses.",
        "ملكية المحتوى والعلامات وحقوق المؤلف والاستخدامات المسموحة.",
      ),
      missing: [
        l(
          "Confirmation of trademark owner for the UAE",
          "تأكيد مالك العلامة في الإمارات",
        ),
      ],
    },
    {
      id: "links",
      heading: l("5. Links and third parties", "5. الروابط والأطراف الثالثة"),
      text: l(
        "Responsibility for external sites and conditions for linking to this site.",
        "المسؤولية عن المواقع الخارجية وشروط الربط بهذا الموقع.",
      ),
      missing: [],
    },
    {
      id: "liability",
      heading: l("6. Limitation of liability", "6. حدود المسؤولية"),
      text: l(
        "Use of the site, availability and the limits of liability.",
        "استخدام الموقع وتوفّره وحدود المسؤولية.",
      ),
      missing: [l("Wording approved by counsel", "صياغة معتمدة من المستشار القانوني")],
    },
    {
      id: "law",
      heading: l("7. Governing law and courts", "7. القانون الواجب التطبيق والمحاكم"),
      text: l(
        "The applicable law and competent courts.",
        "القانون الواجب التطبيق والمحاكم المختصة.",
      ),
      missing: [
        l(
          "Governing law and jurisdiction set by counsel",
          "القانون والاختصاص القضائي يحدّدهما المستشار القانوني",
        ),
      ],
    },
  ],
};

// ───────────────────────────── Cookie policy ─────────────────────────────
export const COOKIES = {
  seo: {
    title: l(
      "Cookie settings | IOMA Paris Dubai",
      "إعدادات ملفات تعريف الارتباط | آيوما باريس دبي",
    ),
    description: l(
      "Choose which cookies IOMA Paris Dubai may use, and change your choice at any time.",
      "اختاروا ملفات تعريف الارتباط التي يجوز لآيوما باريس دبي استخدامها، وغيّروا اختياركم في أي وقت.",
    ),
  },
  kicker: l("Legal", "قانوني"),
  title: l("Cookie settings", "إعدادات ملفات تعريف الارتباط"),
  lede: l(
    "Cookies are small files stored in your browser. Choose which optional ones we may use. Your choice is remembered and you can change it here at any time.",
    "ملفات تعريف الارتباط ملفات صغيرة تُحفظ في متصفحكم. اختاروا الاختيارية منها التي نستخدمها. يُحفظ اختياركم ويمكنكم تغييره هنا في أي وقت.",
  ),
  categoriesTitle: l("The categories", "الفئات"),
  categories: [
    {
      title: l("Necessary", "ضرورية"),
      text: l(
        "Needed for the site to work: signing in, your basket, your language and the record of this consent choice. They cannot be switched off.",
        "ضرورية لعمل الموقع: تسجيل الدخول وسلتكم ولغتكم وسجلّ خيار الموافقة هذا. ولا يمكن إيقافها.",
      ),
    },
    {
      title: l("Analytics", "التحليلات"),
      text: l(
        "Help us understand, in aggregate, how the site is used. Off unless you accept them.",
        "تساعدنا على فهم كيفية استخدام الموقع بشكل مجمّع. متوقفة ما لم تقبلوها.",
      ),
    },
    {
      title: l("Marketing", "التسويق"),
      text: l(
        "Used to measure campaigns and show relevant offers. Off unless you accept them.",
        "تُستخدم لقياس الحملات وعرض عروض مناسبة. متوقفة ما لم تقبلوها.",
      ),
    },
  ],
  lifetimeTitle: l("How long cookies last", "مدة بقاء الملفات"),
  lifetime: l(
    "Session cookies disappear when you close your browser. Persistent cookies stay for a set time or until you delete them. Your consent choice is kept for 180 days.",
    "تختفي ملفات الجلسة عند إغلاق المتصفح، وتبقى الدائمة مدة محدّدة أو حتى تحذفونها. يُحفظ خيار موافقتكم 180 يومًا.",
  ),
  browserTitle: l("Through your browser", "عبر المتصفح"),
  browser: l(
    "You can also block or delete cookies in your browser settings. Blocking necessary cookies may stop parts of the site from working.",
    "يمكنكم أيضًا حظر ملفات تعريف الارتباط أو حذفها من إعدادات المتصفح. وقد يؤدي حظر الضرورية منها إلى توقف أجزاء من الموقع.",
  ),
  statusTitle: l("Current status", "الوضع الحالي"),
  statusText: l(
    "No analytics or marketing tool is active on this site at the moment. If one is added, it will only run after you accept its category. The detailed cookie inventory will be listed here once those tools are chosen.",
    "لا توجد حاليًا أدوات تحليلات أو تسويق مفعّلة على الموقع. وإن أُضيفت فلن تعمل إلا بعد قبولكم فئتها. وستُدرج هنا قائمة الملفات التفصيلية عند اختيار تلك الأدوات.",
  ),
  your: l("Your choice", "اختياركم"),
  none: l("Not set yet", "لم يُحدَّد بعد"),
  on: l("on", "مفعّل"),
  off: l("off", "متوقف"),
};
