import { prisma } from "@/lib/db/prisma";

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
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
}
