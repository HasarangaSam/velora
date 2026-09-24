import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().min(1),
  couponCode: z.string().trim().min(1).max(50).optional().or(z.literal("")),
});
