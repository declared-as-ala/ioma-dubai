import { BadRequestException } from "@nestjs/common";
import { applicationFormSchema } from "@ioma/validation";
import { z } from "zod";

export function parseApplication(body: unknown) {
  const result = applicationFormSchema.strict().safeParse(body);
  if (!result.success)
    throw new BadRequestException(
      "Invalid application fields or missing terms acceptance.",
    );
  return result.data;
}

export function parseReview(body: unknown, required = false) {
  const result = z
    .object({ reviewNotes: z.string().trim().max(2000).optional() })
    .strict()
    .safeParse(body);
  if (!result.success || (required && !result.data.reviewNotes)) {
    throw new BadRequestException("Review notes are required for this action.");
  }
  return result.data.reviewNotes;
}

export function validateApplicationFile(file: Express.Multer.File | undefined) {
  if (!file || !file.size || file.size > 10 * 1024 * 1024) {
    throw new BadRequestException("Provide a document up to 10 MB.");
  }
  const b = file.buffer;
  const valid =
    (file.mimetype === "application/pdf" && b.subarray(0, 5).toString() === "%PDF-") ||
    (file.mimetype === "image/png" &&
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (file.mimetype === "image/jpeg" && b[0] === 255 && b[1] === 216 && b[2] === 255) ||
    (file.mimetype === "image/webp" &&
      b.subarray(0, 4).toString() === "RIFF" &&
      b.subarray(8, 12).toString() === "WEBP");
  if (!valid)
    throw new BadRequestException("Provide a valid PDF, JPEG, PNG or WebP document.");
}
