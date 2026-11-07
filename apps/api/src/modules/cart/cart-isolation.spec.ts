import { CartService } from "./cart.service";

describe("personal and professional cart isolation", () => {
  const userId = "507f1f77bcf86cd799439011";
  it("loads different carts for one identity without switching cart types", async () => {
    const model = {
      findOne: jest.fn().mockImplementation(async (filter) => ({
        id: filter.type,
        type: filter.type,
        items: [],
      })),
    };
    const variants = { find: jest.fn().mockReturnValue({ lean: async () => [] }) };
    const products = { find: jest.fn().mockReturnValue({ lean: async () => [] }) };
    const service = new CartService(
      model as never,
      variants as never,
      products as never,
      {} as never,
    );
    expect((await service.getCart({ userId })).type).toBe("b2c");
    expect((await service.getCart({ userId, type: "b2b" })).type).toBe("b2b");
    expect(model.findOne.mock.calls.map((call) => call[0].type)).toEqual(["b2c", "b2b"]);
  });
  it("rejects a cabin product through the personal add endpoint", async () => {
    const variants = {
      findOne: jest.fn().mockResolvedValue({
        sku: "CABIN",
        productId: userId,
        quantityOnHand: 10,
        quantityReserved: 0,
      }),
    };
    const products = {
      findById: jest
        .fn()
        .mockResolvedValue({ status: "published", visibility: "b2b_cabin" }),
    };
    const service = new CartService(
      {} as never,
      variants as never,
      products as never,
      {} as never,
    );
    await expect(service.addItem({ userId }, { sku: "CABIN", qty: 1 })).rejects.toThrow(
      "Product unavailable",
    );
  });
});
