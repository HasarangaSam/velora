import { describe, expect, it } from "vitest";
import { getCurrentPrice, getDiscountPercent } from "./product-pricing";

describe("product pricing", () => {
  it("uses the sale price when it is a valid discount", () => {
    const product = { price: "5490.00", salePrice: "4990.00" };

    expect(getCurrentPrice(product)).toBe(4990);
    expect(getDiscountPercent(product)).toBe(9);
  });

  it.each([null, "", "0", "5490", "6000", "not-a-price"])(
    "uses the regular price and hides the badge for invalid sale price %s",
    (salePrice) => {
      const product = { price: "5490", salePrice };

      expect(getCurrentPrice(product)).toBe(5490);
      expect(getDiscountPercent(product)).toBeNull();
    },
  );

  it("rounds the displayed discount percentage to the nearest whole number", () => {
    expect(getDiscountPercent({ price: 100, salePrice: 66 })).toBe(34);
  });
});
