// Content for /technology. Source: "IOMA Dubai — Our Technology" brief supplied by the
// client (IEVA Group presentation, February 2024, and the IOMA brand book). Items the
// brief flagged "to confirm with IEVA" (i-Diag duration, UAE availability, the "most
// sophisticated device in the world" claim, video links) are deliberately NOT published.
// Photos are the low-resolution brief images — replace with HD files from IEVA
// (tracked in CLIENT_REQUIREMENTS.md).

export type L = { en: string; ar: string };
const l = (en: string, ar: string): L => ({ en, ar });

export const SOURCES = {
  ieva: l("Source: IEVA Group, February 2024.", "المصدر: مجموعة IEVA، فبراير 2024."),
  ievaPresentation: l(
    "Source: IEVA Group presentation, February 2024.",
    "المصدر: عرض مجموعة IEVA، فبراير 2024.",
  ),
  brandBook: l("Source: IOMA brand book.", "المصدر: كتيّب علامة IOMA."),
  skinCode: l(
    "Source: IOMA brand book. SkinCode™: a seven-digit number that positions each skin dimension from 1 (best) to 15.",
    "المصدر: كتيّب علامة IOMA. SkinCode™: رقم من سبع خانات يحدّد موقع كل بُعد من أبعاد البشرة من 1 (الأفضل) إلى 15.",
  ),
  timeline: l(
    "Milestones of the beauty-tech devices developed by IEVA Group. Source: IEVA Group presentation, February 2024.",
    "محطات أجهزة تقنيات الجمال التي طوّرتها مجموعة IEVA. المصدر: عرض مجموعة IEVA، فبراير 2024.",
  ),
};

export const NAV = [
  { id: "devices", label: l("Devices", "الأجهزة") },
  { id: "i-diag", label: l("i-Diag", "i-Diag") },
  { id: "sphere", label: l("IOMA Sphere 2", "IOMA Sphere 2") },
  { id: "in-lab", label: l("IOMA In.Lab", "IOMA In.Lab") },
  { id: "compare", label: l("Compare", "المقارنة") },
  { id: "story", label: l("Our story", "قصتنا") },
];

export const HERO = {
  kicker: l("Our technology", "تقنيتنا"),
  titleA: l("Three devices read your skin.", "ثلاثة أجهزة تقرأ بشرتك."),
  titleB: l("One creates your formula.", "وجهاز واحد يصنع تركيبتك."),
  body: l(
    "i-Diag, IOMA Sphere and IOMA In.Lab: from the first scan to a made-to-measure formula prepared in under a minute.",
    "i-Diag وIOMA Sphere وIOMA In.Lab: من المسح الأول إلى تركيبة مصمَّمة خصيصاً لك تُحضَّر في أقل من دقيقة.",
  ),
  primary: l("Discover the devices", "اكتشف الأجهزة"),
  secondary: l("Find a partner", "ابحث عن شريك"),
  tags: [
    { label: l("Fine lines", "الخطوط الدقيقة"), x: 34, y: 33 },
    { label: l("Pigment spots", "بقع التصبغ"), x: 58, y: 44 },
    { label: l("Redness", "الاحمرار"), x: 46, y: 62 },
    { label: l("Hydration", "الترطيب"), x: 66, y: 76 },
  ],
  scanLabel: l("Scan · IOMA Sphere 2", "مسح · IOMA Sphere 2"),
  stats: [
    { value: "1M+", label: l("skin diagnoses performed", "تشخيص بشرة تم إجراؤه") },
    {
      value: "3,500+",
      label: l("diagnostic devices deployed worldwide", "جهاز تشخيص منتشر حول العالم"),
    },
    {
      value: "800",
      label: l("IOMA In.Lab devices installed", "جهاز IOMA In.Lab مُركَّب"),
    },
    {
      value: "1 billion+",
      label: l("possible personalised combinations", "تركيبة مخصصة ممكنة"),
    },
    {
      value: "€40M",
      label: l("invested in technology R&D", "استُثمرت في البحث والتطوير التقني"),
    },
  ],
};

export const DEVICES_INTRO = {
  kicker: l("The devices", "الأجهزة"),
  title: l("Three devices, one journey.", "ثلاثة أجهزة، رحلة واحدة."),
  explore: l("Explore", "اكتشف"),
};

export const DEVICES = [
  {
    id: "i-diag",
    index: "01",
    name: "i-Diag",
    image: "/images/technology/i-diag.jpg",
    body: l(
      "The smart diagnosis, powered by artificial intelligence. Alone or with an advisor.",
      "التشخيص الذكي المدعوم بالذكاء الاصطناعي. بمفردك أو مع مستشارة.",
    ),
  },
  {
    id: "sphere",
    index: "02",
    name: "IOMA Sphere 2",
    image: "/images/technology/sphere.webp",
    body: l(
      "The complete analysis: six shots, two probes, seven dimensions of the skin.",
      "التحليل الكامل: ست لقطات، مسبران، سبعة أبعاد للبشرة.",
    ),
  },
  {
    id: "in-lab",
    index: "03",
    name: "IOMA In.Lab",
    image: "/images/brand/inlab-machine-2.webp",
    body: l(
      "The miniature laboratory that prepares your formula in under a minute.",
      "المختبر المصغَّر الذي يحضّر تركيبتك في أقل من دقيقة.",
    ),
  },
];

export const LABELS = {
  howItWorks: l("How it works", "كيف يعمل"),
  keyFeatures: l("Key features", "أبرز المزايا"),
  forCustomer: l("For the customer", "للعميلة"),
  forPartner: l("For the partner", "للشريك"),
  twoWays: l("Two ways to use it", "طريقتان للاستخدام"),
  whatYouGet: l("What you get", "ما الذي تحصلين عليه"),
  insideDevice: l("Inside the device", "داخل الجهاز"),
  howMeasured: l("How it is measured", "كيف يتم القياس"),
};

// ---- 01 i-Diag
export const I_DIAG = {
  eyebrow: l("i-Diag by IEVA", "i-Diag من IEVA"),
  title: l("The smart diagnosis.", "التشخيص الذكي."),
  body: l(
    "A technological tool for skin diagnosis in stores and beauty rooms, powered by artificial intelligence and IEVA Group's experience.",
    "أداة تقنية لتشخيص البشرة في المتاجر وغرف التجميل، مدعومة بالذكاء الاصطناعي وبخبرة مجموعة IEVA.",
  ),
  image: "/images/technology/i-diag.jpg",
  steps: [
    {
      title: l("Facial analysis", "تحليل الوجه"),
      body: l(
        "Artificial intelligence analyses the customer's face, using a knowledge base of hundreds of thousands of images.",
        "يحلّل الذكاء الاصطناعي وجه العميلة بالاعتماد على قاعدة معرفية تضم مئات الآلاف من الصور.",
      ),
    },
    {
      title: l("Instrumental measures", "القياسات الآلية"),
      body: l(
        "With an advisor: dermatological patches are scanned to read sebum and quantify desquamation, and a wireless i-probe measures skin moisture.",
        "مع مستشارة: تُمسح لصقات جلدية لقراءة الزيوم وقياس التقشّر، ويقيس مسبار i اللاسلكي رطوبة البشرة.",
      ),
    },
    {
      title: l("Questionnaire", "الاستبيان"),
      body: l(
        "The customer's concerns and lifestyle complete the picture.",
        "تكمل اهتمامات العميلة ونمط حياتها الصورة.",
      ),
    },
  ],
  modes: [
    {
      title: l("On your own", "بمفردك"),
      rows: [
        { label: l("Facial analysis by AI", "تحليل الوجه بالذكاء الاصطناعي"), on: true },
        { label: l("Instrumental measures", "القياسات الآلية"), on: false },
        { label: l("Questionnaire", "الاستبيان"), on: true },
      ],
    },
    {
      title: l("With a beauty advisor", "مع مستشارة تجميل"),
      rows: [
        { label: l("Facial analysis by AI", "تحليل الوجه بالذكاء الاصطناعي"), on: true },
        { label: l("Instrumental measures", "القياسات الآلية"), on: true },
        { label: l("Questionnaire", "الاستبيان"), on: true },
      ],
    },
  ],
  gets: [
    {
      title: l("Your beauty profile", "ملفك الجمالي"),
      body: l(
        "Skin age, phototype, skin type and more, generated by the AI.",
        "عمر البشرة والنمط الضوئي ونوع البشرة وغير ذلك، يولّدها الذكاء الاصطناعي.",
      ),
    },
    {
      title: l("The state of your skin", "حالة بشرتك"),
      body: l(
        "Detailed and illustrated results, easy to understand.",
        "نتائج مفصّلة ومصوّرة وسهلة الفهم.",
      ),
    },
    {
      title: l("Your beauty combination", "تركيبتك الجمالية"),
      body: l(
        "Customised beauty routines, suited to your needs.",
        "روتينات جمالية مخصصة تناسب احتياجاتك.",
      ),
    },
    {
      title: l("Results by email", "النتائج عبر البريد"),
      body: l(
        "The results and the beauty advice are emailed to the customer.",
        "تُرسل النتائج والنصائح الجمالية إلى العميلة بالبريد الإلكتروني.",
      ),
    },
  ],
  features: [
    {
      value: l("2", "2"),
      label: l(
        "ways to use it: alone or with an advisor",
        "طريقتان للاستخدام: بمفردك أو مع مستشارة",
      ),
    },
    {
      value: l("3", "3"),
      label: l(
        "analyses: face, instruments, questionnaire",
        "تحليلات: الوجه، الأدوات، الاستبيان",
      ),
    },
    {
      value: l("Patented", "مُسجَّل ببراءة"),
      label: l("diagnostics in detail", "تشخيص مفصّل"),
    },
    {
      value: l("By email", "عبر البريد"),
      label: l(
        "results and routine sent to the customer",
        "تُرسل النتائج والروتين إلى العميلة",
      ),
    },
  ],
  customer: [
    l("Simple and fast, suitable for every customer", "بسيط وسريع، ومناسب لكل عميلة"),
    l("Clear, illustrated results", "نتائج واضحة ومصوّرة"),
    l("A beauty routine suited to her needs", "روتين جمالي يناسب احتياجاتها"),
    l("Results and advice emailed to her", "تصلها النتائج والنصائح بالبريد الإلكتروني"),
  ],
  partner: [
    l(
      "Two modes: self-diagnosis or a detailed diagnosis led by an advisor",
      "وضعان: تشخيص ذاتي أو تشخيص مفصّل بقيادة مستشارة",
    ),
    l(
      "A smart diagnosis powered by AI, with patented diagnostics",
      "تشخيص ذكي مدعوم بالذكاء الاصطناعي مع تشخيصات مسجَّلة ببراءة",
    ),
    l(
      "Instrumental measures bring precision to the advisor's recommendation",
      "تضيف القياسات الآلية دقة إلى توصية المستشارة",
    ),
  ],
};

// ---- 02 IOMA Sphere 2
export const SPHERE = {
  eyebrow: l("IOMA Sphere 2", "IOMA Sphere 2"),
  title: l("Reveal what the eye cannot see.", "اكشف ما لا تراه العين."),
  body: l(
    "Six shots, two probes, seven dimensions of the skin. The skin is photographed, probed and revealed in about four minutes, without effort for the customer.",
    "ست لقطات ومسباران وسبعة أبعاد للبشرة. تُصوَّر البشرة وتُفحص وتنكشف في نحو أربع دقائق، دون أي جهد من العميلة.",
  ),
  image: "/images/technology/sphere.webp",
  stats: [
    { value: "6", label: l("shots under different lights", "لقطات تحت إضاءات مختلفة") },
    { value: "2", label: l("probes: Physio and Visio", "مسباران: Physio وVisio") },
    {
      value: "7",
      label: l(
        "skin dimensions, plus an eye contour focus",
        "أبعاد للبشرة، إضافة إلى تركيز على محيط العين",
      ),
    },
    { value: "≈ 4 min", label: l("for a complete analysis", "لتحليل كامل") },
  ],
  lights: {
    kicker: l("Five lights, five readings", "خمس إضاءات، خمس قراءات"),
    title: l("The same face, seen five ways.", "الوجه نفسه، بخمس طرق."),
    body: l(
      "Each light reveals what the naked eye cannot see.",
      "تكشف كل إضاءة ما لا تراه العين المجردة.",
    ),
    note: l(
      "Photos: IOMA brand book (low resolution).",
      "الصور: كتيّب علامة IOMA (دقة منخفضة).",
    ),
    items: [
      {
        image: "/images/technology/light-natural.jpg",
        label: l("Natural state", "الحالة الطبيعية"),
        body: l(
          "Visible light shows the natural look of the skin.",
          "يُظهر الضوء المرئي المظهر الطبيعي للبشرة.",
        ),
      },
      {
        image: "/images/technology/light-texture.jpg",
        label: l("Skin texture", "ملمس البشرة"),
        body: l(
          "Parallel polarised light reveals fine lines and wrinkles.",
          "يكشف الضوء المستقطب المتوازي الخطوط الدقيقة والتجاعيد.",
        ),
      },
      {
        image: "/images/technology/light-redness.jpg",
        label: l("Redness", "الاحمرار"),
        body: l(
          "Cross-polarised light reveals redness.",
          "يكشف الضوء المستقطب المتعامد الاحمرار.",
        ),
      },
      {
        image: "/images/technology/light-spots.jpg",
        label: l("Spots", "البقع"),
        body: l(
          "UV light reveals pigment spots.",
          "تكشف الأشعة فوق البنفسجية بقع التصبغ.",
        ),
      },
      {
        image: "/images/technology/light-sebum.jpg",
        label: l("Sebum", "الزيوم"),
        body: l(
          "Blue light shows bacterial activity.",
          "يُظهر الضوء الأزرق النشاط البكتيري.",
        ),
      },
    ],
  },
  dimensions: {
    kicker: l("What IOMA Sphere reads", "ما الذي يقرؤه IOMA Sphere"),
    title: l("Seven dimensions of the skin.", "سبعة أبعاد للبشرة."),
    body: l(
      "Choose a dimension to see how it is measured.",
      "اختر بُعداً لترى كيف يُقاس.",
    ),
    items: [
      {
        name: l("Dehydration", "الجفاف"),
        tag: l("MEMS sensor", "مستشعر MEMS"),
        body: l(
          "Measured by the MEMS sensor of the Physio probe, and by the structure of the skin across the whole face. Desquamation is revealed in 3D, separating fine flakes from thick ones.",
          "يُقاس بمستشعر MEMS في مسبار Physio وببنية البشرة على كامل الوجه. ويُكشف التقشّر بالأبعاد الثلاثية، فيُفصل بين القشور الدقيقة والسميكة.",
        ),
      },
      {
        name: l("Fine lines", "الخطوط الدقيقة"),
        tag: l("Parallel polarised light", "ضوء مستقطب متوازٍ"),
        body: l(
          "Parallel polarised light reveals fine lines and wrinkles. The Visio probe photographs the skin magnified 50 times to read fine lines.",
          "يكشف الضوء المستقطب المتوازي الخطوط الدقيقة والتجاعيد. ويصوّر مسبار Visio البشرة مكبّرة 50 مرة لقراءة الخطوط الدقيقة.",
        ),
      },
      {
        name: l("Wrinkles", "التجاعيد"),
        tag: l("Parallel polarised light", "ضوء مستقطب متوازٍ"),
        body: l(
          "Parallel polarised light reveals fine lines and wrinkles.",
          "يكشف الضوء المستقطب المتوازي الخطوط الدقيقة والتجاعيد.",
        ),
      },
      {
        name: l("Redness", "الاحمرار"),
        tag: l("Cross-polarised light", "ضوء مستقطب متعامد"),
        body: l(
          "Cross-polarised light reveals redness.",
          "يكشف الضوء المستقطب المتعامد الاحمرار.",
        ),
      },
      {
        name: l("Excess sebum", "فائض الزيوم"),
        tag: l("Visio probe", "مسبار Visio"),
        body: l(
          "The Visio probe takes photos of the skin magnified 50 times, to read fine lines, elasticity and sebum.",
          "يلتقط مسبار Visio صوراً للبشرة مكبّرة 50 مرة لقراءة الخطوط الدقيقة والمرونة والزيوم.",
        ),
      },
      {
        name: l("Bacterial foci", "البؤر البكتيرية"),
        tag: l("Blue light", "الضوء الأزرق"),
        body: l(
          "Blue light shows bacterial activity.",
          "يُظهر الضوء الأزرق النشاط البكتيري.",
        ),
      },
      {
        name: l("Pigment spots", "بقع التصبغ"),
        tag: l("UV light", "الأشعة فوق البنفسجية"),
        body: l(
          "UV light reveals pigment spots.",
          "تكشف الأشعة فوق البنفسجية بقع التصبغ.",
        ),
      },
    ],
    eyeTitle: l("Eye contour focus.", "تركيز على محيط العين."),
    eyeBody: l(
      "Fine lines, dark circles, eye bags and eyelid sagging are evaluated on a scale of 8 levels.",
      "تُقيَّم الخطوط الدقيقة والهالات وانتفاخ العين وترهّل الجفن على مقياس من 8 مستويات.",
    ),
  },
  inside: [
    {
      key: "physio",
      title: l("The Physio probe", "مسبار Physio"),
      body: l(
        "Equipped with a MEMS sensor, it measures the hydration of the skin. MEMS (Micro Electro Mechanical Systems) are microscopic sensors.",
        "مزوّد بمستشعر MEMS يقيس ترطيب البشرة. و MEMS (الأنظمة الكهروميكانيكية الدقيقة) هي مستشعرات مجهرية.",
      ),
    },
    {
      key: "visio",
      title: l("The Visio probe", "مسبار Visio"),
      body: l(
        "Takes photos of the skin magnified 50 times, to read fine lines, elasticity and sebum.",
        "يلتقط صوراً للبشرة مكبّرة 50 مرة لقراءة الخطوط الدقيقة والمرونة والزيوم.",
      ),
    },
    {
      key: "screen",
      title: l("The touch screen", "شاشة اللمس"),
      body: l(
        "Colour photos, videos, charts and 3D representations make the results easy to understand and interactive.",
        "صور ملونة ومقاطع فيديو ورسوم بيانية وتمثيلات ثلاثية الأبعاد تجعل النتائج سهلة الفهم وتفاعلية.",
      ),
    },
  ],
  customer: [
    l(
      "She sees what she cannot see: her skin in colour photos, videos, charts and 3D representations",
      "ترى ما لا تستطيع رؤيته: بشرتها في صور ملونة ومقاطع فيديو ورسوم وتمثيلات ثلاثية الأبعاد",
    ),
    l(
      "She receives her SkinCode™ and her Beauty Combination",
      "تتلقى SkinCode™ وتركيبتها الجمالية",
    ),
    l(
      "A few weeks later, she can measure again and compare her results",
      "بعد أسابيع قليلة يمكنها القياس مجدداً ومقارنة نتائجها",
    ),
  ],
  partner: [
    l(
      "A diagnosis that is pedagogical and playful: customers understand and engage",
      "تشخيص تعليمي وممتع: تفهم العميلات وتتفاعل",
    ),
    l(
      "A consultation tool: the results guide the recommendation",
      "أداة استشارة: تقود النتائج التوصية",
    ),
    l(
      "A follow-up that brings customers back to compare",
      "متابعة تعيد العميلات للمقارنة",
    ),
    l("A premium experience that sets the space apart", "تجربة فاخرة تميّز المكان"),
  ],
};

// ---- 03 IOMA In.Lab
export const IN_LAB = {
  eyebrow: l("IOMA In.Lab", "IOMA In.Lab"),
  title: l("A laboratory, infinitely small.", "مختبر صغير إلى ما لا نهاية."),
  body: l(
    "The first miniaturised creator for personalised skincare. Once the diagnosis is done, IOMA In.Lab takes over and prepares your formula drop by drop, in under a minute.",
    "أول جهاز مصغَّر لصنع العناية المخصصة بالبشرة. بعد التشخيص يتولى IOMA In.Lab الأمر ويحضّر تركيبتك قطرة بقطرة في أقل من دقيقة.",
  ),
  image: "/images/brand/inlab-machine.webp",
  stats: [
    { value: "< 1 min", label: l("to prepare a formula", "لتحضير تركيبة") },
    {
      value: "40,257",
      label: l("possible formulas for Ma Crème", "تركيبة ممكنة لـ Ma Crème"),
    },
    {
      value: "33,281",
      label: l("possible formulas for Mon Sérum", "تركيبة ممكنة لـ Mon Sérum"),
    },
    {
      value: "13,257",
      label: l("possible formulas for Mon Soin Yeux", "تركيبة ممكنة لـ Mon Soin Yeux"),
    },
  ],
  steps: [
    {
      title: l("Choose the base", "اختر القاعدة"),
      body: l("Day or Night, for Ma Crème.", "نهار أو ليل، لـ Ma Crème."),
    },
    {
      title: l("Enter the formula", "أدخل التركيبة"),
      body: l(
        "From the diagnosis (IOMA Sphere), from a questionnaire, or choose a pre-formulated option.",
        "من التشخيص (IOMA Sphere) أو من استبيان، أو اختر تركيبة جاهزة.",
      ),
    },
    {
      title: l("In.Lab prepares it", "In.Lab يحضّرها"),
      body: l(
        "The serums are dispensed drop by drop onto the base, while the customer watches.",
        "تُوزَّع الأمصال قطرة بقطرة على القاعدة بينما تشاهد العميلة.",
      ),
    },
    {
      title: l("Mix, close, note", "امزج، أغلق، دوّن"),
      body: l(
        "The formula is noted on the authenticity card given to the customer.",
        "تُدوَّن التركيبة على بطاقة الأصالة التي تُسلَّم للعميلة.",
      ),
    },
  ],
  features: [
    {
      title: l("Drop-by-drop precision", "دقة قطرة بقطرة"),
      body: l(
        "High precision in the dosage of every serum.",
        "دقة عالية في جرعة كل مصل.",
      ),
    },
    {
      title: l("Simplified for advisors", "مبسَّط للمستشارات"),
      body: l(
        "Formulating becomes easy for beauty advisors, with the formula and the serum numbers displayed on screen.",
        "يصبح تحضير التركيبة سهلاً على مستشارات التجميل مع عرض التركيبة وأرقام الأمصال على الشاشة.",
      ),
    },
    {
      title: l("Highest standards of traceability", "أعلى معايير التتبّع"),
      body: l(
        "Built to meet the highest standards of traceability and regulation.",
        "مصمَّم لتلبية أعلى معايير التتبّع والامتثال التنظيمي.",
      ),
    },
    {
      title: l("A premium pack", "عبوة فاخرة"),
      body: l(
        "A screw cap and a window that shows the level of the product.",
        "غطاء لولبي ونافذة تُظهر مستوى المنتج.",
      ),
    },
  ],
  customer: [
    l(
      "A formula made for her, prepared in front of her",
      "تركيبة صُنعت لها وتُحضَّر أمام عينيها",
    ),
    l("An authenticity card with her own formula", "بطاقة أصالة تحمل تركيبتها الخاصة"),
    l(
      "A made-to-measure care she can follow over time, measure after measure",
      "عناية مفصَّلة على مقاسها تتابعها مع الوقت، قياساً بعد قياس",
    ),
  ],
  partner: [
    l(
      "Simplified formulation: advisors prepare a personalised care in a minute",
      "تحضير مبسَّط: تُعدّ المستشارات عناية مخصصة في دقيقة",
    ),
    l(
      "Traceability and a control register for every formula",
      "تتبّع وسجل مراقبة لكل تركيبة",
    ),
    l(
      "A moment of theatre: the formula is made under the customer's eyes",
      "لحظة مسرحية: تُصنع التركيبة أمام عيني العميلة",
    ),
  ],
};

// ---- Compare table
export const COMPARE = {
  kicker: l("At a glance", "نظرة سريعة"),
  title: l("The three devices compared.", "مقارنة الأجهزة الثلاثة."),
  columns: ["i-Diag", "IOMA Sphere 2", "IOMA In.Lab"],
  rows: [
    {
      label: l("Its role", "دوره"),
      cells: [
        l("Diagnose quickly and smartly", "التشخيص السريع والذكي"),
        l("Analyse the skin in depth", "تحليل البشرة بعمق"),
        l("Create the formula", "صنع التركيبة"),
      ],
    },
    {
      label: l("Who uses it", "من يستخدمه"),
      cells: [
        l("The customer alone, or with an advisor", "العميلة بمفردها أو مع مستشارة"),
        l("The beauty advisor", "مستشارة التجميل"),
        l("The beauty advisor", "مستشارة التجميل"),
      ],
    },
    {
      label: l("What it measures", "ما الذي يقيسه"),
      cells: [
        l(
          "The face (AI), sebum and desquamation (patches), moisture (i-probe), a questionnaire",
          "الوجه (ذكاء اصطناعي)، الزيوم والتقشّر (لصقات)، الرطوبة (مسبار i)، استبيان",
        ),
        l(
          "Seven skin dimensions with six shots, two probes, plus an eye contour focus",
          "سبعة أبعاد للبشرة بست لقطات ومسبارين، إضافة إلى تركيز على محيط العين",
        ),
        l(
          "Nothing: it creates the formula from the diagnosis",
          "لا شيء: يصنع التركيبة انطلاقاً من التشخيص",
        ),
      ],
    },
    {
      label: l("Time", "الوقت"),
      cells: [
        l("—", "—"),
        l("About 4 minutes", "نحو 4 دقائق"),
        l("Under 1 minute", "أقل من دقيقة"),
      ],
    },
  ],
};

// ---- Story + timeline
export const STORY = {
  kicker: l("The story", "القصة"),
  title: l("From a beauty mark to a skin laboratory.", "من شامة إلى مختبر للبشرة."),
  paragraphs: [
    l(
      "IOMA's technology starts with its founder. Jean-Michel Karam, a doctor in micro-electronics and an engineer, holds more than 50 patents and founded MEMSCAP, a listed company.",
      "تبدأ تقنية IOMA من مؤسسها. جان ميشال كرم، دكتور في الإلكترونيات الدقيقة ومهندس، يحمل أكثر من 50 براءة اختراع وأسّس MEMSCAP، شركة مدرجة في البورصة.",
    ),
    l(
      'During a routine skin check, he realised that dermatologists had no tool to measure how the skin evolves. His team built the first diagnostic devices. IOMA, which means "to me" in French (À MOI), was created in 2010 around one idea: care that is personalised and measurable.',
      "خلال فحص روتيني للبشرة، أدرك أن أطباء الجلد لا يملكون أداة لقياس تطوّر البشرة. فبنى فريقه أولى أجهزة التشخيص. وتأسست IOMA، ومعناها «لي» بالفرنسية (À MOI)، عام 2010 حول فكرة واحدة: عناية مخصصة وقابلة للقياس.",
    ),
  ],
  facts: [
    {
      value: "50+",
      label: l("patents held by Jean-Michel Karam", "براءة اختراع يحملها جان ميشال كرم"),
    },
    { value: "MEMSCAP", label: l("a listed company he founded", "شركة مدرجة أسّسها") },
    { value: "2010", label: l("the year IOMA was created", "عام تأسيس IOMA") },
    {
      value: "1M+",
      label: l("skin diagnoses performed with IOMA devices", "تشخيص بشرة تم بأجهزة IOMA"),
    },
  ],
  source: SOURCES.brandBook,
};

export const TIMELINE = {
  kicker: l("A history of measuring", "تاريخ من القياس"),
  title: l("Two decades of devices.", "عقدان من الأجهزة."),
  items: [
    { year: "2002", name: "Skin Station", image: "/images/technology/timeline-1.jpg" },
    { year: "2004", name: "Skin Evidence", image: "/images/technology/timeline-2.jpg" },
    { year: "2006 / 2007", name: "TruVu", image: "/images/technology/timeline-3.jpg" },
    {
      year: "2008 – 2009",
      name: "IOMA Beauty Diag",
      image: "/images/technology/timeline-4.jpg",
    },
    {
      year: "2008 – 2009",
      name: "Intuipack for Hair",
      image: "/images/technology/timeline-5.jpg",
    },
    {
      year: "2010",
      name: "IOMA Sphere & Derm",
      image: "/images/technology/timeline-6.jpg",
    },
    {
      year: "2012",
      name: "IOMA Link / SensCard",
      image: "/images/technology/timeline-7.jpg",
    },
    { year: "2013", name: "Perfum Station", image: "/images/technology/timeline-8.jpg" },
    { year: "2014", name: "IOMA Sphere 2", image: "/images/technology/timeline-9.jpg" },
    { year: "2015", name: "IOMA Mirror", image: "/images/technology/timeline-10.jpg" },
  ],
  todayKicker: l("Today in Dubai", "اليوم في دبي"),
  todayTitle: l(
    "i-Diag, IOMA Sphere and IOMA In.Lab.",
    "i-Diag وIOMA Sphere وIOMA In.Lab.",
  ),
  todayBody: l(
    "Three devices that work together: an AI-powered diagnosis, a complete skin analysis, and a miniature laboratory that creates your formula.",
    "ثلاثة أجهزة تعمل معاً: تشخيص مدعوم بالذكاء الاصطناعي، وتحليل كامل للبشرة، ومختبر مصغَّر يصنع تركيبتك.",
  ),
  source: SOURCES.timeline,
};

export const CTA = {
  kicker: l("Try it", "جرّبها"),
  title: l("Experience it at an IOMA partner.", "عِش التجربة لدى شريك IOMA."),
  body: l(
    "Find an IOMA partner near you and meet the devices in person.",
    "ابحث عن شريك IOMA قريب منك وتعرّف إلى الأجهزة عن قرب.",
  ),
  primary: l("Find a partner", "ابحث عن شريك"),
  secondary: l("Professionals & Spas", "للمحترفين والسبا"),
};
