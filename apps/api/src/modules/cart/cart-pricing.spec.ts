import { stockState } from "@ioma/config";
import { canFulfil, isInStock, isTracked } from "../../common/inventory";
import { CartService } from "./cart.service";

const userId = "507f1f77bcf86cd799439011";

function build(
  variant: Record<string, unknown>,
  product: Record<string, unknown> = { status: "published", visibility: "both" },
) {
  const cart = { items: [] as unknown[], save: jest.fn(), id: "c1", type: "b2c" };
  const model = { findOne: jest.fn().mockResolvedValue(cart), create: jest.fn() };
  const variants = {
    findOne: jest
      .fn()
      .mockResolvedValue({ sku: "X", productId: userId, _id: "v", id: "v", ...variant }),
    find: jest.fn().mockReturnValue({ lean: async () => [] }),
  };
  const products = {
    findById: jest.fn().mockResolvedValue(product),
    find: jest.fn().mockReturnValue({ lean: async () => [] }),
  };
  return {
    service: new CartService(
      model as never,
      variants as never,
      products as never,
      {} as never,
    ),
    cart,
  };
}

describe("a product without a price can never be bought", () => {
  it("rejects a retail variant priced at 0 AED (price on request)", async () => {
    const { service, cart } = build({
      b2cPriceMinor: 0,
      b2bPriceMinor: 5000,
      quantityOnHand: 5,
      quantityReserved: 0,
    });
    await expect(service.addItem({ userId }, { sku: "X", qty: 1 })).rejects.toThrow(
      "available on request",
    );
    expect(cart.save).not.toHaveBeenCalled();
  });

  it("a professional cart never falls back to the retail price", async () => {
    const { service } = build({
      b2cPriceMinor: 44200,
      b2bPriceMinor: null,
      quantityOnHand: 5,
      quantityReserved: 0,
    });
    await expect(
      service.addItem({ userId, type: "b2b" }, { sku: "X", qty: 1 }, "b2b"),
    ).rejects.toThrow("available on request");
  });

  it("uses the trade price for professionals and the retail price for consumers", () => {
    const { service } = build({});
    const v = { b2cPriceMinor: 44200, b2bPriceMinor: 26309 } as never;
    expect(service.currentPriceMinor(v, "b2c")).toBe(44200);
    expect(service.currentPriceMinor(v, "b2b")).toBe(26309);
    expect(
      service.currentPriceMinor(
        { b2cPriceMinor: -1, b2bPriceMinor: null } as never,
        "b2b",
      ),
    ).toBe(0);
  });

  it("adds a priced item", async () => {
    const { service, cart } = build({
      b2cPriceMinor: 44200,
      quantityOnHand: 5,
      quantityReserved: 0,
    });
    await service.addItem({ userId }, { sku: "X", qty: 2 });
    expect(cart.save).toHaveBeenCalled();
  });
});

describe("per-variant inventory tracking", () => {
  it("an untracked variant is always sellable and in stock", () => {
    const v = {
      trackInventory: false,
      quantityOnHand: 0,
      quantityReserved: 0,
      backorderAllowed: false,
    };
    expect(isTracked(v)).toBe(false);
    expect(canFulfil(v, 50)).toBe(true);
    expect(isInStock(v)).toBe(true);
  });

  it("a tracked variant respects stock, and backorder lifts the limit", () => {
    const v = {
      trackInventory: true,
      quantityOnHand: 3,
      quantityReserved: 1,
      backorderAllowed: false,
    };
    expect(canFulfil(v, 2)).toBe(true);
    expect(canFulfil(v, 3)).toBe(false);
    expect(canFulfil({ ...v, backorderAllowed: true }, 30)).toBe(true);
    expect(isInStock({ ...v, quantityOnHand: 0 })).toBe(false);
  });

  it("legacy variants without the flag stay tracked", () => {
    expect(isTracked({ quantityOnHand: 0 })).toBe(true);
  });

  it("the explicit flag decides the reported stock state", () => {
    expect(stockState([{ trackInventory: false, quantityOnHand: 0 }])).toBe(
      "not_tracked",
    );
    expect(
      stockState([{ trackInventory: true, quantityOnHand: 0, backorderAllowed: true }]),
    ).toBe("in_stock");
    expect(
      stockState([{ trackInventory: true, quantityOnHand: 0, backorderAllowed: false }]),
    ).toBe("out");
  });
});
