import { expect, type Page, test } from "@playwright/test";

const locales = ["en", "fr", "ar"] as const;

const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1440", width: 1440, height: 900 },
] as const;

const publicRoutes = [
  "/design-system",
  "/",
  "/maison",
  "/technology",
  "/professionals",
  "/contact",
  "/faq",
  "/treatments",
  "/treatments/diagnosis-consultation",
  "/treatments/hydra-protocol",
  "/treatments/renew-protocol",
  "/treatments/calm-protocol",
  "/journal",
  "/journal/dubai-summer-barrier-routine",
  "/journal/reading-a-diagnosis",
  "/privacy-policy",
  "/cookie-policy",
  "/shipping-policy",
  "/return-policy",
  "/terms-and-conditions",
  "/accessibility-statement",
  "/ai-consent",
] as const;

const commerceAndAuthRoutes = [
  "/shop",
  "/shop/hydra-serum-intense",
  "/cart",
  "/checkout",
  "/wishlist",
  "/login",
  "/register",
] as const;

const accountRoutes = [
  "/account",
  "/account/profile",
  "/account/addresses",
  "/account/orders",
  "/account/security",
  "/account/delete",
] as const;

const matrix = [
  ...viewports.map((viewport) => ({ locale: "en" as const, viewport })),
  ...locales.flatMap((locale) =>
    locale === "en"
      ? []
      : viewports
          .filter(({ width }) => width === 390 || width === 768)
          .map((viewport) => ({ locale, viewport })),
  ),
];

async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function expectNoDocumentOverflow(page: Page, label: string) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  const overflowingElements =
    dimensions.scrollWidth > dimensions.clientWidth
      ? await page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;
          return Array.from(document.querySelectorAll<HTMLElement>("body *"))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.right > viewportWidth + 1 || rect.left < -1;
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                tag: element.tagName,
                className: typeof element.className === "string" ? element.className : "",
                text: element.textContent?.trim().slice(0, 80) ?? "",
                left: Math.round(rect.left),
                right: Math.round(rect.right),
              };
            })
            .slice(0, 20);
        })
      : [];
  expect(
    dimensions.scrollWidth,
    `${label}: document width ${dimensions.scrollWidth}px exceeded ${dimensions.clientWidth}px; offenders: ${JSON.stringify(overflowingElements)}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth);
}

async function undersizedControls(page: Page) {
  return page.evaluate(() => {
    const selector = [
      "a[href]",
      "button:not([data-slot='checkbox']):not([data-slot='switch'])",
      "[role='button']",
      "[role='radio']",
      "[role='tab']",
      "input:not([type='hidden'])",
      "select",
    ].join(",");

    return [...new Set(document.querySelectorAll<HTMLElement>(selector))]
      .filter((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          element.getAttribute("aria-hidden") !== "true" &&
          !element.closest('[aria-hidden="true"]') &&
          box.width > 0 &&
          box.height > 0
        );
      })
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          label:
            element.getAttribute("aria-label") ??
            element.textContent?.trim().slice(0, 60) ??
            element.tagName,
          width: Math.round(box.width),
          height: Math.round(box.height),
        };
      })
      .filter(({ width, height }) => width < 44 || height < 44);
  });
}

for (const { locale, viewport } of matrix) {
  test(`${locale} route matrix has no overflow at ${viewport.name}px`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(viewport);

    const failures: string[] = [];
    for (const route of [...publicRoutes, ...commerceAndAuthRoutes]) {
      const path = `/${locale}${route}`;
      const response = await page.goto(path);
      if (!response || response.status() >= 400) {
        failures.push(`${path}: HTTP ${response?.status() ?? "no response"}`);
        continue;
      }

      await settle(page);
      const html = page.locator("html");
      await expect(html).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      if (dimensions.scrollWidth > dimensions.clientWidth) {
        const offenders = await page.evaluate(() => {
          const width = document.documentElement.clientWidth;
          return Array.from(document.querySelectorAll<HTMLElement>("body *"))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.right > width + 1 || rect.left < -1;
            })
            .map((element) => ({
              tag: element.tagName,
              text: element.textContent?.trim().slice(0, 60) ?? "",
              className: typeof element.className === "string" ? element.className : "",
            }))
            .slice(0, 10);
        });
        failures.push(
          `${path}: ${dimensions.scrollWidth}px > ${dimensions.clientWidth}px; ${JSON.stringify(offenders)}`,
        );
      }

      if (viewport.width <= 1024) {
        const small = await undersizedControls(page);
        if (small.length > 0)
          failures.push(`${path}: undersized controls ${JSON.stringify(small)}`);
      }
    }

    expect(failures, `responsive failures for ${locale} at ${viewport.name}px`).toEqual(
      [],
    );
  });
}

for (const locale of locales) {
  test(`${locale} mobile navigation is reachable and opens from the correct side`, async ({
    page,
  }) => {
    await page.setViewportSize(viewports[0]);
    await page.goto(`/${locale}/`);
    await settle(page);

    const trigger = page.getByTestId("mobile-nav-trigger");
    await expect(trigger).toBeVisible();
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox?.width).toBeGreaterThanOrEqual(44);
    expect(triggerBox?.height).toBeGreaterThanOrEqual(44);
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");

    const drawer = page.getByTestId("mobile-nav");
    await expect(drawer).toBeVisible();
    expect(
      await drawer.evaluate((element) => element.contains(document.activeElement)),
    ).toBe(true);
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox?.width).toBeLessThanOrEqual(390);
    if (locale === "ar") expect(drawerBox?.x).toBeGreaterThanOrEqual(0);
    else expect(drawerBox?.x).toBe(0);

    const navLinks = drawer.locator("nav a");
    for (let index = 0; index < (await navLinks.count()); index += 1) {
      const box = await navLinks.nth(index).boundingBox();
      expect(box?.height, `mobile nav link ${index}`).toBeGreaterThanOrEqual(44);
    }

    await drawer.locator(`nav a[href="/${locale}/maison"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/maison$`));
    await expect(drawer).toBeHidden();
  });
}

for (const locale of locales) {
  test(`${locale} homepage mobile tabs are app-like, usable, and mobile-only`, async ({
    page,
  }) => {
    await page.setViewportSize(viewports[0]);
    await page.goto(`/${locale}/`);
    await settle(page);

    // Sprint 4.7 replaced the earlier homepage-only "home-mobile-tabs"
    // component with a site-wide bottom tab bar (`bottom-tab-bar`) — same
    // fixed-bottom pattern, but rendered on every page instead of just the
    // homepage. See DECISIONS.md.
    const tabs = page.getByTestId("bottom-tab-bar");
    await expect(tabs).toBeVisible();
    await expect(tabs.locator("a")).toHaveCount(5);
    await expect(tabs.locator('[aria-current="page"]')).toHaveCount(1);

    for (const tab of await tabs.locator("a").all()) {
      const box = await tab.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }

    await tabs.locator(`a[href="/${locale}/shop"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/shop$`));

    await page.goto(`/${locale}/`);
    // Bar hides at `xl` (1280px), matching header.tsx's own hamburger/
    // primary-nav handoff breakpoint — not `lg` (1024px).
    await page.setViewportSize(viewports[3]);
    await expect(page.getByTestId("bottom-tab-bar")).toBeHidden();
  });
}

test("PDP stacks through 768px and becomes two columns at 1024px", async ({ page }) => {
  await page.setViewportSize(viewports[1]);
  await page.goto("/en/shop/hydra-serum-intense");
  await settle(page);

  const layout = page.getByTestId("pdp-layout");
  const image = layout.locator(":scope > div").nth(0);
  const details = layout.locator(":scope > div").nth(1);
  const imageAt768 = await image.boundingBox();
  const detailsAt768 = await details.boundingBox();
  expect(Math.abs((imageAt768?.x ?? 0) - (detailsAt768?.x ?? 0))).toBeLessThanOrEqual(1);
  expect(detailsAt768?.y).toBeGreaterThan(imageAt768?.y ?? 0);

  await page.setViewportSize(viewports[2]);
  const imageAt1024 = await image.boundingBox();
  const detailsAt1024 = await details.boundingBox();
  expect(detailsAt1024?.x).toBeGreaterThan(imageAt1024?.x ?? 0);
  await expectNoDocumentOverflow(page, "PDP at 1024px");
});

for (const locale of locales) {
  test(`${locale} cart, all checkout steps, and real confirmation stay responsive`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const requiredViewports = locale === "en" ? viewports : viewports.slice(0, 2);
    await page.setViewportSize(viewports[0]);
    await page.goto(`/${locale}/shop/hydra-serum-intense`);
    await settle(page);
    await page.getByTestId("add-to-cart").click();

    const cartDrawer = page.getByTestId("cart-drawer");
    await expect(cartDrawer).toBeVisible();
    const drawerBox = await cartDrawer.boundingBox();
    expect(drawerBox?.width).toBeGreaterThanOrEqual(350);
    expect(drawerBox?.width).toBeLessThanOrEqual(390);
    expect(drawerBox?.x).toBeCloseTo(locale === "ar" ? 0 : 6, 0);
    const closeButton = cartDrawer.getByRole("button", { name: "Close" });
    await expect(closeButton).toBeVisible();
    const closeBox = await closeButton.boundingBox();
    expect(closeBox?.width).toBeGreaterThanOrEqual(44);
    expect(closeBox?.height).toBeGreaterThanOrEqual(44);
    await expectNoDocumentOverflow(page, `${locale} cart drawer`);

    await page.keyboard.press("Escape");
    await page.goto(`/${locale}/cart`);
    await settle(page);
    await expectNoDocumentOverflow(page, `${locale} full cart`);
    await page.getByTestId("cart-page-checkout").click();

    for (const viewport of requiredViewports) {
      await page.setViewportSize(viewport);
      await expectNoDocumentOverflow(
        page,
        `${locale} checkout address at ${viewport.name}px`,
      );
      const progressBox = await page.getByTestId("checkout-progress").boundingBox();
      expect(progressBox?.width).toBeLessThanOrEqual(viewport.width);
    }
    await expect(
      page.getByTestId("checkout-progress").locator('[data-status="current"]'),
    ).toContainText(
      { en: "Current step", fr: "Étape en cours", ar: "الخطوة الحالية" }[locale],
    );

    await page.setViewportSize(viewports[0]);
    // guests give an email for the order confirmation (signed-in customers do not see the field)
    if (await page.locator("#checkout-email").count())
      await page.locator("#checkout-email").fill("responsive@example.test");
    await page.locator("#checkout-fullname").fill("Responsive Test");
    await page.locator("#checkout-phone").fill("+971501234567");
    await page.locator("#checkout-emirate").click();
    await page.getByRole("option").first().click();
    await page.locator("#checkout-city").fill("Dubai");
    await page.locator("#checkout-address1").fill("Marina Walk, Tower 3");
    await page.getByTestId("checkout-address-continue").click();
    await expect(
      page.getByTestId("checkout-progress").locator('[data-status="current"]'),
    ).toContainText(
      { en: "Current step", fr: "Étape en cours", ar: "الخطوة الحالية" }[locale],
    );

    for (const viewport of requiredViewports) {
      await page.setViewportSize(viewport);
      await expectNoDocumentOverflow(
        page,
        `${locale} checkout delivery at ${viewport.name}px`,
      );
      const progressBox = await page.getByTestId("checkout-progress").boundingBox();
      expect(progressBox?.width).toBeLessThanOrEqual(viewport.width);
    }

    await page.setViewportSize(viewports[0]);
    await page.getByTestId("checkout-delivery-continue").click();
    await expect(
      page.getByTestId("checkout-progress").locator('[data-status="current"]'),
    ).toContainText(
      { en: "Current step", fr: "Étape en cours", ar: "الخطوة الحالية" }[locale],
    );
    for (const viewport of requiredViewports) {
      await page.setViewportSize(viewport);
      await expectNoDocumentOverflow(
        page,
        `${locale} checkout payment at ${viewport.name}px`,
      );
      const progressBox = await page.getByTestId("checkout-progress").boundingBox();
      expect(progressBox?.width).toBeLessThanOrEqual(viewport.width);
    }

    await page.setViewportSize(viewports[0]);
    await page.getByTestId("payment-success").click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/checkout/confirmation/IOMA-`));
    const confirmationUrl = new URL(page.url());

    for (const viewport of requiredViewports) {
      await page.setViewportSize(viewport);
      await page.goto(confirmationUrl.toString());
      await settle(page);
      await expectNoDocumentOverflow(
        page,
        `${locale} confirmation at ${viewport.name}px`,
      );
    }
  });
}

for (const locale of locales) {
  test(`${locale} authenticated account routes reflow at 390px and 768px`, async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const email = `responsive-${locale}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const response = await request.post("http://localhost:4000/api/auth/register", {
      data: {
        email,
        password: "ResponsivePass1",
        firstName: "Responsive",
        lastName: "Test",
        locale,
      },
    });
    if (!response.ok()) {
      throw new Error(
        `Account setup failed (${response.status()}): ${await response.text()}`,
      );
    }
    const session = await response.json();
    await page.addInitScript((storedSession) => {
      localStorage.setItem(
        "ioma_auth",
        JSON.stringify({ state: storedSession, version: 0 }),
      );
    }, session);

    for (const viewport of viewports.slice(0, 2)) {
      await page.setViewportSize(viewport);
      for (const route of accountRoutes) {
        await page.goto(`/${locale}${route}`);
        await settle(page);
        await expect(page).toHaveURL(new RegExp(`/${locale}${route}$`));
        await expectNoDocumentOverflow(page, `${locale}${route} at ${viewport.name}px`);
        const small = await undersizedControls(page);
        expect(
          small,
          `${locale}${route} undersized controls at ${viewport.name}px`,
        ).toEqual([]);
      }
    }
  });
}
