// B2B access rules (client brief "Trade access: the flow, step by step").
//
//   visitor    no validated trade account: registration page + locked preview, no prices
//   validated  account approved by IOMA, no qualifying order yet: prices, shop, cabin
//              products and the documents needed to order
//   customer   a qualifying first order exists: training videos, cabin gallery, benefits,
//              protocol guides, brand book and the dedicated IOMA contact
//
// The level is *derived* from the account state and the orders at request time, so a
// cancelled or refunded first order automatically closes the benefits again and there is
// no separate "unlock" job that can drift out of sync with the orders.

export type AccessLevel = "visitor" | "validated" | "customer";
export type UnlockOn = "confirmed" | "paid";

export interface AccessRule {
  /** Minimum order total (minor units, fils) for an order to count as the first order. */
  minFirstOrderMinor: number;
  /** "paid": only a paid order unlocks. "confirmed": an authorised/paid order, or one the
   *  team has already started processing. Never a merely placed (pending) order. */
  unlockOn: UnlockOn;
  /** Benefits stay open this many months after the latest qualifying order; null = for life. */
  validMonths: number | null;
}

export interface OrderFacts {
  _id?: unknown;
  totalMinor: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: Date;
}

export const DEFAULT_RULE: AccessRule = {
  minFirstOrderMinor: 0,
  unlockOn: "confirmed",
  validMonths: null,
};

export function orderQualifies(order: OrderFacts, rule: AccessRule): boolean {
  if (order.fulfillmentStatus === "cancelled") return false;
  if (order.paymentStatus === "failed" || order.paymentStatus === "refunded")
    return false;
  if (order.totalMinor < rule.minFirstOrderMinor) return false;
  if (rule.unlockOn === "paid") return order.paymentStatus === "paid";
  return (
    order.paymentStatus === "authorized" ||
    order.paymentStatus === "paid" ||
    ["processing", "shipped", "delivered"].includes(order.fulfillmentStatus)
  );
}

export interface AccessInput {
  /** The account has an approved, non-suspended professional profile. */
  hasActiveProfile: boolean;
  /** The user holds an admin role (previews the full pro space). */
  isStaff?: boolean;
  orders: OrderFacts[];
  rule: AccessRule;
  now?: Date;
}

export interface AccessResult {
  level: AccessLevel;
  firstOrder: OrderFacts | null;
  /** When the benefits lapse (only when a validity period is configured). */
  benefitsUntil: Date | null;
}

export function computeAccess({
  hasActiveProfile,
  isStaff = false,
  orders,
  rule,
  now = new Date(),
}: AccessInput): AccessResult {
  if (isStaff) return { level: "customer", firstOrder: null, benefitsUntil: null };
  if (!hasActiveProfile)
    return { level: "visitor", firstOrder: null, benefitsUntil: null };

  const qualifying = orders
    .filter((o) => orderQualifies(o, rule))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (qualifying.length === 0) {
    return { level: "validated", firstOrder: null, benefitsUntil: null };
  }

  const firstOrder = qualifying[0]!;
  if (rule.validMonths == null) {
    return { level: "customer", firstOrder, benefitsUntil: null };
  }

  const latest = qualifying[qualifying.length - 1]!;
  const until = new Date(latest.createdAt);
  until.setMonth(until.getMonth() + rule.validMonths);
  return until.getTime() >= now.getTime()
    ? { level: "customer", firstOrder, benefitsUntil: until }
    : { level: "validated", firstOrder, benefitsUntil: until };
}

const ORDER: Record<AccessLevel, number> = { visitor: 0, validated: 1, customer: 2 };
export const atLeast = (have: AccessLevel, need: AccessLevel) =>
  ORDER[have] >= ORDER[need];
