import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, 100);
  if (query.length < 2) return NextResponse.json({ products: [] });

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
      variants: {
        where: { stock: { gt: 0 } },
        orderBy: { price: "asc" },
        take: 1,
        select: { price: true },
      },
    },
  });

  return NextResponse.json({
    products: products.map((product) => ({
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? null,
      price: product.variants[0]?.price.toString() ?? null,
    })),
  });
}
