"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { addressSchema } from "@/lib/validation/address";

export type AddressActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  address?: {
    id: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: string;
    postalCode: string;
    isDefault: boolean;
  };
};

const initialState: AddressActionState = {
  success: false,
  message: "",
};

export async function createAddress(
  _prevState: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  try {
    const user = await requireUser();

    const result = addressSchema.safeParse({
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2") || undefined,
      city: formData.get("city"),
      district: formData.get("district"),
      postalCode: formData.get("postalCode"),
      isDefault: formData.get("isDefault") === "true" || formData.get("isDefault") === "on",
    });

    if (!result.success) {
      return {
        ...initialState,
        message: "Please correct the address details.",
        errors: result.error.flatten().fieldErrors,
      };
    }

    const existingCount = await prisma.address.count({
      where: { userId: user.id },
    });

    const shouldBeDefault = result.data.isDefault || existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
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

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return {
      success: true,
      message: "Address added successfully.",
      address,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ...initialState, message: "Authentication required." };
    }
    console.error("Create address action error:", error);
    return { ...initialState, message: "Unable to add the address." };
  }
}

export async function updateAddress(
  addressId: string,
  _prevState: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  try {
    const user = await requireUser();

    const result = addressSchema.safeParse({
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2") || undefined,
      city: formData.get("city"),
      district: formData.get("district"),
      postalCode: formData.get("postalCode"),
      isDefault: formData.get("isDefault") === "true" || formData.get("isDefault") === "on",
    });

    if (!result.success) {
      return {
        ...initialState,
        message: "Please correct the address details.",
        errors: result.error.flatten().fieldErrors,
      };
    }

    const existing = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existing || existing.userId !== user.id) {
      return { ...initialState, message: "Address not found." };
    }

    const address = await prisma.$transaction(async (tx) => {
      if (result.data.isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
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

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return {
      success: true,
      message: "Address updated successfully.",
      address,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ...initialState, message: "Authentication required." };
    }
    console.error("Update address action error:", error);
    return { ...initialState, message: "Unable to update address." };
  }
}

export async function deleteAddress(
  addressId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireUser();

    const address = await prisma.address.findUnique({
      where: { id: addressId },
      select: { id: true, userId: true, isDefault: true },
    });

    if (!address || address.userId !== user.id) {
      return { success: false, message: "Address not found." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      });

      if (address.isDefault) {
        const replacement = await tx.address.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });

        if (replacement) {
          await tx.address.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }
    });

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return { success: true, message: "Address deleted successfully." };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { success: false, message: "Authentication required." };
    }
    console.error("Delete address action error:", error);
    return { success: false, message: "Unable to delete address." };
  }
}
