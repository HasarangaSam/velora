import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product-${slug}`);

  const product = await prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      subCategory: {
        select: {
          name: true,
          slug: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      variants: {
        where: {
          stock: {
            gt: 0,
          },
        },
        orderBy: [
          {
            size: "asc",
          },
          {
            colour: "asc",
          },
        ],
      },
    },
  });

  if (!product) return null;

  return {
    ...product,
    price: product.price.toString(),
    salePrice: product.salePrice?.toString() ?? null,
  };
}

export async function getCollectionProducts(categoryId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `category-${categoryId}-products`);

  return prisma.product.findMany({
    where: { categoryId, isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: [{ createdAt: "desc" }, { slug: "asc" }],
  });
}
