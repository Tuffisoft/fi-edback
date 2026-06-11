import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS
} from "./chunk-SSW72WGR.js";

// src/lib/validation.ts
import { z } from "zod";
function getFeedbackSchema() {
  return z.object({
    projectSlug: z.string().min(1).max(100),
    pageUrl: z.string().url(),
    x: z.number().finite(),
    y: z.number().finite(),
    message: z.string().min(1, "Message is required").max(2e3),
    name: z.string().max(100).optional(),
    // Allow empty string (user cleared the field) or a valid email
    email: z.string().max(200).refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Must be a valid email address"
    }).optional(),
    sessionId: z.string().min(1).max(128),
    userAgent: z.string().max(500).optional(),
    // Honeypot field — must be an empty string; bots fill it in
    website: z.literal("")
  });
}

// src/lib/db/client.ts
import { neon } from "@neondatabase/serverless";
var clientCache = /* @__PURE__ */ new Map();
function getNeonClient(databaseUrl) {
  const cached = clientCache.get(databaseUrl);
  if (cached) return cached;
  const client = neon(databaseUrl);
  clientCache.set(databaseUrl, client);
  return client;
}

// src/lib/db/queries.ts
async function insertFeedback(sql, payload) {
  await sql`
    INSERT INTO fi_feedback (
      project_slug,
      page_url,
      x,
      y,
      message,
      name,
      email,
      session_id,
      user_agent
    ) VALUES (
      ${payload.projectSlug},
      ${payload.pageUrl},
      ${payload.x},
      ${payload.y},
      ${payload.message},
      ${payload.name ?? null},
      ${payload.email ?? null},
      ${payload.sessionId},
      ${payload.userAgent ?? null}
    )
  `;
}
async function isRateLimited(sql, sessionId) {
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1e3
  ).toISOString();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM fi_feedback
    WHERE session_id = ${sessionId}
      AND created_at > ${windowStart}::timestamptz
  `;
  const count = rows[0].count;
  return count >= RATE_LIMIT_MAX;
}

// src/server/route-handler.ts
function createFeedbackRouteHandler() {
  const POST = async (request) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("[fi-edback] DATABASE_URL is not set");
      return Response.json({ error: "Server misconfigured" }, { status: 500 });
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = getFeedbackSchema().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Validation failed",
          issues: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }
    if (body.website !== "") {
      return Response.json({ ok: true });
    }
    const sql = getNeonClient(databaseUrl);
    try {
      const limited = await isRateLimited(sql, parsed.data.sessionId);
      if (limited) {
        return Response.json(
          { error: "Too many submissions \u2014 please wait before trying again." },
          { status: 429 }
        );
      }
      await insertFeedback(sql, {
        projectSlug: parsed.data.projectSlug,
        pageUrl: parsed.data.pageUrl,
        x: parsed.data.x,
        y: parsed.data.y,
        message: parsed.data.message,
        name: parsed.data.name,
        email: parsed.data.email || void 0,
        sessionId: parsed.data.sessionId,
        userAgent: request.headers.get("user-agent") ?? void 0
      });
      return Response.json({ ok: true });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }
  };
  return { POST };
}
export {
  createFeedbackRouteHandler
};
