import { expect, test } from "@playwright/test";
import { API, apiSession } from "./helpers/professional";

test("appointments: ownership, live reschedule, cancellation confirmation and Dubai time", async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  const user = await apiSession(request, `appointment-${Date.now()}@example.com`);
  const other = await apiSession(request, `appointment-other-${Date.now()}@example.com`);
  const partner = await (await request.get(`${API}/partners/ioma-difc-flagship`)).json();
  expect(partner.services.length).toBeGreaterThan(0);
  let start = "";
  for (let day = 2; day < 14 && !start; day++) {
    const date = new Date(Date.now() + day * 86400000).toISOString().slice(0, 10);
    const response = await request.get(
      `${API}/availability/${partner.id}/slots?date=${date}`,
    );
    const slots = await response.json();
    const slot = Array.isArray(slots) ? slots.find((s) => s.available) : null;
    if (slot) start = `${date}T${slot.startsAt}:00.000+04:00`;
  }
  expect(start).toBeTruthy();
  const response = await request.post(`${API}/appointments`, {
    headers: user.headers,
    data: { partnerId: partner.id, serviceId: partner.services[0].id, startsAt: start },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const appointment = await response.json();
  for (const method of ["view", "cancel", "reschedule"]) {
    const url = `${API}/appointments/${appointment.id}`;
    const r =
      method === "view"
        ? await request.get(url, { headers: other.headers })
        : method === "cancel"
          ? await request.post(`${url}/cancel`, { headers: other.headers, data: {} })
          : await request.patch(`${url}/reschedule`, {
              headers: other.headers,
              data: { startsAt: start },
            });
    expect(r.status()).toBe(403);
  }
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
    user,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/account/appointments");
  await expect(page.getByText(partner.name, { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Reschedule", exact: true }).click();
  await expect(page).toHaveURL(/account\/appointments\/reschedule/);
  const dateButtons = page
    .locator("button")
    .filter({ hasText: /(Mon|Tue|Wed|Thu|Fri|Sat)/ });
  await dateButtons.first().click();
  const times = page.getByRole("button", { name: /^\d{2}:\d{2}$/ });
  await expect(times.first()).toBeVisible();
  await times.first().click();
  await page.getByRole("button", { name: "Confirm reschedule", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/appointments$/);
  await expect(page.getByText("Rescheduled", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel appointment", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel appointment", exact: true })
    .click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  const stored = await (
    await request.get(`${API}/appointments/${appointment.id}`, { headers: user.headers })
  ).json();
  expect(stored.status).toBe("cancelled");
});
