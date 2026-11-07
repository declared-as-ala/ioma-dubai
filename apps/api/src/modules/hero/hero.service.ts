import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { z } from "zod";
import { StorageService } from "../../common/storage/storage.service";
import { HeroSlide, HeroSlideDocument } from "./hero-slide.schema";

const bi = z
  .object({ en: z.string().trim().max(300), ar: z.string().trim().max(300) })
  .strict();
const href = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//i.test(v),
    "Use a site path like /shop or an https link.",
  );
const media = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) =>
      v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//i.test(v),
    "Use an uploaded file or an https link.",
  );

export const slideInput = z
  .object({
    tab: bi,
    kicker: bi,
    line1: bi,
    line2: bi,
    body: bi,
    ctaLabel: bi,
    ctaHref: href,
    moreLabel: bi,
    moreHref: href,
    videoUrl: media,
    posterUrl: media,
    status: z.enum(["active", "inactive"]),
  })
  .strict();

const toDto = (d: HeroSlide & { _id: Types.ObjectId; updatedAt?: Date }) => ({
  id: String(d._id),
  tab: d.tab,
  kicker: d.kicker,
  line1: d.line1,
  line2: d.line2,
  body: d.body,
  ctaLabel: d.ctaLabel,
  ctaHref: d.ctaHref,
  moreLabel: d.moreLabel,
  moreHref: d.moreHref,
  videoUrl: d.videoUrl,
  posterUrl: d.posterUrl,
  order: d.order,
  status: d.status,
  updatedAt: d.updatedAt,
});

function parse<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const r = schema.safeParse(body);
  if (!r.success)
    throw new BadRequestException({
      message: "Invalid slide.",
      fields: r.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  return r.data;
}

@Injectable()
export class HeroService {
  constructor(
    @InjectModel(HeroSlide.name) private readonly model: Model<HeroSlideDocument>,
    private readonly storage: StorageService,
  ) {}

  /** Public: active slides that have a video, in order. Empty -> the site shows its built-in reel. */
  async publicSlides() {
    const rows = await this.model
      .find({ status: "active", videoUrl: { $ne: "" } })
      .sort({ order: 1, _id: 1 })
      .lean();
    return rows.map(toDto);
  }

  async list() {
    const rows = await this.model.find({}).sort({ order: 1, _id: 1 }).lean();
    return rows.map(toDto);
  }

  async create(body: unknown) {
    const data = parse(slideInput, body);
    const last = await this.model.findOne({}).sort({ order: -1 }).lean();
    const doc = await this.model.create({ ...data, order: (last?.order ?? -1) + 1 });
    return toDto(doc.toObject());
  }

  async update(id: string, body: unknown) {
    const data = parse(slideInput, body);
    const doc = await this.model
      .findByIdAndUpdate(this.oid(id), { $set: data }, { new: true })
      .lean();
    if (!doc) throw new NotFoundException("Slide not found.");
    return toDto(doc);
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(this.oid(id)).lean();
    if (!doc) throw new NotFoundException("Slide not found.");
    return { deleted: true };
  }

  async reorder(body: unknown) {
    const { ids } = parse(
      z.object({ ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(100) }).strict(),
      body,
    );
    await this.model.bulkWrite(
      ids.map((id, order) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(id) },
          update: { $set: { order } },
        },
      })),
    );
    return this.list();
  }

  async stored(id: string, file: "video" | "poster") {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new NotFoundException();
    const keys =
      file === "video"
        ? [`hero/${id}/video.mp4`, `hero/${id}/video.webm`]
        : [`hero/${id}/poster.webp`];
    for (const key of keys) {
      try {
        const bytes = await this.storage.getObject("public", key);
        return {
          bytes,
          type: key.endsWith(".mp4")
            ? "video/mp4"
            : key.endsWith(".webm")
              ? "video/webm"
              : "image/webp",
        };
      } catch {
        /* try the next candidate */
      }
    }
    throw new NotFoundException();
  }

  private oid(id: string) {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new BadRequestException("Invalid identifier.");
    return new Types.ObjectId(id);
  }
}
