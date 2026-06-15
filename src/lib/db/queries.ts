import type { NeonQueryFn } from "./client";
import type { FeedbackPayload, FeedbackRow, ReactionSummary } from "../types";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS } from "../config";

export async function insertFeedback(
  sql: NeonQueryFn,
  payload: FeedbackPayload,
): Promise<FeedbackRow> {
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
      ip_address,
      pin_color,
      viewport_width,
      device_type
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
      ${payload.ipAddress ?? null},
      ${payload.pinColor ?? "#3b82f6"},
      ${payload.viewportWidth ?? null},
      ${payload.deviceType ?? null}
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
      pin_color as "pinColor",
      viewport_width as "viewportWidth",
      device_type as "deviceType",
      created_at as "createdAt"
  `;

  const row = rows[0];
  return {
    ...row,
    createdAt: new Date(row.createdAt as string),
  } as FeedbackRow;
}

/**
 * Fetch all feedback for a specific project and page URL.
 * Returns rows ordered by creation date (newest first).
 */
export async function getFeedbackForPage(
  sql: NeonQueryFn,
  projectSlug: string,
  pageUrl: string,
  sessionId: string,
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
      pin_color as "pinColor",
      viewport_width as "viewportWidth",
      device_type as "deviceType",
      created_at as "createdAt"
    FROM fi_feedback
    WHERE project_slug = ${projectSlug}
      AND page_url = ${pageUrl}
    ORDER BY created_at DESC
  `;

  const feedback = rows.map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt as string),
  })) as FeedbackRow[];

  // Fetch reactions for all feedback items
  if (feedback.length > 0) {
    const feedbackIds = feedback.map((f) => f.id);
    const reactionsMap = await getReactionsForFeedback(
      sql,
      feedbackIds,
      sessionId,
    );

    for (const item of feedback) {
      item.reactions = reactionsMap.get(item.id) || [];
    }
  }

  return feedback;
}

/**
 * Delete a feedback entry by ID.
 * Returns true if a row was deleted, false otherwise.
 */
export async function deleteFeedback(
  sql: NeonQueryFn,
  id: string,
): Promise<boolean> {
  await sql`
    DELETE FROM fi_feedback
    WHERE id = ${id}
  `;

  // Delete is successful if no error was thrown
  return true;
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

/**
 * Get reaction summaries for multiple feedback items.
 * Returns a map of feedbackId -> ReactionSummary[]
 */
export async function getReactionsForFeedback(
  sql: NeonQueryFn,
  feedbackIds: string[],
  currentSessionId: string,
): Promise<Map<string, ReactionSummary[]>> {
  if (feedbackIds.length === 0) {
    return new Map();
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

  const map = new Map<string, ReactionSummary[]>();

  for (const row of rows) {
    const typed = row as {
      feedbackId: string;
      reaction: string;
      count: number;
      hasReacted: boolean;
    };
    if (!map.has(typed.feedbackId)) {
      map.set(typed.feedbackId, []);
    }
    map.get(typed.feedbackId)!.push({
      reaction: typed.reaction,
      count: typed.count,
      hasReacted: typed.hasReacted,
    });
  }

  return map;
}

/**
 * Toggle a reaction: add if not present, remove if already present.
 * Returns true if added, false if removed.
 */
export async function toggleReaction(
  sql: NeonQueryFn,
  feedbackId: string,
  reaction: string,
  sessionId: string,
): Promise<boolean> {
  // Check if reaction already exists
  const existing = await sql`
    SELECT id
    FROM fi_feedback_reactions
    WHERE feedback_id = ${feedbackId}
      AND reaction = ${reaction}
      AND session_id = ${sessionId}
  `;

  if (existing.length > 0) {
    // Remove reaction
    await sql`
      DELETE FROM fi_feedback_reactions
      WHERE feedback_id = ${feedbackId}
        AND reaction = ${reaction}
        AND session_id = ${sessionId}
    `;
    return false;
  } else {
    // Add reaction
    await sql`
      INSERT INTO fi_feedback_reactions (feedback_id, reaction, session_id)
      VALUES (${feedbackId}, ${reaction}, ${sessionId})
      ON CONFLICT (feedback_id, reaction, session_id) DO NOTHING
    `;
    return true;
  }
}

/**
 * Update the position of a feedback pin.
 */
export async function updateFeedbackPosition(
  sql: NeonQueryFn,
  feedbackId: string,
  x: number,
  y: number,
): Promise<boolean> {
  await sql`
    UPDATE fi_feedback
    SET x = ${x}, y = ${y}
    WHERE id = ${feedbackId}
  `;

  // Update is successful if no error was thrown
  return true;
}

/**
 * Export all feedback for a project as CSV-ready data
 */
export async function exportFeedbackAsCSV(
  sql: NeonQueryFn,
  projectSlug: string,
): Promise<{
  headers: string[];
  rows: string[][];
}> {
  const result = await sql`
    SELECT
      f.id,
      f.page_url,
      f.message,
      f.name,
      f.email,
      f.x,
      f.y,
      f.pin_color,
      f.viewport_width,
      f.device_type,
      f.ip_address,
      f.created_at,
      STRING_AGG(DISTINCT r.reaction, '; ') AS reactions
    FROM fi_feedback f
    LEFT JOIN fi_feedback_reactions r ON f.id = r.feedback_id
    WHERE f.project_slug = ${projectSlug}
    GROUP BY f.id, f.page_url, f.message, f.name, f.email, f.x, f.y,
             f.pin_color, f.viewport_width, f.device_type, f.ip_address, f.created_at
    ORDER BY f.created_at DESC
  `;

  const headers = [
    "ID",
    "Page URL",
    "Message",
    "Name",
    "Email",
    "X Position",
    "Y Position",
    "Pin Color",
    "Viewport Width",
    "Device Type",
    "IP Address",
    "Created At",
    "Reactions",
  ];

  const rows = result.map((row) => [
    row.id,
    row.page_url,
    row.message,
    row.name || "",
    row.email || "",
    row.x.toString(),
    row.y.toString(),
    row.pin_color || "",
    row.viewport_width?.toString() || "",
    row.device_type || "",
    row.ip_address || "",
    new Date(row.created_at).toISOString(),
    row.reactions || "",
  ]);

  return { headers, rows };
}
