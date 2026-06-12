import type { NeonQueryFn } from "./client";
import type { FeedbackPayload, FeedbackRow } from "../types";
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

/**
 * Fetch all feedback for a specific project and page URL.
 * Returns rows ordered by creation date (newest first).
 */
export async function getFeedbackForPage(
  sql: NeonQueryFn,
  projectSlug: string,
  pageUrl: string,
): Promise<FeedbackRow[]> {
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
  
  return rows.map(row => ({
    ...row,
    createdAt: new Date(row.createdAt as string),
  })) as FeedbackRow[];
}

/**
 * Delete a feedback entry by ID.
 * Returns true if a row was deleted, false otherwise.
 */
export async function deleteFeedback(
  sql: NeonQueryFn,
  id: string,
): Promise<boolean> {
  const result = await sql`
    DELETE FROM fi_feedback
    WHERE id = ${id}
  `;
  
  return result.count > 0;
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
