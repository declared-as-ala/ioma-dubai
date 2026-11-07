import { dashboardPeriod, comparison } from "./dashboard-period";
describe("Dubai dashboard reporting periods", () => {
  it("includes the entire Dubai day and compares an equal preceding period", () => {
    const p = dashboardPeriod("2026-09-01", "2026-09-06");
    expect(p.start.toISOString()).toBe("2026-08-31T20:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-09-06T20:00:00.000Z");
    expect(p.previousStart.toISOString()).toBe("2026-08-25T20:00:00.000Z");
    expect(p.days).toBe(6);
  });
  it("uses Dubai today across UTC midnight", () => {
    expect(
      dashboardPeriod(undefined, undefined, new Date("2026-09-06T22:00:00Z")).to,
    ).toBe("2026-09-07");
  });
  it.each(["wrong", "2026-02-30", "2026-13-01"])(
    "rejects invalid date %s without a server error",
    (date) => {
      expect(() => dashboardPeriod(undefined, date)).toThrow(/date/i);
    },
  );
  it("rejects reversed periods", () =>
    expect(() => dashboardPeriod("2026-09-06", "2026-09-01")).toThrow());
  it("does not manufacture a percentage with no baseline", () => {
    expect(comparison(100, 0).percent).toBeNull();
    expect(comparison(150, 100).percent).toBe(50);
  });
});
