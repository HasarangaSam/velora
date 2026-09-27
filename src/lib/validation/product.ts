import { z } from "zod";

export const productVariantSchema = z.object({
  size: z.string().trim().min(1).max(20),
  colour: z.string().trim().min(1).max(50),
  stock: z.coerce.number().int().min(0).max(1000000),
});

export function hasDuplicateProductVariantOptions(
  variants: readonly { size: string; colour: string }[],
) {
  const seen = new Set<string>();
  for (const variant of variants) {
    const optionKey = `${variant.size.toLowerCase()}::${variant.colour.toLowerCase()}`;
    if (seen.has(optionKey)) return true;
    seen.add(optionKey);
  }
  return false;
}

const optionalSalePrice = z.preprocess(
  (value) => value === "" || value === null || value === undefined ? null : value,
  z.coerce.number().positive().max(10000000).nullable(),
);

export const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(10).max(5000),
  categoryId: z.string().min(1),
  subCategoryId: z.string().nullish(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  price: z.coerce.number().positive().max(10000000),
  salePrice: optionalSalePrice,
}).superRefine((product, context) => {
  if (product.salePrice !== null && product.salePrice >= product.price) {
    context.addIssue({ code: "custom", path: ["salePrice"], message: "Sale price must be lower than the regular price." });
  }
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
