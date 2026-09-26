"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { productSchema, productVariantSchema } from "@/lib/validation/product";
import { redis } from "@/lib/redis";
import cloudinary from "@/lib/cloudinary";
import { z } from "zod";

export type ProductActionState = {
  success: boolean;
  message: string;
  productId?: string;
  errors?: Record<string, string[]>;
};

const initialState: ProductActionState = {
  success: false,
  message: "",
};

const updateProductVariantSchema = productVariantSchema.extend({
  id: z.string().optional(),
});

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

    const rawSubCategoryId = formData.get("subCategoryId");
    const subCategoryId =
      rawSubCategoryId && String(rawSubCategoryId) !== ""
        ? String(rawSubCategoryId)
        : null;

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
      where: { id: productResult.data.categoryId },
      select: { id: true },
    });

    if (!category) {
      return { ...initialState, message: "The selected category does not exist." };
    }

    // Validate sub-category if provided
    if (subCategoryId) {
      const subCat = await prisma.category.findUnique({
        where: { id: subCategoryId },
        select: { parentId: true },
      });
      if (!subCat || subCat.parentId !== productResult.data.categoryId) {
        return {
          ...initialState,
          message: "Selected sub-category does not belong to the chosen main category.",
        };
      }
    }

    const slug = productResult.data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      return { ...initialState, message: "Unable to create a valid product slug." };
    }

    const existingSlug = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingSlug) {
      return {
        ...initialState,
        message: "A product with a similar name already exists. Please use a different product name.",
      };
    }

    const product = await prisma.product.create({
      data: {
        name: productResult.data.name,
        slug,
        description: productResult.data.description,
        categoryId: productResult.data.categoryId,
        subCategoryId: subCategoryId ?? null,
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
      select: { id: true },
    });

    try {
      const keys = await redis.keys("velora:products*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (redisErr) {
      console.error("Redis cache invalidation error:", redisErr);
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return {
      success: true,
      message: `Product "${productResult.data.name}" created successfully.`,
      productId: product.id,
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

export async function updateProduct(
  productId: string,
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

    const rawSubCategoryId = formData.get("subCategoryId");
    const subCategoryId =
      rawSubCategoryId && String(rawSubCategoryId) !== ""
        ? String(rawSubCategoryId)
        : null;

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
        message: "Please correct the form errors.",
        errors: productResult.error.flatten().fieldErrors,
      };
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!existingProduct) {
      return {
        ...initialState,
        message: "Product not found.",
      };
    }

    const category = await prisma.category.findUnique({
      where: { id: productResult.data.categoryId },
      select: { id: true },
    });

    if (!category) {
      return {
        ...initialState,
        message: "The selected category does not exist.",
      };
    }

    if (subCategoryId) {
      const subCat = await prisma.category.findUnique({
        where: { id: subCategoryId },
        select: { parentId: true },
      });

      if (!subCat || subCat.parentId !== productResult.data.categoryId) {
        return {
          ...initialState,
          message: "Selected sub-category does not belong to the chosen main category.",
        };
      }
    }

    const variantsResult = z
      .array(updateProductVariantSchema)
      .min(1, "Please add at least one product variant.")
      .safeParse(variants);

    if (!variantsResult.success) {
      return {
        ...initialState,
        message: "Please provide valid product variants.",
      };
    }

    const existingVariantIds = new Set(
      existingProduct.variants.map((variant) => variant.id),
    );
    const submittedVariantIds = new Set<string>();

    for (const variant of variantsResult.data) {
      if (variant.id) {
        if (!existingVariantIds.has(variant.id)) {
          return { ...initialState, message: "Invalid product variant." };
        }
        if (submittedVariantIds.has(variant.id)) {
          return { ...initialState, message: "Duplicate product variant ID." };
        }
        submittedVariantIds.add(variant.id);
      }
    }

    const duplicateVariants = new Set<string>();
    for (const variant of variantsResult.data) {
      const key = `${variant.size.toLowerCase()}::${variant.colour.toLowerCase()}`;
      if (duplicateVariants.has(key)) {
        return {
          ...initialState,
          message: "Each size and colour combination can only be added once.",
        };
      }
      duplicateVariants.add(key);
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: productResult.data.name,
          description: productResult.data.description,
          categoryId: productResult.data.categoryId,
          subCategoryId: subCategoryId ?? null,
          isActive: productResult.data.isActive,
          isFeatured: productResult.data.isFeatured,
        },
      });

      for (const variant of variantsResult.data) {
        if (variant.id) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              size: variant.size,
              colour: variant.colour,
              price: variant.price,
              stock: variant.stock,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId,
              size: variant.size,
              colour: variant.colour,
              price: variant.price,
              stock: variant.stock,
            },
          });
        }
      }

      // Mark removed variants as 0 stock to preserve FK references in orders/carts
      for (const variant of existingProduct.variants) {
        if (!submittedVariantIds.has(variant.id)) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: 0 },
          });
        }
      }
    });

    try {
      const keys = await redis.keys("velora:products*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (redisError) {
      console.error("Redis cache invalidation error:", redisError);
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath("/products");
    revalidatePath("/");

    return {
      success: true,
      message: "Product updated successfully.",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ...initialState, message: "Authentication required." };
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { ...initialState, message: "Admin access required." };
    }

    console.error("Update product action error:", error);
    return { ...initialState, message: "Unable to update the product." };
  }
}

export async function deleteProduct(productId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await requireAdmin();

    if (typeof productId !== "string" || productId.length < 1 || productId.length > 64) {
      return { success: false, message: "Invalid product." };
    }

    const deletion = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          images: { select: { publicId: true } },
          _count: { select: { orderItems: true } },
        },
      });

      if (!product) return { kind: "not-found" as const };
      if (product._count.orderItems > 0) return { kind: "has-orders" as const };

      await tx.product.delete({ where: { id: product.id } });
      return {
        kind: "deleted" as const,
        name: product.name,
        publicIds: product.images.map((image) => image.publicId),
      };
    });

    if (deletion.kind === "not-found") {
      return { success: false, message: "Product not found." };
    }
    if (deletion.kind === "has-orders") {
      return {
        success: false,
        message: "This product has order history and can’t be deleted. Deactivate it instead to preserve past orders.",
      };
    }

    const imageCleanup = await Promise.allSettled(
      deletion.publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)),
    );
    if (imageCleanup.some((result) => result.status === "rejected")) {
      console.error(`Some Cloudinary images for deleted product ${productId} could not be removed.`);
    }

    try {
      const keys = await redis.keys("velora:products*");
      if (keys.length > 0) await redis.del(...keys);
      await redis.del("velora:featured_products:v2");
    } catch (error) {
      console.error("Redis product cache invalidation error:", error);
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/shop");
    revalidatePath("/");

    return { success: true, message: `“${deletion.name}” was deleted.` };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, message: "Authentication required." };
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { success: false, message: "Admin access required." };
    }

    if (error && typeof error === "object" && "code" in error && error.code === "P2003") {
      return {
        success: false,
        message: "This product is referenced by an order or cart and can’t be deleted. Deactivate it instead.",
      };
    }

    console.error("Delete product action error:", error);
    return { success: false, message: "Unable to delete this product." };
  }
}
