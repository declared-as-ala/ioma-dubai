import { z } from "zod";

const emirateList = ["AUH", "DXB", "SHJ", "AJM", "UAQ", "RAK", "FUJ"] as const;
const businessTypes = [
  "spa",
  "clinic",
  "beauty_institute",
  "hotel",
  "retail",
  "distributor",
] as const;

export const applicationFormSchema = z.object({
  companyName: z.string().min(2, "Company name is required."),
  contactPerson: z.string().min(2, "Contact person is required."),
  businessType: z.enum(businessTypes, {
    required_error: "Please select a business type.",
  }),
  tradeLicenceNumber: z.string().min(3, "Trade licence number is required."),
  vatNumber: z.string().optional(),
  email: z.string().email("Valid email is required."),
  phone: z.string().regex(/^\+?[0-9][0-9 ()-]{5,19}$/, "Valid phone number is required."),
  address: z.string().min(5, "Address is required."),
  emirate: z.enum(emirateList, { required_error: "Please select an emirate." }),
  city: z.string().min(2, "City is required."),
  website: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  socialMedia: z.string().optional(),
  locationsCount: z.coerce.number().int().min(1, "At least 1 location required."),
  expectedOrderVolume: z.string().min(1, "Expected order volume is required."),
  message: z.string().optional(),
  termsAccepted: z.boolean().refine((value) => value, "Terms must be accepted."),
});

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;
