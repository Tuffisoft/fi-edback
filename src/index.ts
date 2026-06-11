// Server-safe entry point.
// Import UI components from 'fi-edback/client' instead.
export { createFeedbackRouteHandler } from "./server/route-handler";
export type { FeedbackPayload, FeedbackConfig, FeedbackRow } from "./lib/types";
