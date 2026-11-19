import { z } from "zod";
import { EMIRATES } from "@ioma/config";
import { registerSchema } from "./auth";

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim() || undefined)
    .optional();

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || /^[+0-9 ()\-.]{6,20}$/.test(v)),
  dateOfBirth: z.string(),
  skinConcerns: z.array(z.string()),
  newsletterOptIn: z.boolean(),
  preferredLocale: z.enum(["en", "fr", "ar"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

const emirateCodes = EMIRATES.map((emirate) => emirate.code) as [string, ...string[]];

export const addressSchema = z.object({
  type: z.enum(["shipping", "billing"]),
  label: z.string().trim().min(1).max(60),
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(20),
  line1: z.string().trim().min(1).max(200),
  line2: optionalText(200),
  emirate: z.enum(emirateCodes),
  city: z.string().trim().min(1).max(80),
  isDefault: z.boolean(),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: registerSchema.shape.password,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const deletionRequestSchema = z.object({
  reason: z.string().max(1000),
});

export type DeletionRequestInput = z.infer<typeof deletionRequestSchema>;
