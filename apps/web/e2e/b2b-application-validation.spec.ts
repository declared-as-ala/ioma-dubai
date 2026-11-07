import { expect, test } from "@playwright/test";
import {
  API,
  apiSession,
  details,
  dictionaries,
  document,
  fillApplication,
  registerViaApplication,
} from "./helpers/professional";

test.describe.configure({ mode: "serial" });

for (const locale of ["en", "fr", "ar"] as const) {
  test(`${locale}: localized required fields, email/phone, upload and API failures preserve form`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const t = dictionaries[locale].Professionals.apply;
    await registerViaApplication(
      page,
      locale,
      `b2b-validation-${locale}-${Date.now()}@example.com`,
    );
    const button = page.getByRole("button", { name: t.actions.submit, exact: true });
    await button.click();
    await expect(page.getByText(t.validation.companyName, { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(t.validation.termsAccepted, { exact: true })).toBeVisible(
      { timeout: 15000 },
    );
    await fillApplication(page, "Validation Spa");
    await page.locator("#email").fill("invalid");
    await page.locator("#phone").fill("abcdefg");
    await button.click();
    await expect(page.getByText(t.validation.email, { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(t.validation.phone, { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await page.locator("#email").fill("valid@example.com");
    await page.locator("#phone").fill("+971501234567");
    await button.click();
    await expect(page.getByText(t.errors.documentRequired, { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await page.route("**/professional/applications/*/upload", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Injected upload failure" }),
      }),
    );
    await page.locator("#application-document").setInputFiles(document);
    await expect(page.getByText(t.errors.upload, { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("#companyName")).toHaveValue("Validation Spa");
    await page.unroute("**/professional/applications/*/upload");
    await page.locator("#application-document").setInputFiles(document);
    await expect(
      page.getByText(`${document.name} — ${t.documents.uploaded}`, { exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await page.route("**/professional/applications/*/submit", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Injected submission failure" }),
      }),
    );
    await button.click();
    await expect(page.getByText(t.errors.submit, { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(button).toBeEnabled();
    await expect(page.locator("#companyName")).toHaveValue("Validation Spa");
    await page.unroute("**/professional/applications/*/submit");
    await button.click();
    await expect(page.getByTestId("application-status")).toBeVisible({ timeout: 15000 });
  });
}

test("real API: duplicate draft/submission races, validation, document ownership, rejection and reapplication", async ({
  request,
}) => {
  test.setTimeout(120_000);
  const session = await apiSession(request, `b2b-api-${Date.now()}@example.com`);
  const options = { headers: session.headers };
  const admin = await apiSession(request);
  const other = await apiSession(request, `b2b-other-${Date.now()}@example.com`);
  expect((await request.get(`${API}/pro/catalog`)).status()).toBe(401);
  expect((await request.get(`${API}/pro/catalog`, options)).status()).toBe(403);
  expect(
    (await request.get(`${API}/professional/admin/applications`, options)).status(),
  ).toBe(403);
  const drafts = await Promise.all(
    [1, 2, 3].map(() => request.post(`${API}/professional/applications/draft`, options)),
  );
  const ids = await Promise.all(
    drafts.map(async (r) => {
      expect(r.ok(), await r.text()).toBeTruthy();
      return (await r.json())._id;
    }),
  );
  expect(new Set(ids).size).toBe(1);
  const id = ids[0];
  expect(
    (
      await request.get(`${API}/professional/applications/${id}`, {
        headers: other.headers,
      })
    ).status(),
  ).toBe(403);
  for (const data of [
    {},
    { ...details, email: "invalid" },
    { ...details, phone: "abcdefg" },
    { ...details, termsAccepted: false },
    { ...details, status: "approved" },
    details,
  ]) {
    expect(
      (
        await request.post(`${API}/professional/applications/${id}/submit`, {
          ...options,
          data,
        })
      ).status(),
    ).toBe(400);
  }
  expect(
    (
      await request.post(`${API}/professional/applications/${id}/upload`, {
        ...options,
        multipart: { file: { ...document, buffer: Buffer.from("not really a PNG") } },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(`${API}/professional/applications/${id}/upload`, {
        headers: other.headers,
        multipart: { file: document },
      })
    ).status(),
  ).toBe(403);
  const upload = await request.post(`${API}/professional/applications/${id}/upload`, {
    ...options,
    multipart: { file: document },
  });
  expect(upload.ok(), await upload.text()).toBeTruthy();
  const uploaded = await upload.json();
  // Metadata attachment must not permit a second copy to satisfy a later document request.
  expect(
    (
      await request.post(`${API}/professional/applications/${id}/documents`, {
        ...options,
        data: { ...uploaded, mimeType: document.mimeType },
      })
    ).status(),
  ).toBe(409);
  const submissions = await Promise.all(
    [1, 2].map(() =>
      request.post(`${API}/professional/applications/${id}/submit`, {
        ...options,
        data: details,
      }),
    ),
  );
  expect(submissions.filter((r) => r.ok())).toHaveLength(1);
  expect([400, 409]).toContain(submissions.find((r) => !r.ok())!.status());
  const repeat = await request.post(`${API}/professional/applications/draft`, options);
  expect((await repeat.json())._id).toBe(id);
  expect((await request.get(`${API}/pro/catalog`, options)).status()).toBe(403);
  const requested = await request.patch(
    `${API}/professional/admin/applications/${id}/request-documents`,
    { headers: admin.headers, data: { reviewNotes: "Renewed licence needed" } },
  );
  expect(requested.ok()).toBeTruthy();
  expect(
    (
      await request.post(`${API}/professional/applications/${id}/submit`, {
        ...options,
        data: details,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.patch(`${API}/professional/admin/applications/${id}/reject`, {
        headers: admin.headers,
        data: { reviewNotes: "Invalid licence" },
      })
    ).ok(),
  ).toBeTruthy();
  const newDraft = await request.post(`${API}/professional/applications/draft`, options);
  expect(newDraft.ok(), await newDraft.text()).toBeTruthy();
  expect((await newDraft.json())._id).not.toBe(id);
});
