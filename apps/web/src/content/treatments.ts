// Sprint 3 seed content for the Treatments listing — real, general
// descriptions of protocol categories (diagnosis-led, range-aligned), not
// fabricated specific outcomes, pricing, or duration claims beyond a
// reasonable in-institute session length. Pending the real Sprint 9
// Treatment/Protocol backend (see DATA_MODEL.md) — structured so migrating
// to API-backed data is a data swap, not a rewrite.
import type { Locale } from "@ioma/config";
import type { ProductRangeKey } from "@ioma/config";

export interface Treatment {
  slug: string;
  range?: ProductRangeKey;
  name: Record<Locale, string>;
  summary: Record<Locale, string>;
  body: Record<Locale, string[]>;
  durationMinutes: number;
}

export const TREATMENTS: Treatment[] = [
  {
    slug: "diagnosis-consultation",
    name: {
      en: "Diagnosis & Consultation",
      fr: "Diagnostic & Consultation",
      ar: "التشخيص والاستشارة",
    },
    summary: {
      en: "The starting point for every in-institute visit — a professional reading of your skin, confirmed and explained.",
      fr: "Le point de départ de chaque visite en institut — une lecture professionnelle de votre peau, confirmée et expliquée.",
      ar: "نقطة البداية لكل زيارة في المعهد — قراءة احترافية لبشرتكِ، مؤكدة وموضحة.",
    },
    body: {
      en: [
        "Every treatment at an IOMA partner institute begins the same way: with a diagnosis, not an assumption. A trained specialist reads your skin's current state with high-precision diagnostic devices, confirming your skin profile and parameters from the start.",
        "You'll leave with a clear explanation of your skin's profile and a specific recommendation — whether that's a home routine, a specific in-cabin treatment, or both.",
      ],
      fr: [
        "Chaque soin dans un institut partenaire IOMA commence de la même façon : par un diagnostic, jamais par une supposition. Un spécialiste formé lit l'état actuel de votre peau à l'aide d'appareils de diagnostic haute précision, confirmant vos paramètres cutanés dès le départ.",
        "Vous repartez avec une explication claire du profil de votre peau et une recommandation précise — qu'il s'agisse d'une routine à domicile, d'un soin en cabine spécifique, ou des deux.",
      ],
      ar: [
        "يبدأ كل علاج في معهد شريك لآيوما بالطريقة ذاتها: بتشخيص، لا بافتراض. يقرأ أخصائي مدرب الحالة الحالية لبشرتكِ باستخدام أجهزة تشخيص عالية الدقة، مؤكداً خصائص بشرتكِ ومعاييرها منذ البداية.",
        "ستغادرين بشرح واضح لملف بشرتكِ وتوصية محددة — سواء كانت روتيناً منزلياً، علاجاً محدداً في الكابينة، أو كليهما.",
      ],
    },
    durationMinutes: 30,
  },
  {
    slug: "hydra-protocol",
    range: "hydra",
    name: { en: "Hydra Protocol", fr: "Protocole Hydra", ar: "بروتوكول هيدرا" },
    summary: {
      en: "A deep hydration treatment for skin that feels tight, dull, or dehydrated.",
      fr: "Un soin d'hydratation profonde pour les peaux tiraillées, ternes ou déshydratées.",
      ar: "علاج ترطيب عميق للبشرة المشدودة أو الباهتة أو الجافة.",
    },
    body: {
      en: [
        "Built around the Hydra range, this in-cabin protocol targets skin showing signs of dehydration — tightness, dullness, or fine lines that appear more pronounced by the end of the day.",
        "The specialist applies the Hydra range's formulas in a specific sequence and technique designed to restore comfort during the session, with a home routine recommended to maintain results.",
      ],
      fr: [
        "Construit autour de la gamme Hydra, ce protocole en cabine cible les peaux montrant des signes de déshydratation — tiraillements, teint terne ou ridules plus marquées en fin de journée.",
        "Le spécialiste applique les formules de la gamme Hydra selon une séquence et une technique précises conçues pour restaurer le confort pendant la séance, avec une routine à domicile recommandée pour entretenir les résultats.",
      ],
      ar: [
        "مبني حول تشكيلة هيدرا، يستهدف هذا البروتوكول في الكابينة البشرة التي تظهر عليها علامات الجفاف — الشد أو الباهتان أو الخطوط الدقيقة الأكثر وضوحاً مع نهاية اليوم.",
        "يطبق الأخصائي تركيبات تشكيلة هيدرا وفق تسلسل وتقنية محددين لاستعادة الراحة خلال الجلسة، مع التوصية بروتين منزلي للحفاظ على النتائج.",
      ],
    },
    durationMinutes: 60,
  },
  {
    slug: "renew-protocol",
    range: "renew",
    name: { en: "Renew Protocol", fr: "Protocole Renew", ar: "بروتوكول رينيو" },
    summary: {
      en: "A firming, renewing treatment for the first visible signs of time.",
      fr: "Un soin raffermissant et renouvelant pour les premiers signes visibles du temps.",
      ar: "علاج شدّ وتجديد لأولى علامات الزمن المرئية.",
    },
    body: {
      en: [
        "The Renew Protocol pairs the Renew range's formulas with a specialist-led massage technique focused on firmness and skin renewal, for those beginning to notice a loss of elasticity or the first fine lines.",
        "Sessions are typically recommended as part of a short series rather than a one-time visit, with progress reviewed at each diagnosis re-read.",
      ],
      fr: [
        "Le Protocole Renew associe les formules de la gamme Renew à une technique de massage réalisée par un spécialiste, centrée sur la fermeté et le renouvellement cutané, pour celles qui commencent à observer une perte d'élasticité ou les premières ridules.",
        "Les séances sont généralement recommandées dans le cadre d'une courte série plutôt qu'en une seule visite, avec un suivi des progrès à chaque relecture de diagnostic.",
      ],
      ar: [
        "يجمع بروتوكول رينيو بين تركيبات تشكيلة رينيو وتقنية تدليك يقودها أخصائي، تركز على الشد وتجدد البشرة، لمن بدأن يلاحظن فقدان المرونة أو ظهور أولى الخطوط الدقيقة.",
        "يُنصح عادة بالجلسات ضمن سلسلة قصيرة بدلاً من زيارة واحدة، مع متابعة التقدم في كل إعادة قراءة للتشخيص.",
      ],
    },
    durationMinutes: 75,
  },
  {
    slug: "calm-protocol",
    range: "calm",
    name: { en: "Calm Protocol", fr: "Protocole Calm", ar: "بروتوكول كالم" },
    summary: {
      en: "A soothing treatment for reactive, sensitive, or redness-prone skin.",
      fr: "Un soin apaisant pour les peaux réactives, sensibles ou sujettes aux rougeurs.",
      ar: "علاج مهدئ للبشرة الحساسة والمتفاعلة والمعرضة للاحمرار.",
    },
    body: {
      en: [
        "Designed for skin that reacts easily to heat, climate change, or new products, the Calm Protocol uses the Calm range in a gentle, low-friction technique intended to reduce visible redness and discomfort during the session.",
        "Particularly relevant after intense sun exposure or travel between very different climates.",
      ],
      fr: [
        "Conçu pour les peaux qui réagissent facilement à la chaleur, aux changements de climat ou à de nouveaux produits, le Protocole Calm utilise la gamme Calm avec une technique douce et à faible friction, destinée à réduire les rougeurs visibles et l'inconfort pendant la séance.",
        "Particulièrement pertinent après une forte exposition au soleil ou un voyage entre des climats très différents.",
      ],
      ar: [
        "مصمم للبشرة التي تتفاعل بسهولة مع الحرارة أو تغير المناخ أو المنتجات الجديدة، يستخدم بروتوكول كالم تشكيلة كالم بتقنية لطيفة قليلة الاحتكاك، تهدف لتقليل الاحمرار الظاهر والانزعاج خلال الجلسة.",
        "مناسب بشكل خاص بعد التعرض الشديد للشمس أو السفر بين مناخات مختلفة جداً.",
      ],
    },
    durationMinutes: 60,
  },
];
