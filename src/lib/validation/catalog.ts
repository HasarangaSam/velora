import { z } from "zod";

export const catalogQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  category: z.string().trim().max(100).optional().default(""),
  minPrice: z.coerce.number().min(0).max(10000000).optional(),
  maxPrice: z.coerce.number().min(0).max(10000000).optional(),
  sort: z
    .enum(["newest", "price-low", "price-high", "name"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
});
