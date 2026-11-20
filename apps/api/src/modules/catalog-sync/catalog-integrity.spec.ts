import { Types } from "mongoose";
import { CatalogIntegrityService } from "./catalog-integrity.service";

type Doc = Record<string, any>;

function build(data: Record<string, Doc[]>) {
  const matches = (d: Doc, q: Doc): boolean =>
    Object.entries(q).every(([k, v]) => {
      if (k === "$or") return (v as Doc[]).some((x) => matches(d, x));
      if (k === "archivedAt" && v === null) return !d.archivedAt;
      const val = k
        .split(".")
        .reduce((o: any, p) => (Array.isArray(o) ? o.map((e) => e?.[p]) : o?.[p]), d);
      const vals = Array.isArray(val) ? val.flat() : [val];
      return vals.some((x) => String(x) === String(v));
    });
  const db = {
    collection: (name: string) => ({
      find: (q: Doc = {}) => ({
        toArray: async () => (data[name] ?? []).filter((d) => matches(d, q)),
      }),
      countDocuments: async (q: Doc) =>
        (data[name] ?? []).filter((d) => matches(d, q)).length,
      updateOne: async (q: Doc, u: { $set: Doc }) => {
        const d = (data[name] ?? []).find((x) => matches(x, q));
        if (d) Object.assign(d, u.$set);
        return { modifiedCount: d ? 1 : 0 };
      },
    }),
  };
  const audit = { recordEvent: jest.fn().mockResolvedValue({}) };
  return { svc: new CatalogIntegrityService(db as never, audit as never), audit };
}

describe("CatalogIntegrityService", () => {
  const live = new Types.ObjectId();
  const mk = () => {
    const free = {
      _id: new Types.ObjectId(),
      sku: "QA-FREE",
      productId: new Types.ObjectId(),
    };
    const used = {
      _id: new Types.ObjectId(),
      sku: "QA-USED",
      productId: new Types.ObjectId(),
    };
    const ok = { _id: new Types.ObjectId(), sku: "IBP104", productId: live };
    return {
      free,
      used,
      ok,
      data: {
        products: [{ _id: live }],
        productvariants: [free, used, ok],
        orders: [{ items: [{ sku: "QA-USED" }] }],
      } as Record<string, Doc[]>,
    };
  };

  it("lists only orphans and flags the ones an order refers to", async () => {
    const { data } = mk();
    const { svc } = build(data);
    const r = await svc.orphans();
    expect(r.map((x) => x.sku).sort()).toEqual(["QA-FREE", "QA-USED"]);
    expect(r.find((x) => x.sku === "QA-USED")).toMatchObject({
      safeToArchive: false,
      references: { orders: 1 },
    });
    expect(r.find((x) => x.sku === "QA-FREE")!.safeToArchive).toBe(true);
  });

  it("archives (never deletes) only unreferenced orphans and refuses the rest", async () => {
    const { data, free } = mk();
    const { svc, audit } = build(data);
    await expect(svc.archive({ sub: "a", email: "a@b.c" }, ["QA-USED"])).rejects.toThrow(
      "Not archived",
    );
    await expect(svc.archive({ sub: "a", email: "a@b.c" }, ["IBP104"])).rejects.toThrow(
      "Not archived",
    );
    const res = await svc.archive({ sub: "a", email: "a@b.c" }, ["QA-FREE"]);
    expect(res.archived).toBe(1);
    expect(data.productvariants).toHaveLength(3); // nothing deleted
    expect((free as Doc).archivedAt).toBeInstanceOf(Date);
    expect(audit.recordEvent).toHaveBeenCalled();
    expect((await svc.orphans()).map((x) => x.sku)).toEqual(["QA-USED"]); // archived ones leave the report
  });
});
