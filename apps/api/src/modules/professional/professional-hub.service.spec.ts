import { ConflictException, NotFoundException } from "@nestjs/common";
import { Types } from "mongoose";
import { ProfessionalHubService } from "./professional-hub.service";

type Doc = Record<string, any>;

/** Minimal in-memory stand-in for the Mongo collections the hub reads and writes. */
function fakeDb(data: Record<string, Doc[]>) {
  const match = (d: Doc, q: Doc): boolean =>
    Object.entries(q).every(([k, v]) => {
      if (v && typeof v === "object" && "$in" in v)
        return (v.$in as unknown[]).some((x) => String(x) === String(d[k]));
      if (v && typeof v === "object" && "$ne" in v) return String(d[k]) !== String(v.$ne);
      return String(d[k]) === String(v);
    });
  return {
    collection: (name: string) => ({
      find: (q: Doc = {}) => {
        const rows = (data[name] ?? []).filter((d) => match(d, q));
        const cur: any = {
          sort: () => cur,
          limit: () => cur,
          toArray: async () => rows,
        };
        return cur;
      },
      findOne: async (q: Doc) => (data[name] ?? []).find((d) => match(d, q)) ?? null,
      countDocuments: async () => (data[name] ?? []).length,
      aggregate: () => ({ toArray: async () => [] }),
      updateOne: async (q: Doc, u: { $set?: Doc }) => {
        const d = (data[name] ?? []).find((x) => match(x, q));
        if (d && u.$set) Object.assign(d, u.$set);
        return { matchedCount: d ? 1 : 0 };
      },
    }),
  };
}

const actor = { sub: "a1", email: "admin@example.com" };
const id = () => new Types.ObjectId();

function build(data: Record<string, Doc[]>) {
  const audit = { recordEvent: jest.fn().mockResolvedValue({}) };
  const users = {
    addRole: jest.fn(),
    removeRole: jest.fn(),
    findById: jest.fn().mockResolvedValue({ email: "owner@example.com" }),
  };
  const access = {
    getAccess: jest.fn().mockResolvedValue({ level: "validated" }),
    assertLevel: jest.fn().mockResolvedValue({ level: "validated" }),
  };
  const svc = new ProfessionalHubService(
    fakeDb(data) as never,
    users as never,
    access as never,
    audit as never,
  );
  return { svc, audit, users };
}

describe("ProfessionalHubService", () => {
  it("lists a professional with its public profile once, and keeps unlinked partners visible", async () => {
    const p1 = { _id: id(), userId: id(), companyName: "Spa A", status: "approved" };
    const partnerA = {
      _id: id(),
      name: "Spa A",
      type: "spa",
      status: "active",
      professionalProfileId: p1._id,
    };
    const partnerB = {
      _id: id(),
      name: "Standalone",
      type: "clinic",
      status: "inactive",
    };
    (p1 as Doc).partnerId = partnerA._id;
    const { svc } = build({
      professionalprofiles: [p1],
      partners: [partnerA, partnerB],
      users: [{ _id: p1.userId, email: "a@x.test" }],
    });
    const res = await svc.list({});
    expect(res.total).toBe(2); // no duplicate business
    const keys = res.items.map((r) => r.key).sort();
    expect(keys).toEqual([`b:${partnerB._id}`, `p:${p1._id}`].sort());
    expect(res.items.find((r) => r.kind === "professional")?.visibility).toBe("active");
    expect(res.items.find((r) => r.kind === "partner")?.b2bStatus).toBe("none");
  });

  it("filters by B2B status and visibility independently", async () => {
    const p1 = { _id: id(), userId: id(), companyName: "Spa A", status: "approved" };
    const partner = { _id: id(), name: "Hidden", type: "spa", status: "inactive" };
    const { svc } = build({ professionalprofiles: [p1], partners: [partner], users: [] });
    expect((await svc.list({ b2b: "approved" })).total).toBe(1);
    expect((await svc.list({ visibility: "inactive" })).total).toBe(1);
  });

  it("links a public profile to a professional in both directions and records it", async () => {
    const profile = {
      _id: id(),
      userId: id(),
      companyName: "A",
      status: "approved",
      partnerId: null,
    };
    const partner = { _id: id(), name: "A", professionalProfileId: null };
    const { svc, audit } = build({
      professionalprofiles: [profile],
      partners: [partner],
    });
    await svc.link(actor, String(profile._id), String(partner._id));
    expect(String(profile.partnerId)).toBe(String(partner._id));
    expect(String((partner as Doc).professionalProfileId)).toBe(String(profile._id));
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "admin.professional.partner.linked" }),
    );
  });

  it("refuses to link a public profile that already belongs to another professional", async () => {
    const other = id();
    const profile = { _id: id(), userId: id(), partnerId: null };
    const partner = { _id: id(), professionalProfileId: other };
    const { svc } = build({ professionalprofiles: [profile], partners: [partner] });
    await expect(
      svc.link(actor, String(profile._id), String(partner._id)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("changes public visibility without touching the B2B status", async () => {
    const profile = { _id: id(), userId: id(), status: "approved" };
    const partner = { _id: id(), status: "active" };
    const { svc } = build({ professionalprofiles: [profile], partners: [partner] });
    await svc.setVisibility(actor, String(partner._id), "inactive");
    expect(partner.status).toBe("inactive");
    expect(profile.status).toBe("approved");
  });

  it("reactivates only a suspended professional and restores the approved role", async () => {
    const profile = { _id: id(), userId: id(), applicationId: id(), status: "suspended" };
    const { svc, users } = build({
      professionalprofiles: [profile],
      professionalapplications: [{ _id: profile.applicationId }],
    });
    await svc.reactivate(actor, String(profile._id));
    expect(profile.status).toBe("approved");
    expect(users.addRole).toHaveBeenCalledWith(
      String(profile.userId),
      "professional_approved",
    );
    await expect(svc.reactivate(actor, String(profile._id))).rejects.toThrow("suspended");
  });

  it("reports an unknown record as not found", async () => {
    const { svc } = build({ professionalprofiles: [], partners: [] });
    await expect(svc.detail(`p:${id()}`)).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.detail("zz:123")).rejects.toBeInstanceOf(NotFoundException);
  });

  describe("partner self-service", () => {
    const setup = () => {
      const userId = id();
      const partner: Doc = {
        _id: id(),
        name: "Old name",
        city: "Dubai",
        phone: "+971 1",
        description: { en: "old" },
        status: "active",
        pendingChange: null,
      };
      const profile = { _id: id(), userId, status: "approved", partnerId: partner._id };
      return {
        userId,
        partner,
        profile,
        ...build({ professionalprofiles: [profile], partners: [partner] }),
      };
    };

    it("applies non-sensitive edits at once and queues sensitive ones for review", async () => {
      const { svc, userId, partner } = setup();
      const res = await svc.updateMyBusiness(String(userId), ["professional_approved"], {
        phone: "+971 2",
        name: "New name",
      });
      expect(res).toEqual({ applied: ["phone"], pendingReview: ["name"] });
      expect(partner.phone).toBe("+971 2");
      expect(partner.name).toBe("Old name"); // public name unchanged until approved
      expect(partner.pendingChange.fields).toEqual({ name: "New name" });
    });

    it("admin approval applies the queued change; rejection discards it", async () => {
      const { svc, userId, partner } = setup();
      await svc.updateMyBusiness(String(userId), [], { name: "New name" });
      await svc.resolvePendingChange(actor, String(partner._id), "reject");
      expect(partner.name).toBe("Old name");
      expect(partner.pendingChange).toBeNull();
      await svc.updateMyBusiness(String(userId), [], { city: "Abu Dhabi" });
      await svc.resolvePendingChange(actor, String(partner._id), "approve");
      expect(partner.city).toBe("Abu Dhabi");
      await expect(
        svc.resolvePendingChange(actor, String(partner._id), "approve"),
      ).rejects.toThrow("no pending change");
    });
  });
});
