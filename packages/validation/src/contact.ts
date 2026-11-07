import { z } from "zod";

// Mirrors apps/api/src/modules/contact/dto/create-contact-message.dto.ts
// and apps/api/src/modules/newsletter/dto/subscribe-newsletter.dto.ts.
export const contactMessageSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(150),
  message: z.string().min(10).max(2000),
  locale: z.enum(["en", "fr", "ar"]),
  category: z.enum(["order", "return", "product", "account", "pro", "other"]).optional(),
  orderReference: z.string().trim().max(40).optional(),
  // Honeypot: real visitors never fill this hidden field; bots usually do.
  website: z.string().max(200).optional(),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export const newsletterSubscribeSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["en", "fr", "ar"]),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
