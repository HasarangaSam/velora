"use server";

import { prisma } from "@/lib/db/prisma";

export type SearchProductSuggestion = {
  name: string;
  slug: string;
  image: string | null;
  price: string;
  salePrice: string | null;
};

export async function searchProductsAction(
  rawQuery: string,
): Promise<SearchProductSuggestion[]> {
  const query = (rawQuery ?? "").trim().slice(0, 100);
  if (query.length < 2) return [];

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
      variants: { some: { stock: { gt: 0 } } },
    },
    take: 6,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: {
      name: true,
      slug: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      price: true,
      salePrice: true,
    },
  });

  return products.map((product) => ({
    name: product.name,
    slug: product.slug,
    image: product.images[0]?.url ?? null,
    price: product.price.toString(),
    salePrice: product.salePrice?.toString() ?? null,
  }));
}
