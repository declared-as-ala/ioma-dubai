import { BadRequestException } from "@nestjs/common";
import { ProfessionalPricingService } from "./professional-pricing.service";

type Doc = Record<string, any>;

function build(variants: Doc[]) {
  const updates: Array<[Doc, Doc]> = [];
  const history: Doc[] = [];
  const db = {
    collection: (name: string) => ({
      find: (q: Doc) => ({
        toArray: async () =>
          name === "productvariants" && q.sku
            ? variants.filter((v) => q.sku.$in.includes(v.sku))
            : variants,
      }),
      insertOne: async (d: Doc) => {
        if (name === "pricehistory") history.push(d);
        return {};
      },
      updateOne: async (filter: Doc, update: Doc) => {
        updates.push([filter, update]);
        const v = variants.find((x) => String(x._id) === String(filter._id));
        if (v) Object.assign(v, update.$set);
        return {};
      },
    }),
  };
  const audit = { recordEvent: jest.fn().mockResolvedValue({}) };
  return {
    svc: new ProfessionalPricingService(db as never, audit as never),
    updates,
    history,
    audit,
  };
}

const actor = { sub: "a", email: "admin@example.test" };
const variant = () => ({
  _id: "v1",
  sku: "IBP302",
  b2bPriceMinor: 10000,
  suggestedRetailMinor: null,
  moq: null,
});

describe("ProfessionalPricingService", () => {
  it("previews a change without writing anything", async () => {
    const { svc, updates, audit } = build([variant()]);
    const r = await svc.change(actor, {
      dryRun: true,
      items: [{ sku: "IBP302", b2bPriceMinor: 12500 }],
    });
    expect(r.applied).toBe(false);
    expect(r.changes[0]).toMatchObject({
      sku: "IBP302",
      b2bPriceMinor: { from: 10000, to: 12500 },
    });
    expect(updates).toHaveLength(0);
    expect(audit.recordEvent).not.toHaveBeenCalled();
  });

  it("publishes the change and records it in the audit trail", async () => {
    const { svc, updates, audit, history } = build([variant()]);
    const r = await svc.change(actor, {
      items: [{ sku: "IBP302", b2bPriceMinor: 12500, moq: 2 }],
    });
    expect(r.applied).toBe(true);
    // who changed which price, from what to what, and when
    expect(history).toHaveLength(2);
    expect(history.find((h) => h.field === "b2bPriceMinor")).toMatchObject({
      sku: "IBP302",
      from: 10000,
      to: 12500,
      byEmail: "admin@example.test",
    });
    expect(history[0]!.at).toBeInstanceOf(Date);
    expect(updates).toHaveLength(1);
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "admin.professional-pricing.updated" }),
    );
  });

  it("skips unchanged values and rejects invalid or unknown input", async () => {
    const { svc, updates } = build([variant()]);
    const same = await svc.change(actor, {
      items: [{ sku: "IBP302", b2bPriceMinor: 10000 }],
    });
    expect(same.changes).toHaveLength(0);
    expect(updates).toHaveLength(0);
    await expect(
      svc.change(actor, { items: [{ sku: "IBP302", b2bPriceMinor: -5 }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      svc.change(actor, { items: [{ sku: "IBP302", b2bPriceMinor: 1.5 }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      svc.change(actor, { items: [{ sku: "NOPE", b2bPriceMinor: 100 }] }),
    ).rejects.toThrow("Unknown SKU");
    await expect(
      svc.change(actor, {
        items: [
          { sku: "IBP302", b2bPriceMinor: 1 },
          { sku: "IBP302", b2bPriceMinor: 2 },
        ],
      }),
    ).rejects.toThrow("once");
  });
});
