import { BadRequestException } from "@nestjs/common";
import { Types } from "mongoose";
import { OrdersService } from "./orders.service";
import type { CheckoutDto } from "./dto/checkout.dto";

const variantId = new Types.ObjectId();
const productId = new Types.ObjectId();
const dto: CheckoutDto = {
  shippingAddress: {
    fullName: "Layla Haddad",
    phone: "+971500000000",
    emirate: "Dubai",
    city: "Dubai",
    addressLine1: "Marina Walk 1",
  } as never,
  deliveryMethod: "standard",
  paymentMethod: "mock_success",
  email: "Layla@Example.test",
  locale: "ar",
};

function build(
  opts: {
    existing?: unknown;
    createError?: unknown;
    payment?: "succeeded" | "failed";
  } = {},
) {
  const created: Record<string, any>[] = [];
  const orderModel = {
    findOne: jest.fn().mockResolvedValue(opts.existing ?? null),
    create: jest.fn().mockImplementation(async (doc: Record<string, any>) => {
      if (opts.createError) throw opts.createError;
      const o: Record<string, any> = {
        ...doc,
        _id: new Types.ObjectId(),
        id: "oid1",
        statusHistory: [...doc.statusHistory],
        save: jest.fn().mockResolvedValue(undefined),
        toObject() {
          return { ...this };
        },
      };
      created.push(o);
      return o;
    }),
    findOneAndUpdate: jest.fn(),
  };
  const variantModel = {
    find: jest.fn().mockResolvedValue([{ _id: variantId, sku: "IBP104", productId }]),
    updateOne: jest.fn().mockResolvedValue(undefined),
  };
  const productModel = {
    find: jest
      .fn()
      .mockResolvedValue([
        { _id: productId, name: { en: "Cream", fr: "Crème", ar: "كريم" } },
      ]),
  };
  const cart = {
    getCart: jest.fn().mockResolvedValue({ items: [{ sku: "IBP104", qty: 2 }] }),
    version: jest.fn().mockResolvedValue("cart1:1000"),
    currentPriceMinor: jest.fn().mockReturnValue(10_000),
    clearCart: jest.fn().mockResolvedValue(undefined),
  };
  const payments = {
    createPending: jest.fn().mockResolvedValue({}),
    charge: jest.fn().mockResolvedValue({ status: opts.payment ?? "succeeded" }),
  };
  const notifications = {
    placed: jest.fn().mockResolvedValue(undefined),
    statusChanged: jest.fn(),
  };
  const users = {
    findOne: jest.fn().mockResolvedValue({
      email: "Pro@Spa.test",
      firstName: "P",
      lastName: "R",
      locale: "en",
    }),
  };
  const db = {
    collection: (n: string) =>
      n === "users"
        ? users
        : { findOne: jest.fn().mockResolvedValue({ companyName: "Serenity Spa" }) },
  };
  const svc = new OrdersService(
    orderModel as never,
    variantModel as never,
    productModel as never,
    cart as never,
    payments as never,
    notifications as never,
    db as never,
  );
  return { svc, orderModel, cart, payments, notifications, created, variantModel };
}

describe("OrdersService.checkout", () => {
  it("creates the order from stored contact data, charges once and announces it once", async () => {
    const { svc, created, payments, notifications } = build();
    const r = await svc.checkout({ sessionId: "guest-1" }, dto);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      customerEmail: "layla@example.test",
      customerName: "Layla Haddad",
      locale: "ar",
      paymentMethod: "demo",
      notifyPending: true,
      subtotalMinor: 20_000,
      taxMinor: 1_000,
      shippingMinor: 2_000,
      totalMinor: 23_000,
    });
    expect(String(created[0]!.checkoutKey)).toMatch(/^[a-f0-9]{64}$/);
    expect(r.paymentStatus).toBe("paid");
    expect(payments.charge).toHaveBeenCalledTimes(1);
    expect(notifications.placed).toHaveBeenCalledTimes(1);
  });

  it("a repeated request for the same cart returns the existing order: no second order, charge or email", async () => {
    const existing = {
      toObject: () => ({ orderNumber: "IOMA-EXISTING", paymentStatus: "paid" }),
    };
    const { svc, orderModel, payments, notifications } = build({ existing });
    const r = await svc.checkout({ sessionId: "guest-1" }, dto);
    expect(r).toMatchObject({ orderNumber: "IOMA-EXISTING" });
    expect(orderModel.create).not.toHaveBeenCalled();
    expect(payments.charge).not.toHaveBeenCalled();
    expect(notifications.placed).not.toHaveBeenCalled();
  });

  it("two simultaneous requests: the loser of the race gets the winner's order", async () => {
    const winner = { toObject: () => ({ orderNumber: "IOMA-WINNER" }) };
    const { svc, orderModel, payments } = build({ createError: { code: 11000 } });
    orderModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(winner);
    const r = await svc.checkout({ sessionId: "guest-1" }, dto);
    expect(r).toMatchObject({ orderNumber: "IOMA-WINNER" });
    expect(payments.charge).not.toHaveBeenCalled();
  });

  it("the key depends on the cart state, so a new cart is a new order", async () => {
    const a = build();
    await a.svc.checkout({ sessionId: "g" }, dto);
    const b = build();
    b.cart.version.mockResolvedValue("cart1:2000");
    await b.svc.checkout({ sessionId: "g" }, dto);
    expect(a.created[0]!.checkoutKey).not.toBe(b.created[0]!.checkoutKey);
  });

  it("guests must give an email address", async () => {
    const { svc, created } = build();
    await expect(
      svc.checkout({ sessionId: "g" }, { ...dto, email: undefined }),
    ).rejects.toThrow(BadRequestException);
    expect(created).toHaveLength(0);
  });

  it("signed-in customers use their account email, never the one in the request", async () => {
    const { svc, created } = build();
    await svc.checkout(
      { userId: String(new Types.ObjectId()), professionalApproved: false },
      { ...dto, email: "someone-else@example.test" },
    );
    expect(created[0]!.customerEmail).toBe("pro@spa.test");
  });

  it("B2B checkout stores the company and the professional order type", async () => {
    const { svc, created } = build();
    await svc.checkout(
      { userId: String(new Types.ObjectId()), type: "b2b", professionalApproved: true },
      dto,
    );
    expect(created[0]).toMatchObject({ type: "b2b", companyName: "Serenity Spa" });
  });

  it("a failed payment is not announced and frees the key for a deliberate new attempt", async () => {
    const { svc, created, notifications } = build({ payment: "failed" });
    const r = await svc.checkout(
      { sessionId: "g" },
      { ...dto, paymentMethod: "mock_failure" },
    );
    expect(r.paymentStatus).toBe("failed");
    expect(created[0]!.checkoutKey).toBeNull();
    expect(notifications.placed).not.toHaveBeenCalled();
  });
});

describe("OrdersService.retryPayment", () => {
  it("claims the failed order atomically; a second click finds nothing to retry", async () => {
    const { svc, orderModel } = build();
    const failed = {
      _id: new Types.ObjectId(),
      type: "b2c",
      userId: null,
      guestToken: "tok",
      paymentStatus: "failed",
    };
    orderModel.findOne.mockResolvedValue(failed);
    orderModel.findOneAndUpdate.mockResolvedValue(null); // someone else already claimed it
    await expect(
      svc.retryPayment("IOMA-X", { guestToken: "tok" } as never, "mock_success"),
    ).rejects.toThrow(BadRequestException);
    expect(orderModel.findOneAndUpdate.mock.calls[0]![0]).toMatchObject({
      paymentStatus: "failed",
    });
  });
});
