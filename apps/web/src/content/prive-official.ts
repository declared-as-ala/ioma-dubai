/**
 * IOMA Privé page content: a rewrite of the official IOMA Paris page (https://ioma-paris.com/pages/ioma-prive).
 * Every fact, figure, price and address is the official one; nothing is added. EN, FR and AR.
 * The official page names an "IA IOMA" that selects actives; this site no longer presents AI features, so the
 * wording here says that IOMA selects the actives for the measured needs.
 */
export type Loc = "en" | "fr" | "ar";
export type L = Record<Loc, string>;
const l = (en: string, ar: string, fr: string = en): L => ({ en, fr, ar });

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
    kicker: l("IOMA Privé", "آيوما بريفيه", "IOMA Privé"),
    title: l(
      "Your skin is unique. So is your care.",
      "بشرتكِ فريدة. وعنايتكِ كذلك.",
      "Votre peau est unique. Votre soin aussi.",
    ),
    marquee: l(
      "Beautiful Longevity · Empreinte Cutanée · In.Lab",
      "الجمال الدائم · بصمة البشرة · In.Lab",
      "Beautiful Longevity · Empreinte Cutanée · In.Lab",
    ),
    scroll: l("Scroll", "تابعوا", "Défiler"),
    alt: l(
      "A model during an IOMA Privé skin measurement",
      "عارضة أثناء قياس البشرة في آيوما بريفيه",
      "Une modèle lors d'une mesure de peau IOMA Privé",
    ),
  },
  story: {
    kicker: l(
      "IOMA, innovation in the service of your skin",
      "آيوما، الابتكار في خدمة بشرتكِ",
      "IOMA, l'innovation au service de votre peau",
    ),
    statement: l(
      "Because every skin is unique, its needs are too. They change with time, seasons, environment and daily life.",
      "لأن كل بشرة فريدة، فاحتياجاتها كذلك. وهي تتغيّر مع الزمن والفصول والبيئة والحياة اليومية.",
      "Parce que chaque peau est unique, ses besoins le sont aussi. Ils évoluent avec le temps, les saisons, l'environnement et le quotidien.",
    ),
    body: [
      l(
        "Founded in 2010 by Jean Michel Karam, an engineer with a doctorate in microelectronics, IOMA has placed knowledge of the skin at the heart of care since its creation.",
        "تأسست آيوما عام 2010 على يد جان ميشال كرم، المهندس الحاصل على دكتوراه في الإلكترونيات الدقيقة، ومنذ نشأتها جعلت معرفة البشرة في صميم العناية.",
        "Fondée en 2010 par Jean Michel Karam, ingénieur docteur en microélectronique, IOMA place depuis sa création la connaissance de la peau au cœur du soin.",
      ),
      l(
        "IOMA relies on its scientific expertise and its patented skin-diagnosis technologies to measure several parameters of the skin with precision: hydration, sebum, surface renewal and the skin barrier. This data helps understand what your skin needs and select the most suitable actives, for care as close as possible to your skin and how it evolves.",
        "تعتمد آيوما على خبرتها العلمية وتقنياتها المسجّلة ببراءة لتشخيص البشرة، لقياس عدة معايير بدقة: الترطيب والدهون والتجدد السطحي وحاجز البشرة. وتساعد هذه البيانات على فهم احتياجات بشرتكِ واختيار المكوّنات الفعّالة الأنسب، لعناية قريبة قدر الإمكان من بشرتكِ وتطوّرها.",
        "IOMA s'appuie sur son expertise scientifique et ses technologies brevetées de diagnostic cutané pour mesurer avec précision plusieurs paramètres de la peau : hydratation, sébum, renouvellement de surface et barrière cutanée. Ces données permettent de comprendre ce dont votre peau a besoin et de sélectionner les actifs les plus adaptés, pour un soin au plus près de votre peau et de son évolution.",
      ),
    ],
    pointsTitle: l(
      "IOMA technology in the service of your skin",
      "تقنية آيوما في خدمة بشرتكِ",
      "La technologie IOMA au service de votre peau",
    ),
    points: [
      l(
        "A precise measurement of its essential parameters",
        "قياس دقيق لمعاييرها الأساسية",
        "Une mesure précise de ses paramètres essentiels",
      ),
      l(
        "A better understanding of its needs",
        "فهم أفضل لاحتياجاتها",
        "Une meilleure compréhension de ses besoins",
      ),
      l(
        "A selection of actives to guide your bespoke formula",
        "اختيار مكوّنات فعّالة يوجّه تركيبتكِ الخاصة",
        "Une sélection d'actifs pour guider votre formule sur mesure",
      ),
    ],
    cabinAlt: l(
      "The IOMA Privé treatment cabin",
      "كابينة العناية في آيوما بريفيه",
      "La cabine de soin IOMA Privé",
    ),
  },
  longevity: {
    kicker: l("Beautiful Longevity", "الجمال الدائم", "Beautiful Longevity"),
    title: l(
      "Taking care of your skin, over time.",
      "العناية ببشرتكِ مع مرور الزمن.",
      "Prendre soin de votre peau, dans le temps.",
    ),
    body: [
      l(
        "Your skin evolves throughout your life. Seasons, environment, pace of life and hormonal variations change its needs. With Beautiful Longevity, IOMA does not look at skin through age alone, but through what it really needs today and how it evolves.",
        "تتطوّر بشرتكِ طوال حياتكِ. فالفصول والبيئة وإيقاع الحياة والتغيّرات الهرمونية تغيّر احتياجاتها. ومع الجمال الدائم، لا تنظر آيوما إلى البشرة من خلال العمر فقط، بل من خلال ما تحتاجه فعلًا اليوم وكيف تتطوّر.",
        "Votre peau évolue tout au long de votre vie. Les saisons, l'environnement, le rythme de vie et les variations hormonales changent ses besoins. Avec Beautiful Longevity, IOMA ne regarde pas la peau à travers l'âge seul, mais à travers ce dont elle a réellement besoin aujourd'hui et la façon dont elle évolue.",
      ),
      l(
        "This vision combines science, technology and expertise to understand your skin and support it over time: preserve its balance, reinforce what it needs and let the care evolve with it, rather than offering a fixed answer.",
        "تجمع هذه الرؤية بين العلم والتقنية والخبرة لفهم بشرتكِ ومرافقتها مع الزمن: الحفاظ على توازنها وتعزيز ما تحتاجه وتطوير العناية معها، بدل تقديم جواب ثابت.",
        "Cette vision associe science, technologie et expertise pour comprendre votre peau et l'accompagner dans le temps : préserver son équilibre, renforcer ce dont elle a besoin et faire évoluer le soin avec elle, plutôt que d'apporter une réponse figée.",
      ),
    ],
    line: l(
      "Your skin changes. Your care evolves with it.",
      "بشرتكِ تتغيّر. وعنايتكِ تتطوّر معها.",
      "Votre peau change. Votre soin évolue avec elle.",
    ),
  },
  born: {
    kicker: l(
      "From this vision, IOMA Privé was born",
      "من هذه الرؤية وُلد آيوما بريفيه",
      "De cette vision est né IOMA Privé",
    ),
    title: l(
      "Before you, this care did not exist.",
      "قبلكِ، لم تكن هذه العناية موجودة.",
      "Avant vous, ce soin n'existait pas.",
    ),
    body: [
      l(
        "With IOMA Privé, your Empreinte Cutanée (skin fingerprint) reveals the characteristics of your skin and lets your expert adapt every step of your care.",
        "مع آيوما بريفيه، تكشف بصمة بشرتكِ (Empreinte Cutanée) خصائص بشرتكِ وتتيح لخبيرتكِ تكييف كل خطوة من عنايتكِ.",
        "Avec IOMA Privé, votre Empreinte Cutanée révèle les caractéristiques de votre peau et permet à votre experte d'adapter chaque étape de votre soin.",
      ),
      l(
        "At the heart of the Longévité AMOI In.Lab ritual, technology goes further. A true miniaturised laboratory, In.Lab selects and precisely doses the suitable actives to create, before your eyes and in real time, the Booster used during your treatment: a formula created on demand, at the moment of your ritual.",
        "في قلب طقس Longévité AMOI In.Lab تذهب التقنية أبعد. فجهاز In.Lab مختبر مصغّر حقيقي، يختار المكوّنات الفعّالة المناسبة ويجرعها بدقة ليصنع أمام عينيكِ وفي الوقت الفعلي المعزّز (Booster) المستخدم أثناء العناية: تركيبة تُحضَّر عند الطلب في لحظة طقسكِ.",
        "Au cœur du rituel Longévité AMOI In.Lab, la technologie va plus loin. Véritable laboratoire miniaturisé, l'In.Lab sélectionne et dose avec précision les actifs adaptés pour créer, sous vos yeux et en temps réel, le Booster utilisé pendant votre soin : une formule créée à la demande, au moment de votre rituel.",
      ),
    ],
    line: l(
      "Your measurements. Your actives. Your formula.",
      "قياساتكِ. مكوّناتكِ الفعّالة. تركيبتكِ.",
      "Vos mesures. Vos actifs. Votre formule.",
    ),
    statsLabel: l("Skin diagnostics", "تشخيص للبشرة", "Diagnostics de peau"),
    formulas: l("Possible formulas", "تركيبة ممكنة", "Formules possibles"),
    stats: [
      {
        value: 1000000,
        prefix: "+",
        display: "+1M",
        label: l("Skin diagnostics", "تشخيص للبشرة", "Diagnostics de peau"),
      },
      {
        value: 80515,
        display: "80 515",
        label: l(
          "Possible formulas · Ma crème",
          "تركيبة ممكنة · Ma crème",
          "Formules possibles · Ma crème",
        ),
      },
      {
        value: 33281,
        display: "33 281",
        label: l(
          "Possible formulas · Mon sérum",
          "تركيبة ممكنة · Mon sérum",
          "Formules possibles · Mon sérum",
        ),
      },
      {
        value: 13257,
        display: "13 257",
        label: l(
          "Possible formulas · Mon Soin Yeux",
          "تركيبة ممكنة · Mon Soin Yeux",
          "Formules possibles · Mon Soin Yeux",
        ),
      },
    ],
  },
  steps: {
    eyebrow: l(
      "The experience in three steps",
      "التجربة في ثلاث خطوات",
      "L'expérience en trois étapes",
    ),
    ariaLabel: l(
      "The experience in three steps",
      "التجربة في ثلاث خطوات",
      "L'expérience en trois étapes",
    ),
    items: [
      {
        n: "01",
        kicker: l("Empreinte Cutanée", "بصمة البشرة", "Empreinte Cutanée"),
        title: l("The skin fingerprint.", "بصمة البشرة.", "L'empreinte de votre peau."),
        body: l(
          "With the face scan, the i-patch and the i-probe, IOMA precisely analyses the essential parameters of your skin: its hydration level, its sebum level, its surface renewal and its ability to protect itself. Together these measurements reveal your Empreinte Cutanée and your skin's needs at the time of the treatment.",
          "بفضل مسح الوجه وجهازَي i-patch وi-probe، تحلّل آيوما بدقة المعايير الأساسية لبشرتكِ: مستوى الترطيب ومستوى الدهون والتجدد السطحي والقدرة على حماية نفسها. وتكشف هذه القياسات معًا بصمة بشرتكِ واحتياجاتها لحظة العناية.",
          "Grâce au scan du visage, à l'i-patch et à l'i-probe, IOMA analyse avec précision les paramètres essentiels de votre peau : son niveau d'hydratation, son niveau de sébum, son renouvellement de surface et sa capacité à se protéger. Ensemble, ces mesures révèlent votre Empreinte Cutanée et les besoins de votre peau au moment du soin.",
        ),
      },
      {
        n: "02",
        kicker: l(
          "Your formula by In.Lab",
          "تركيبتكِ من In.Lab",
          "Votre formule par In.Lab",
        ),
        title: l(
          "A formula made before your eyes.",
          "تركيبة تُصنع أمام عينيكِ.",
          "Une formule créée sous vos yeux.",
        ),
        body: l(
          "From your Empreinte Cutanée, IOMA selects the actives suited to the measured needs of your skin. In.Lab then doses them precisely to formulate, before your eyes and in real time, the Booster used during your treatment.",
          "انطلاقًا من بصمة بشرتكِ، تختار آيوما المكوّنات الفعّالة المناسبة للاحتياجات المقيسة. ثم يجرعها In.Lab بدقة ليصنع أمام عينيكِ وفي الوقت الفعلي المعزّز المستخدم أثناء العناية.",
          "À partir de votre Empreinte Cutanée, IOMA sélectionne les actifs adaptés aux besoins mesurés de votre peau. L'In.Lab les dose ensuite avec précision pour formuler, sous vos yeux et en temps réel, le Booster utilisé pendant votre soin.",
        ),
      },
      {
        n: "03",
        kicker: l(
          "The personalised massage",
          "التدليك المخصّص",
          "Le massage personnalisé",
        ),
        title: l(
          "A massage guided by your skin.",
          "تدليك تقوده بشرتكِ.",
          "Un massage guidé par votre peau.",
        ),
        body: l(
          "Your Empreinte Cutanée also guides the massage. Your expert combines IOMA's signature gestures according to the measured needs of your skin, to create a suitable and fully personalised protocol.",
          "توجّه بصمة بشرتكِ التدليك أيضًا. فتجمع خبيرتكِ حركات آيوما المميّزة وفق احتياجات بشرتكِ المقيسة، لتصنع بروتوكولًا مناسبًا ومخصّصًا بالكامل.",
          "Votre Empreinte Cutanée guide aussi le massage. Votre experte associe les gestes signatures d'IOMA en fonction des besoins mesurés de votre peau, pour créer un protocole adapté et entièrement personnalisé.",
        ),
      },
    ],
  },
  menu: {
    kicker: l("The treatment menu", "قائمة العناية", "La carte des soins"),
    title: l(
      "One experience. Several ways to live it.",
      "تجربة واحدة. عدّة طرق لعيشها.",
      "Une expérience. Plusieurs façons de la vivre.",
    ),
    body: l(
      "Radiance, hydration, firmness or mature skin: each ritual answers a need and is personalised through your Empreinte Cutanée.",
      "إشراقة أو ترطيب أو شدّ أو بشرة ناضجة: كل طقس يلبّي حاجة ويُخصَّص عبر بصمة بشرتكِ.",
      "Éclat, hydratation, fermeté ou peau mature : chaque rituel répond à un besoin et se personnalise grâce à votre Empreinte Cutanée.",
    ),
    signature: l("The signature ritual", "الطقس المميّز", "Le rituel signature"),
    min: l("min", "د", "min"),
    rituals: [
      {
        name: l("Bouclier Longévité", "Bouclier Longévité", "Bouclier Longévité"),
        tags: l(
          "Prevention · 25–40 years · Beautiful Longevity",
          "الوقاية · 25–40 سنة · الجمال الدائم",
          "Prévention · 25–40 ans · Beautiful Longevity",
        ),
        text: l(
          "A prevention ritual that accompanies your skin over time.",
          "طقس وقاية يرافق بشرتكِ مع الزمن.",
          "Un rituel de prévention qui accompagne votre peau dans le temps.",
        ),
        min: 60,
        eur: 90,
      },
      {
        name: l("L'Éclat Absolu", "L'Éclat Absolu", "L'Éclat Absolu"),
        tags: l(
          "Radiance · Texture · Complexion",
          "الإشراقة · الملمس · لون البشرة",
          "Éclat · Texture · Teint",
        ),
        text: l(
          "To reveal radiance and enhance the texture and evenness of the complexion.",
          "لإبراز الإشراقة وتحسين الملمس وتوحيد لون البشرة.",
          "Pour révéler l'éclat et sublimer la texture et l'uniformité du teint.",
        ),
        min: 60,
        eur: 127,
      },
      {
        name: l("Rituel Glass Skin", "Rituel Glass Skin", "Rituel Glass Skin"),
        tags: l("Hydration · Glow", "الترطيب · التوهّج", "Hydratation · Éclat"),
        text: l(
          "A ritual dedicated to the hydration and luminosity of the skin.",
          "طقس مخصّص لترطيب البشرة وإشراقها.",
          "Un rituel dédié à l'hydratation et à la luminosité de la peau.",
        ),
        min: 60,
        eur: 127,
      },
      {
        name: l("Le Lifting Naturel", "Le Lifting Naturel", "Le Lifting Naturel"),
        tags: l(
          "Firmness · Oval · Wrinkles",
          "الشدّ · محيط الوجه · التجاعيد",
          "Fermeté · Ovale · Rides",
        ),
        text: l(
          "A treatment targeting firmness, the oval of the face and wrinkles.",
          "عناية تستهدف الشدّ ومحيط الوجه والتجاعيد.",
          "Un soin ciblant la fermeté, l'ovale du visage et les rides.",
        ),
        min: 60,
        eur: 160,
      },
      {
        name: l(
          "Rituel Longévité Absolue",
          "Rituel Longévité Absolue",
          "Rituel Longévité Absolue",
        ),
        tags: l(
          "Density · Mature skin",
          "الكثافة · البشرة الناضجة",
          "Densité · Peau mature",
        ),
        text: l(
          "A ritual designed for the specific needs of mature skin.",
          "طقس مصمّم لاحتياجات البشرة الناضجة.",
          "Un rituel conçu pour les besoins spécifiques de la peau mature.",
        ),
        min: 90,
        eur: 180,
      },
      {
        name: l(
          "Longévité AMOI In.Lab",
          "Longévité AMOI In.Lab",
          "Longévité AMOI In.Lab",
        ),
        tags: l("Signature ritual", "الطقس المميّز", "Rituel signature"),
        text: l(
          "Your Empreinte Cutanée, a Booster created during your appointment and IOMA's signature gestures.",
          "بصمة بشرتكِ، ومعزّز يُصنع أثناء موعدكِ، وحركات آيوما المميّزة.",
          "Votre Empreinte Cutanée, un Booster créé pendant votre rendez-vous et les gestes signatures d'IOMA.",
        ),
        min: 90,
        eur: 230,
        signature: true,
      },
      {
        name: l(
          "Votre peau, votre formule",
          "Votre peau, votre formule",
          "Votre peau, votre formule",
        ),
        tags: l(
          "Diagnosis · Formulation",
          "التشخيص · التركيب",
          "Diagnostic · Formulation",
        ),
        text: l(
          "Skin diagnosis and formulation of a bespoke care.",
          "تشخيص البشرة وتركيب عناية خاصة.",
          "Diagnostic de peau et formulation d'un soin sur mesure.",
        ),
        min: 15,
        eur: 145,
      },
    ],
  },
  home: {
    kicker: l("After your appointment", "بعد موعدكِ", "Après votre rendez-vous"),
    title: l(
      "Bespoke in the cabin. Bespoke at home.",
      "مخصّص في الكابينة. ومخصّص في منزلكِ.",
      "Sur mesure en cabine. Sur mesure à la maison.",
    ),
    body: l(
      "At the end of the treatment, your expert advises a personalised IOMA formula according to your Empreinte Cutanée, to extend the ritual at home. You leave with a better knowledge of your skin and advice for your routine.",
      "في نهاية العناية، توصي خبيرتكِ بتركيبة آيوما مخصّصة وفق بصمة بشرتكِ، لتمديد الطقس في المنزل. تغادرين وقد عرفتِ بشرتكِ أكثر ومعكِ نصائح لروتينكِ.",
      "À la fin du soin, votre experte vous conseille une formule IOMA personnalisée selon votre Empreinte Cutanée, pour prolonger le rituel à la maison. Vous repartez avec une meilleure connaissance de votre peau et des conseils pour votre routine.",
    ),
    cta: l(
      "Discover IOMA bespoke care",
      "اكتشفوا عناية آيوما المخصّصة",
      "Découvrir les soins sur mesure IOMA",
    ),
    alt: l(
      "An IOMA bespoke skincare product",
      "منتج عناية مخصّص من آيوما",
      "Un soin sur mesure IOMA",
    ),
  },
  dessange: {
    kicker: l(
      "For the first time at DESSANGE",
      "للمرة الأولى لدى DESSANGE",
      "Pour la première fois chez DESSANGE",
    ),
    title: l(
      "Two beauty expertises, one requirement: personalisation.",
      "خبرتان في الجمال، ومطلب واحد: التخصيص.",
      "Deux expertises beauté, une même exigence : la personnalisation.",
    ),
    body: l(
      "For its first address, IOMA Privé settles within the flagship of Maison DESSANGE, in the heart of Paris, in a dedicated cabin.",
      "في عنوانها الأول، تستقر آيوما بريفيه داخل المتجر الرئيسي لدار DESSANGE في قلب باريس، في كابينة مخصّصة.",
      "Pour sa première adresse, IOMA Privé s'installe au sein du flagship de la Maison DESSANGE, au cœur de Paris, dans une cabine dédiée.",
    ),
    place: l("La Maison DESSANGE", "La Maison DESSANGE", "La Maison DESSANGE"),
    address: ["4, rue Marbeuf", "75008 Paris"],
    hoursTitle: l("Opening hours", "ساعات العمل", "Horaires d'ouverture"),
    hours: [
      l("Monday: 10am – 6pm", "الإثنين: 10 صباحًا – 6 مساءً", "Lundi : 10 h – 18 h"),
      l(
        "Tuesday to Saturday: 9am – 7pm",
        "من الثلاثاء إلى السبت: 9 صباحًا – 7 مساءً",
        "Du mardi au samedi : 9 h – 19 h",
      ),
      l("Closed on Sunday", "مغلق يوم الأحد", "Fermé le dimanche"),
    ],
    appointmentTitle: l("Appointments", "المواعيد", "Rendez-vous"),
    phone: "+33 1 43 59 31 31",
    alt: l(
      "The Maison DESSANGE flagship",
      "المتجر الرئيسي لدار DESSANGE",
      "Le flagship de la Maison DESSANGE",
    ),
    allianceAlt: l(
      "IOMA and DESSANGE logos",
      "شعارا آيوما وDESSANGE",
      "Logos IOMA et DESSANGE",
    ),
  },
  faq: {
    title: l("Questions", "أسئلة", "Questions"),
    items: [
      {
        q: l("What is IOMA Privé?", "ما هو آيوما بريفيه؟", "Qu'est-ce qu'IOMA Privé ?"),
        a: l(
          "IOMA Privé is IOMA's in-cabin care experience. The measurement of your skin establishes your Empreinte Cutanée and guides the personalisation of the ritual and the massage. With Longévité AMOI In.Lab, this approach goes as far as creating a bespoke Booster, formulated before your eyes during your appointment.",
          "آيوما بريفيه هو تجربة العناية في الكابينة من آيوما. يحدّد قياس بشرتكِ بصمتها ويوجّه تخصيص الطقس والتدليك. ومع Longévité AMOI In.Lab يصل هذا النهج إلى صنع معزّز خاص يُركَّب أمام عينيكِ أثناء موعدكِ.",
          "IOMA Privé est l'expérience de soin en cabine d'IOMA. La mesure de votre peau établit votre Empreinte Cutanée et guide la personnalisation du rituel et du massage. Avec Longévité AMOI In.Lab, cette approche va jusqu'à la création d'un Booster sur mesure, formulé sous vos yeux pendant votre rendez-vous.",
        ),
      },
      {
        q: l(
          "Do all the rituals include In.Lab?",
          "هل تشمل جميع الطقوس In.Lab؟",
          "Tous les rituels incluent-ils l'In.Lab ?",
        ),
        a: l(
          'The In.Lab Booster formulation is offered in the signature ritual Longévité AMOI In.Lab. The other rituals are part of IOMA Privé\'s personalised approach, guided by your Empreinte Cutanée. The "Votre peau, votre formule" appointment also offers a diagnosis and the formulation of a bespoke care in 15 minutes.',
          "يُقدَّم تركيب المعزّز بواسطة In.Lab في الطقس المميّز Longévité AMOI In.Lab. أما الطقوس الأخرى فتندرج في نهج آيوما بريفيه المخصّص الذي توجّهه بصمة بشرتكِ. كما يتيح موعد «Votre peau, votre formule» تشخيصًا وتركيب عناية خاصة في 15 دقيقة.",
          "Le Booster In.Lab est proposé dans le rituel signature Longévité AMOI In.Lab. Les autres rituels s'inscrivent dans l'approche personnalisée d'IOMA Privé, guidée par votre Empreinte Cutanée. Le rendez-vous « Votre peau, votre formule » propose aussi un diagnostic et la formulation d'un soin sur mesure en 15 minutes.",
        ),
      },
      {
        q: l(
          "How do I choose my treatment?",
          "كيف أختار عنايتي؟",
          "Comment choisir mon soin ?",
        ),
        a: l(
          "Each ritual answers specific concerns: prevention, radiance, hydration, firmness or density. Your expert talks with you about your expectations and guides you from the needs revealed by your Empreinte Cutanée.",
          "يلبّي كل طقس اهتمامات محدّدة: الوقاية أو الإشراقة أو الترطيب أو الشدّ أو الكثافة. تتحدث خبيرتكِ معكِ عن توقعاتكِ وتوجّهكِ انطلاقًا من الاحتياجات التي كشفتها بصمة بشرتكِ.",
          "Chaque rituel répond à des préoccupations précises : prévention, éclat, hydratation, fermeté ou densité. Votre experte échange avec vous sur vos attentes et vous guide à partir des besoins révélés par votre Empreinte Cutanée.",
        ),
      },
      {
        q: l(
          "Can I extend the experience at home?",
          "هل يمكنني تمديد التجربة في المنزل؟",
          "Puis-je prolonger l'expérience à la maison ?",
        ),
        a: l(
          "Yes. At the end of the treatment, your expert can advise a personalised IOMA formula among Ma Crème Jour, Ma Crème Nuit, Mon Sérum and Mon Soin Yeux, and helps you choose the care and integrate it into your routine.",
          "نعم. في نهاية العناية، يمكن لخبيرتكِ أن توصي بتركيبة آيوما مخصّصة من بين Ma Crème Jour وMa Crème Nuit وMon Sérum وMon Soin Yeux، وترافقكِ في اختيار العناية ودمجها في روتينكِ.",
          "Oui. À la fin du soin, votre experte peut vous conseiller une formule IOMA personnalisée parmi Ma Crème Jour, Ma Crème Nuit, Mon Sérum et Mon Soin Yeux, et vous aide à choisir le soin et à l'intégrer à votre routine.",
        ),
      },
      {
        q: l(
          "Where can I discover IOMA Privé?",
          "أين يمكنني اكتشاف آيوما بريفيه؟",
          "Où découvrir IOMA Privé ?",
        ),
        a: l(
          "For its first address, IOMA Privé is set in a dedicated cabin in the heart of La Maison DESSANGE, 4, rue Marbeuf, 75008 Paris.",
          "في عنوانها الأول، تقع آيوما بريفيه في كابينة مخصّصة في قلب La Maison DESSANGE، 4, rue Marbeuf، 75008 باريس.",
          "Pour sa première adresse, IOMA Privé est installé dans une cabine dédiée au cœur de La Maison DESSANGE, 4, rue Marbeuf, 75008 Paris.",
        ),
      },
    ],
  },
  seo: {
    title: l(
      "IOMA Privé | Personalised Skin Care in Cabin | IOMA Paris",
      "آيوما بريفيه | عناية مخصّصة بالبشرة في الكابينة | آيوما باريس",
      "IOMA Privé | Soins personnalisés en cabine | IOMA Paris",
    ),
    description: l(
      "IOMA Privé, the IOMA in-cabin care experience: your Empreinte Cutanée guides the ritual and the massage, and In.Lab creates your Booster during the treatment. First address at La Maison DESSANGE, Paris.",
      "آيوما بريفيه، تجربة العناية في الكابينة من آيوما: بصمة بشرتكِ توجّه الطقس والتدليك، ويصنع In.Lab معزّزكِ أثناء العناية. العنوان الأول في La Maison DESSANGE بباريس.",
      "IOMA Privé, l'expérience de soin en cabine d'IOMA : votre Empreinte Cutanée guide le rituel et le massage, et l'In.Lab crée votre Booster pendant le soin. Première adresse à La Maison DESSANGE, Paris.",
    ),
  },
} as const;
