import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createPayHerePaymentData, PAYHERE_CHECKOUT_URL } from "@/lib/payhere";
import PayHereForm from "@/components/payment/PayHereForm";

type PaymentPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }

  const params = await searchParams;

  if (!params.orderId) {
    redirect("/checkout");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        select: {
          name: true,
          size: true,
          colour: true,
          quantity: true,
        },
      },
      payment: true,
    },
  });

  if (!order || !order.payment) {
    redirect("/checkout");
  }

  if (order.paymentStatus === "PAID") {
    redirect(`/checkout/success?orderId=${order.id}`);
  }

  if (order.status !== "PENDING") {
    redirect(`/checkout/cancelled?orderId=${order.id}`);
  }

  const payment = await prisma.payment.update({
    where: {
      id: order.payment.id,
    },
    data: {
      status: "PENDING",
    },
  });

  const fields = createPayHerePaymentData({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.total),
    customer: {
      name: order.user.name ?? order.shippingFullName,
      email: order.user.email,
    },
    address: {
      phone: order.shippingPhone,
      addressLine1: order.shippingAddressLine1,
      addressLine2: order.shippingAddressLine2,
      city: order.shippingCity,
    },
    items: order.items
      .map(
        (item) =>
          `${item.name} (${item.size}, ${item.colour}) x${item.quantity}`,
      )
      .join(", "),
  });

  void payment;

  return <PayHereForm action={PAYHERE_CHECKOUT_URL} fields={fields} />;
}
