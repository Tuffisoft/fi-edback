"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  createFeedbackRouteHandler: () => createFeedbackRouteHandler
});
module.exports = __toCommonJS(src_exports);

// src/lib/validation.ts
var import_zod = require("zod");
function getFeedbackSchema() {
  return import_zod.z.object({
    projectSlug: import_zod.z.string().min(1).max(100),
    pageUrl: import_zod.z.string().url(),
    x: import_zod.z.number().finite(),
    y: import_zod.z.number().finite(),
    message: import_zod.z.string().min(1, "Message is required").max(2e3),
    name: import_zod.z.string().max(100).optional(),
    email: import_zod.z.string().max(200).refine((v) => v === "" || import_zod.z.string().email().safeParse(v).success, {
      message: "Must be a valid email address"
    }).optional(),
    sessionId: import_zod.z.string().min(1).max(128),
    userAgent: import_zod.z.string().max(500).optional(),
    // Honeypot field — must be an empty string; bots fill it in
    website: import_zod.z.literal("")
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
  `;
}
async function getFeedbackForPage(sql, projectSlug, pageUrl) {
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
  return rows.map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt)
  }));
}
async function deleteFeedback(sql, id) {
  const result = await sql`
    DELETE FROM fi_feedback
    WHERE id = ${id}
  `;
  return result.count > 0;
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
    if (!projectSlug || !pageUrl) {
      return Response.json(
        { error: "Missing projectSlug or pageUrl query parameter" },
        { status: 400 }
      );
    }
    const sql = await getNeonClient(databaseUrl);
    try {
      const feedback = await getFeedbackForPage(sql, projectSlug, pageUrl);
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
      await insertFeedback(sql, {
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
      return Response.json({ ok: true });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to save feedback" },
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
      const deleted = await deleteFeedback(sql, id);
      if (!deleted) {
        return Response.json({ error: "Feedback not found" }, { status: 404 });
      }
      return Response.json({ ok: true });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to delete feedback" },
        { status: 500 }
      );
    }
  };
  return { GET, POST, DELETE };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createFeedbackRouteHandler
});
