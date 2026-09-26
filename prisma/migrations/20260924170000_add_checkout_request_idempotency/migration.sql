ALTER TABLE "Order"
ADD COLUMN "checkoutRequestKey" TEXT,
ADD COLUMN "checkoutRequestHash" TEXT;

CREATE UNIQUE INDEX "Order_checkoutRequestKey_key"
ON "Order"("checkoutRequestKey");
