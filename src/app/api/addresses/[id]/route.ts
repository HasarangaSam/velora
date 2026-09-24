import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { addressSchema } from "@/lib/validation/address";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();

    const { id } = await context.params;

    const body = await request.json();

    const result = addressSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Please provide valid address details.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const existingAddress = await prisma.address.findUnique({
      where: {
        id,
      },
    });

    if (!existingAddress || existingAddress.userId !== user.id) {
      return NextResponse.json(
        { message: "Address not found." },
        { status: 404 },
      );
    }

    const address = await prisma.$transaction(async (tx) => {
      if (result.data.isDefault) {
        await tx.address.updateMany({
          where: {
            userId: user.id,
            id: {
              not: id,
            },
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.update({
        where: {
          id,
        },
        data: {
          fullName: result.data.fullName,
          phone: result.data.phone,
          addressLine1: result.data.addressLine1,
          addressLine2: result.data.addressLine2 || null,
          city: result.data.city,
          district: result.data.district,
          postalCode: result.data.postalCode,
          isDefault: result.data.isDefault,
        },
      });
    });

    return NextResponse.json({
      message: "Address updated successfully.",
      address,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    console.error("Update address error:", error);

    return NextResponse.json(
      { message: "Unable to update the address." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();

    const { id } = await context.params;

    const address = await prisma.address.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
        isDefault: true,
      },
    });

    if (!address || address.userId !== user.id) {
      return NextResponse.json(
        { message: "Address not found." },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: {
          id,
        },
      });

      if (address.isDefault) {
        const replacement = await tx.address.findFirst({
          where: {
            userId: user.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (replacement) {
          await tx.address.update({
            where: {
              id: replacement.id,
            },
            data: {
              isDefault: true,
            },
          });
        }
      }
    });

    return NextResponse.json({
      message: "Address deleted successfully.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    console.error("Delete address error:", error);

    return NextResponse.json(
      { message: "Unable to delete the address." },
      { status: 500 },
    );
  }
}
