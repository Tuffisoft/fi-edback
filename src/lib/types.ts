export interface FeedbackPayload {
  projectSlug: string;
  pageUrl: string;
  /** Document-relative X coordinate (clientX + scrollX) */
  x: number;
  /** Document-relative Y coordinate (clientY + scrollY) */
  y: number;
  message: string;
  name?: string;
  email?: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  /** Hex color code for pin (e.g., #3b82f6) */
  pinColor?: string;
  /** Viewport width when feedback was submitted */
  viewportWidth?: number;
  /** Device type: mobile, tablet, or desktop */
  deviceType?: "mobile" | "tablet" | "desktop";
}

export interface FeedbackConfig {
  apiPath?: string;
}

export interface FeedbackRow extends FeedbackPayload {
  id: string;
  createdAt: Date;
  reactions?: ReactionSummary[];
}

export interface Reaction {
  id: string;
  feedbackId: string;
  reaction: string;
  sessionId: string;
  createdAt: Date;
}

export interface ReactionSummary {
  reaction: string;
  count: number;
  hasReacted: boolean; // true if current session has reacted with this type
}
