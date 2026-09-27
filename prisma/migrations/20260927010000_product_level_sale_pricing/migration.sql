-- Product prices are shared across all size/colour variants. Existing products
-- with inconsistent variant prices are migrated to their lowest variant price.
ALTER TABLE "Product" ADD COLUMN "price" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "salePrice" DECIMAL(10,2);

UPDATE "Product" AS product
SET "price" = prices.minimum_price
FROM (
  SELECT "productId", MIN("price") AS minimum_price
  FROM "ProductVariant"
  GROUP BY "productId"
) AS prices
WHERE product."id" = prices."productId";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Product" WHERE "price" IS NULL) THEN
    RAISE EXCEPTION 'Cannot migrate product pricing: at least one product has no variants and needs a regular price.';
  END IF;
END $$;

ALTER TABLE "Product" ALTER COLUMN "price" SET NOT NULL;
ALTER TABLE "ProductVariant" DROP COLUMN "price";
ALTER TABLE "Product" ADD CONSTRAINT "Product_salePrice_less_than_price_check"
  CHECK ("salePrice" IS NULL OR ("salePrice" > 0 AND "salePrice" < "price"));
