import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import cloudinary from "@/lib/cloudinary";

type RouteContext = {
  params: Promise<{
    id: string;
    imageId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id: productId, imageId } = await context.params;

    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { message: "Product image not found." },
        { status: 404 },
      );
    }

    await cloudinary.uploader.destroy(image.publicId);

    await prisma.productImage.delete({
      where: {
        id: image.id,
      },
    });

    return NextResponse.json({
      message: "Product image deleted successfully.",
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

    console.error("Delete product image error:", error);

    return NextResponse.json(
      { message: "Unable to delete product image." },
      { status: 500 },
    );
  }
}
