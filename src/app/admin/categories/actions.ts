"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { categorySchema } from "@/lib/validation/product";

export type CategoryActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const initialState: CategoryActionState = {
  success: false,
  message: "",
};

export async function createCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  try {
    await requireAdmin();

    const result = categorySchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
    });

    if (!result.success) {
      return {
        ...initialState,
        message: "Please correct the category details.",
        errors: result.error.flatten().fieldErrors,
      };
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          {
            name: {
              equals: result.data.name,
              mode: "insensitive",
            },
          },
          {
            slug: result.data.slug,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (existingCategory) {
      return {
        ...initialState,
        message: "A category with this name or slug already exists.",
      };
    }

    await prisma.category.create({
      data: result.data,
    });

    return {
      success: true,
      message: "Category created successfully.",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return {
        ...initialState,
        message: "Authentication required.",
      };
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return {
        ...initialState,
        message: "Admin access required.",
      };
    }

    console.error("Create category action error:", error);

    return {
      ...initialState,
      message: "Unable to create the category.",
    };
  }
}
