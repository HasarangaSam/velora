"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { z } from "zod";

export type CategoryActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const initialState: CategoryActionState = {
  success: false,
  message: "",
};

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  parentId: z.string().optional(),
});

export async function createCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  try {
    await requireAdmin();

    const rawParentId = formData.get("parentId");
    const result = categorySchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      parentId: rawParentId && rawParentId !== "" ? String(rawParentId) : undefined,
    });

    if (!result.success) {
      return {
        ...initialState,
        message: "Please correct the category details.",
        errors: result.error.flatten().fieldErrors,
      };
    }

    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: result.data.name, mode: "insensitive" } },
          { slug: result.data.slug },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return {
        ...initialState,
        message: "A category with this name or slug already exists.",
      };
    }

    // If parentId given, verify it exists and is a top-level category
    if (result.data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: result.data.parentId },
        select: { id: true, parentId: true },
      });

      if (!parent) {
        return { ...initialState, message: "Selected parent category not found." };
      }

      if (parent.parentId) {
        return {
          ...initialState,
          message: "Sub-categories cannot be nested further (max 2 levels).",
        };
      }
    }

    await prisma.category.create({
      data: {
        name: result.data.name,
        slug: result.data.slug,
        parentId: result.data.parentId ?? null,
      },
    });

    revalidatePath("/admin/categories");

    return {
      success: true,
      message: "Category created successfully.",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ...initialState, message: "Authentication required." };
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { ...initialState, message: "Admin access required." };
    }

    console.error("Create category action error:", error);
    return { ...initialState, message: "Unable to create the category." };
  }
}

export async function deleteCategory(
  categoryId: string,
): Promise<CategoryActionState> {
  try {
    await requireAdmin();

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { products: true, subProducts: true, children: true } },
      },
    });

    if (!category) {
      return { ...initialState, message: "Category not found." };
    }

    if (category._count.products > 0 || category._count.subProducts > 0) {
      return {
        ...initialState,
        message: "Cannot delete a category that has products assigned to it.",
      };
    }

    if (category._count.children > 0) {
      return {
        ...initialState,
        message: "Cannot delete a parent category that still has sub-categories. Delete sub-categories first.",
      };
    }

    await prisma.category.delete({ where: { id: categoryId } });

    revalidatePath("/admin/categories");

    return { success: true, message: "Category deleted." };
  } catch (error) {
    console.error("Delete category action error:", error);
    return { ...initialState, message: "Unable to delete the category." };
  }
}
