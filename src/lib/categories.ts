import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export async function getCachedCategoryTree() {
  "use cache";
  cacheLife("days");
  cacheTag("categories");

  return prisma.category.findMany({
    where: { parentId: null },
    orderBy: {
      name: "asc",
    },
    include: {
      children: {
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}
