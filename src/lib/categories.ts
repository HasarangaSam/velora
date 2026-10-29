import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export async function getCachedCategoryTree() {
  "use cache";
  cacheLife("days");
  cacheTag("categories");

  try {
    return await prisma.category.findMany({
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
  } catch {
    // Database unavailable (e.g. during build-time static prerendering).
    // Return empty list so the build succeeds; the Navbar falls back to its
    // hardcoded default subcategories. At real runtime the DB is always
    // present and this path is never taken.
    return [];
  }
}
