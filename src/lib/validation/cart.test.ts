import { describe, expect, it } from "vitest";
import {
  addToCartSchema,
  syncCartSchema,
  updateCartItemSchema,
} from "./cart";

describe("addToCartSchema", () => {
  it("accepts a valid item and converts a numeric string quantity", () => {
    const result = addToCartSchema.safeParse({
      variantId: "variant-123",
      quantity: "2",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ variantId: "variant-123", quantity: 2 });
    }
  });

  it.each([0, 101, 1.5, "not a number"])(
    "rejects quantity %s",
    (quantity) => {
      expect(
        addToCartSchema.safeParse({ variantId: "variant-123", quantity })
          .success,
      ).toBe(false);
    },
  );

  it("rejects an empty variant ID", () => {
    expect(
      addToCartSchema.safeParse({ variantId: "", quantity: 1 }).success,
    ).toBe(false);
  });
});

describe("updateCartItemSchema", () => {
  it("accepts the minimum allowed quantity", () => {
    expect(updateCartItemSchema.safeParse({ quantity: 1 }).success).toBe(true);
  });

  it("rejects a quantity over the limit", () => {
    expect(updateCartItemSchema.safeParse({ quantity: 101 }).success).toBe(
      false,
    );
  });
});

describe("syncCartSchema", () => {
  it("accepts an empty cart", () => {
    expect(syncCartSchema.safeParse({ items: [] }).success).toBe(true);
  });

  it("rejects more than 100 cart items", () => {
    const items = Array.from({ length: 101 }, (_, index) => ({
      variantId: `variant-${index}`,
      quantity: 1,
    }));

    expect(syncCartSchema.safeParse({ items }).success).toBe(false);
  });
});
