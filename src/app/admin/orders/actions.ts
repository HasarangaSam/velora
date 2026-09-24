"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { OrderStatus } from "@/generated/prisma/enums";

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    await requireAdmin();

    if (!Object.values(OrderStatus).includes(newStatus as OrderStatus)) {
      return { success: false, message: "Invalid order status value." };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus as OrderStatus,
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");

    return { success: true, message: `Order status updated to ${newStatus}.` };
  } catch (error) {
    console.error("Update order status error:", error);
    return { success: false, message: "Failed to update order status." };
  }
}

export type OrderActionState = {
  success: boolean;
  message: string;
  currentStatus?: string;
};

export async function updateOrderStatusAction(
  orderId: string,
  prevState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const newStatus = formData.get("status") as string;
  if (!newStatus) {
    return { success: false, message: "Status is required.", currentStatus: prevState.currentStatus };
  }
  const res = await updateOrderStatus(orderId, newStatus);
  return {
    ...res,
    currentStatus: res.success ? newStatus : prevState.currentStatus,
  };
}
