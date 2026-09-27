import { describe, expect, it } from "vitest";
import { strongPasswordSchema } from "./password";

describe("strongPasswordSchema", () => {
  it("accepts a password at the minimum length with uppercase and symbol", () => {
    expect(strongPasswordSchema.safeParse("Abcdef1!").success).toBe(true);
  });

  it.each([
    ["short", "Abc1!"],
    ["missing uppercase", "abcdef1!"],
    ["missing symbol", "Abcdef12"],
    ["too long", `A${"a".repeat(99)}!`],
  ])("rejects a password that is %s", (_reason, password) => {
    expect(strongPasswordSchema.safeParse(password).success).toBe(false);
  });
});
