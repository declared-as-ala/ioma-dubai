import { expect, test } from "@playwright/test";

// English and Arabic product pages must not show French interface text or French product copy,
// and must not show invented reviews, ratings or an AI summary.
const FRENCH =
  /\b(Appliquer|votre peau|Une peau|matin et soir|Livraison|Choisissez|Meilleure vente|Écrire un avis|Avis clients)\b/i;
for (const locale of ["en", "ar"]) {
  test(`product page (${locale}) shows no French and no invented reviews`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/shop/ma-creme-jour`, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(FRENCH);
    expect(text).not.toMatch(/64 avis|Sophie D\.|Fatima A\.|AI-generated|généré par IA/i);
  });
}
