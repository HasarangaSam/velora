-- These short-lived values were previously stored in plaintext. Revoke them
-- during the transition to HMAC-digested verification/reset credentials.
DELETE FROM "VerificationCode";
DELETE FROM "PasswordResetToken";

ALTER TABLE "VerificationCode"
ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
