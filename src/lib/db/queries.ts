import type { NeonQueryFn } from "./client";
import type { FeedbackPayload } from "../types";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS } from "../config";

export async function insertFeedback(
  sql: NeonQueryFn,
  payload: FeedbackPayload,
): Promise<void> {
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

/**
 * Returns true if the session has exceeded the rate limit.
 * Uses a DB query against fi_feedback so no external state store is needed —
 * safe for serverless environments where in-memory state is not shared.
 */
export async function isRateLimited(
  sql: NeonQueryFn,
  sessionId: string,
): Promise<boolean> {
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000,
  ).toISOString();

  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM fi_feedback
    WHERE session_id = ${sessionId}
      AND created_at > ${windowStart}::timestamptz
  `;

  const count = (rows[0] as { count: number }).count;
  return count >= RATE_LIMIT_MAX;
}
