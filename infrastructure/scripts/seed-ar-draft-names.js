// Idempotent. Stores Arabic NAME DRAFTS for review (products.arDraft). It never writes the live Arabic text:
// an administrator approves each draft in the product editor (SEO & translations tab).
// Brand names and technical references (In.Lab, CC Gel, SPF50+ PA++++, IEVA SkinDiag, H1/R1/CR...) stay in Latin script.
// Products that already have a draft (pending, approved or rejected) are skipped.
// Run:  mongosh <db> --eval 'var APPLY=true' infrastructure/scripts/seed-ar-draft-names.js   (without APPLY it only reports)
const APPLY = typeof globalThis.APPLY !== "undefined" ? globalThis.APPLY : false;

const N = {
  "ma-creme-jour": "كريمتي للنهار",
  "ma-creme-nuit": "كريمتي لليل",
  "mon-serum": "سيرومي",
  "mon-soin-yeux": "عنايتي للعيون",
  "gel-fraicheur-hydratant": "جل الانتعاش المرطّب",
  "serum-hydratant-optimum": "سيروم الترطيب الأمثل",
  "gelee-fraiche-demaquillante-yeux": "جل منعش لإزالة مكياج العيون",
  "lait-demaquillant-hydratant": "حليب منظّف مرطّب",
  "eau-de-soin-hydratante": "ماء العناية المرطّب",
  "masque-hydratant-oxygenant": "ماسك الترطيب والأكسجة",
  "creme-apaisante-jour-et-nuit": "كريم مهدّئ للنهار والليل",
  "soft-peeling": "Soft Peeling – تقشير لطيف",
  "emulsion-exfoliante-douce": "مستحلب مقشّر لطيف",
  "mousse-tonique-astringente": "موس تونيك قابض",
  "gel-reparateur-jour-et-nuit": "جل مُرمِّم للنهار والليل",
  "masque-absorbant": "ماسك ماص",
  "creme-hydratation-jeunesse-jour-et-nuit": "كريم ترطيب الشباب",
  "vitality-shot": "Vitality Shot – جرعة الحيوية",
  "cc-gel-soin-teinte-eclat-parfait": "CC Gel – عناية ملوّنة لإشراقة مثالية",
  "concentre-contour-yeux-jeunesse-eclair": "مركّز محيط العين – شباب فوري",
  "vitality-sleeping-mask": "Vitality Sleeping Mask – ماسك الليل للحيوية",
  "creme-regulatrice-matifiante-jour-et-nuit": "كريم منظّم ومطفئ للّمعان",
  "cell-protector-spf-50-pa": "Cell Protector SPF50+ PA++++ – واقٍ شمسي",
  "bright-pearl-essence": "Bright Pearl Essence – إسِنس اللؤلؤ المشرق",
  "elixir-anti-taches-lumiere": "إكسير مضاد للبقع – إشراقة",
  "nettoyant-exfoliant-lumiere": "منظّف مقشّر – إشراقة",
  "eau-de-soin-lumiere": "ماء العناية – إشراقة",
  "mousse-tonique-doux": "تونيك لطيف",
  "creme-genereuse-jour": "كريم سخي للنهار",
  "creme-genereuse-nuit": "كريم سخي لليل",
  "serum-genereux-extreme": "سيروم سخي فائق",
  "creme-genereuse-contour-des-yeux": "كريم سخي لمحيط العين",
  "ioma-lip-lift": "Lip Lift – مجدّد الشفاه",
  "creme-sublime-revitalisante": "كريم Sublime المجدّد للحيوية",
  "lift-contours-decollete": "Lift Contours – شدّ الرقبة والصدر",
  "booster-jeunesse-anti-age": "معزّز الشباب المضاد للشيخوخة",
  "sublime-oil": "Sublime Oil – زيت مضاد للتقدّم في السن",
  "masque-sublime-revitalisant": "ماسك Sublime المجدّد",
  "serum-intensif-resurfacant": "سيروم مكثّف لتجديد سطح البشرة",
  "genius-balm": "Genius Balm – بلسم",
  "voile-exfoliant-douceur": "مقشّر الجسم اللطيف",
  "creme-voluptueuse-corps": "كريم الجسم الفاخر",
  "shampoing-soin-purifiant": "شامبو عناية منقٍّ",
  "shampooing-soin-hydratant-anti-casse": "شامبو عناية مرطّب ضد التقصّف",
  "apres-shampooing-hydratation-fondamentale": "بلسم الترطيب الأساسي",
  "apres-shampooing-volumisant": "بلسم لإضفاء الكثافة",
  "apres-shampooing-reparateur": "بلسم مُرمِّم",
  "masque-en-baume-reparateur": "ماسك بلسم مُرمِّم للشعر",
  "serum-essence-hydratant-cheveux": "سيروم إسِنس مرطّب للشعر",
  "kit-de-patchs-cutanes-ieva-skindiag": "مجموعة لصقات تشخيص البشرة IEVA SkinDiag",
  "routine-eclat-peau-defatiguee": "روتين الإشراقة للبشرة المرهقة",
  "routine-par-jean-michel-karam-peau-hydratee": "روتين البشرة المرطّبة – بتوصية Jean Michel Karam",
  "carte-cadeau-ioma": "بطاقة هدية IOMA",
  "trio-protecteur-et-hydratant": "ثلاثي الحماية والترطيب",
  "rituel-expert-anti-age": "الطقس الخبير المضاد للشيخوخة",
  "trio-soin-expert-anti-taches": "ثلاثي العناية الخبيرة ضد البقع",
  "routine-sublime-anti-age": "روتين Sublime المضاد للشيخوخة",
  "duo-anti-taches": "ثنائي مضاد للبقع",
  "morning-routine": "روتين الصباح IOMA",
  "soins-reparateurs-cheveux": "عناية مُرمِّمة للشعر",
  "routine-anti-imperfections": "روتين مضاد للشوائب",
  "duo-zero-defaut": "ثنائي صفر عيوب",
  "duo-soins-du-corps": "ثنائي عناية الجسم",
  "optimum-moisture-serum-cabin-ibc104": "سيروم الترطيب الأمثل",
  "fresh-gel-eye-make-up-remover-cabin-ibc150": "جل منعش لإزالة مكياج العيون",
  "moisturizing-cleansing-milk-cabin-ibv174": "حليب منظّف مرطّب",
  "moisturizing-skin-care-water-cabin-ibv175": "ماء العناية المرطّب",
  "oxygenating-hydrating-mask-cabin-ibv276": "ماسك الترطيب والأكسجة",
  "fresh-hydrating-gel-cabin-ibv302": "جل الانتعاش المرطّب",
  "flash-youth-eye-contour-concentrate-cabin-ibv179": "مركّز محيط العين – شباب فوري",
  "vitality-sleeping-mask-cabin-ibv186": "Vitality Sleeping Mask – ماسك الليل للحيوية",
  "cc-gel-perfect-glow-tinted-gel-cabin-ibv222": "CC Gel – جل ملوّن لإشراقة مثالية",
  "ultimate-generous-serum-cabin-ibc114": "سيروم سخي فائق",
  "lip-lift-cabin-ibc149": "Lip Lift – مجدّد الشفاه",
  "lift-contours-cabin-ibc189": "Lift Contours – شدّ الملامح",
  "youth-booster-jar-cabin-ibc231": "معزّز الشباب (علبة)",
  "generous-eye-contour-cream-cabin-ibv115": "كريم سخي لمحيط العين",
  "sublime-revitalizing-cream-cabin-ibv168": "كريم Sublime المجدّد",
  "sublime-oil-cabin-ibv218": "Sublime Oil – زيت Sublime",
  "sublime-revitalizing-mask-cabin-ibv413": "ماسك Sublime المجدّد",
  "soft-peeling-cabin-ibc215": "Soft Peeling – تقشير لطيف",
  "soothing-cream-cabin-ibv116": "كريم مهدّئ",
  "astringent-toning-foam-cabin-ibc119": "موس تونيك قابض",
  "absorbent-mask-cabin-ibc121": "ماسك ماص",
  "gentle-exfoliating-emulsion-cabin-ibv108": "مستحلب مقشّر لطيف",
  "brightening-water-essence-cabin-ibv180": "ماء العناية المنوّر",
  "brightening-exfoliating-cleanser-cabin-ibv221": "منظّف مقشّر منوّر",
  "delightful-exfoliating-body-scrub-cabin-ibc008": "مقشّر الجسم اللطيف",
  "voluptuous-body-cream-cabin-ibc009": "كريم الجسم الفاخر",
  "self-warming-cleanser-cabin-ibv208": "منظّف ذاتي التسخين",
  "massage-oil-cabin-ibv209": "زيت التدليك",
  "oxygenating-drops-cabin-ibv210": "قطرات الأكسجة",
  "soothing-drops-cabin-ibv211": "قطرات مهدّئة",
  "self-warming-specific-zone-scrub-cabin-ibv300": "مقشّر ذاتي التسخين لمناطق محددة",
  "warming-detox-mask-cabin-ibv301": "ماسك ديتوكس مُدفّئ",
};
// In.Lab actives and concentrates (technical codes stay in Latin)
for (const code of ["H1", "H2", "H3", "R1", "R2", "R3", "R4", "R5"]) {
  const n = code.toLowerCase();
  const ar = "سيروم نشط In.Lab " + code;
  const ref = { h1: "ibp200", h2: "ibp201", h3: "ibp202", r1: "ibp203", r2: "ibp204", r3: "ibp205", r4: "ibp206", r5: "ibp207" }[n];
  N["in-lab-active-serum-" + n + "-" + ref] = ar;
  N["in-lab-active-serum-" + n + "-cabin-" + ref + "-cab"] = ar;
}
for (const [code, ref] of [["CR", "ibp208"], ["CI", "ibp209"], ["CP", "ibp210"], ["CC", "ibp211"]]) {
  const n = code.toLowerCase();
  const ar = "مركّز In.Lab " + code;
  N["in-lab-concentrate-" + n + "-" + ref] = ar;
  N["in-lab-concentrate-" + n + "-cabin-" + ref + "-cab"] = ar;
}

const out = { apply: APPLY, drafted: 0, skippedExisting: 0, unknownSlugs: [], productsWithoutDraft: [] };
const known = new Set(Object.keys(N));
db.products.find({ deletedAt: null }, { slug: 1, arDraft: 1 }).forEach((p) => {
  known.delete(p.slug);
  const ar = N[p.slug];
  if (!ar) return out.productsWithoutDraft.push(p.slug);
  if (p.arDraft) return out.skippedExisting++;
  out.drafted++;
  if (APPLY)
    db.products.updateOne(
      { _id: p._id, arDraft: { $exists: false } },
      {
        $set: {
          arDraft: {
            status: "draft",
            source: "Draft translation to be reviewed by a human",
            draftedAt: new Date(),
            fields: { name: ar },
          },
        },
      },
    );
});
out.unknownSlugs = [...known];
print(JSON.stringify(out));
