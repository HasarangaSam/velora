import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { productSchema, productVariantSchema } from "@/lib/validation/product";
import { redis } from "@/lib/redis";

const updateProductSchema = productSchema.extend({
  variants: z
    .array(
      productVariantSchema.extend({
        id: z.string().optional(),
      }),
    )
    .min(1),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Admin access required." }, { status: 403 });
    }
    return NextResponse.json({ message: "Unable to fetch product." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();

    const result = updateProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Please provide valid product details.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    if (!product) {
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
        { message: "The selected category does not exist." },
        { status: 400 },
      );
    }

    // Validate sub-category if provided
    if (result.data.subCategoryId) {
      const subCat = await prisma.category.findUnique({
        where: { id: result.data.subCategoryId },
        select: { parentId: true },
      });

      if (!subCat || subCat.parentId !== result.data.categoryId) {
        return NextResponse.json(
          {
            message:
              "Selected sub-category does not belong to the chosen main category.",
          },
          { status: 400 },
        );
      }
    }

    const existingVariantIds = new Set(
      product.variants.map((variant) => variant.id),
    );

    const submittedVariantIds = new Set<string>();

    for (const variant of result.data.variants) {
      if (variant.id) {
        if (!existingVariantIds.has(variant.id)) {
          return NextResponse.json(
            { message: "Invalid product variant." },
            { status: 400 },
          );
        }

        if (submittedVariantIds.has(variant.id)) {
          return NextResponse.json(
            { message: "Duplicate product variant." },
            { status: 400 },
          );
        }

        submittedVariantIds.add(variant.id);
      }
    }

    const duplicateVariants = new Set<string>();

    for (const variant of result.data.variants) {
      const key = `${variant.size.toLowerCase()}::${variant.colour.toLowerCase()}`;

      if (duplicateVariants.has(key)) {
        return NextResponse.json(
          {
            message: "Each size and colour combination can only be added once.",
          },
          { status: 400 },
        );
      }

      duplicateVariants.add(key);
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: result.data.name,
          description: result.data.description,
          categoryId: result.data.categoryId,
          subCategoryId: result.data.subCategoryId ?? null,
          isActive: result.data.isActive,
          isFeatured: result.data.isFeatured,
        },
      });

      for (const variant of result.data.variants) {
        if (variant.id) {
          await tx.productVariant.update({
            where: {
              id: variant.id,
            },
            data: {
              size: variant.size,
              colour: variant.colour,
              price: variant.price,
              stock: variant.stock,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              size: variant.size,
              colour: variant.colour,
              price: variant.price,
              stock: variant.stock,
            },
          });
        }
      }

      // Preserve foreign keys in existing orders/carts: mark removed variants as 0 stock instead of deleting
      for (const variant of product.variants) {
        if (!submittedVariantIds.has(variant.id)) {
          await tx.productVariant.update({
            where: {
              id: variant.id,
            },
            data: {
              stock: 0,
            },
          });
        }
      }

      return updated;
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

    return NextResponse.json({
      message: "Product updated successfully.",
      product: updatedProduct,
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

    console.error("Update product error:", error);

    return NextResponse.json(
      { message: "Unable to update the product." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 },
      );
    }

    await prisma.product.update({
      where: { id },
      data: {
        isActive: false,
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
      { message: "Unable to deactivate the product." },
      { status: 500 },
    );
  }
}
