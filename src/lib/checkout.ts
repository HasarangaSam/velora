export const SHIPPING_COST = 350;
export const FREE_SHIPPING_THRESHOLD = 10000;

export function calculateShipping(subtotal: number) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  return SHIPPING_COST;
}

export function calculateCouponDiscount(
  subtotal: number,
  coupon: {
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    maximumDiscount: number | null;
  },
) {
  let discount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    discount = (subtotal * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }

  if (coupon.maximumDiscount !== null) {
    discount = Math.min(discount, coupon.maximumDiscount);
  }

  return Math.min(discount, subtotal);
}
