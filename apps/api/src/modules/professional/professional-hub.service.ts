import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { AuditService } from "../audit/audit.service";
import { UsersService } from "../users/users.service";
import { ProAccessService } from "./pro-access.service";

type Row = Record<string, any>;

export interface HubQuery {
  q?: string;
  b2b?: string; // approved | suspended | none
  visibility?: string; // active | inactive | none
  type?: string;
  page?: number;
  limit?: number;
}

const oid = (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundException("Record not found.");
  return new Types.ObjectId(id);
};

/**
 * Professionals and partners are ONE business. The professional profile is the B2B identity
 * (account, approval, pricing, orders), the partners record is its public profile (location,
 * gallery, services, hours, bookings). They are linked by stable ids; public visibility stays on
 * the partner and is controlled independently of the B2B approval.
 *
 * A row key is "p:<profileId>" (a professional, with or without a public profile) or
 * "b:<partnerId>" (a public listing that has no professional account yet), so nothing that
 * existed before the merge disappears from the admin.
 */
@Injectable()
export class ProfessionalHubService {
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly users: UsersService,
    private readonly access: ProAccessService,
    private readonly audit: AuditService,
  ) {}

  private col(name: string) {
    return this.db.collection(name);
  }

  private async event(
    actor: { sub: string; email: string },
    action: string,
    id: string,
    details: Record<string, unknown> = {},
  ) {
    await this.audit.recordEvent({
      actorId: actor.sub,
      actorEmail: actor.email,
      action,
      resource: "professionals",
      resourceId: id,
      details,
    });
  }

  // ------------------------------------------------------------------ list

  async list(query: HubQuery) {
    const [profiles, partners] = await Promise.all([
      this.col("professionalprofiles").find({}).toArray() as Promise<Row[]>,
      this.col("partners").find({}).toArray() as Promise<Row[]>,
    ]);
    const userIds = profiles.map((p) => p.userId).filter(Boolean);
    const users = userIds.length
      ? ((await this.col("users")
          .find(
            { _id: { $in: userIds } },
            { projection: { email: 1, firstName: 1, lastName: 1, status: 1 } },
          )
          .toArray()) as Row[])
      : [];
    const userById = new Map(users.map((u) => [String(u._id), u]));
    const partnerById = new Map(partners.map((p) => [String(p._id), p]));
    const used = new Set<string>();

    const rows: Row[] = profiles.map((p) => {
      const partner =
        (p.partnerId && partnerById.get(String(p.partnerId))) ||
        partners.find((x) => String(x.professionalProfileId) === String(p._id));
      if (partner) used.add(String(partner._id));
      const u = userById.get(String(p.userId));
      return {
        key: `p:${p._id}`,
        kind: "professional",
        name: p.companyName,
        businessType: p.businessType || partner?.type || "",
        city: p.city || partner?.city || "",
        emirate: p.emirate || partner?.emirate || "",
        b2bStatus: p.status,
        visibility: partner ? partner.status : "none",
        partnerId: partner ? String(partner._id) : null,
        email: u?.email ?? partner?.email ?? "",
        phone: partner?.phone ?? "",
        accessLevel: p.accessLevel,
        createdAt: p.createdAt,
      };
    });
    for (const partner of partners) {
      if (used.has(String(partner._id))) continue;
      rows.push({
        key: `b:${partner._id}`,
        kind: "partner",
        name: partner.name,
        businessType: partner.type,
        city: partner.city,
        emirate: partner.emirate,
        b2bStatus: "none",
        visibility: partner.status,
        partnerId: String(partner._id),
        email: partner.email ?? "",
        phone: partner.phone ?? "",
        accessLevel: null,
        createdAt: partner.createdAt,
      });
    }

    const needle = (query.q ?? "").trim().toLowerCase();
    let out = rows.filter((r) => {
      if (needle) {
        const hay = [r.name, r.email, r.city, r.phone].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (query.b2b && r.b2bStatus !== query.b2b) return false;
      if (query.visibility && r.visibility !== query.visibility) return false;
      if (query.type && r.businessType !== query.type) return false;
      return true;
    });
    out = out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const page = Math.max(query.page ?? 1, 1);
    return {
      items: out.slice((page - 1) * limit, page * limit),
      total: out.length,
      page,
      limit,
      counts: {
        all: rows.length,
        approved: rows.filter((r) => r.b2bStatus === "approved").length,
        suspended: rows.filter((r) => r.b2bStatus === "suspended").length,
        publicListings: rows.filter((r) => r.visibility === "active").length,
        unlinked: rows.filter((r) => r.kind === "partner").length,
      },
    };
  }

  // ------------------------------------------------------------------ detail

  private async resolve(key: string) {
    const [kind, id] = key.split(":");
    if (!id || !["p", "b"].includes(kind ?? "")) throw new NotFoundException();
    if (kind === "p") {
      const profile = (await this.col("professionalprofiles").findOne({
        _id: oid(id),
      })) as Row | null;
      if (!profile) throw new NotFoundException("Professional not found.");
      const partner = (await this.col("partners").findOne(
        profile.partnerId
          ? { _id: profile.partnerId }
          : { professionalProfileId: profile._id },
      )) as Row | null;
      return { profile, partner };
    }
    const partner = (await this.col("partners").findOne({ _id: oid(id) })) as Row | null;
    if (!partner) throw new NotFoundException("Partner not found.");
    if (partner.professionalProfileId) {
      const profile = (await this.col("professionalprofiles").findOne({
        _id: partner.professionalProfileId,
      })) as Row | null;
      if (profile) return { profile, partner };
    }
    return { profile: null as Row | null, partner };
  }

  async detail(key: string): Promise<Record<string, unknown>> {
    const { profile, partner } = await this.resolve(key);
    const userId = profile?.userId ?? partner?.professionalAccountId ?? null;
    const user = userId
      ? ((await this.col("users").findOne(
          { _id: userId },
          {
            projection: {
              email: 1,
              firstName: 1,
              lastName: 1,
              roles: 1,
              status: 1,
              emailVerifiedAt: 1,
              lastLoginAt: 1,
              createdAt: 1,
            },
          },
        )) as Row | null)
      : null;
    const application = profile
      ? ((await this.col("professionalapplications").findOne(
          { _id: profile.applicationId },
          { projection: { documents: 0 } },
        )) as Row | null)
      : null;

    // B2B orders of this professional account.
    const orderQuery = userId ? { userId, type: "b2b" } : null;
    const orders = orderQuery
      ? await this.col("orders")
          .find(orderQuery, {
            projection: {
              orderNumber: 1,
              totalMinor: 1,
              fulfillmentStatus: 1,
              paymentStatus: 1,
              createdAt: 1,
              currency: 1,
            },
          })
          .sort({ createdAt: -1 })
          .limit(10)
          .toArray()
      : [];
    const orderTotals = orderQuery
      ? await this.col("orders")
          .aggregate([
            { $match: orderQuery },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalMinor: { $sum: "$totalMinor" },
              },
            },
          ])
          .toArray()
      : [];

    // Public bookings of the linked partner profile.
    const bookingsBy = partner
      ? await this.col("appointments")
          .aggregate([
            { $match: { partnerId: partner._id } },
            { $group: { _id: "$status", n: { $sum: 1 } } },
          ])
          .toArray()
      : [];
    const bookings = partner
      ? await this.col("appointments")
          .find(
            { partnerId: partner._id },
            { projection: { serviceId: 1, startsAt: 1, status: 1, userId: 1, notes: 1 } },
          )
          .sort({ startsAt: -1 })
          .limit(10)
          .toArray()
      : [];

    const serviceIds: Types.ObjectId[] = partner?.serviceIds ?? [];
    const services = serviceIds.length
      ? await this.col("services")
          .find({ _id: { $in: serviceIds } })
          .toArray()
      : [];

    const priceList = profile?.priceListId
      ? await this.col("pricelists").findOne({ _id: profile.priceListId })
      : null;
    const accessSummary =
      profile && user
        ? await this.access.getAccess(String(user._id), (user.roles as string[]) ?? [])
        : null;
    const [videos, documents, benefits] = await Promise.all([
      this.col("provideos").countDocuments({ status: "published" }),
      this.col("prodocuments").countDocuments({ status: "published" }),
      this.col("probenefits").countDocuments({ status: "published" }),
    ]);
    const history = await this.col("auditlogs")
      .find({
        resource: "professionals",
        resourceId: {
          $in: [profile ? String(profile._id) : "", partner ? String(partner._id) : ""],
        },
      })
      .sort({ createdAt: -1 })
      .limit(15)
      .toArray();

    return {
      key,
      kind: profile ? "professional" : "partner",
      profile,
      partner,
      user,
      application,
      services,
      orders: {
        count: orderTotals[0]?.count ?? 0,
        totalMinor: orderTotals[0]?.totalMinor ?? 0,
        recent: orders,
      },
      bookings: {
        total: bookingsBy.reduce((n, b) => n + (b.n as number), 0),
        byStatus: Object.fromEntries(bookingsBy.map((b) => [String(b._id), b.n])),
        recent: bookings,
      },
      pricing: {
        priceListId: profile?.priceListId ?? null,
        priceList: priceList
          ? {
              id: String(priceList._id),
              name: priceList.name,
              items: priceList.items?.length ?? 0,
            }
          : null,
      },
      trainingAndDocuments: {
        access: accessSummary,
        published: { videos, documents, benefits },
      },
      history,
    };
  }

  // ------------------------------------------------------------------ actions

  /** Links a public partner profile to a professional (both directions, one-to-one). */
  async link(
    actor: { sub: string; email: string },
    profileId: string,
    partnerId: string,
  ) {
    const profile = (await this.col("professionalprofiles").findOne({
      _id: oid(profileId),
    })) as Row | null;
    if (!profile) throw new NotFoundException("Professional not found.");
    const partner = (await this.col("partners").findOne({
      _id: oid(partnerId),
    })) as Row | null;
    if (!partner) throw new NotFoundException("Partner profile not found.");
    if (profile.partnerId && String(profile.partnerId) !== partnerId)
      throw new ConflictException("This professional already has a public profile.");
    if (
      partner.professionalProfileId &&
      String(partner.professionalProfileId) !== profileId
    )
      throw new ConflictException("This public profile belongs to another professional.");

    await this.col("professionalprofiles").updateOne(
      { _id: profile._id },
      { $set: { partnerId: partner._id, updatedAt: new Date() } },
    );
    await this.col("partners").updateOne(
      { _id: partner._id },
      {
        $set: {
          professionalProfileId: profile._id,
          professionalAccountId: profile.userId,
          updatedAt: new Date(),
        },
      },
    );
    await this.event(actor, "admin.professional.partner.linked", profileId, {
      partnerId,
    });
    return { linked: true };
  }

  async unlink(actor: { sub: string; email: string }, profileId: string) {
    const profile = (await this.col("professionalprofiles").findOne({
      _id: oid(profileId),
    })) as Row | null;
    if (!profile) throw new NotFoundException("Professional not found.");
    const partnerId = profile.partnerId;
    await this.col("professionalprofiles").updateOne(
      { _id: profile._id },
      { $set: { partnerId: null, updatedAt: new Date() } },
    );
    if (partnerId)
      await this.col("partners").updateOne(
        { _id: partnerId },
        {
          $set: {
            professionalProfileId: null,
            professionalAccountId: null,
            updatedAt: new Date(),
          },
        },
      );
    await this.event(actor, "admin.professional.partner.unlinked", profileId, {
      partnerId: partnerId ? String(partnerId) : null,
    });
    return { linked: false };
  }

  /** Public visibility of the partner profile, independent of the B2B approval. */
  async setVisibility(
    actor: { sub: string; email: string },
    partnerId: string,
    status: "active" | "inactive",
  ) {
    const r = await this.col("partners").updateOne(
      { _id: oid(partnerId) },
      { $set: { status, updatedAt: new Date() } },
    );
    if (!r.matchedCount) throw new NotFoundException("Partner profile not found.");
    await this.event(actor, "admin.partner.visibility.changed", partnerId, { status });
    return { status };
  }

  /** Re-enables a suspended professional (the reverse of ProfessionalService.suspendProfile). */
  async reactivate(actor: { sub: string; email: string }, profileId: string) {
    const profile = (await this.col("professionalprofiles").findOne({
      _id: oid(profileId),
    })) as Row | null;
    if (!profile) throw new NotFoundException("Professional not found.");
    if (profile.status !== "suspended")
      throw new BadRequestException("Only a suspended professional can be reactivated.");
    await this.col("professionalprofiles").updateOne(
      { _id: profile._id },
      { $set: { status: "approved", updatedAt: new Date() } },
    );
    await this.col("professionalapplications").updateOne({ _id: profile.applicationId }, {
      $set: { status: "approved" },
      $push: {
        statusHistory: { status: "approved", at: new Date(), note: "Reactivated" },
      },
    } as never);
    const userId = String(profile.userId);
    await this.users.removeRole(userId, "professional_suspended");
    await this.users.addRole(userId, "professional_approved");
    await this.event(actor, "admin.professional.reactivated", profileId);
    return { status: "approved" };
  }

  async assignPriceList(
    actor: { sub: string; email: string },
    profileId: string,
    priceListId: string | null,
  ) {
    if (priceListId) {
      const exists = await this.col("pricelists").findOne({ _id: oid(priceListId) });
      if (!exists) throw new NotFoundException("Price list not found.");
    }
    const r = await this.col("professionalprofiles").updateOne(
      { _id: oid(profileId) },
      {
        $set: {
          priceListId: priceListId ? oid(priceListId) : null,
          updatedAt: new Date(),
        },
      },
    );
    if (!r.matchedCount) throw new NotFoundException("Professional not found.");
    await this.event(actor, "admin.professional.pricelist.assigned", profileId, {
      priceListId,
    });
    return { priceListId };
  }

  /** Public partner profiles not yet linked to a professional (for the "link existing" picker). */
  async unlinkedPartners(): Promise<Row[]> {
    return (await this.col("partners")
      .find(
        {
          $or: [
            { professionalProfileId: null },
            { professionalProfileId: { $exists: false } },
          ],
        },
        { projection: { name: 1, slug: 1, type: 1, city: 1, status: 1 } },
      )
      .sort({ name: 1 })
      .toArray()) as Row[];
  }
}
