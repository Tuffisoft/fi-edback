import { z } from "zod";

export const feedbackSchema = z.object({
  projectSlug: z.string().min(1).max(100),
  pageUrl: z.string().url(),
  x: z.number().finite(),
  y: z.number().finite(),
  message: z.string().min(1, "Message is required").max(2000),
  name: z.string().max(100).optional(),
  // Allow empty string (user cleared the field) or a valid email
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
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
