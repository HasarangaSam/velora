"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { productSchema, productVariantSchema } from "@/lib/validation/product";

export type ProductActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const initialState: ProductActionState = {
  success: false,
  message: "",
};

export async function createProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  try {
    await requireAdmin();

    const variantsValue = formData.get("variants");

    if (typeof variantsValue !== "string") {
      return {
        ...initialState,
        message: "Please add at least one product variant.",
      };
    }

    let variants: unknown;

    try {
      variants = JSON.parse(variantsValue);
    } catch {
      return {
        ...initialState,
        message: "Invalid variant data.",
      };
    }

    const productResult = productSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      categoryId: formData.get("categoryId"),
      isActive: formData.get("isActive") === "true",
      isFeatured: formData.get("isFeatured") === "true",
    });

    if (!productResult.success) {
      return {
        ...initialState,
        message: "Please correct the product details.",
        errors: productResult.error.flatten().fieldErrors,
      };
    }

    const variantsResult = productVariantSchema
      .array()
      .min(1, "At least one variant is required.")
      .safeParse(variants);

    if (!variantsResult.success) {
      return {
        ...initialState,
        message: "Please correct the variant details.",
      };
    }

    const category = await prisma.category.findUnique({
      where: {
        id: productResult.data.categoryId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      return {
        ...initialState,
        message: "The selected category does not exist.",
      };
    }

    const slug = productResult.data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      return {
        ...initialState,
        message: "Unable to create a valid product slug.",
      };
    }

    const existingSlug = await prisma.product.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existingSlug) {
      return {
        ...initialState,
        message:
          "A product with a similar name already exists. Please use a different product name.",
      };
    }

    const product = await prisma.product.create({
      data: {
        name: productResult.data.name,
        slug,
        description: productResult.data.description,
        categoryId: productResult.data.categoryId,
        isActive: productResult.data.isActive,
        isFeatured: productResult.data.isFeatured,
        variants: {
          create: variantsResult.data.map((variant) => ({
            size: variant.size,
            colour: variant.colour,
            price: variant.price,
            stock: variant.stock,
          })),
        },
      },
      select: {
        id: true,
      },
    });

    return {
      success: true,
      message: `Product "${productResult.data.name}" created successfully.`,
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

    console.error("Create product action error:", error);

    return {
      ...initialState,
      message: "Unable to create the product.",
    };
  }
}
