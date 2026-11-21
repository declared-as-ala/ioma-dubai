import { Types } from "mongoose";
import { checkTranslation, TranslationBulkService } from "./translation-bulk.service";

const FR =
  "Hydratation jusqu'à 24 heures*\n• Instantanément : +68% d'hydratation*\n• Après 24 heures : +26% d'hydratation*";

describe("checkTranslation", () => {
  it("passes a faithful translation", () => {
    const en =
      "Hydration for up to 24 hours*\n• Instantly: +68% hydration*\n• After 24 hours: +26% hydration*";
    expect(checkTranslation(FR, en, "en")).toEqual([]);
  });

  it("fails when a percentage changes", () => {
    const en =
      "Hydration for up to 24 hours*\n• Instantly: +86% hydration*\n• After 24 hours: +26% hydration*";
    const r = checkTranslation(FR, en, "en");
    expect(r.some((c) => c.level === "fail" && /Figures differ/.test(c.message))).toBe(
      true,
    );
  });

  it("treats a decimal comma and a decimal point as the same figure", () => {
    expect(
      checkTranslation(
        "Jusqu'à 77,5% de peau plus lisse",
        "Up to 77.5% smoother skin",
        "en",
      ),
    ).toEqual([]);
  });

  it("fails when an official name is lost", () => {
    const r = checkTranslation(
      "Le concentré contient du NEUTRAZEN, un peptide apaisant.",
      "The concentrate contains a soothing peptide.",
      "en",
    );
    expect(r.some((c) => c.level === "fail" && /NEUTRAZEN/.test(c.message))).toBe(true);
  });

  it("fails an English translation that is still French, and an Arabic one with no Arabic", () => {
    expect(
      checkTranslation(
        "Appliquer matin et soir sur une peau nettoyée.",
        "Appliquer matin et soir sur une peau nettoyée.",
        "en",
      ).some((c) => c.level === "fail"),
    ).toBe(true);
    expect(
      checkTranslation("Appliquer le soin.", "Apply the care.", "ar").some((c) =>
        /no Arabic/.test(c.message),
      ),
    ).toBe(true);
  });

  it("flags a missing translation", () => {
    expect(checkTranslation("Texte", "", "en")[0]?.level).toBe("fail");
  });

  it("warns, not fails, on small number differences written as words", () => {
    const r = checkTranslation(
      "Appliquer 2 pompes matin et soir",
      "Apply two pumps morning and evening",
      "en",
    );
    expect(r.every((c) => c.level !== "fail")).toBe(true);
  });
});

/** A tiny in-memory stand-in for the two collections the service touches. */
function fakeDb(products: Record<string, any>[]) {
  const batches: Record<string, any>[] = [];
  const getPath = (o: any, path: string) => path.split(".").reduce((v, k) => v?.[k], o);
  const setPath = (o: any, path: string, value: unknown) => {
    const keys = path.split(".");
    let cur = o;
    for (const k of keys.slice(0, -1)) cur = cur[k] ??= {};
    cur[keys[keys.length - 1]!] = value;
  };
  const delPath = (o: any, path: string) => {
    const keys = path.split(".");
    let cur = o;
    for (const k of keys.slice(0, -1)) cur = cur?.[k];
    if (cur) delete cur[keys[keys.length - 1]!];
  };
  const productsCol = {
    find: () => ({
      sort: () => ({ toArray: async () => products }),
    }),
    findOne: async (q: any) =>
      products.find((p) => String(p._id) === String(q._id)) ?? null,
    updateOne: async (q: any, u: any) => {
      const p = products.find((x) => String(x._id) === String(q._id))!;
      for (const [k, v] of Object.entries(u.$set ?? {})) setPath(p, k, v);
      for (const k of Object.keys(u.$unset ?? {})) delPath(p, k);
      return {};
    },
  };
  const batchesCol = {
    insertOne: async (d: any) => {
      const _id = new Types.ObjectId();
      batches.push({ _id, ...d });
      return { insertedId: _id };
    },
    findOne: async (q: any) =>
      batches.find((b) => String(b._id) === String(q._id)) ?? null,
    updateOne: async (q: any, u: any) => {
      Object.assign(
        batches.find((b) => String(b._id) === String(q._id))!,
        u.$set,
      );
      return {};
    },
  };
  void getPath;
  return {
    db: {
      collection: (n: string) => (n === "products" ? productsCol : batchesCol),
    } as never,
    batches,
  };
}

describe("TranslationBulkService approve and rollback", () => {
  const actor = { sub: String(new Types.ObjectId()), email: "owner@example.test" };
  const makeProduct = (slug: string, draftEn: string) => ({
    _id: new Types.ObjectId(),
    slug,
    name: { en: slug },
    visibility: "both",
    howToUse: {
      fr: "Appliquer 2 pompes le matin et le soir.",
      en: "Appliquer 2 pompes le matin et le soir.",
      ar: "Appliquer 2 pompes le matin et le soir.",
    },
    enDraft: { status: "draft", fields: { howToUse: draftEn } },
    arDraft: { status: "draft", fields: { howToUse: "ضعي مضختين صباحًا ومساءً." } },
  });

  it("publishes only the selected products, keeps the French original, and can be rolled back", async () => {
    const a = makeProduct("a", "Apply 2 pumps in the morning and in the evening.");
    const b = makeProduct("b", "Apply 2 pumps in the morning and in the evening.");
    const { db } = fakeDb([a, b]);
    const svc = new TranslationBulkService(db, { recordEvent: jest.fn() } as never);

    const res = await svc.approve(actor, { productIds: [String(a._id)], langs: ["en"] });
    expect(res.approved).toBe(1);
    expect(a.howToUse.en).toBe("Apply 2 pumps in the morning and in the evening.");
    expect(a.howToUse.fr).toBe("Appliquer 2 pompes le matin et le soir.");
    expect(a.enDraft.status).toBe("approved");
    expect(b.howToUse.en).toMatch(/^Appliquer/); // not selected: untouched

    const back = await svc.rollback(actor, res.batchId!);
    expect(back.restored).toBe(1);
    expect(a.howToUse.en).toMatch(/^Appliquer/);
    expect(a.enDraft.status).toBe("draft");
    await expect(svc.rollback(actor, res.batchId!)).rejects.toThrow(/already/);
  });

  it("skips a product whose verification failed unless forced", async () => {
    const bad = makeProduct(
      "bad",
      "Apply 3 pumps in the morning and in the evening, 99% safe.",
    );
    const { db } = fakeDb([bad]);
    const svc = new TranslationBulkService(db, { recordEvent: jest.fn() } as never);
    const res = await svc.approve(actor, {
      productIds: [String(bad._id)],
      langs: ["en"],
    });
    expect(res.approved).toBe(0);
    expect(res.skipped[0]?.reason).toMatch(/verification failed/);
    expect(bad.howToUse.en).toMatch(/^Appliquer/);
  });

  it("does not overwrite text that was edited by hand after the approval", async () => {
    const a = makeProduct("a", "Apply 2 pumps in the morning and in the evening.");
    const { db } = fakeDb([a]);
    const svc = new TranslationBulkService(db, { recordEvent: jest.fn() } as never);
    const res = await svc.approve(actor, { productIds: [String(a._id)], langs: ["en"] });
    a.howToUse.en = "Apply 2 pumps, morning and evening (edited).";
    const back = await svc.rollback(actor, res.batchId!);
    expect(back.restored).toBe(0);
    expect(back.leftAsEdited).toEqual(["a.howToUse.en"]);
    expect(a.howToUse.en).toContain("edited");
  });

  it("requires a selection and a language", async () => {
    const { db } = fakeDb([]);
    const svc = new TranslationBulkService(db, { recordEvent: jest.fn() } as never);
    await expect(svc.approve(actor, { productIds: [], langs: ["en"] })).rejects.toThrow();
    await expect(
      svc.approve(actor, { productIds: [String(new Types.ObjectId())], langs: [] }),
    ).rejects.toThrow();
  });
});
