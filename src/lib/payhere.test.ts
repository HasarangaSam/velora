import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  generatePayHereNotificationSignature,
  verifyPayHereSignature,
} from "./payhere";

describe("PayHere notification signature", () => {
  beforeEach(() => {
    vi.stubEnv("PAYHERE_MERCHANT_ID", "test-merchant");
    vi.stubEnv("PAYHERE_MERCHANT_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const notification = {
    orderId: "VEL-1001",
    amount: "12500.00",
    currency: "LKR",
    statusCode: "2",
  };

  it("accepts a valid notification signature", () => {
    const signature = generatePayHereNotificationSignature(notification);

    expect(verifyPayHereSignature(signature, signature)).toBe(true);
    expect(verifyPayHereSignature(signature.toLowerCase(), signature)).toBe(true);
  });

  it("rejects a modified signature and a different-length signature", () => {
    const signature = generatePayHereNotificationSignature(notification);

    expect(verifyPayHereSignature(`${signature.slice(0, -1)}0`, signature)).toBe(
      false,
    );
    expect(verifyPayHereSignature("invalid", signature)).toBe(false);
  });

  it("produces a different signature when a signed payment field changes", () => {
    const signature = generatePayHereNotificationSignature(notification);
    const changedSignature = generatePayHereNotificationSignature({
      ...notification,
      statusCode: "-1",
    });

    expect(verifyPayHereSignature(changedSignature, signature)).toBe(false);
  });
});
