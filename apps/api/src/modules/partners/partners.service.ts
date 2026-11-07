import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Partner, PartnerDocument } from "./schemas/partner.schema";
import { Service, ServiceDocument } from "./schemas/service.schema";
import { Treatment, TreatmentDocument } from "./schemas/treatment.schema";
import type { QueryPartnersDto } from "./dto/query-partners.dto";

@Injectable()
export class PartnersService {
  constructor(
    @InjectModel(Partner.name)
    private readonly partnerModel: Model<PartnerDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Treatment.name)
    private readonly treatmentModel: Model<TreatmentDocument>,
  ) {}

  async listPartners(query: QueryPartnersDto) {
    const filter: Record<string, unknown> = { status: "active" };

    if (query.emirate) filter.emirate = query.emirate;
    if (query.city) filter.city = query.city;
    if (query.type) filter.type = query.type;
    if (query.diagnosisAvailable !== undefined) {
      filter.diagnosisAvailable = query.diagnosisAvailable;
    }
    if (query.service) {
      const serviceDoc = await this.serviceModel.findOne({ slug: query.service }).lean();
      if (serviceDoc) {
        filter.serviceIds = serviceDoc._id;
      }
    }

    // Geo-proximity query via $geoNear when lat/lng provided
    if (query.lat !== undefined && query.lng !== undefined) {
      const radiusMeters = query.radius ?? 50_000; // default 50km
      const results = await this.partnerModel.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [query.lng, query.lat] },
            distanceField: "distanceMeters",
            maxDistance: radiusMeters,
            spherical: true,
            query: filter,
          },
        },
        { $sort: { distanceMeters: 1 } },
        { $limit: 50 },
      ]);
      return results.map((r) => this.toListItem(r));
    }

    const docs = await this.partnerModel
      .find(filter)
      .populate<{
        serviceIds: {
          slug: string;
          name: Record<string, string>;
          durationMinutes: number;
        }[];
      }>("serviceIds")
      .sort({ name: 1 })
      .lean();

    return docs.map((d) => this.toListItem(d));
  }

  async getPartnerBySlug(slug: string) {
    const doc = await this.partnerModel
      .findOne({ slug, status: "active" })
      .populate<{
        serviceIds: {
          _id: Types.ObjectId;
          slug: string;
          name: Record<string, string>;
          durationMinutes: number;
          category: string;
        }[];
      }>("serviceIds")
      .lean();

    if (!doc) throw new NotFoundException("Partner not found.");

    return {
      id: doc._id.toString(),
      slug: doc.slug,
      type: doc.type,
      name: doc.name,
      description: doc.description,
      emirate: doc.emirate,
      city: doc.city,
      address: doc.address,
      coordinates: doc.coordinates,
      phone: doc.phone,
      whatsapp: doc.whatsapp ?? null,
      email: doc.email ?? null,
      website: doc.website ?? null,
      openingHours: doc.openingHours ?? null,
      diagnosisAvailable: doc.diagnosisAvailable,
      services: doc.serviceIds.map((s) => ({
        id: s._id.toString(),
        slug: s.slug,
        name: s.name,
        durationMinutes: s.durationMinutes,
        category: s.category,
      })),
      mediaIds: doc.mediaIds ?? [],
    };
  }

  async getPartnerById(id: string) {
    const doc = await this.partnerModel.findById(id).lean();
    if (!doc) throw new NotFoundException("Partner not found.");
    return doc;
  }

  async listServices() {
    return this.serviceModel.find().sort({ slug: 1 }).lean();
  }

  async getServiceBySlug(slug: string) {
    const doc = await this.serviceModel.findOne({ slug }).lean();
    if (!doc) throw new NotFoundException("Service not found.");
    return doc;
  }

  async listTreatments() {
    return this.treatmentModel.find().sort({ slug: 1 }).lean();
  }

  async getTreatmentBySlug(slug: string) {
    const doc = await this.treatmentModel.findOne({ slug }).lean();
    if (!doc) throw new NotFoundException("Treatment not found.");
    return doc;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toListItem(doc: any) {
    const services = Array.isArray(doc.serviceIds)
      ? doc.serviceIds.map(
          (s: {
            slug?: string;
            name?: Record<string, string>;
            durationMinutes?: number;
          }) => ({
            slug: s.slug,
            name: s.name,
            durationMinutes: s.durationMinutes,
          }),
        )
      : [];

    return {
      id: doc._id?.toString() ?? doc._id,
      slug: doc.slug,
      type: doc.type,
      name: doc.name,
      description: doc.description,
      emirate: doc.emirate,
      city: doc.city,
      address: doc.address,
      coordinates: doc.coordinates,
      phone: doc.phone,
      whatsapp: doc.whatsapp ?? null,
      email: doc.email ?? null,
      website: doc.website ?? null,
      diagnosisAvailable: doc.diagnosisAvailable,
      image:
        Array.isArray(doc.mediaIds) && doc.mediaIds.length
          ? String(doc.mediaIds[0])
          : null,
      mediaIds: Array.isArray(doc.mediaIds) ? doc.mediaIds : [],
      services,
      distanceMeters: doc.distanceMeters ?? null,
    };
  }
}
