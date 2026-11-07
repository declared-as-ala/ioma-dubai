import {
  AccessRule,
  DEFAULT_RULE,
  OrderFacts,
  atLeast,
  computeAccess,
  orderQualifies,
} from "./pro-access.rules";

const order = (over: Partial<OrderFacts> = {}): OrderFacts => ({
  _id: "o1",
  totalMinor: 50_000,
  paymentStatus: "paid",
  fulfillmentStatus: "pending",
  createdAt: new Date("2026-01-10T10:00:00Z"),
  ...over,
});
const rule = (over: Partial<AccessRule> = {}): AccessRule => ({
  ...DEFAULT_RULE,
  ...over,
});

describe("orderQualifies", () => {
  it("never counts a merely placed order (pending payment, not processed)", () => {
    expect(
      orderQualifies(
        order({ paymentStatus: "pending", fulfillmentStatus: "pending" }),
        rule(),
      ),
    ).toBe(false);
  });

  it("confirmed rule: authorised, paid, or already in fulfilment all count", () => {
    expect(orderQualifies(order({ paymentStatus: "authorized" }), rule())).toBe(true);
    expect(orderQualifies(order({ paymentStatus: "paid" }), rule())).toBe(true);
    expect(
      orderQualifies(
        order({ paymentStatus: "pending", fulfillmentStatus: "processing" }),
        rule(),
      ),
    ).toBe(true);
  });

  it("paid rule: only a paid order counts", () => {
    const strict = rule({ unlockOn: "paid" });
    expect(orderQualifies(order({ paymentStatus: "authorized" }), strict)).toBe(false);
    expect(orderQualifies(order({ paymentStatus: "paid" }), strict)).toBe(true);
  });

  it("a cancelled, failed or refunded order never counts", () => {
    expect(orderQualifies(order({ fulfillmentStatus: "cancelled" }), rule())).toBe(false);
    expect(orderQualifies(order({ paymentStatus: "failed" }), rule())).toBe(false);
    expect(orderQualifies(order({ paymentStatus: "refunded" }), rule())).toBe(false);
  });

  it("respects the minimum first-order amount", () => {
    const min = rule({ minFirstOrderMinor: 100_000 });
    expect(orderQualifies(order({ totalMinor: 99_999 }), min)).toBe(false);
    expect(orderQualifies(order({ totalMinor: 100_000 }), min)).toBe(true);
  });
});

describe("computeAccess", () => {
  it("visitor: no active professional profile", () => {
    expect(
      computeAccess({ hasActiveProfile: false, orders: [order()], rule: rule() }).level,
    ).toBe("visitor");
  });

  it("validated: approved profile with no qualifying order yet", () => {
    const res = computeAccess({
      hasActiveProfile: true,
      orders: [order({ paymentStatus: "pending", fulfillmentStatus: "pending" })],
      rule: rule(),
    });
    expect(res.level).toBe("validated");
    expect(res.firstOrder).toBeNull();
  });

  it("customer: the first qualifying order opens everything and is reported as the first order", () => {
    const early = order({ _id: "first", createdAt: new Date("2026-01-01T00:00:00Z") });
    const later = order({ _id: "second", createdAt: new Date("2026-02-01T00:00:00Z") });
    const res = computeAccess({
      hasActiveProfile: true,
      orders: [later, early],
      rule: rule(),
    });
    expect(res.level).toBe("customer");
    expect(res.firstOrder?._id).toBe("first");
  });

  it("goes back to validated when the only qualifying order is cancelled afterwards", () => {
    const res = computeAccess({
      hasActiveProfile: true,
      orders: [order({ fulfillmentStatus: "cancelled" })],
      rule: rule(),
    });
    expect(res.level).toBe("validated");
  });

  it("keeps customer access when a second qualifying order remains after the first is cancelled", () => {
    const res = computeAccess({
      hasActiveProfile: true,
      orders: [order({ _id: "a", fulfillmentStatus: "cancelled" }), order({ _id: "b" })],
      rule: rule(),
    });
    expect(res.level).toBe("customer");
  });

  it("validity period: access lapses 12 months after the latest qualifying order", () => {
    const yearly = rule({ validMonths: 12 });
    const placed = order({ createdAt: new Date("2026-01-10T00:00:00Z") });
    const within = computeAccess({
      hasActiveProfile: true,
      orders: [placed],
      rule: yearly,
      now: new Date("2026-12-31T00:00:00Z"),
    });
    const after = computeAccess({
      hasActiveProfile: true,
      orders: [placed],
      rule: yearly,
      now: new Date("2027-02-01T00:00:00Z"),
    });
    expect(within.level).toBe("customer");
    expect(after.level).toBe("validated");
    expect(after.benefitsUntil?.toISOString().slice(0, 10)).toBe("2027-01-10");
  });

  it("a new order renews the validity period", () => {
    const yearly = rule({ validMonths: 12 });
    const res = computeAccess({
      hasActiveProfile: true,
      orders: [
        order({ createdAt: new Date("2026-01-10T00:00:00Z") }),
        order({ _id: "renew", createdAt: new Date("2026-11-01T00:00:00Z") }),
      ],
      rule: yearly,
      now: new Date("2027-02-01T00:00:00Z"),
    });
    expect(res.level).toBe("customer");
  });

  it("staff preview the full pro space regardless of orders", () => {
    expect(
      computeAccess({ hasActiveProfile: false, isStaff: true, orders: [], rule: rule() })
        .level,
    ).toBe("customer");
  });
});

describe("atLeast", () => {
  it("orders visitor < validated < customer", () => {
    expect(atLeast("customer", "validated")).toBe(true);
    expect(atLeast("validated", "customer")).toBe(false);
    expect(atLeast("visitor", "validated")).toBe(false);
    expect(atLeast("validated", "validated")).toBe(true);
  });
});
