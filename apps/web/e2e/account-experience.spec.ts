import { expect, test, type Page, type APIRequestContext } from "@playwright/test";
import { execFileSync } from "node:child_process";
import {
  API,
  apiSession,
  details,
  document as licence,
  dictionaries,
} from "./helpers/professional";

type State =
  | "customer"
  | "draft"
  | "submitted"
  | "pending_review"
  | "documents_requested"
  | "approved"
  | "rejected"
  | "suspended";

test("professional training: own booking, duplicate protection, cancellation and seat recovery", async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  const { session } = await fixture(request, "approved");
  const { session: other } = await fixture(request, "approved");
  const courses = await (
    await request.get(`${API}/trainings`, { headers: session.headers })
  ).json();
  expect(courses.length).toBeGreaterThan(0);
  const sessionId = execFileSync(
    "docker",
    [
      "exec",
      "ioma-dev-mongo-1",
      "mongosh",
      "ioma",
      "--quiet",
      "--eval",
      `const id=new ObjectId();db.trainingsessions.insertOne({_id:id,trainingId:ObjectId('${courses[0]._id}'),startsAt:new Date(Date.now()+864000000),endsAt:new Date(Date.now()+871200000),location:'Account QA training '+id.toString(),capacity:1,seatsBooked:0,priceMinor:null});print(id.toString())`,
    ],
    { encoding: "utf8" },
  ).trim();
  await signIn(page, session);
  await page.goto("/en/portal/trainings");
  const row = page
    .getByText(`Account QA training ${sessionId}`, { exact: true })
    .locator("../..");
  await row
    .getByRole("button", { name: dictionaries.en.Pro.trainings.bookSession, exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: dictionaries.en.Pro.trainings.cancelBooking,
      exact: true,
    }),
  ).toBeVisible();
  const bookings = await (
    await request.get(`${API}/trainings/my-bookings`, { headers: session.headers })
  ).json();
  const booking = bookings.find((b: { sessionId: string }) => b.sessionId === sessionId);
  expect(booking).toBeTruthy();
  expect(
    (
      await request.post(`${API}/trainings/sessions/${sessionId}/book`, {
        headers: session.headers,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.patch(`${API}/trainings/my-bookings/${booking.id}/cancel`, {
        headers: other.headers,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.get(`${API}/trainings/my-bookings/${booking.id}/certificate`, {
        headers: other.headers,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.get(`${API}/trainings/my-bookings/${booking.id}/certificate`, {
        headers: session.headers,
      })
    ).status(),
  ).toBe(404);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", {
      name: dictionaries.en.Pro.trainings.cancelBooking,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: dictionaries.en.Pro.trainings.cancelBooking,
      exact: true,
    }),
  ).toHaveCount(0);
  const sessions = await (
    await request.get(`${API}/trainings/${courses[0]._id}/sessions`, {
      headers: session.headers,
    })
  ).json();
  expect(sessions.find((s: { _id: string }) => s._id === sessionId).seatsBooked).toBe(0);
  expect(
    (
      await request.post(`${API}/trainings/sessions/${sessionId}/book`, {
        headers: session.headers,
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.patch(`${API}/trainings/my-bookings/${booking.id}/cancel`, {
        headers: session.headers,
      })
    ).ok(),
  ).toBeTruthy();
});
async function fixture(request: APIRequestContext, state: State) {
  const session = await apiSession(
    request,
    `account-${state}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
  );
  let app;
  if (state !== "customer") {
    app = await (
      await request.post(`${API}/professional/applications/draft`, {
        headers: session.headers,
      })
    ).json();
    if (state !== "draft") {
      expect(
        (
          await request.post(`${API}/professional/applications/${app._id}/upload`, {
            headers: session.headers,
            multipart: { file: licence },
          })
        ).ok(),
      ).toBeTruthy();
      expect(
        (
          await request.post(`${API}/professional/applications/${app._id}/submit`, {
            headers: session.headers,
            data: { ...details, companyName: `Account QA ${state}` },
          })
        ).ok(),
      ).toBeTruthy();
      if (state === "pending_review") {
        // Existing stored state has no separate start-review endpoint; seed only this QA application.
        execFileSync("docker", [
          "exec",
          "ioma-dev-mongo-1",
          "mongosh",
          "ioma",
          "--quiet",
          "--eval",
          `db.professionalapplications.updateOne({_id:ObjectId('${app._id}')},{$set:{status:'pending_review'},$push:{statusHistory:{status:'pending_review',at:new Date()}}})`,
        ]);
      }
      if (["approved", "suspended", "rejected", "documents_requested"].includes(state)) {
        const admin = await apiSession(request);
        const action =
          state === "documents_requested"
            ? "request-documents"
            : state === "rejected"
              ? "reject"
              : "approve";
        expect(
          (
            await request.patch(
              `${API}/professional/admin/applications/${app._id}/${action}`,
              {
                headers: admin.headers,
                data: {
                  reviewNotes:
                    action === "approve"
                      ? "Internal approval note"
                      : "Please provide an updated licence.",
                },
              },
            )
          ).ok(),
        ).toBeTruthy();
        if (state === "suspended") {
          const profile = await (
            await request.get(`${API}/professional/profile`, { headers: session.headers })
          ).json();
          expect(
            (
              await request.patch(
                `${API}/professional/admin/profiles/${profile._id}/suspend`,
                { headers: admin.headers, data: { reason: "QA suspension" } },
              )
            ).ok(),
          ).toBeTruthy();
        }
      }
    }
  }
  return { session, app };
}
async function signIn(page: Page, session: Awaited<ReturnType<typeof apiSession>>) {
  await page.addInitScript(
    (s) =>
      localStorage.setItem(
        "ioma_auth",
        JSON.stringify({
          state: {
            user: s.user,
            accessToken: s.accessToken,
            refreshToken: s.refreshToken,
          },
          version: 0,
        }),
      ),
    session,
  );
}

for (const width of [1440, 390])
  for (const state of [
    "customer",
    "draft",
    "submitted",
    "pending_review",
    "documents_requested",
    "approved",
    "rejected",
    "suspended",
  ] as State[]) {
    test(`${state} account ${width}px: real status, access and personal workspace`, async ({
      page,
      request,
    }, info) => {
      test.setTimeout(120000);
      const { session } = await fixture(request, state);
      await signIn(page, session);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto("/en/account");
      await expect(page.getByRole("heading", { level: 1 })).toContainText("Test");
      await expect(
        page.getByRole("heading", { name: "Your skin journey" }),
      ).toBeVisible();
      if (state === "customer") {
        await expect(
          page.getByRole("link", { name: "Apply for professional access", exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Enter professional portal", exact: true }),
        ).toHaveCount(0);
      } else
        await expect(page.getByTestId("partner-status")).toContainText(
          dictionaries.en.AccountExperience.statuses[state],
        );
      expect(
        await page.evaluate(
          () => window.document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      await page.screenshot({
        path: info.outputPath(`account-${state}-${width}.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
      for (const path of [
        "/pro/catalog",
        "/cart/pro",
        "/orders/pro/list",
        "/trainings",
        "/protocols",
      ])
        expect(
          (await request.get(`${API}${path}`, { headers: session.headers })).status(),
          path,
        ).toBe(state === "approved" ? 200 : 403);
      await page.goto("/en/account/profile");
      await expect(page.locator("#profile-first-name")).toHaveValue("Test");
      if (state === "approved") {
        await page.goto("/en/portal");
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          "IOMA Professional",
        );
        await page.screenshot({
          path: info.outputPath(`portal-${width}.png`),
          fullPage: true,
        });
        for (const path of [
          "catalog",
          "orders",
          "trainings",
          "protocols",
          "documents",
          "company",
          "support",
          "cart",
        ]) {
          await page.goto(`/en/portal/${path}`);
          await expect(page.locator("main")).toBeVisible();
          await expect(page.getByText(/MISSING_MESSAGE|Application error/)).toHaveCount(
            0,
          );
        }
      }
      expect(errors).toEqual([]);
    });
  }
for (const locale of ["fr", "ar"] as const)
  for (const state of ["customer", "approved"] as State[]) {
    test(`${locale} ${state}: translated account, mobile and tablet`, async ({
      page,
      request,
    }, info) => {
      test.setTimeout(120000);
      const { session } = await fixture(request, state);
      await signIn(page, session);
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      for (const [width, height] of [
        [390, 844],
        [768, 1024],
        [1024, 768],
        [1280, 800],
      ]) {
        await page.setViewportSize({ width: width!, height: height! });
        await page.goto(`/${locale}/${state === "approved" ? "portal" : "account"}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          locale === "ar" ? "rtl" : "ltr",
        );
        await page.waitForTimeout(700);
        expect(
          await page.evaluate(
            () => window.document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBeTruthy();
        await page.screenshot({
          path: info.outputPath(`${locale}-${state}-${width}.png`),
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
    });
  }

test("personal and B2B carts/orders remain separate and private", async ({
  request,
  page,
}) => {
  test.setTimeout(120000);
  const { session } = await fixture(request, "approved");
  const other = await apiSession(request, `other-${Date.now()}@example.com`);
  const catalog = await (
    await request.get(`${API}/pro/catalog`, { headers: session.headers })
  ).json();
  const product = catalog.find(
    (p: { variants: { inStock: boolean; b2bPriceMinor: number | null }[] }) =>
      p.variants.some((v) => v.inStock && v.b2bPriceMinor !== null),
  );
  const variant = product.variants.find((v: { inStock: boolean }) => v.inStock);
  const publicProducts = await (await request.get(`${API}/products`)).json();
  const retail = Array.isArray(publicProducts)
    ? publicProducts[0]
    : publicProducts.items[0];
  const retailDetail = await (await request.get(`${API}/products/${retail.slug}`)).json();
  const sku = retailDetail.variants.find((v: { inStock: boolean }) => v.inStock).sku;
  expect(
    (
      await request.post(`${API}/cart/items`, {
        headers: session.headers,
        data: { sku, qty: 1 },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.post(`${API}/cart/pro/items`, {
        headers: session.headers,
        data: { sku: variant.sku, qty: variant.moq ?? 1 },
      })
    ).ok(),
  ).toBeTruthy();
  const personal = await (
    await request.get(`${API}/cart`, { headers: session.headers })
  ).json();
  const pro = await (
    await request.get(`${API}/cart/pro`, { headers: session.headers })
  ).json();
  expect(personal.id).not.toBe(pro.id);
  expect(personal.type).toBe("b2c");
  expect(pro.type).toBe("b2b");
  const input = {
    shippingAddress: {
      fullName: "Account QA",
      phone: "+971501234567",
      emirate: "DXB",
      city: "Dubai",
      addressLine1: "QA Marina",
    },
    deliveryMethod: "standard",
    paymentMethod: "mock_success",
  };
  const b2b = await (
    await request.post(`${API}/orders/pro/checkout`, {
      headers: session.headers,
      data: input,
    })
  ).json();
  expect(b2b.type).toBe("b2b");
  expect(
    (await (await request.get(`${API}/cart`, { headers: session.headers })).json())
      .itemCount,
  ).toBe(1);
  const personalCheckout = await request.post(`${API}/orders`, {
    headers: session.headers,
    data: input,
  });
  expect(personalCheckout.ok(), await personalCheckout.text()).toBeTruthy();
  const b2c = await personalCheckout.json();
  expect(b2c.type).toBe("b2c");
  expect(
    (
      await (await request.get(`${API}/orders/my`, { headers: session.headers })).json()
    ).map((o: { orderNumber: string }) => o.orderNumber),
  ).toEqual([b2c.orderNumber]);
  expect(
    (
      await (
        await request.get(`${API}/orders/pro/list`, { headers: session.headers })
      ).json()
    ).map((o: { orderNumber: string }) => o.orderNumber),
  ).toEqual([b2b.orderNumber]);
  expect(
    (
      await request.get(`${API}/orders/${b2c.orderNumber}`, { headers: other.headers })
    ).status(),
  ).toBe(403);
  await signIn(page, session);
  for (const [path, order, cartPath] of [
    ["account", b2c, "/cart"],
    ["portal", b2b, "/cart/pro"],
  ] as const) {
    await page.goto(`/en/${path}/orders/${order.orderNumber}`);
    await expect(
      page.getByRole("heading", { name: order.orderNumber, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Reorder", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Added to bag", exact: true }),
    ).toBeVisible();
    const cart = await (
      await request.get(`${API}${cartPath}`, { headers: session.headers })
    ).json();
    expect(cart.itemCount).toBeGreaterThan(0);
  }
});
