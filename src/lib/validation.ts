import { z } from "zod";

export function getFeedbackSchema() {
  return z.object({
    projectSlug: z.string().min(1).max(100),
    pageUrl: z.string().url(),
    x: z.number().finite(),
    y: z.number().finite(),
    message: z.string().min(1, "Message is required").max(2000),
    name: z.string().max(100).optional(),
    email: z
      .string()
      .max(200)
      .refine((v) => v === "" || z.string().email().safeParse(v).success, {
        message: "Must be a valid email address",
      })
      .optional(),
    sessionId: z.string().min(1).max(128),
    userAgent: z.string().max(500).optional(),
    // Honeypot field — must be an empty string; bots fill it in
    website: z.literal(""),
    // Pin color (hex code)
    pinColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color code")
      .optional(),
    // Viewport width for responsive positioning
    viewportWidth: z.number().int().positive().optional(),
    // Device type for filtering
    deviceType: z.enum(["mobile", "tablet", "desktop"]).optional(),
  });
}

export type FeedbackInput = ReturnType<typeof getFeedbackSchema>["_type"];
