import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { productSchema, productVariantSchema } from "@/lib/validation/product";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    await requireAdmin();

    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Admin access required." }, { status: 403 });
    }
    console.error("List products error:", error);
    return NextResponse.json({ message: "Unable to load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const productResult = productSchema.safeParse({
      name: body.name,
      description: body.description,
      categoryId: body.categoryId,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
    });

    if (!productResult.success) {
      return NextResponse.json(
        {
          message: "Please correct the product details.",
          errors: productResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const variantsResult = productVariantSchema
      .array()
      .min(1, "At least one variant is required.")
      .safeParse(body.variants);

    if (!variantsResult.success) {
      return NextResponse.json(
        {
          message: "Please correct the variant details.",
          errors: variantsResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: productResult.data.categoryId },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json(
        { message: "The selected category does not exist." },
        { status: 400 },
      );
    }

    const slug = productResult.data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existingSlug = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingSlug) {
      return NextResponse.json(
        { message: "A product with a similar name already exists." },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: {
        name: productResult.data.name,
        slug,
        description: productResult.data.description,
        categoryId: productResult.data.categoryId,
        isActive: productResult.data.isActive,
        isFeatured: productResult.data.isFeatured,
        variants: {
          create: variantsResult.data.map((variant) => ({
            size: variant.size,
            colour: variant.colour,
            price: variant.price,
            stock: variant.stock,
          })),
        },
      },
      include: {
        category: true,
        variants: true,
      },
    });

    // Invalidate Redis catalog cache
    try {
      const keys = await redis.keys("velora:products*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      await redis.del("velora:featured_products:v3");
    } catch (redisError) {
      console.error("Redis cache invalidation error:", redisError);
    }

    return NextResponse.json(
      { message: "Product created successfully.", product },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Admin access required." }, { status: 403 });
    }
    console.error("Create product API error:", error);
    return NextResponse.json({ message: "Unable to create product." }, { status: 500 });
  }
}
