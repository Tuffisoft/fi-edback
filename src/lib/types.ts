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
}

export interface FeedbackConfig {
  apiPath?: string;
}

export interface FeedbackRow extends FeedbackPayload {
  id: string;
  createdAt: Date;
}
