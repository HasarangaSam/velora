import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { productVariantSchema } from "@/lib/validation/product";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id: productId } = await context.params;
    const body = await request.json();

    const result = productVariantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Please provide valid variant details." },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
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

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        ...result.data,
      },
    });

    return NextResponse.json(variant, { status: 201 });
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

    console.error("Create variant error:", error);

    return NextResponse.json(
      { message: "Unable to create variant." },
      { status: 500 },
    );
  }
}
