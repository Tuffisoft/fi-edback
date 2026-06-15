import { getFeedbackSchema } from "../lib/validation";
import { getNeonClient } from "../lib/db/client";
import {
  insertFeedback,
  isRateLimited,
  getFeedbackForPage,
  deleteFeedback,
  toggleReaction,
  updateFeedbackPosition,
  exportFeedbackAsCSV,
} from "../lib/db/queries";

type RouteHandler = (request: Request) => Promise<Response>;

/**
 * Extract IP address from request headers.
 * Vercel and most reverse proxies set x-forwarded-for.
 */
function getIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first one
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? undefined;
}

/**
 * Returns a `{ GET, POST, DELETE }` object ready to be re-exported from a
 * Next.js Route Handler file. The host app creates the file and delegates to
 * this factory — keeping Server Action / Route Handler wiring inside the
 * consuming app while all logic stays in the package.
 *
 * Usage in app/api/fi-edback/route.ts:
 *   import { createFeedbackRouteHandler } from 'fi-edback'
 *   export const { GET, POST, DELETE } = createFeedbackRouteHandler()
 */
export function createFeedbackRouteHandler(): {
  GET: RouteHandler;
  POST: RouteHandler;
  PATCH: RouteHandler;
  DELETE: RouteHandler;
} {
  const GET: RouteHandler = async (request) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("[fi-edback] DATABASE_URL is not set");
      return Response.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const url = new URL(request.url);
    const projectSlug = url.searchParams.get("projectSlug");
    const pageUrl = url.searchParams.get("pageUrl");
    const sessionId = url.searchParams.get("sessionId") || "";
    const format = url.searchParams.get("format");

    // CSV export endpoint
    if (format === "csv") {
      if (!projectSlug) {
        return Response.json(
          { error: "Missing projectSlug query parameter" },
          { status: 400 },
        );
      }

      const sql = await getNeonClient(databaseUrl);

      try {
        const { headers, rows } = await exportFeedbackAsCSV(sql, projectSlug);

        // Helper to escape and quote CSV values - accepts any type
        const escapeCSV = (value: any): string => {
          // Convert everything to string, handle null/undefined
          const strValue = String(value ?? "");
          // Escape existing double quotes by doubling them
          const escaped = strValue.replace(/"/g, '""');
          // Always wrap in double quotes
          return `"${escaped}"`;
        };

        // Generate CSV content with Windows line endings for Excel compatibility
        const csvLines = [
          headers.map(escapeCSV).join(","),
          ...rows.map((row) => row.map(escapeCSV).join(",")),
        ];

        // Add UTF-8 BOM and sep directive for Excel compatibility (especially German/European locales)
        const csvContent = "\uFEFF" + "sep=,\r\n" + csvLines.join("\r\n");

        // Return CSV file
        return new Response(csvContent, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="feedback-${projectSlug}-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      } catch (error) {
        console.error("[fi-edback] Export error:", error);
        return Response.json(
          { error: "Failed to export feedback" },
          { status: 500 },
        );
      }
    }

    // Standard feedback fetch endpoint
    if (!projectSlug || !pageUrl) {
      return Response.json(
        { error: "Missing projectSlug or pageUrl query parameter" },
        { status: 400 },
      );
    }

    const sql = await getNeonClient(databaseUrl);

    try {
      const feedback = await getFeedbackForPage(
        sql,
        projectSlug,
        pageUrl,
        sessionId,
      );
      return Response.json({ feedback });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to fetch feedback" },
        { status: 500 },
      );
    }
  };

  const POST: RouteHandler = async (request) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("[fi-edback] DATABASE_URL is not set");
      return Response.json({ error: "Server misconfigured" }, { status: 500 });
    }

    let body: unknown;
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
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // Honeypot: if the hidden field was filled in, silently accept to avoid
    // leaking the honeypot strategy to bots, but do not save anything.
    if ((body as Record<string, unknown>).website !== "") {
      return Response.json({ ok: true });
    }

    const sql = await getNeonClient(databaseUrl);

    try {
      const limited = await isRateLimited(sql, parsed.data.sessionId);
      if (limited) {
        return Response.json(
          { error: "Too many submissions — please wait before trying again." },
          { status: 429 },
        );
      }

      const feedback = await insertFeedback(sql, {
        projectSlug: parsed.data.projectSlug,
        pageUrl: parsed.data.pageUrl,
        x: parsed.data.x,
        y: parsed.data.y,
        message: parsed.data.message,
        name: parsed.data.name,
        email: parsed.data.email || undefined,
        sessionId: parsed.data.sessionId,
        userAgent: request.headers.get("user-agent") ?? undefined,
        ipAddress: getIpAddress(request),
        pinColor: parsed.data.pinColor,
        viewportWidth: parsed.data.viewportWidth,
        deviceType: parsed.data.deviceType,
      });

      return Response.json({ feedback });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to save feedback" },
        { status: 500 },
      );
    }
  };

  const PATCH: RouteHandler = async (request) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("[fi-edback] DATABASE_URL is not set");
      return Response.json({ error: "Server misconfigured" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const bodyObj = body as Record<string, unknown>;
    const sql = await getNeonClient(databaseUrl);

    // Handle position update (has x and y fields)
    if (typeof bodyObj.x === "number" && typeof bodyObj.y === "number") {
      const { feedbackId, x, y } = bodyObj as {
        feedbackId: string;
        x: number;
        y: number;
      };

      if (!feedbackId) {
        return Response.json({ error: "Missing feedbackId" }, { status: 400 });
      }

      try {
        await updateFeedbackPosition(sql, feedbackId, x, y);
        return Response.json({ ok: true });
      } catch (error) {
        console.error("[fi-edback] Database error:", error);
        return Response.json(
          { error: "Failed to update position" },
          { status: 500 },
        );
      }
    }

    // Handle reaction toggle (has reaction field)
    const { feedbackId, reaction, sessionId } = bodyObj as Record<
      string,
      string
    >;

    if (!feedbackId || !reaction || !sessionId) {
      return Response.json(
        { error: "Missing feedbackId, reaction, or sessionId" },
        { status: 400 },
      );
    }

    try {
      const added = await toggleReaction(sql, feedbackId, reaction, sessionId);
      return Response.json({ added });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to toggle reaction" },
        { status: 500 },
      );
    }
  };

  const DELETE: RouteHandler = async (request) => {
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
        { status: 400 },
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
        { status: 500 },
      );
    }
  };

  return { GET, POST, PATCH, DELETE };
}
