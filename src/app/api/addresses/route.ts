import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { addressSchema } from "@/lib/validation/address";

export async function GET() {
  try {
    const user = await requireUser();

    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json({
      addresses,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    console.error("Get addresses error:", error);

    return NextResponse.json(
      { message: "Unable to load addresses." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

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

    const existingAddressCount = await prisma.address.count({
      where: {
        userId: user.id,
      },
    });

    const shouldBeDefault = result.data.isDefault || existingAddressCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: {
            userId: user.id,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.create({
        data: {
          userId: user.id,
          fullName: result.data.fullName,
          phone: result.data.phone,
          addressLine1: result.data.addressLine1,
          addressLine2: result.data.addressLine2 || null,
          city: result.data.city,
          district: result.data.district,
          postalCode: result.data.postalCode,
          isDefault: shouldBeDefault,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Address added successfully.",
        address,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    console.error("Create address error:", error);

    return NextResponse.json(
      { message: "Unable to add the address." },
      { status: 500 },
    );
  }
}
