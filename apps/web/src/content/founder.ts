/**
 * Jean Michel Karam page content. Every fact restates the official IOMA Paris page
 * (https://ioma-paris.com/pages/jean-michel-karam): engineer, researcher and entrepreneur; doctorate in
 * microelectronics and a specialist in MEMS; work in aeronautics and health, including at MEMSCAP; turn to
 * cosmetics and founding of IOMA in 2010; the IOMA Sphere that measures key skin parameters; In.Lab formulation
 * at the point of sale; products made in France. Nothing else is dated and no figure is added.
 * The wording is original editorial copy. EN and AR only (French is no longer a served locale).
 */
export type Loc = "en" | "ar";
export type L = Record<Loc, string>;
const l = (en: string, ar: string): L => ({ en, ar });

export const OFFICIAL_SITE = "https://jeanmichelkaram.com/";
export const OFFICIAL_YOUTUBE = "https://www.youtube.com/@jmkaramofficiel";

export const FOUNDER_IMAGES = {
  /** Official assets from the IOMA Paris founder page, stored locally (not hotlinked). */
  portrait: "/images/founder/jean-michel-karam.jpg",
  banner: "/images/founder/jean-michel-karam-banner.jpg",
  poster: "/images/founder/film-poster.jpg",
  lab: "/images/technology/i-diag.jpg",
  machine: "/images/brand/inlab-machine.webp",
  sphere: "/images/technology/sphere.webp",
  detail: "/images/brand/inlab-creme-jour.webp",
} as const;

/** The official page's film (self-hosted, silent loop). */
export const FOUNDER_VIDEO = {
  desktop: "/videos/founder/film.mp4",
  mobile: "/videos/founder/film-mobile.mp4",
} as const;

export const FOUNDER = {
  name: "Jean Michel Karam",
  metaTitle: l(
    "Jean Michel Karam | Founder of IOMA Paris | IOMA Dubai",
    "جان ميشال كرم | مؤسس آيوما باريس | آيوما دبي",
  ),
  metaDescription: l(
    "Discover Jean Michel Karam, the engineer, researcher and entrepreneur behind IOMA Paris, and the vision of scientific innovation and personalised skincare.",
    "تعرّفوا إلى جان ميشال كرم، المهندس والباحث ورائد الأعمال وراء آيوما باريس، ورؤيته للابتكار العلمي والعناية الشخصية بالبشرة.",
  ),
  pageTitle: l(
    "Jean Michel Karam — The Visionary Behind IOMA",
    "جان ميشال كرم — صاحب الرؤية وراء آيوما",
  ),
  hero: {
    kicker: l("The founder of IOMA Paris", "مؤسس آيوما باريس"),
    line: l("Where science meets the art of beauty.", "حيث يلتقي العلم بفنّ الجمال."),
    sub: l("Engineer, researcher and entrepreneur.", "مهندس وباحث ورائد أعمال."),
    scroll: l("Scroll", "تابعوا"),
    pause: l("Pause the film", "إيقاف الفيلم مؤقتًا"),
    play: l("Play the film", "تشغيل الفيلم"),
    soundOn: l("Turn the sound on", "تشغيل الصوت"),
    soundOff: l("Turn the sound off", "إيقاف الصوت"),
    portraitAlt: l(
      "Portrait of Jean Michel Karam, founder of IOMA Paris",
      "صورة جان ميشال كرم، مؤسس آيوما باريس",
    ),
  },
  banner: {
    kicker: l(
      "The entrepreneur of the Beautiful and the Good",
      "رائد أعمال الجميل والخيّر",
    ),
    title: l("Where science meets the art of beauty.", "حيث يلتقي العلم بفنّ الجمال."),
    body: l(
      "Engineer by training and passionate researcher, Jean Michel Karam turns ideas into concrete solutions: from microelectronics to personalised beauty, a path guided by technology and meaning.",
      "مهندس بالتكوين وباحث شغوف، يحوّل جان ميشال كرم الأفكار إلى حلول ملموسة: من الإلكترونيات الدقيقة إلى الجمال الشخصي، مسار تقوده التقنية والمعنى.",
    ),
    alt: l(
      "Jean Michel Karam smiling, in a dark jacket embroidered with a green rose",
      "جان ميشال كرم مبتسمًا ببدلة داكنة مطرّزة بوردة خضراء",
    ),
  },
  a: {
    kicker: l("I — The engineer", "١ — المهندس"),
    title: l(
      "The engineer behind personalised beauty.",
      "المهندس الذي يقف وراء الجمال الشخصي.",
    ),
    body: [
      l(
        "Jean Michel Karam holds a doctorate in microelectronics and is a specialist in MEMS: microelectromechanical systems, the tiny sensors that measure the physical world with great precision.",
        "يحمل جان ميشال كرم دكتوراه في الإلكترونيات الدقيقة، وهو متخصص في أنظمة MEMS، أي المستشعرات المجهرية التي تقيس العالم المادي بدقة عالية.",
      ),
      l(
        "He applied that expertise in aeronautics and in health, including at MEMSCAP, the company he founded in 1997, long before turning it towards the skin.",
        "وقد طبّق هذه الخبرة في مجالَي الطيران والصحة، ومنها في شركة MEMSCAP التي أسّسها عام 1997، قبل أن يوجّهها نحو البشرة بوقت طويل.",
      ),
    ],
    imageAlt: l(
      "Black-and-white portrait of Jean Michel Karam laughing",
      "صورة بالأبيض والأسود لجان ميشال كرم يضحك",
    ),
  },
  b: {
    kicker: l("II — The journey", "٢ — المسيرة"),
    title: l(
      "A journey rooted in scientific innovation.",
      "مسيرة متجذّرة في الابتكار العلمي.",
    ),
    steps: [
      {
        mark: l("Science", "العلم"),
        title: l("Microelectronics", "الإلكترونيات الدقيقة"),
        body: l(
          "A doctorate in microelectronics and a specialisation in MEMS lay the scientific foundation.",
          "دكتوراه في الإلكترونيات الدقيقة وتخصّص في MEMS يرسيان الأساس العلمي.",
        ),
      },
      {
        mark: l("1997", "1997"),
        title: l("MEMSCAP", "MEMSCAP"),
        body: l(
          "He founds MEMSCAP, taking MEMS technology into aeronautics and health.",
          "يؤسس MEMSCAP ويأخذ تقنية MEMS إلى مجالَي الطيران والصحة.",
        ),
      },
      {
        mark: l("2010", "2010"),
        title: l("IOMA", "آيوما"),
        body: l(
          "He founds IOMA, the first brand to bring skin diagnosis into cosmetics, and develops the IOMA Sphere to measure the key parameters of the skin.",
          "يؤسس آيوما، أول علامة تُدخل تشخيص البشرة إلى عالم مستحضرات التجميل، ويطوّر جهاز IOMA Sphere لقياس المعايير الأساسية للبشرة.",
        ),
      },
      {
        mark: l("Formulation", "التركيب"),
        title: l("In.Lab", "In.Lab"),
        body: l(
          "Care is formulated at the point of sale with the In.Lab, from what the skin has revealed.",
          "تُركَّب العناية في نقطة البيع بجهاز In.Lab انطلاقًا مما كشفته البشرة.",
        ),
      },
      {
        mark: l("Soft longevity", "طول العمر الهادئ"),
        title: l("myIEVA", "myIEVA"),
        body: l(
          "He creates myIEVA, a digital and intelligent beauty subscription designed to support a soft-longevity approach.",
          "يبتكر myIEVA، اشتراكًا رقميًا وذكيًا في الجمال يرافق كل شخص في نهج طول العمر الهادئ.",
        ),
      },
      {
        mark: l("Today", "اليوم"),
        title: l("IEVA Group", "مجموعة IEVA"),
        body: l(
          "Through IEVA Group, which brings all his brands together, he builds an ecosystem where each brand embodies an engaged innovation.",
          "عبر مجموعة IEVA التي تضم جميع علاماته، يبني منظومة تجسّد فيها كل علامة ابتكارًا ملتزمًا.",
        ),
      },
    ],
  },
  c: {
    kicker: l("III — The birth of IOMA", "٣ — ولادة آيوما"),
    title: l(
      "Care created to reveal the uniqueness of each skin.",
      "عناية صُمّمت لتُبرز تفرّد كل بشرة.",
    ),
    body: [
      l(
        "When Jean Michel Karam founded IOMA in 2010, he created the first brand to bring skin diagnosis into cosmetics, with a researcher's habit: measure first, then decide.",
        "حين أسّس جان ميشال كرم آيوما عام 2010، أنشأ أول علامة تُدخل تشخيص البشرة إلى مستحضرات التجميل، بعادة الباحث: أن يقيس أولًا ثم يقرّر.",
      ),
      l(
        "From that conviction, personalisation became the centre of the house. IOMA's products are made in France with clean formulations.",
        "ومن هذه القناعة أصبح التخصيص محور الدار. وتُصنَّع منتجات آيوما في فرنسا بتركيبات نظيفة.",
      ),
    ],
    imageAlt: l("An IOMA bespoke day cream", "كريم نهار مخصّص من آيوما"),
  },
  d: {
    kicker: l("IV — Technology meets skin", "٤ — حين تلتقي التقنية بالبشرة"),
    title: l("Innovation in the service of your skin.", "الابتكار في خدمة بشرتكِ."),
    body: l(
      "The IOMA Sphere reads the key parameters of the skin; the In.Lab turns what was read into a formula prepared for it. Two instruments, one idea: care that starts from the skin itself.",
      "يقرأ جهاز IOMA Sphere المعايير الأساسية للبشرة، ويحوّل جهاز In.Lab ما قُرئ إلى تركيبة مُعدّة لها. أداتان لفكرة واحدة: عناية تنطلق من البشرة نفسها.",
    ),
    cta: l("Explore our technology", "اكتشفوا تقنيتنا"),
    sphereAlt: l("The IOMA Sphere", "جهاز IOMA Sphere"),
    machineAlt: l("The IOMA In.Lab machine", "جهاز IOMA In.Lab"),
  },
  quote: {
    text: l(
      "Transmission is the very essence of innovation.",
      "التواصل ونقل المعرفة هما جوهر الابتكار.",
    ),
    original: "« La transmission est l'essence même de l'innovation. »",
    note: l(
      "Jean Michel Karam, as presented on the official IOMA Paris page (translated from French).",
      "جان ميشال كرم، كما ورد في الصفحة الرسمية لآيوما باريس (ترجمة عن الفرنسية).",
    ),
  },
  e: {
    kicker: l("V — Beyond IOMA", "٥ — ما بعد آيوما"),
    title: l(
      "The entrepreneur of the Beautiful and the Good.",
      "رائد أعمال الجميل والخيّر.",
    ),
    body: l(
      "Jean Michel Karam shares his entrepreneurial journey on his own platforms.",
      "يشارك جان ميشال كرم مسيرته في ريادة الأعمال عبر منصاته الخاصة.",
    ),
    site: l("Visit the official website", "زيارة الموقع الرسمي"),
    youtube: l("Discover his YouTube channel", "اكتشفوا قناته على يوتيوب"),
    external: l("opens in a new tab", "يفتح في نافذة جديدة"),
    youtubeNote: l("“Entrepreneur en vol”", "«Entrepreneur en vol»"),
    brand: l("The IOMA Paris house", "دار آيوما باريس"),
  },
} as const;
