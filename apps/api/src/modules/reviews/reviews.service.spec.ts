import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Types } from "mongoose";
import { ReviewsService } from "./reviews.service";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";

const productId = new Types.ObjectId();
const userId = new Types.ObjectId();
const user = {
  sub: String(userId),
  email: "c@example.test",
  roles: ["customer"],
} as JwtPayload;
const admin = {
  sub: String(new Types.ObjectId()),
  email: "a@example.test",
  roles: ["super_administrator"],
} as JwtPayload;

function build(
  opts: { existing?: unknown; completedOrder?: boolean; recent?: number } = {},
) {
  const reviews = {
    findOne: jest.fn().mockResolvedValue(opts.existing ?? null),
    countDocuments: jest.fn().mockResolvedValue(opts.recent ?? 0),
    insertOne: jest.fn().mockResolvedValue({ insertedId: new Types.ObjectId() }),
    updateOne: jest.fn().mockResolvedValue({}),
    createIndex: jest.fn(),
    aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
  };
  const collections: Record<string, any> = {
    productreviews: reviews,
    products: {
      findOne: jest.fn().mockResolvedValue({
        _id: productId,
        slug: "ma-creme-jour",
        name: { en: "Ma Crème Jour" },
        visibility: "both",
      }),
    },
    users: {
      findOne: jest.fn().mockResolvedValue({ firstName: "Amira", lastName: "Hassan" }),
    },
    productvariants: {
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ sku: "IBP194-30ML" }]),
      }),
    },
    orders: {
      findOne: jest.fn().mockResolvedValue(opts.completedOrder ? { _id: 1 } : null),
    },
  };
  const audit = { recordEvent: jest.fn().mockResolvedValue(undefined) };
  const service = new ReviewsService(
    { collection: (n: string) => collections[n] } as never,
    audit as never,
  );
  return { service, reviews, collections, audit };
}

describe("ReviewsService", () => {
  it("stores a new review as pending, with a short author name and no verified badge by default", async () => {
    const { service, reviews } = build();
    const res = await service.create("ma-creme-jour", user, {
      rating: 5,
      title: "Lovely",
      comment: "A really nice texture, absorbs well.",
    });
    expect(res.status).toBe("pending");
    expect(res.verifiedPurchase).toBe(false);
    const doc = reviews.insertOne.mock.calls[0][0];
    expect(doc.status).toBe("pending");
    expect(doc.authorName).toBe("Amira H.");
  });

  it("marks a purchase as verified only when a paid, delivered order contains the product", async () => {
    const { service, collections } = build({ completedOrder: true });
    const res = await service.create("ma-creme-jour", user, {
      rating: 4,
      comment: "Delivered and tested for weeks.",
    });
    expect(res.verifiedPurchase).toBe(true);
    const query = collections.orders.findOne.mock.calls[0][0];
    expect(query.paymentStatus).toBe("paid");
    expect(query.fulfillmentStatus).toBe("delivered");
    expect(query["items.sku"].$in).toEqual(["IBP194-30ML"]);
  });

  it.each([0, 6, 3.5, "x", undefined])("rejects the rating %p", async (rating) => {
    const { service } = build();
    await expect(
      service.create("ma-creme-jour", user, {
        rating,
        comment: "Long enough comment here.",
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects a too-short comment and links", async () => {
    const { service } = build();
    await expect(
      service.create("ma-creme-jour", user, { rating: 5, comment: "nice" }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.create("ma-creme-jour", user, {
        rating: 5,
        comment: "Buy at https://spam.example now please",
      }),
    ).rejects.toThrow(/Links/);
  });

  it("strips HTML from the text", async () => {
    const { service, reviews } = build();
    await service.create("ma-creme-jour", user, {
      rating: 5,
      title: "<b>Great</b>",
      comment: "<script>x</script>Really good cream.",
    });
    const doc = reviews.insertOne.mock.calls[0][0];
    expect(doc.title).toBe("Great");
    expect(doc.comment).not.toContain("<");
  });

  it("refuses a second review of the same product by the same customer", async () => {
    const { service } = build({ existing: { _id: new Types.ObjectId() } });
    await expect(
      service.create("ma-creme-jour", user, {
        rating: 5,
        comment: "Another review of the same product.",
      }),
    ).rejects.toThrow(ConflictException);
  });

  it("limits how many reviews a customer can submit per day", async () => {
    const { service } = build({ recent: 5 });
    await expect(
      service.create("ma-creme-jour", user, {
        rating: 5,
        comment: "One review too many today.",
      }),
    ).rejects.toThrow(/several reviews/);
  });

  it("does not expose cabin-only products", async () => {
    const { service, collections } = build();
    collections.products.findOne.mockResolvedValue({
      _id: productId,
      slug: "x",
      visibility: "b2b_cabin",
    });
    await expect(service.listForProduct("x", undefined, {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it("computes the statistics from published reviews only", async () => {
    const { service, reviews } = build();
    reviews.aggregate.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([
        { _id: 5, n: 2, verified: 1 },
        { _id: 4, n: 1, verified: 0 },
      ]),
    });
    const s = await service.stats(productId);
    expect(s.count).toBe(3);
    expect(s.average).toBe(4.7);
    expect(s.distribution["5"]).toBe(2);
    expect(s.verifiedCount).toBe(1);
    expect(reviews.aggregate.mock.calls[0][0][0].$match.status).toBe("published");
  });

  it("reports no average when there are no published reviews", async () => {
    const { service } = build();
    const s = await service.stats(productId);
    expect(s).toEqual({
      count: 0,
      average: null,
      distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
      verifiedCount: 0,
    });
  });

  it("only a customer can withdraw their own review", async () => {
    const mine = { _id: new Types.ObjectId(), userId };
    const { service } = build({ existing: mine });
    await expect(
      service.withdraw({ ...user, sub: String(new Types.ObjectId()) }, String(mine._id)),
    ).rejects.toThrow(NotFoundException);
    await expect(service.withdraw(user, String(mine._id))).resolves.toMatchObject({
      status: "withdrawn",
    });
  });

  it("moderation needs commerce management and records who decided", async () => {
    const r = {
      _id: new Types.ObjectId(),
      status: "pending",
      productSlug: "ma-creme-jour",
    };
    const { service, reviews, audit } = build({ existing: r });
    await expect(
      service.moderate({ ...user, roles: ["customer"] }, String(r._id), {
        status: "published",
      }),
    ).rejects.toThrow();
    await service.moderate(admin, String(r._id), { status: "published", note: "ok" });
    const update = reviews.updateOne.mock.calls[0][1].$set;
    expect(update.status).toBe("published");
    expect(update.moderation.by).toBe("a@example.test");
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "review.published" }),
    );
    await expect(
      service.moderate(admin, String(r._id), { status: "bogus" }),
    ).rejects.toThrow(BadRequestException);
  });
});
