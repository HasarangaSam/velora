import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { productSchema, productVariantSchema } from "@/lib/validation/product";

const updateProductSchema = productSchema.extend({
  variants: productVariantSchema.array().min(1),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();

    const result = updateProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Please provide valid product details." },
        { status: 400 },
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 },
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: result.data.categoryId,
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

    const product = await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({
        where: {
          productId: id,
        },
      });

      return tx.product.update({
        where: {
          id,
        },
        data: {
          name: result.data.name,
          description: result.data.description,
          categoryId: result.data.categoryId,
          isActive: result.data.isActive,
          isFeatured: result.data.isFeatured,
          variants: {
            create: result.data.variants.map((variant) => ({
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
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json(product);
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

    console.error("Update product error:", error);

    return NextResponse.json(
      { message: "Unable to update product." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 },
      );
    }

    await prisma.product.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      message: "Product deactivated successfully.",
    });
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

    console.error("Delete product error:", error);

    return NextResponse.json(
      { message: "Unable to deactivate product." },
      { status: 500 },
    );
  }
}
