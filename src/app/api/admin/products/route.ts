import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { productSchema, productVariantSchema } from "@/lib/validation/product";

const createProductSchema = productSchema.extend({
  slug: productSchema.shape.name
    .transform((name) =>
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .optional(),
  variants: productVariantSchema.array().min(1),
});

export async function GET() {
  try {
    await requireAdmin();

    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        variants: {
          orderBy: {
            size: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { message: "Admin access required." },
        { status: 403 },
      );
    }

    console.error("Get products error:", error);

    return NextResponse.json(
      { message: "Unable to load products." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Please provide valid product details.",
        },
        { status: 400 },
      );
    }

    const { name, description, categoryId, isActive, isFeatured, variants } =
      result.data;

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Selected category does not exist." },
        { status: 400 },
      );
    }

    const slug =
      result.data.slug ??
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        isActive,
        isFeatured,
        variants: {
          create: variants.map((variant) => ({
            size: variant.size,
            colour: variant.colour,
            price: variant.price,
            stock: variant.stock,
          })),
        },
      },
      include: {
        variants: true,
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { message: "Admin access required." },
        { status: 403 },
      );
    }

    console.error("Create product error:", error);

    return NextResponse.json(
      { message: "Unable to create product." },
      { status: 500 },
    );
  }
}
