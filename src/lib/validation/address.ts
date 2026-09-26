import { z } from "zod";
import { SRI_LANKAN_DISTRICTS } from "@/lib/sri-lankan-districts";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+94|0)7\d{8}$/, {
      message: "Enter a valid Sri Lankan mobile number.",
    }),
  addressLine1: z.string().trim().min(3).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().refine(
    (district) => (SRI_LANKAN_DISTRICTS as readonly string[]).includes(district),
    { message: "Select a Sri Lankan district." },
  ),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, {
      message: "Postal code must contain 5 digits.",
    }),
  isDefault: z.boolean().default(false),
});
