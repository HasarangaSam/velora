INSERT INTO "Coupon" (
    "id",
    "code",
    "discountType",
    "discountValue",
    "minimumOrderValue",
    "maximumDiscount",
    "usageLimit",
    "perUserLimit",
    "usedCount",
    "status",
    "startsAt",
    "expiresAt",
    "createdAt",
    "updatedAt"
)
VALUES (
    'welcome500-first-order',
    'WELCOME500',
    'FIXED',
    500,
    3000,
    NULL,
    NULL,
    1,
    0,
    'ACTIVE',
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO UPDATE SET
    "discountType" = EXCLUDED."discountType",
    "discountValue" = EXCLUDED."discountValue",
    "minimumOrderValue" = EXCLUDED."minimumOrderValue",
    "maximumDiscount" = EXCLUDED."maximumDiscount",
    "usageLimit" = EXCLUDED."usageLimit",
    "perUserLimit" = EXCLUDED."perUserLimit",
    "status" = 'ACTIVE',
    "startsAt" = NULL,
    "expiresAt" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP;
