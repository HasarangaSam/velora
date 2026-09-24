import { createHash, timingSafeEqual } from "crypto";

export const PAYHERE_CURRENCY = "LKR";

export const PAYHERE_CHECKOUT_URL =
  process.env.PAYHERE_SANDBOX === "true"
    ? "https://sandbox.payhere.lk/pay/checkout"
    : "https://www.payhere.lk/pay/checkout";

function md5(value: string) {
  return createHash("md5").update(value).digest("hex").toUpperCase();
}

export function formatPayHereAmount(amount: number) {
  return amount.toFixed(2);
}

export function generatePayHereHash(
  orderId: string,
  amount: string,
  currency: string,
) {
  const merchantId = process.env.PAYHERE_MERCHANT_ID ?? "";
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET ?? "";
  const hashedSecret = md5(merchantSecret);

  return md5(`${merchantId}${orderId}${amount}${currency}${hashedSecret}`);
}

export function generatePayHereNotificationSignature({
  orderId,
  amount,
  currency,
  statusCode,
}: {
  orderId: string;
  amount: string;
  currency: string;
  statusCode: string;
}) {
  const merchantId = process.env.PAYHERE_MERCHANT_ID ?? "";
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET ?? "";
  const hashedSecret = md5(merchantSecret);

  return md5(
    `${merchantId}${orderId}${amount}${currency}${statusCode}${hashedSecret}`,
  );
}

export function verifyPayHereSignature(
  receivedSignature: string,
  expectedSignature: string,
) {
  const received = Buffer.from(receivedSignature.toUpperCase());
  const expected = Buffer.from(expectedSignature.toUpperCase());

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: parts[0],
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function createPayHerePaymentData({
  orderId,
  orderNumber,
  amount,
  customer,
  address,
  items,
}: {
  orderId: string;
  orderNumber: string;
  amount: number;
  customer: {
    name: string;
    email: string;
  };
  address: {
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
  };
  items: string;
}): Record<string, string> {
  const merchantId = process.env.PAYHERE_MERCHANT_ID ?? "";
  const notifyUrl = process.env.PAYHERE_NOTIFY_URL ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const formattedAmount = formatPayHereAmount(amount);
  const { firstName, lastName } = splitName(customer.name);

  return {
    merchant_id: merchantId,

    return_url: `${appUrl}/checkout/success?orderId=${orderId}`,
    cancel_url: `${appUrl}/checkout/cancelled?orderId=${orderId}`,
    notify_url: notifyUrl,

    first_name: firstName,
    last_name: lastName,
    email: customer.email,
    phone: address.phone,

    address: [address.addressLine1, address.addressLine2]
      .filter(Boolean)
      .join(", "),

    city: address.city,
    country: "Sri Lanka",

    order_id: orderNumber,
    items,
    currency: PAYHERE_CURRENCY,
    amount: formattedAmount,

    hash: generatePayHereHash(orderNumber, formattedAmount, PAYHERE_CURRENCY),
  };
}

