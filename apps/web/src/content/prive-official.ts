/**
 * IOMA Privé page content: a rewrite of the official IOMA Paris page (https://ioma-paris.com/pages/ioma-prive).
 * Every fact, figure, price and address is the official one; nothing is added. EN and AR only.
 * The official page names an "IA IOMA" that selects actives; this site no longer presents AI features, so the
 * wording here says that IOMA selects the actives for the measured needs.
 */
export type Loc = "en" | "ar";
export type L = Record<Loc, string>;
const l = (en: string, ar: string): L => ({ en, ar });

export const PRIVE_IMAGES = {
  model: "/images/prive/modele.jpg",
  cabin: "/images/prive/cabine.jpg",
  tech: [
    "/images/prive/tech-1.jpg",
    "/images/prive/tech-2.jpg",
    "/images/prive/tech-3.jpg",
  ],
  home: "/images/prive/soins-perso.jpg",
  dessange: "/images/prive/dessange.jpg",
  alliance: "/images/prive/alliance.png",
} as const;

export const PRIVE = {
  hero: {
    kicker: l("IOMA Privé", "آيوما بريفيه"),
    title: l("Your skin is unique. So is your care.", "بشرتكِ فريدة. وعنايتكِ كذلك."),
    marquee: l(
      "Beautiful Longevity · Empreinte Cutanée · In.Lab",
      "الجمال الدائم · بصمة البشرة · In.Lab",
    ),
    scroll: l("Scroll", "تابعوا"),
    alt: l(
      "A model during an IOMA Privé skin measurement",
      "عارضة أثناء قياس البشرة في آيوما بريفيه",
    ),
  },
  story: {
    kicker: l(
      "IOMA, innovation in the service of your skin",
      "آيوما، الابتكار في خدمة بشرتكِ",
    ),
    statement: l(
      "Because every skin is unique, its needs are too. They change with time, seasons, environment and daily life.",
      "لأن كل بشرة فريدة، فاحتياجاتها كذلك. وهي تتغيّر مع الزمن والفصول والبيئة والحياة اليومية.",
    ),
    body: [
      l(
        "Founded in 2010 by Jean Michel Karam, an engineer with a doctorate in microelectronics, IOMA has placed knowledge of the skin at the heart of care since its creation.",
        "تأسست آيوما عام 2010 على يد جان ميشال كرم، المهندس الحاصل على دكتوراه في الإلكترونيات الدقيقة، ومنذ نشأتها جعلت معرفة البشرة في صميم العناية.",
      ),
      l(
        "IOMA relies on its scientific expertise and its patented skin-diagnosis technologies to measure several parameters of the skin with precision: hydration, sebum, surface renewal and the skin barrier. This data helps understand what your skin needs and select the most suitable actives, for care as close as possible to your skin and how it evolves.",
        "تعتمد آيوما على خبرتها العلمية وتقنياتها المسجّلة ببراءة لتشخيص البشرة، لقياس عدة معايير بدقة: الترطيب والدهون والتجدد السطحي وحاجز البشرة. وتساعد هذه البيانات على فهم احتياجات بشرتكِ واختيار المكوّنات الفعّالة الأنسب، لعناية قريبة قدر الإمكان من بشرتكِ وتطوّرها.",
      ),
    ],
    pointsTitle: l(
      "IOMA technology in the service of your skin",
      "تقنية آيوما في خدمة بشرتكِ",
    ),
    points: [
      l(
        "A precise measurement of its essential parameters",
        "قياس دقيق لمعاييرها الأساسية",
      ),
      l("A better understanding of its needs", "فهم أفضل لاحتياجاتها"),
      l(
        "A selection of actives to guide your bespoke formula",
        "اختيار مكوّنات فعّالة يوجّه تركيبتكِ الخاصة",
      ),
    ],
    cabinAlt: l("The IOMA Privé treatment cabin", "كابينة العناية في آيوما بريفيه"),
  },
  longevity: {
    kicker: l("Beautiful Longevity", "الجمال الدائم"),
    title: l("Taking care of your skin, over time.", "العناية ببشرتكِ مع مرور الزمن."),
    body: [
      l(
        "Your skin evolves throughout your life. Seasons, environment, pace of life and hormonal variations change its needs. With Beautiful Longevity, IOMA does not look at skin through age alone, but through what it really needs today and how it evolves.",
        "تتطوّر بشرتكِ طوال حياتكِ. فالفصول والبيئة وإيقاع الحياة والتغيّرات الهرمونية تغيّر احتياجاتها. ومع الجمال الدائم، لا تنظر آيوما إلى البشرة من خلال العمر فقط، بل من خلال ما تحتاجه فعلًا اليوم وكيف تتطوّر.",
      ),
      l(
        "This vision combines science, technology and expertise to understand your skin and support it over time: preserve its balance, reinforce what it needs and let the care evolve with it, rather than offering a fixed answer.",
        "تجمع هذه الرؤية بين العلم والتقنية والخبرة لفهم بشرتكِ ومرافقتها مع الزمن: الحفاظ على توازنها وتعزيز ما تحتاجه وتطوير العناية معها، بدل تقديم جواب ثابت.",
      ),
    ],
    line: l(
      "Your skin changes. Your care evolves with it.",
      "بشرتكِ تتغيّر. وعنايتكِ تتطوّر معها.",
    ),
  },
  born: {
    kicker: l("From this vision, IOMA Privé was born", "من هذه الرؤية وُلد آيوما بريفيه"),
    title: l("Before you, this care did not exist.", "قبلكِ، لم تكن هذه العناية موجودة."),
    body: [
      l(
        "With IOMA Privé, your Empreinte Cutanée (skin fingerprint) reveals the characteristics of your skin and lets your expert adapt every step of your care.",
        "مع آيوما بريفيه، تكشف بصمة بشرتكِ (Empreinte Cutanée) خصائص بشرتكِ وتتيح لخبيرتكِ تكييف كل خطوة من عنايتكِ.",
      ),
      l(
        "At the heart of the Longévité AMOI In.Lab ritual, technology goes further. A true miniaturised laboratory, In.Lab selects and precisely doses the suitable actives to create, before your eyes and in real time, the Booster used during your treatment: a formula created on demand, at the moment of your ritual.",
        "في قلب طقس Longévité AMOI In.Lab تذهب التقنية أبعد. فجهاز In.Lab مختبر مصغّر حقيقي، يختار المكوّنات الفعّالة المناسبة ويجرعها بدقة ليصنع أمام عينيكِ وفي الوقت الفعلي المعزّز (Booster) المستخدم أثناء العناية: تركيبة تُحضَّر عند الطلب في لحظة طقسكِ.",
      ),
    ],
    line: l(
      "Your measurements. Your actives. Your formula.",
      "قياساتكِ. مكوّناتكِ الفعّالة. تركيبتكِ.",
    ),
    statsLabel: l("Skin diagnostics", "تشخيص للبشرة"),
    formulas: l("Possible formulas", "تركيبة ممكنة"),
    stats: [
      {
        value: 1000000,
        prefix: "+",
        display: "+1M",
        label: l("Skin diagnostics", "تشخيص للبشرة"),
      },
      {
        value: 80515,
        display: "80 515",
        label: l("Possible formulas · Ma crème", "تركيبة ممكنة · Ma crème"),
      },
      {
        value: 33281,
        display: "33 281",
        label: l("Possible formulas · Mon sérum", "تركيبة ممكنة · Mon sérum"),
      },
      {
        value: 13257,
        display: "13 257",
        label: l("Possible formulas · Mon Soin Yeux", "تركيبة ممكنة · Mon Soin Yeux"),
      },
    ],
  },
  steps: {
    eyebrow: l("The experience in three steps", "التجربة في ثلاث خطوات"),
    ariaLabel: l("The experience in three steps", "التجربة في ثلاث خطوات"),
    items: [
      {
        n: "01",
        kicker: l("Empreinte Cutanée", "بصمة البشرة"),
        title: l("The skin fingerprint.", "بصمة البشرة."),
        body: l(
          "With the face scan, the i-patch and the i-probe, IOMA precisely analyses the essential parameters of your skin: its hydration level, its sebum level, its surface renewal and its ability to protect itself. Together these measurements reveal your Empreinte Cutanée and your skin's needs at the time of the treatment.",
          "بفضل مسح الوجه وجهازَي i-patch وi-probe، تحلّل آيوما بدقة المعايير الأساسية لبشرتكِ: مستوى الترطيب ومستوى الدهون والتجدد السطحي والقدرة على حماية نفسها. وتكشف هذه القياسات معًا بصمة بشرتكِ واحتياجاتها لحظة العناية.",
        ),
      },
      {
        n: "02",
        kicker: l("Your formula by In.Lab", "تركيبتكِ من In.Lab"),
        title: l("A formula made before your eyes.", "تركيبة تُصنع أمام عينيكِ."),
        body: l(
          "From your Empreinte Cutanée, IOMA selects the actives suited to the measured needs of your skin. In.Lab then doses them precisely to formulate, before your eyes and in real time, the Booster used during your treatment.",
          "انطلاقًا من بصمة بشرتكِ، تختار آيوما المكوّنات الفعّالة المناسبة للاحتياجات المقيسة. ثم يجرعها In.Lab بدقة ليصنع أمام عينيكِ وفي الوقت الفعلي المعزّز المستخدم أثناء العناية.",
        ),
      },
      {
        n: "03",
        kicker: l("The personalised massage", "التدليك المخصّص"),
        title: l("A massage guided by your skin.", "تدليك تقوده بشرتكِ."),
        body: l(
          "Your Empreinte Cutanée also guides the massage. Your expert combines IOMA's signature gestures according to the measured needs of your skin, to create a suitable and fully personalised protocol.",
          "توجّه بصمة بشرتكِ التدليك أيضًا. فتجمع خبيرتكِ حركات آيوما المميّزة وفق احتياجات بشرتكِ المقيسة، لتصنع بروتوكولًا مناسبًا ومخصّصًا بالكامل.",
        ),
      },
    ],
  },
  menu: {
    kicker: l("The treatment menu", "قائمة العناية"),
    title: l("One experience. Several ways to live it.", "تجربة واحدة. عدّة طرق لعيشها."),
    body: l(
      "Radiance, hydration, firmness or mature skin: each ritual answers a need and is personalised through your Empreinte Cutanée.",
      "إشراقة أو ترطيب أو شدّ أو بشرة ناضجة: كل طقس يلبّي حاجة ويُخصَّص عبر بصمة بشرتكِ.",
    ),
    signature: l("The signature ritual", "الطقس المميّز"),
    min: l("min", "د"),
    rituals: [
      {
        name: l("Bouclier Longévité", "Bouclier Longévité"),
        tags: l(
          "Prevention · 25–40 years · Beautiful Longevity",
          "الوقاية · 25–40 سنة · الجمال الدائم",
        ),
        text: l(
          "A prevention ritual that accompanies your skin over time.",
          "طقس وقاية يرافق بشرتكِ مع الزمن.",
        ),
        min: 60,
        eur: 90,
      },
      {
        name: l("L'Éclat Absolu", "L'Éclat Absolu"),
        tags: l("Radiance · Texture · Complexion", "الإشراقة · الملمس · لون البشرة"),
        text: l(
          "To reveal radiance and enhance the texture and evenness of the complexion.",
          "لإبراز الإشراقة وتحسين الملمس وتوحيد لون البشرة.",
        ),
        min: 60,
        eur: 127,
      },
      {
        name: l("Rituel Glass Skin", "Rituel Glass Skin"),
        tags: l("Hydration · Glow", "الترطيب · التوهّج"),
        text: l(
          "A ritual dedicated to the hydration and luminosity of the skin.",
          "طقس مخصّص لترطيب البشرة وإشراقها.",
        ),
        min: 60,
        eur: 127,
      },
      {
        name: l("Le Lifting Naturel", "Le Lifting Naturel"),
        tags: l("Firmness · Oval · Wrinkles", "الشدّ · محيط الوجه · التجاعيد"),
        text: l(
          "A treatment targeting firmness, the oval of the face and wrinkles.",
          "عناية تستهدف الشدّ ومحيط الوجه والتجاعيد.",
        ),
        min: 60,
        eur: 160,
      },
      {
        name: l("Rituel Longévité Absolue", "Rituel Longévité Absolue"),
        tags: l("Density · Mature skin", "الكثافة · البشرة الناضجة"),
        text: l(
          "A ritual designed for the specific needs of mature skin.",
          "طقس مصمّم لاحتياجات البشرة الناضجة.",
        ),
        min: 90,
        eur: 180,
      },
      {
        name: l("Longévité AMOI In.Lab", "Longévité AMOI In.Lab"),
        tags: l("Signature ritual", "الطقس المميّز"),
        text: l(
          "Your Empreinte Cutanée, a Booster created during your appointment and IOMA's signature gestures.",
          "بصمة بشرتكِ، ومعزّز يُصنع أثناء موعدكِ، وحركات آيوما المميّزة.",
        ),
        min: 90,
        eur: 230,
        signature: true,
      },
      {
        name: l("Votre peau, votre formule", "Votre peau, votre formule"),
        tags: l("Diagnosis · Formulation", "التشخيص · التركيب"),
        text: l(
          "Skin diagnosis and formulation of a bespoke care.",
          "تشخيص البشرة وتركيب عناية خاصة.",
        ),
        min: 15,
        eur: 145,
      },
    ],
  },
  home: {
    kicker: l("After your appointment", "بعد موعدكِ"),
    title: l(
      "Bespoke in the cabin. Bespoke at home.",
      "مخصّص في الكابينة. ومخصّص في منزلكِ.",
    ),
    body: l(
      "At the end of the treatment, your expert advises a personalised IOMA formula according to your Empreinte Cutanée, to extend the ritual at home. You leave with a better knowledge of your skin and advice for your routine.",
      "في نهاية العناية، توصي خبيرتكِ بتركيبة آيوما مخصّصة وفق بصمة بشرتكِ، لتمديد الطقس في المنزل. تغادرين وقد عرفتِ بشرتكِ أكثر ومعكِ نصائح لروتينكِ.",
    ),
    cta: l("Discover IOMA bespoke care", "اكتشفوا عناية آيوما المخصّصة"),
    alt: l("An IOMA bespoke skincare product", "منتج عناية مخصّص من آيوما"),
  },
  dessange: {
    kicker: l("For the first time at DESSANGE", "للمرة الأولى لدى DESSANGE"),
    title: l(
      "Two beauty expertises, one requirement: personalisation.",
      "خبرتان في الجمال، ومطلب واحد: التخصيص.",
    ),
    body: l(
      "For its first address, IOMA Privé settles within the flagship of Maison DESSANGE, in the heart of Paris, in a dedicated cabin.",
      "في عنوانها الأول، تستقر آيوما بريفيه داخل المتجر الرئيسي لدار DESSANGE في قلب باريس، في كابينة مخصّصة.",
    ),
    place: l("La Maison DESSANGE", "La Maison DESSANGE"),
    address: ["4, rue Marbeuf", "75008 Paris"],
    hoursTitle: l("Opening hours", "ساعات العمل"),
    hours: [
      l("Monday: 10am – 6pm", "الإثنين: 10 صباحًا – 6 مساءً"),
      l("Tuesday to Saturday: 9am – 7pm", "من الثلاثاء إلى السبت: 9 صباحًا – 7 مساءً"),
      l("Closed on Sunday", "مغلق يوم الأحد"),
    ],
    appointmentTitle: l("Appointments", "المواعيد"),
    phone: "+33 1 43 59 31 31",
    alt: l("The Maison DESSANGE flagship", "المتجر الرئيسي لدار DESSANGE"),
    allianceAlt: l("IOMA and DESSANGE logos", "شعارا آيوما وDESSANGE"),
  },
  faq: {
    title: l("Questions", "أسئلة"),
    items: [
      {
        q: l("What is IOMA Privé?", "ما هو آيوما بريفيه؟"),
        a: l(
          "IOMA Privé is IOMA's in-cabin care experience. The measurement of your skin establishes your Empreinte Cutanée and guides the personalisation of the ritual and the massage. With Longévité AMOI In.Lab, this approach goes as far as creating a bespoke Booster, formulated before your eyes during your appointment.",
          "آيوما بريفيه هو تجربة العناية في الكابينة من آيوما. يحدّد قياس بشرتكِ بصمتها ويوجّه تخصيص الطقس والتدليك. ومع Longévité AMOI In.Lab يصل هذا النهج إلى صنع معزّز خاص يُركَّب أمام عينيكِ أثناء موعدكِ.",
        ),
      },
      {
        q: l("Do all the rituals include In.Lab?", "هل تشمل جميع الطقوس In.Lab؟"),
        a: l(
          'The In.Lab Booster formulation is offered in the signature ritual Longévité AMOI In.Lab. The other rituals are part of IOMA Privé\'s personalised approach, guided by your Empreinte Cutanée. The "Votre peau, votre formule" appointment also offers a diagnosis and the formulation of a bespoke care in 15 minutes.',
          "يُقدَّم تركيب المعزّز بواسطة In.Lab في الطقس المميّز Longévité AMOI In.Lab. أما الطقوس الأخرى فتندرج في نهج آيوما بريفيه المخصّص الذي توجّهه بصمة بشرتكِ. كما يتيح موعد «Votre peau, votre formule» تشخيصًا وتركيب عناية خاصة في 15 دقيقة.",
        ),
      },
      {
        q: l("How do I choose my treatment?", "كيف أختار عنايتي؟"),
        a: l(
          "Each ritual answers specific concerns: prevention, radiance, hydration, firmness or density. Your expert talks with you about your expectations and guides you from the needs revealed by your Empreinte Cutanée.",
          "يلبّي كل طقس اهتمامات محدّدة: الوقاية أو الإشراقة أو الترطيب أو الشدّ أو الكثافة. تتحدث خبيرتكِ معكِ عن توقعاتكِ وتوجّهكِ انطلاقًا من الاحتياجات التي كشفتها بصمة بشرتكِ.",
        ),
      },
      {
        q: l(
          "Can I extend the experience at home?",
          "هل يمكنني تمديد التجربة في المنزل؟",
        ),
        a: l(
          "Yes. At the end of the treatment, your expert can advise a personalised IOMA formula among Ma Crème Jour, Ma Crème Nuit, Mon Sérum and Mon Soin Yeux, and helps you choose the care and integrate it into your routine.",
          "نعم. في نهاية العناية، يمكن لخبيرتكِ أن توصي بتركيبة آيوما مخصّصة من بين Ma Crème Jour وMa Crème Nuit وMon Sérum وMon Soin Yeux، وترافقكِ في اختيار العناية ودمجها في روتينكِ.",
        ),
      },
      {
        q: l("Where can I discover IOMA Privé?", "أين يمكنني اكتشاف آيوما بريفيه؟"),
        a: l(
          "For its first address, IOMA Privé is set in a dedicated cabin in the heart of La Maison DESSANGE, 4, rue Marbeuf, 75008 Paris.",
          "في عنوانها الأول، تقع آيوما بريفيه في كابينة مخصّصة في قلب La Maison DESSANGE، 4, rue Marbeuf، 75008 باريس.",
        ),
      },
    ],
  },
  seo: {
    title: l(
      "IOMA Privé | Personalised Skin Care in Cabin | IOMA Paris",
      "آيوما بريفيه | عناية مخصّصة بالبشرة في الكابينة | آيوما باريس",
    ),
    description: l(
      "IOMA Privé, the IOMA in-cabin care experience: your Empreinte Cutanée guides the ritual and the massage, and In.Lab creates your Booster during the treatment. First address at La Maison DESSANGE, Paris.",
      "آيوما بريفيه، تجربة العناية في الكابينة من آيوما: بصمة بشرتكِ توجّه الطقس والتدليك، ويصنع In.Lab معزّزكِ أثناء العناية. العنوان الأول في La Maison DESSANGE بباريس.",
    ),
  },
} as const;
