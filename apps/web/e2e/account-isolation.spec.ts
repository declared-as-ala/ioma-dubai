import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import {
  API,
  apiSession,
  details,
  document as licence,
  dictionaries,
} from "./helpers/professional";

test("account ownership: profiles, addresses, diagnoses, AI, routines, wishlist and documents", async ({
  request,
  page,
}, info) => {
  test.setTimeout(180000);
  const a = await apiSession(request, `owner-a-${Date.now()}@example.com`);
  const b = await apiSession(request, `owner-b-${Date.now()}@example.com`);
  const address = {
    type: "shipping",
    label: "Home QA",
    fullName: "Owner A",
    phone: "+971501234567",
    line1: "Marina QA",
    emirate: "DXB",
    city: "Dubai",
    isDefault: true,
  };
  const saved = await (
    await request.post(`${API}/account/addresses`, { headers: a.headers, data: address })
  ).json();
  expect(saved._id).toBeTruthy();
  expect(
    (
      await request.patch(`${API}/account/addresses/${saved._id}`, {
        headers: b.headers,
        data: { ...address, label: "Unauthorized" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.delete(`${API}/account/addresses/${saved._id}`, {
        headers: b.headers,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.patch(`${API}/account/addresses/${saved._id}`, {
        headers: a.headers,
        data: { ...address, label: "Updated QA" },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    await (await request.get(`${API}/account/addresses`, { headers: b.headers })).json(),
  ).toEqual([]);
  expect(
    (
      await request.patch(`${API}/account/profile`, {
        headers: a.headers,
        data: { firstName: "Owner A" },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await (
        await request.get(`${API}/account/profile?userId=${a.user.id}`, {
          headers: b.headers,
        })
      ).json()
    ).firstName,
  ).toBe("Test");
  const answers = Object.entries(dictionaries.en.Diagnosis.standard.questions).map(
    ([questionKey, q]) => ({ questionKey, value: Object.keys(q.options)[0] }),
  );
  const diagnosis = await (
    await request.post(`${API}/diagnosis/standard`, {
      headers: a.headers,
      data: { answers },
    })
  ).json();
  expect(diagnosis.id).toBeTruthy();
  expect(
    (
      await request.get(`${API}/diagnosis/standard/${diagnosis.id}`, {
        headers: b.headers,
      })
    ).status(),
  ).toBe(403);
  expect(
    await (
      await request.get(`${API}/diagnosis/standard/mine`, { headers: b.headers })
    ).json(),
  ).toEqual([]);
  const sku = diagnosis.morningRoutine[0]?.sku ?? diagnosis.eveningRoutine[0]?.sku;
  expect(sku).toBeTruthy();
  expect(
    (await request.post(`${API}/wishlist`, { headers: a.headers, data: { sku } })).ok(),
  ).toBeTruthy();
  expect(
    await (
      await request.get(`${API}/wishlist?userId=${a.user.id}`, { headers: b.headers })
    ).json(),
  ).toEqual([]);
  const app = await (
    await request.post(`${API}/professional/applications/draft`, { headers: a.headers })
  ).json();
  const doc = await (
    await request.post(`${API}/professional/applications/${app._id}/upload`, {
      headers: a.headers,
      multipart: { file: licence },
    })
  ).json();
  expect(
    (
      await request.get(
        `${API}/professional/applications/${app._id}/documents/${doc.documentId}`,
        { headers: b.headers },
      )
    ).status(),
  ).toBe(403);
  const signed = await (
    await request.get(
      `${API}/professional/applications/${app._id}/documents/${doc.documentId}`,
      { headers: a.headers },
    )
  ).json();
  expect((await request.get(signed.url)).ok()).toBeTruthy();
  expect((await request.get(signed.url.split("?")[0])).status()).toBe(403);
  // Explicit QA fixture: failed analysis avoids sending a customer image to an external provider.
  const aiId = execFileSync(
    "docker",
    [
      "exec",
      "ioma-dev-mongo-1",
      "mongosh",
      "ioma",
      "--quiet",
      "--eval",
      `const id=new ObjectId();db.aianalyses.insertOne({_id:id,userId:ObjectId('${a.user.id}'),status:'failed',isSimulated:true,provider:'qa',failureReason:'QA fixture',createdAt:new Date(),morningRoutine:[],eveningRoutine:[],chatHistory:[]});print(id.toString())`,
    ],
    { encoding: "utf8" },
  ).trim();
  expect(
    (await request.get(`${API}/ai-analysis/${aiId}`, { headers: b.headers })).status(),
  ).toBe(403);
  expect(
    await (await request.get(`${API}/ai-analysis/mine`, { headers: b.headers })).json(),
  ).toEqual([]);
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
    a,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/account");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Owner A");
  await expect(page.getByRole("button", { name: "Add routine to bag" })).toBeVisible();
  await page.screenshot({
    path: info.outputPath("populated-account.png"),
    fullPage: true,
  });
  await page.goto("/en/account/diagnosis");
  await expect(
    page.getByRole("link", { name: "View details", exact: true }),
  ).toBeVisible();
  await page.goto("/en/account/ai");
  await expect(
    page.getByRole("link", { name: "View details", exact: true }),
  ).toBeVisible();
  await page.goto("/en/account/routines");
  await page.getByRole("button", { name: "Add routine to bag", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    (await (await request.get(`${API}/cart`, { headers: a.headers })).json()).itemCount,
  ).toBeGreaterThan(0);
  await page.goto("/en/account/wishlist");
  await expect(
    page.getByRole("button", { name: "Add to bag", exact: true }),
  ).toBeVisible();
  expect(
    (
      await request.delete(`${API}/account/addresses/${saved._id}`, {
        headers: a.headers,
      })
    ).status(),
  ).toBe(204);
  expect(
    (await request.delete(`${API}/wishlist/${sku}`, { headers: a.headers })).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.patch(`${API}/professional/applications/${app._id}/contact`, {
        headers: b.headers,
        data: {
          contactPerson: "Intruder",
          email: "intruder@example.com",
          phone: "+971501234567",
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.patch(`${API}/professional/applications/${app._id}/contact`, {
        headers: a.headers,
        data: {
          contactPerson: "Updated contact",
          email: "updated@example.com",
          phone: "+971501234567",
        },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.patch(`${API}/professional/applications/${app._id}/contact`, {
        headers: a.headers,
        data: {
          contactPerson: "Updated contact",
          email: "updated@example.com",
          phone: "+971501234567",
          status: "approved",
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(`${API}/professional/applications/${app._id}/submit`, {
        headers: a.headers,
        data: details,
      })
    ).ok(),
  ).toBeTruthy();
});
