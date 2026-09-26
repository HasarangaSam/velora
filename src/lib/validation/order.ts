import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().min(1),
  couponCode: z.string().trim().min(1).max(50).optional().or(z.literal("")),
  buyNow: z.object({
    variantId: z.string().min(1),
    quantity: z.coerce.number().int().min(1).max(99),
  }).optional(),
});
