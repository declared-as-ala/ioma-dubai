import { expect, test } from "@playwright/test";

// The product page must never scroll sideways on phones (root cause fixed: the `sm` breakpoint is 390px,
// so desktop-only gallery rules used to apply on large phones and widen the page).
const WIDTHS = [320, 375, 390, 430, 768];
for (const locale of ["en", "ar"]) {
  for (const width of WIDTHS) {
    test(`product page has no horizontal overflow at ${width}px (${locale})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/shop/gel-fraicheur-hydratant`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(800);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }
}
