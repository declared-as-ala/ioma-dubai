import { Types } from "mongoose";
import {
  OrderNotificationsService,
  resolveOrderEvent,
} from "./order-notifications.service";

const st = (f: string, p: string) => ({ fulfillmentStatus: f, paymentStatus: p });

describe("resolveOrderEvent (only genuine transitions notify)", () => {
  it.each([
    [st("pending", "pending"), st("processing", "pending"), "confirmed"],
    [st("pending", "pending"), st("pending", "paid"), "payment_received"],
    [st("pending", "pending"), st("processing", "paid"), "payment_received"],
    [st("processing", "paid"), st("shipped", "paid"), "shipped"],
    [st("shipped", "paid"), st("delivered", "paid"), "delivered"],
    [st("processing", "paid"), st("cancelled", "paid"), "cancelled"],
    [st("processing", "paid"), st("cancelled", "refunded"), "cancelled_refunded"],
    [st("delivered", "paid"), st("delivered", "refunded"), "refunded"],
    // nothing changed, or a step back: no email
    [st("processing", "paid"), st("processing", "paid"), null],
    [st("processing", "paid"), st("processing", "paid"), null],
    [st("shipped", "paid"), st("processing", "paid"), null],
    [st("processing", "paid"), st("pending", "paid"), null],
    [st("cancelled", "pending"), st("processing", "pending"), null],
    [st("pending", "paid"), st("pending", "failed"), null],
  ])("%j -> %j = %s", (prev, next, expected) => {
    expect(resolveOrderEvent(prev, next)).toBe(expected);
  });

  it("never announces shipped or delivered unless the order really moved there", () => {
    expect(
      resolveOrderEvent(st("processing", "paid"), st("processing", "paid")),
    ).toBeNull();
    expect(resolveOrderEvent(st("pending", "pending"), st("processing", "paid"))).toBe(
      "payment_received",
    );
  });
});

const oid = () => new Types.ObjectId();

function build(opts: {
  order?: Record<string, unknown>;
  user?: Record<string, unknown> | null;
  env?: Record<string, string | undefined>;
  enqueue?: jest.Mock;
}) {
  const orderId = oid();
  const order: Record<string, any> = {
    _id: orderId,
    orderNumber: "IOMA-20261121-TEST01",
    type: "b2c",
    userId: oid(),
    guestToken: null,
    items: [
      {
        variantId: oid(),
        sku: "IBP104",
        qty: 2,
        unitPriceMinorSnapshot: 10_000,
        totalMinor: 20_000,
        productNameSnapshot: { en: "Cream", fr: "Crème", ar: "كريم" },
      },
    ],
    subtotalMinor: 20_000,
    taxMinor: 1_000,
    shippingMinor: 2_000,
    totalMinor: 23_000,
    currency: "AED",
    shippingAddress: {
      fullName: "A B",
      phone: "+971500000000",
      city: "Dubai",
      emirate: "Dubai",
      addressLine1: "x",
    },
    billingAddress: null,
    paymentStatus: "paid",
    fulfillmentStatus: "processing",
    statusHistory: [{ status: "shipped", at: new Date() }],
    createdAt: new Date(),
    locale: "en",
    ...opts.order,
  };
  const user =
    opts.user === undefined
      ? {
          _id: order.userId,
          email: "Buyer@Example.test",
          firstName: "Buy",
          lastName: "Er",
          locale: "ar",
        }
      : opts.user;
  const updates: unknown[] = [];
  const col = (name: string) => ({
    findOne: jest
      .fn()
      .mockImplementation(async () =>
        name === "orders"
          ? order
          : name === "users"
            ? user
            : name === "professionalprofiles"
              ? { companyName: "Serenity Spa" }
              : null,
      ),
    find: jest.fn().mockReturnValue({
      project: () => ({
        toArray: async () => [],
        limit: () => ({ toArray: async () => [] }),
      }),
    }),
    updateOne: jest.fn().mockImplementation(async (...a: unknown[]) => {
      updates.push(a);
    }),
  });
  const cols: Record<string, ReturnType<typeof col>> = {};
  const db = { collection: (n: string) => (cols[n] ??= col(n)) };
  const enqueue = opts.enqueue ?? jest.fn().mockResolvedValue({ created: true });
  const env: Record<string, string | undefined> = {
    APP_URL: "https://iomaparis.ae",
    ADMIN_APP_URL: "https://admin.iomaparis.ae",
    SUPPORT_EMAIL: "support@iomaparis.ae",
    CONTACT_EMAIL: "contact@iomaparis.ae",
    ...opts.env,
  };
  const svc = new OrderNotificationsService(
    db as never,
    { enqueue } as never,
    { verify: jest.fn(), addressFor: jest.fn() } as never,
    { get: (k: string) => env[k] } as never,
  );
  return { svc, enqueue, updates, order, orderId };
}

describe("OrderNotificationsService.placed", () => {
  it("queues one email to the customer and one to the admin recipients, with unique keys", async () => {
    const { svc, enqueue, orderId, updates } = build({
      order: { locale: "ar" },
      env: { ORDER_NOTIFY_EMAILS: "Ops@iomaparis.ae; boss@iomaparis.ae, not-an-email" },
    });
    await svc.placed(String(orderId));
    expect(enqueue).toHaveBeenCalledTimes(2);
    const [customer, admin] = enqueue.mock.calls.map((c) => c[0]);
    expect(customer).toMatchObject({
      key: `order-placed:customer:${orderId}`,
      to: "buyer@example.test",
      identity: "contact",
      replyTo: "support@iomaparis.ae",
      ref: "IOMA-20261121-TEST01",
    });
    expect(customer.subject).toContain("IOMA-20261121-TEST01");
    // the language stored on the order (chosen at checkout) is the one used
    expect(customer.html).toContain('dir="rtl"');
    expect(admin).toMatchObject({
      key: `order-placed:admin:${orderId}`,
      to: "ops@iomaparis.ae, boss@iomaparis.ae",
      identity: "support",
      replyTo: "buyer@example.test",
    });
    expect(admin.subject.startsWith("[B2C] New order")).toBe(true);
    // announced: the "pending" flag is cleared
    expect(JSON.stringify(updates)).toContain('"notifyPending":false');
  });

  it("uses the contact inbox when no admin recipient is configured, and never the sender by default", async () => {
    const { svc, enqueue, orderId } = build({});
    expect(svc.recipients()).toEqual(["contact@iomaparis.ae"]);
    await svc.placed(String(orderId));
    expect(enqueue.mock.calls[1]![0].to).toBe("contact@iomaparis.ae");
    expect(enqueue.mock.calls[1]![0].identity).toBe("support");
  });

  it("B2B order: partner company in the greeting, trade wording, portal link, [B2B] admin subject", async () => {
    const { svc, enqueue, orderId } = build({
      order: { type: "b2b" },
      user: {
        _id: oid(),
        email: "pro@spa.test",
        firstName: "P",
        lastName: "R",
        locale: "en",
      },
    });
    await svc.placed(String(orderId));
    const [customer, admin] = enqueue.mock.calls.map((c) => c[0]);
    expect(customer.html).toContain("Hello Serenity Spa,");
    expect(customer.html).toContain("trade prices");
    expect(customer.html).toContain("/portal/orders/IOMA-20261121-TEST01");
    expect(admin.subject.startsWith("[B2B]")).toBe(true);
  });

  it("guest order: emails the address from checkout and links to the guest confirmation page", async () => {
    const { svc, enqueue, orderId } = build({
      order: {
        userId: null,
        guestToken: "tok123",
        customerEmail: "guest@example.test",
        customerName: "Guest G",
      },
      user: null,
    });
    await svc.placed(String(orderId));
    const c = enqueue.mock.calls[0]![0];
    expect(c.to).toBe("guest@example.test");
    expect(c.html).toContain("/checkout/confirmation/IOMA-20261121-TEST01?token=tok123");
  });

  it("does not announce an order whose payment failed", async () => {
    const { svc, enqueue, orderId } = build({ order: { paymentStatus: "failed" } });
    await svc.placed(String(orderId));
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("never emails the admin form's placeholder address, but still tells the team", async () => {
    const { svc, enqueue, orderId } = build({
      order: { userId: null, customerEmail: "client@ioma-paris.ae" },
      user: null,
    });
    await svc.placed(String(orderId));
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue.mock.calls[0]![0].key).toBe(`order-placed:admin:${orderId}`);
  });

  it("keeps the order marked as pending when the queue could not store a mail (the sweep retries it)", async () => {
    const enqueue = jest.fn().mockResolvedValue({ created: false, failed: true });
    const { svc, orderId, updates } = build({ enqueue });
    await svc.placed(String(orderId));
    expect(updates).toHaveLength(0);
  });

  it("is safe to call twice: the same keys are used, so the outbox keeps one email each", async () => {
    const { svc, enqueue, orderId } = build({});
    await svc.placed(String(orderId));
    await svc.placed(String(orderId));
    const keys = enqueue.mock.calls.map((c) => c[0].key);
    expect(new Set(keys).size).toBe(2);
    expect(keys.slice(0, 2)).toEqual(keys.slice(2, 4));
  });

  it("never throws, whatever goes wrong underneath", async () => {
    const enqueue = jest.fn().mockRejectedValue(new Error("db down"));
    const { svc, orderId } = build({ enqueue });
    await expect(svc.placed(String(orderId))).resolves.toBeUndefined();
  });
});

describe("OrderNotificationsService.statusChanged", () => {
  it("queues one customer email whose key counts each real arrival at the status", async () => {
    const { svc, enqueue, orderId } = build({
      order: {
        fulfillmentStatus: "shipped",
        statusHistory: [
          { status: "shipped" },
          { status: "processing" },
          { status: "shipped" },
        ],
      },
    });
    await svc.statusChanged(String(orderId), "shipped");
    const m = enqueue.mock.calls[0]![0];
    expect(m.key).toBe(`order-shipped:customer:${orderId}:2`);
    expect(m.to).toBe("buyer@example.test");
    expect(m.kind).toBe("order.shipped.customer.b2c");
    expect(enqueue).toHaveBeenCalledTimes(1);
  });

  it("sends nothing when there is no deliverable address", async () => {
    const { svc, enqueue, orderId } = build({
      order: { userId: null, customerEmail: "client@ioma-paris.ae" },
      user: null,
    });
    await svc.statusChanged(String(orderId), "delivered");
    expect(enqueue).not.toHaveBeenCalled();
  });
});
