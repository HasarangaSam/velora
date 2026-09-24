import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { categorySchema } from "@/lib/validation/product";

export async function GET() {
  try {
    await requireAdmin();

    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
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

    console.error("Get categories error:", error);

    return NextResponse.json(
      { message: "Unable to load categories." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Please provide valid category details.",
        },
        { status: 400 },
      );
    }

    const category = await prisma.category.create({
      data: result.data,
    });

    return NextResponse.json(category, { status: 201 });
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

    console.error("Create category error:", error);

    return NextResponse.json(
      { message: "Unable to create category." },
      { status: 500 },
    );
  }
}
