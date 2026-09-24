import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { categorySchema } from "@/lib/validation/product";

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

    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Please provide valid category details." },
        { status: 400 },
      );
    }

    const category = await prisma.category.update({
      where: {
        id,
      },
      data: result.data,
    });

    return NextResponse.json(category);
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

    console.error("Update category error:", error);

    return NextResponse.json(
      { message: "Unable to update category." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const [productCount, subProductCount, childCategoryCount] =
      await Promise.all([
        prisma.product.count({
          where: { categoryId: id },
        }),
        prisma.product.count({
          where: { subCategoryId: id },
        }),
        prisma.category.count({
          where: { parentId: id },
        }),
      ]);

    if (productCount > 0 || subProductCount > 0) {
      return NextResponse.json(
        {
          message:
            "This category cannot be deleted while products are assigned to it.",
        },
        { status: 409 },
      );
    }

    if (childCategoryCount > 0) {
      return NextResponse.json(
        {
          message:
            "This category has sub-categories. Please delete or move them before deleting this category.",
        },
        { status: 409 },
      );
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Category deleted successfully.",
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

    console.error("Delete category error:", error);

    return NextResponse.json(
      { message: "Unable to delete category." },
      { status: 500 },
    );
  }
}
