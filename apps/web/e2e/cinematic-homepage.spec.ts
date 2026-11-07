import { test, expect } from "@playwright/test";

// Exercise the real local reel with the API unavailable, without requiring commerce fixtures.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"message":"Preview API unavailable"}',
    }),
  );
});

test("cinematic composition fits all supported widths and RTL", async ({ page }) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const locale of ["en", "ar"]) {
    await page.goto(`/${locale}`);
    const hero = page.getByTestId("cinematic-hero");
    await expect(hero).toBeVisible();
    for (const width of [390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        )
        .toBe(true);
      const controls = hero.locator("button");
      for (const control of await controls.all()) {
        const box = await control.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.y + box!.height).toBeLessThanOrEqual(900);
      }
      await page.screenshot({ path: `../../artifacts/cinematic-${locale}-${width}.png` });
    }
    await expect(hero.locator("video").first()).toHaveJSProperty("paused", true);
    await expect(page.getByTestId("hero-discover")).toHaveAttribute(
      "href",
      `/${locale}/maison`,
    );
  }
});

test("real chapters, playback, menu and scroll remain interactive", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  const hero = page.getByTestId("cinematic-hero");
  const playback = page.getByTestId("hero-playback");
  await expect(playback).toHaveAccessibleName("Play video");
  await hero.getByRole("button", { name: "02 In.Lab" }).click();
  await expect(hero.getByRole("button", { name: "02 In.Lab" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await playback.click();
  const second = hero.locator("video").nth(1);
  await expect(second).toHaveJSProperty("paused", false);
  await expect
    .poll(() => second.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0);
  await playback.click();
  await expect(second).toHaveJSProperty("paused", true);
  await expect(hero.locator("video").first()).toHaveJSProperty("paused", true);
  await playback.click();
  await second.evaluate((v: HTMLVideoElement) => {
    v.currentTime = v.duration - 0.2;
  });
  await expect(hero.getByRole("button", { name: "03 Precision" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await playback.click();
  await page.getByTestId("mobile-nav-trigger").click();
  await expect(page.getByTestId("mobile-nav")).toBeVisible();
  await page.keyboard.press("Escape");
  await hero.getByRole("link", { name: "Explore the collection" }).click();
  await expect(page.locator("#home-collection")).toBeFocused();
});
