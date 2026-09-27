export type ProductPriceValues = {
  price: number | string | { toString(): string };
  salePrice?: number | string | { toString(): string } | null;
};

export function getCurrentPrice({ price, salePrice }: ProductPriceValues): number {
  const regularPrice = Number(price);
  const discountedPrice = salePrice == null ? null : Number(salePrice);

  return discountedPrice !== null && Number.isFinite(discountedPrice) && discountedPrice > 0 && discountedPrice < regularPrice
    ? discountedPrice
    : regularPrice;
}

export function getDiscountPercent({ price, salePrice }: ProductPriceValues): number | null {
  if (salePrice == null) return null;
  const regularPrice = Number(price);
  const discountedPrice = Number(salePrice);
  if (!Number.isFinite(regularPrice) || regularPrice <= 0 || !Number.isFinite(discountedPrice) || discountedPrice <= 0 || discountedPrice >= regularPrice) return null;
  return Math.round(((regularPrice - discountedPrice) / regularPrice) * 100);
}
