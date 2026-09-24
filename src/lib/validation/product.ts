import { z } from "zod";

export const productVariantSchema = z.object({
  size: z.string().trim().min(1).max(20),
  colour: z.string().trim().min(1).max(50),
  price: z.coerce.number().positive().max(10000000),
  stock: z.coerce.number().int().min(0).max(1000000),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10).max(5000),
  categoryId: z.string().min(1),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        "Slug must contain lowercase letters, numbers, and hyphens only.",
    }),
});
