import { getFeedbackSchema } from "../lib/validation";
import { getNeonClient } from "../lib/db/client";
import { insertFeedback, isRateLimited } from "../lib/db/queries";

type RouteHandler = (request: Request) => Promise<Response>;

/**
 * Returns a `{ POST }` object ready to be re-exported from a Next.js Route
 * Handler file. The host app creates the file and delegates to this factory —
 * keeping Server Action / Route Handler wiring inside the consuming app while
 * all logic stays in the package.
 *
 * Usage in app/api/fi-edback/route.ts:
 *   import { createFeedbackRouteHandler } from 'fi-edback'
 *   export const { POST } = createFeedbackRouteHandler()
 */
export function createFeedbackRouteHandler(): { POST: RouteHandler } {
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

    const sql = getNeonClient(databaseUrl);

    try {
      const limited = await isRateLimited(sql, parsed.data.sessionId);
      if (limited) {
        return Response.json(
          { error: "Too many submissions — please wait before trying again." },
          { status: 429 },
        );
      }

      await insertFeedback(sql, {
        projectSlug: parsed.data.projectSlug,
        pageUrl: parsed.data.pageUrl,
        x: parsed.data.x,
        y: parsed.data.y,
        message: parsed.data.message,
        name: parsed.data.name,
        email: parsed.data.email || undefined,
        sessionId: parsed.data.sessionId,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });

      return Response.json({ ok: true });
    } catch (error) {
      console.error("[fi-edback] Database error:", error);
      return Response.json(
        { error: "Failed to save feedback" },
        { status: 500 },
      );
    }
  };

  return { POST };
}
