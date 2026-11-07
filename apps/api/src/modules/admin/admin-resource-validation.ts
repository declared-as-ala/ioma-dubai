import { BadRequestException } from "@nestjs/common";
import { type AdminResource, type AdminField } from "@ioma/config";
import { z } from "zod";
const text = z.string().trim().max(12000);
const local = z.object({ en: text, fr: text.optional(), ar: text }).strict();
const safeUrl = z
  .string()
  .max(2048)
  .refine(
    (v) => !v || /^https?:\/\//i.test(v) || (v.startsWith("/") && !v.startsWith("//")),
    "Use an HTTP(S) or local URL.",
  );
export const contentBlocks = z
  .array(
    z
      .object({
        type: z.enum(["text", "image", "link", "faq"]),
        heading: local,
        body: local,
        url: safeUrl.optional(),
        image: safeUrl.optional(),
      })
      .strict(),
  )
  .max(100);
function fieldSchema(field: AdminField): z.ZodTypeAny {
  switch (field.type) {
    case "localized":
      return field.required
        ? z.object({ en: text.min(1), fr: text.optional(), ar: text.min(1) }).strict()
        : local;
    case "boolean":
      return z.boolean();
    case "number":
    case "money": {
      const n = z
        .number()
        .finite()
        .min(field.min ?? -100000000)
        .max(field.max ?? 100000000);
      return field.type === "money" || !field.key.startsWith("coordinates.")
        ? n.int()
        : n;
    }
    case "select":
      return z.enum(field.options as [string, ...string[]]);
    case "reference":
      return z.string().regex(/^[a-f\d]{24}$/i);
    case "references":
      return z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(100);
    case "urls":
      return z.array(safeUrl).max(100);
    case "lines":
      return z.array(text.min(1)).max(100);
    case "date":
      return z.string().datetime({ offset: true });
    case "dates":
      return z
        .array(
          z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .refine((v) => {
              const date = new Date(v);
              return (
                Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === v
              );
            }),
        )
        .max(366);
    case "breaks":
      return z
        .array(
          z
            .object({
              day: z.number().int().min(0).max(6),
              start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
              end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
            })
            .strict()
            .refine((v) => v.start < v.end),
        )
        .max(21);
    case "blocks":
      return contentBlocks;
    case "hours":
      return z
        .array(
          z
            .object({
              day: z.number().int().min(0).max(6),
              open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
              close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
            })
            .strict()
            .refine((h) => h.open < h.close),
        )
        .max(7)
        .refine((hours) => new Set(hours.map((h) => h.day)).size === hours.length);
    case "json":
      return z.any();
    default:
      return field.required ? text.min(1) : text;
  }
}
export function parseResource(resource: AdminResource, body: unknown, create: boolean) {
  const shape: Record<string, z.ZodTypeAny> = {};
  const isDraftProduct =
    resource.key === "products" &&
    (body as Record<string, unknown>)?.status !== "published";

  for (const field of resource.fields) {
    if (!create && field.immutable) continue;
    let schema = fieldSchema(field);
    if (isDraftProduct && field.type === "localized") schema = local;
    if (!field.required || isDraftProduct) schema = schema.nullable();
    if (!create || !field.required || isDraftProduct) schema = schema.optional();
    shape[field.key] = schema;
  }
  const result = z.object(shape).strict().safeParse(body);
  if (!result.success)
    throw new BadRequestException({
      message: "Invalid management fields.",
      fields: result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  if (!Object.keys(result.data).length)
    throw new BadRequestException("Provide fields to save.");
  return result.data;
}
