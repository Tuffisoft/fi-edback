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
var clientCache = /* @__PURE__ */ new Map();
async function getNeonClient(databaseUrl) {
  const cached = clientCache.get(databaseUrl);
  if (cached) return cached;
  const { neon } = await import("@neondatabase/serverless");
  const client = neon(databaseUrl);
  clientCache.set(databaseUrl, client);
  return client;
}

// src/lib/config.ts
var RATE_LIMIT_MAX = 5;
var RATE_LIMIT_WINDOW_SECONDS = 60;

// src/lib/db/queries.ts
async function insertFeedback(sql, payload) {
  const rows = await sql`
    INSERT INTO fi_feedback (
      project_slug,
      page_url,
      x,
      y,
      message,
      name,
      email,
      session_id,
      user_agent,
      ip_address
    ) VALUES (
      ${payload.projectSlug},
      ${payload.pageUrl},
      ${payload.x},
      ${payload.y},
      ${payload.message},
      ${payload.name ?? null},
      ${payload.email ?? null},
      ${payload.sessionId},
      ${payload.userAgent ?? null},
      ${payload.ipAddress ?? null}
    )
    RETURNING
      id,
      project_slug as "projectSlug",
      page_url as "pageUrl",
      x,
      y,
      message,
      name,
      email,
      session_id as "sessionId",
      user_agent as "userAgent",
      ip_address as "ipAddress",
      created_at as "createdAt"
  `;
  const row = rows[0];
  return {
    ...row,
    createdAt: new Date(row.createdAt)
  };
}
async function getFeedbackForPage(sql, projectSlug, pageUrl, sessionId) {
  const rows = await sql`
    SELECT 
      id,
      project_slug as "projectSlug",
      page_url as "pageUrl",
      x,
      y,
      message,
      name,
      email,
      session_id as "sessionId",
      user_agent as "userAgent",
      ip_address as "ipAddress",
      created_at as "createdAt"
    FROM fi_feedback
    WHERE project_slug = ${projectSlug}
      AND page_url = ${pageUrl}
    ORDER BY created_at DESC
  `;
  const feedback = rows.map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt)
  }));
  if (feedback.length > 0) {
    const feedbackIds = feedback.map((f) => f.id);
    const reactionsMap = await getReactionsForFeedback(
      sql,
      feedbackIds,
      sessionId
    );
    for (const item of feedback) {
      item.reactions = reactionsMap.get(item.id) || [];
    }
  }
  return feedback;
}
async function deleteFeedback(sql, id) {
  await sql`
    DELETE FROM fi_feedback
    WHERE id = ${id}
  `;
  return true;
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
async function getReactionsForFeedback(sql, feedbackIds, currentSessionId) {
  if (feedbackIds.length === 0) {
    return /* @__PURE__ */ new Map();
  }
  const rows = await sql`
    SELECT 
      feedback_id as "feedbackId",
      reaction,
      COUNT(*)::int as count,
      BOOL_OR(session_id = ${currentSessionId}) as "hasReacted"
    FROM fi_feedback_reactions
    WHERE feedback_id = ANY(${feedbackIds})
    GROUP BY feedback_id, reaction
    ORDER BY count DESC
  `;
  const map = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const typed = row;
    if (!map.has(typed.feedbackId)) {
      map.set(typed.feedbackId, []);
    }
    map.get(typed.feedbackId).push({
      reaction: typed.reaction,
      count: typed.count,
      hasReacted: typed.hasReacted
    });
  }
  return map;
}
async function toggleReaction(sql, feedbackId, reaction, sessionId) {
  const existing = await sql`
    SELECT id
    FROM fi_feedback_reactions
    WHERE feedback_id = ${feedbackId}
      AND reaction = ${reaction}
      AND session_id = ${sessionId}
  `;
  if (existing.length > 0) {
    await sql`
      DELETE FROM fi_feedback_reactions
      WHERE feedback_id = ${feedbackId}
        AND reaction = ${reaction}
        AND session_id = ${sessionId}
    `;
    return false;
  } else {
    await sql`
      INSERT INTO fi_feedback_reactions (feedback_id, reaction, session_id)
      VALUES (${feedbackId}, ${reaction}, ${sessionId})
      ON CONFLICT (feedback_id, reaction, session_id) DO NOTHING
    `;
    return true;
  }
}
async function updateFeedbackPosition(sql, feedbackId, x, y) {
  await sql`
    UPDATE fi_feedback
    SET x = ${x}, y = ${y}
    WHERE id = ${feedbackId}
  `;
  return true;
}

// src/server/route-handler.ts
function getIpAddress(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? void 0;
}
function createFeedbackRouteHandler() {
  const GET = async (request) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("[fi-edback] DATABASE_URL is not set");
      return Response.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const url = new URL(request.url);
    const projectSlug = url.searchParams.get("projectSlug");
    const pageUrl = url.searchParams.get("pageUrl");
    const sessionId = url.searchParams.get("sessionId") || "";
    if (!projectSlug || !pageUrl) {
      return Response.json(
        { error: "Missing projectSlug or pageUrl query parameter" },
        { status: 400 }
      );
    }
    const sql = await getNeonClient(databaseUrl);
    try {
      const feedback = await getFeedbackForPage(
        sql,
        projectSlug,
        pageUrl,
        sessionId
      );
      return Response.json({ feedback });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to fetch feedback" },
        { status: 500 }
      );
    }
  };
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
    const sql = await getNeonClient(databaseUrl);
    try {
      const limited = await isRateLimited(sql, parsed.data.sessionId);
      if (limited) {
        return Response.json(
          { error: "Too many submissions \u2014 please wait before trying again." },
          { status: 429 }
        );
      }
      const feedback = await insertFeedback(sql, {
        projectSlug: parsed.data.projectSlug,
        pageUrl: parsed.data.pageUrl,
        x: parsed.data.x,
        y: parsed.data.y,
        message: parsed.data.message,
        name: parsed.data.name,
        email: parsed.data.email || void 0,
        sessionId: parsed.data.sessionId,
        userAgent: request.headers.get("user-agent") ?? void 0,
        ipAddress: getIpAddress(request)
      });
      return Response.json({ feedback });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }
  };
  const PATCH = async (request) => {
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
    const bodyObj = body;
    const sql = await getNeonClient(databaseUrl);
    if (typeof bodyObj.x === "number" && typeof bodyObj.y === "number") {
      const { feedbackId: feedbackId2, x, y } = bodyObj;
      if (!feedbackId2) {
        return Response.json({ error: "Missing feedbackId" }, { status: 400 });
      }
      try {
        await updateFeedbackPosition(sql, feedbackId2, x, y);
        return Response.json({ ok: true });
      } catch (error) {
        console.error("[fi-edback] Database error:", error);
        return Response.json(
          { error: "Failed to update position" },
          { status: 500 }
        );
      }
    }
    const { feedbackId, reaction, sessionId } = bodyObj;
    if (!feedbackId || !reaction || !sessionId) {
      return Response.json(
        { error: "Missing feedbackId, reaction, or sessionId" },
        { status: 400 }
      );
    }
    try {
      const added = await toggleReaction(sql, feedbackId, reaction, sessionId);
      return Response.json({ added });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to toggle reaction" },
        { status: 500 }
      );
    }
  };
  const DELETE = async (request) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("[fi-edback] DATABASE_URL is not set");
      return Response.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return Response.json(
        { error: "Missing id query parameter" },
        { status: 400 }
      );
    }
    const sql = await getNeonClient(databaseUrl);
    try {
      await deleteFeedback(sql, id);
      return Response.json({ ok: true });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to delete feedback" },
        { status: 500 }
      );
    }
  };
  return { GET, POST, PATCH, DELETE };
}
export {
  createFeedbackRouteHandler
};
