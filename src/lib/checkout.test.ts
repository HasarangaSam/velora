import { describe, expect, it } from "vitest";
import {
  calculateCouponDiscount,
  calculateShipping,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_COST,
} from "./checkout";

describe("calculateShipping", () => {
  it("charges delivery below the free-shipping threshold and waives it at the threshold", () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD - 0.01)).toBe(SHIPPING_COST);
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD)).toBe(0);
  });
});

describe("calculateCouponDiscount", () => {
  it("applies a percentage discount up to its configured maximum", () => {
    expect(
      calculateCouponDiscount(500, {
        discountType: "PERCENTAGE",
        discountValue: 20,
        maximumDiscount: 50,
      }),
    ).toBe(50);
  });

  it("caps a fixed discount at the order subtotal", () => {
    expect(
      calculateCouponDiscount(200, {
        discountType: "FIXED",
        discountValue: 250,
        maximumDiscount: null,
      }),
    ).toBe(200);
  });
});
