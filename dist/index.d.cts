type RouteHandler = (request: Request) => Promise<Response>;
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
declare function createFeedbackRouteHandler(): {
    GET: RouteHandler;
    POST: RouteHandler;
    PATCH: RouteHandler;
    DELETE: RouteHandler;
};

interface FeedbackPayload {
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
interface FeedbackConfig {
    apiPath?: string;
}
interface FeedbackRow extends FeedbackPayload {
    id: string;
    createdAt: Date;
    reactions?: ReactionSummary[];
}
interface ReactionSummary {
    reaction: string;
    count: number;
    hasReacted: boolean;
}

export { type FeedbackConfig, type FeedbackPayload, type FeedbackRow, createFeedbackRouteHandler };
