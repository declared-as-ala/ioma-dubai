import { adminResource, adminPermissions } from "@ioma/config";
import { parseResource } from "./admin-resource-validation";
describe("admin management input boundary", () => {
  it("rejects role injection into catalog updates", () =>
    expect(() =>
      parseResource(
        adminResource("products")!,
        { roles: ["super_administrator"] },
        false,
      ),
    ).toThrow());
  it("rejects script URLs inside structured CMS content", () =>
    expect(() =>
      parseResource(
        adminResource("content")!,
        {
          blocks: [
            {
              type: "link",
              heading: { en: "x", fr: "x", ar: "x" },
              body: { en: "", fr: "", ar: "" },
              url: "javascript:alert(1)",
            },
          ],
        },
        false,
      ),
    ).toThrow());
  it("rejects invalid opening hours and blocked calendar dates", () => {
    expect(() =>
      parseResource(
        adminResource("availability")!,
        { weeklyHours: [{ day: 1, open: "18:00", close: "09:00" }] },
        false,
      ),
    ).toThrow();
    expect(() =>
      parseResource(
        adminResource("availability")!,
        { blockedDates: ["2026-02-30"] },
        false,
      ),
    ).toThrow();
  });
  it("keeps prices as integer minor units", () =>
    expect(() =>
      parseResource(adminResource("inventory")!, { b2cPriceMinor: 10.5 }, false),
    ).toThrow());
  it("gives no administrative permissions to professional roles", () =>
    expect(adminPermissions(["customer", "professional_approved"])).toEqual([]));
  it("does not grant staff role management to ordinary administrators", () =>
    expect(adminPermissions(["administrator"])).not.toContain("system.manage"));
});
