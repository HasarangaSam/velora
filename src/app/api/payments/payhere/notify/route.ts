import { NextResponse } from "next/server";
import { Prisma, prisma } from "@/lib/db/prisma";
import {
  generatePayHereNotificationSignature,
  verifyPayHereSignature,
  PAYHERE_CURRENCY,
} from "@/lib/payhere";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();

  const merchantId = String(formData.get("merchant_id") ?? "");
  const orderNumber = String(formData.get("order_id") ?? "");
  const paymentId = String(formData.get("payment_id") ?? "");
  const amount = String(formData.get("payhere_amount") ?? "");
  const currency = String(formData.get("payhere_currency") ?? "");
  const statusCode = String(formData.get("status_code") ?? "");
  const receivedSignature = String(formData.get("md5sig") ?? "");

  if (
    !merchantId ||
    !orderNumber ||
    !paymentId ||
    !amount ||
    !currency ||
    !statusCode ||
    !receivedSignature
  ) {
    return NextResponse.json(
      { message: "Invalid notification." },
      { status: 400 },
    );
  }

  const expectedMerchantId = process.env.PAYHERE_MERCHANT_ID;

  if (merchantId !== expectedMerchantId) {
    return NextResponse.json({ message: "Invalid merchant." }, { status: 400 });
  }

  const expectedSignature = generatePayHereNotificationSignature({
    orderId: orderNumber,
    amount,
    currency,
    statusCode,
  });

  if (!verifyPayHereSignature(receivedSignature, expectedSignature)) {
    return NextResponse.json(
      { message: "Invalid signature." },
      { status: 400 },
    );
  }

  if (currency !== PAYHERE_CURRENCY) {
    return NextResponse.json({ message: "Invalid currency." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: {
      orderNumber,
    },
    include: {
      payment: true,
    },
  });

  if (!order || !order.payment) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }

  const expectedAmount = Number(order.total);
  const receivedAmount = Number(amount);

  if (
    !Number.isFinite(receivedAmount) ||
    Math.abs(expectedAmount - receivedAmount) > 0.001
  ) {
    return NextResponse.json(
      { message: "Invalid payment amount." },
      { status: 400 },
    );
  }

  if (statusCode === "2") {
    try {
      await prisma.$transaction(
        async (tx) => {
          const currentPayment = await tx.payment.findUnique({
            where: {
              id: order.payment!.id,
            },
          });

          if (!currentPayment) {
            throw new Error("PAYMENT_NOT_FOUND");
          }

          if (currentPayment.status === "PAID") {
            return;
          }

          const currentOrder = await tx.order.findUnique({
            where: {
              id: order.id,
            },
            include: {
              items: true,
            },
          });

          if (!currentOrder) {
            throw new Error("ORDER_NOT_FOUND");
          }

          if (currentOrder.paymentStatus === "PAID") {
            return;
          }

          for (const item of currentOrder.items) {
            const result = await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                stock: {
                  gte: item.quantity,
                },
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });

            if (result.count !== 1) {
              throw new Error("INSUFFICIENT_STOCK");
            }
          }

          if (currentOrder.couponCode) {
            const coupon = await tx.coupon.findUnique({
              where: {
                code: currentOrder.couponCode,
              },
            });

            if (!coupon) {
              throw new Error("COUPON_NOT_FOUND");
            }

            const now = new Date();

            if (
              coupon.status !== "ACTIVE" ||
              (coupon.startsAt && coupon.startsAt > now) ||
              (coupon.expiresAt && coupon.expiresAt < now)
            ) {
              throw new Error("COUPON_NOT_AVAILABLE");
            }

            if (
              coupon.usageLimit !== null &&
              coupon.usedCount >= coupon.usageLimit
            ) {
              throw new Error("COUPON_USAGE_LIMIT");
            }

            if (coupon.perUserLimit !== null) {
              const userUsageCount = await tx.couponUsage.count({
                where: {
                  couponId: coupon.id,
                  userId: currentOrder.userId,
                },
              });

              if (userUsageCount >= coupon.perUserLimit) {
                throw new Error("COUPON_USER_LIMIT");
              }
            }

            await tx.coupon.update({
              where: {
                id: coupon.id,
              },
              data: {
                usedCount: {
                  increment: 1,
                },
              },
            });

            await tx.couponUsage.create({
              data: {
                couponId: coupon.id,
                userId: currentOrder.userId,
                orderId: currentOrder.id,
              },
            });
          }

          await tx.payment.update({
            where: {
              id: currentPayment.id,
            },
            data: {
              status: "PAID",
              providerId: paymentId,
              providerOrderId: orderNumber,
            },
          });

          await tx.order.update({
            where: {
              id: currentOrder.id,
            },
            data: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "INSUFFICIENT_STOCK") {
          return NextResponse.json(
            {
              message: "Payment received but stock could not be confirmed.",
            },
            { status: 409 },
          );
        }

        if (
          error.message === "COUPON_USAGE_LIMIT" ||
          error.message === "COUPON_USER_LIMIT" ||
          error.message === "COUPON_NOT_AVAILABLE"
        ) {
          return NextResponse.json(
            {
              message: "Payment received but the coupon could not be applied.",
            },
            { status: 409 },
          );
        }

        if (error.message === "COUPON_NOT_FOUND") {
          return NextResponse.json(
            {
              message: "Payment received but the coupon was not found.",
            },
            { status: 409 },
          );
        }
      }

      throw error;
    }

    return new NextResponse("OK");
  }

  if (statusCode === "-1" || statusCode === "-2" || statusCode === "-3") {
    await prisma.payment.update({
      where: {
        id: order.payment.id,
      },
      data: {
        status: "FAILED",
        providerId: paymentId,
        providerOrderId: orderNumber,
      },
    });

    return new NextResponse("OK");
  }

  if (statusCode === "0") {
    await prisma.payment.update({
      where: {
        id: order.payment.id,
      },
      data: {
        status: "PENDING",
        providerId: paymentId,
        providerOrderId: orderNumber,
      },
    });

    return new NextResponse("OK");
  }

  return new NextResponse("OK");
}
