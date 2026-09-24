import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { redis } from "@/lib/redis";
import { catalogQuerySchema } from "@/lib/validation/catalog";

const PRODUCTS_PER_PAGE = 12;
const CACHE_TTL = 60;

export type CatalogQuery = {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  category: {
    name: string;
    slug: string;
  };
  image: string | null;
  priceFrom: string | null;
  totalStock: number;
};

export type CatalogResult = {
  products: CatalogProduct[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function buildCacheKey(query: z.infer<typeof catalogQuerySchema>) {
  return [
    "velora:products",
    query.search,
    query.category,
    query.minPrice ?? "",
    query.maxPrice ?? "",
    query.sort,
    query.page,
  ].join(":");
}

export async function getCatalogProducts(
  rawQuery: CatalogQuery,
): Promise<CatalogResult> {
  const parsed = catalogQuerySchema.safeParse(rawQuery);

  const query = parsed.success ? parsed.data : catalogQuerySchema.parse({});

  const cacheKey = buildCacheKey(query);

  try {
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as CatalogResult;
    }
  } catch (error) {
    console.error("Redis catalog read error:", error);
  }

  const where = {
    isActive: true,

    ...(query.search
      ? {
          OR: [
            {
              name: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),

    ...(query.category
      ? {
          category: {
            slug: query.category,
          },
        }
      : {}),

    variants: {
      some: {
        stock: {
          gt: 0,
        },
        ...(query.minPrice !== undefined
          ? {
              price: {
                gte: query.minPrice,
              },
            }
          : {}),
        ...(query.maxPrice !== undefined
          ? {
              price: {
                lte: query.maxPrice,
              },
            }
          : {}),
      },
    },
  };

  let orderBy;

  switch (query.sort) {
    case "name":
      orderBy = {
        name: "asc" as const,
      };
      break;

    default:
      orderBy = {
        createdAt: "desc" as const,
      };
  }

  const skip = (query.page - 1) * PRODUCTS_PER_PAGE;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        images: {
          where: {
            isPrimary: true,
          },
          take: 1,
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
          orderBy: {
            price: "asc",
          },
          select: {
            price: true,
            stock: true,
          },
        },
      },
      orderBy,
      skip,
      take: PRODUCTS_PER_PAGE,
    }),

    prisma.product.count({
      where,
    }),
  ]);

  const result = {
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      image: product.images[0]?.url ?? null,
      priceFrom: product.variants[0]?.price.toString() ?? null,
      totalStock: product.variants.reduce(
        (totalStock, variant) => totalStock + variant.stock,
        0,
      ),
    })),
    pagination: {
      page: query.page,
      pageSize: PRODUCTS_PER_PAGE,
      total,
      totalPages: Math.ceil(total / PRODUCTS_PER_PAGE),
    },
  };

  try {
    await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);
  } catch (error) {
    console.error("Redis catalog write error:", error);
  }

  return result;
}
