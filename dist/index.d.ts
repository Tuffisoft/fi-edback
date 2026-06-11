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
declare function createFeedbackRouteHandler(): {
    POST: RouteHandler;
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
}
interface FeedbackConfig {
    apiPath?: string;
}
interface FeedbackRow extends FeedbackPayload {
    id: string;
    createdAt: Date;
}

export { type FeedbackConfig, type FeedbackPayload, type FeedbackRow, createFeedbackRouteHandler };
