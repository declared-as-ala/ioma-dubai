import { ForbiddenException } from "@nestjs/common";
import { ProContentService } from "./pro-content.service";
import type { AccessLevel } from "../professional/pro-access.rules";

const VIDEO = {
  _id: { toString: () => "v1" },
  title: { en: "Welcome to IOMA Pro", ar: "مرحباً" },
  category: "sales",
  durationMinutes: 12,
  preview: "/previews/v1.jpg",
  videoUrl: "https://videos.example/secret-full-video.mp4",
  status: "published",
};
const PHOTO = {
  _id: { toString: () => "p1" },
  title: { en: "Cabin", ar: "كابينة" },
  category: "cabins",
  preview: "/previews/p1.jpg",
  image: "/images/full-resolution.jpg",
  status: "published",
};
const DOCS = [
  {
    _id: { toString: () => "d1" },
    title: { en: "Price list" },
    kind: "price_list",
    requiredAccess: "validated",
    fileDocumentId: "507f1f77bcf86cd799439011",
    status: "published",
  },
  {
    _id: { toString: () => "d2" },
    title: { en: "Brand book" },
    kind: "brand_book",
    requiredAccess: "customer",
    fileDocumentId: "507f1f77bcf86cd799439012",
    status: "published",
  },
];

function build(level: AccessLevel) {
  const data: Record<string, unknown[]> = {
    provideos: [VIDEO],
    prophotos: [PHOTO],
    prodocuments: DOCS,
    probenefits: [],
  };
  const progressWrites: unknown[] = [];
  const connection = {
    collection: (name: string) => ({
      find: () => ({
        sort: () => ({ toArray: async () => data[name] ?? [] }),
        toArray: async () => data[name] ?? [],
      }),
      findOne: async (q: { _id: { toString(): string } }) =>
        (data[name] as typeof DOCS).find((d) => d._id.toString() === q._id.toString()) ??
        null,
      updateOne: async (...args: unknown[]) => {
        progressWrites.push(args);
        return {};
      },
    }),
  };
  const access = {
    assertLevel: jest.fn(async () => ({ level })),
    getAccess: jest.fn(async () => ({ level })),
  };
  const documents = { getSignedUrl: jest.fn(async () => "https://signed.example/file") };
  const service = new ProContentService(
    connection as never,
    access as never,
    documents as never,
  );
  return { service, documents, progressWrites };
}

const UID = "507f1f77bcf86cd799439001";

describe("ProContentService locking", () => {
  it("validated account: the video list never contains the real video URL", async () => {
    const { service } = build("validated");
    const [v] = await service.videos(UID, []);
    expect(v!.locked).toBe(true);
    expect(v!.videoUrl).toBeNull();
    expect(v!.preview).toBe("/previews/v1.jpg");
    expect(JSON.stringify(v)).not.toContain("secret-full-video");
  });

  it("customer: the video URL is delivered", async () => {
    const { service } = build("customer");
    const [v] = await service.videos(UID, []);
    expect(v!.locked).toBe(false);
    expect(v!.videoUrl).toBe("https://videos.example/secret-full-video.mp4");
  });

  it("validated account: the gallery never contains the full-resolution image", async () => {
    const { service } = build("validated");
    const [p] = await service.gallery(UID, []);
    expect(p!.locked).toBe(true);
    expect(p!.image).toBeNull();
    expect(JSON.stringify(p)).not.toContain("full-resolution");
  });

  it("documents: order documents are open once validated, the brand book stays locked", async () => {
    const { service } = build("validated");
    const list = await service.documentsList("u", []);
    expect(list.find((d) => d.kind === "price_list")!.locked).toBe(false);
    expect(list.find((d) => d.kind === "brand_book")!.locked).toBe(true);
  });

  it("a locked document cannot be downloaded", async () => {
    const { service, documents } = build("validated");
    await expect(
      service.documentUrl("u", [], "507f1f77bcf86cd799439099"),
    ).rejects.toThrow();
    const brand = DOCS[1]!;
    (brand._id as { toString: () => string }).toString = () => "507f1f77bcf86cd799439022";
    await expect(
      service.documentUrl("u", [], "507f1f77bcf86cd799439022"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(documents.getSignedUrl).not.toHaveBeenCalled();
  });

  it("a customer can download any published document", async () => {
    const { service, documents } = build("customer");
    const price = DOCS[0]!;
    (price._id as { toString: () => string }).toString = () => "507f1f77bcf86cd799439033";
    await expect(
      service.documentUrl("u", [], "507f1f77bcf86cd799439033"),
    ).resolves.toEqual({ url: "https://signed.example/file" });
    expect(documents.getSignedUrl).toHaveBeenCalledTimes(1);
  });

  it("learning progress: a locked account cannot record it, an unlocked one can", async () => {
    const locked = build("validated");
    await expect(
      locked.service.saveProgress(UID, [], "v1", { positionSeconds: 30 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(locked.progressWrites).toHaveLength(0);

    const open = build("customer");
    (VIDEO._id as { toString: () => string }).toString = () => "507f1f77bcf86cd799439044";
    await open.service.saveProgress(UID, [], "507f1f77bcf86cd799439044", {
      positionSeconds: 61.4,
      completed: true,
    });
    expect(open.progressWrites).toHaveLength(1);
    const [, update] = open.progressWrites[0] as [
      unknown,
      { $set: Record<string, unknown> },
    ];
    expect(update.$set.positionSeconds).toBe(61);
    expect(update.$set.completed).toBe(true);
  });
});
