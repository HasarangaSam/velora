export type ProductPriceValues = {
  price: number | string | { toString(): string };
  salePrice?: number | string | { toString(): string } | null;
};

// The effective price uses the sale value when it is valid and lower than the original price.
export function getCurrentPrice({
  price,
  salePrice,
}: ProductPriceValues): number {
  const regularPrice = Number(price);
  const discountedPrice = salePrice == null ? null : Number(salePrice);

  return discountedPrice !== null &&
    Number.isFinite(discountedPrice) &&
    discountedPrice > 0 &&
    discountedPrice < regularPrice
    ? discountedPrice
    : regularPrice;
}

// Return a null discount when the item is not actually discounted, which keeps the UI logic simple.
export function getDiscountPercent({
  price,
  salePrice,
}: ProductPriceValues): number | null {
  if (salePrice == null) return null;
  const regularPrice = Number(price);
  const discountedPrice = Number(salePrice);
  if (
    !Number.isFinite(regularPrice) ||
    regularPrice <= 0 ||
    !Number.isFinite(discountedPrice) ||
    discountedPrice <= 0 ||
    discountedPrice >= regularPrice
  )
    return null;
  return Math.round(((regularPrice - discountedPrice) / regularPrice) * 100);
}
