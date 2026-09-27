import { z } from "zod";

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100, "Password must be under 100 characters.")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
  .regex(/[^A-Za-z0-9\s]/, "Password must include at least one symbol.");
