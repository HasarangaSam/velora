import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
    imageId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, imageId } = await context.params;

    const { requireAdmin } = await import("@/lib/auth/require-admin");

    await requireAdmin();

    const body = await request.json();

    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId: id,
      },
    });

    if (!image) {
      return NextResponse.json(
        { message: "Image not found." },
        { status: 404 },
      );
    }

    if (body.action === "primary") {
      await prisma.$transaction(async (tx) => {
        await tx.productImage.updateMany({
          where: {
            productId: id,
          },
          data: {
            isPrimary: false,
          },
        });

        await tx.productImage.update({
          where: {
            id: imageId,
          },
          data: {
            isPrimary: true,
          },
        });
      });

      return NextResponse.json({
        message: "Primary image updated successfully.",
      });
    }

    if (body.action === "move-left" || body.action === "move-right") {
      const direction = body.action === "move-left" ? "left" : "right";

      const images = await prisma.productImage.findMany({
        where: {
          productId: id,
        },
        orderBy: {
          sortOrder: "asc",
        },
      });

      const currentIndex = images.findIndex(
        (currentImage) => currentImage.id === imageId,
      );

      if (currentIndex === -1) {
        return NextResponse.json(
          { message: "Image not found." },
          { status: 404 },
        );
      }

      const targetIndex =
        direction === "left" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= images.length) {
        return NextResponse.json({
          message: "Image is already at the edge of the current order.",
        });
      }

      const currentImage = images[currentIndex];
      const targetImage = images[targetIndex];

      await prisma.$transaction([
        prisma.productImage.update({
          where: {
            id: currentImage.id,
          },
          data: {
            sortOrder: targetImage.sortOrder,
          },
        }),

        prisma.productImage.update({
          where: {
            id: targetImage.id,
          },
          data: {
            sortOrder: currentImage.sortOrder,
          },
        }),
      ]);

      return NextResponse.json({
        message: "Image order updated successfully.",
      });
    }

    return NextResponse.json(
      { message: "Invalid image action." },
      { status: 400 },
    );
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

    console.error("Update product image error:", error);

    return NextResponse.json(
      { message: "Unable to update the image." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { requireAdmin } = await import("@/lib/auth/require-admin");

    await requireAdmin();

    const { id, imageId } = await context.params;

    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId: id,
      },
    });

    if (!image) {
      return NextResponse.json(
        { message: "Image not found." },
        { status: 404 },
      );
    }

    await cloudinary.uploader.destroy(image.publicId);

    await prisma.$transaction(async (tx) => {
      await tx.productImage.delete({
        where: {
          id: imageId,
        },
      });

      if (image.isPrimary) {
        const nextImage = await tx.productImage.findFirst({
          where: {
            productId: id,
          },
          orderBy: {
            sortOrder: "asc",
          },
        });

        if (nextImage) {
          await tx.productImage.update({
            where: {
              id: nextImage.id,
            },
            data: {
              isPrimary: true,
            },
          });
        }
      }
    });

    return NextResponse.json({
      message: "Image deleted successfully.",
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
      { message: "Unable to delete the image." },
      { status: 500 },
    );
  }
}
