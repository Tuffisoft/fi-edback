// This file is the reference implementation for how a host app registers the
// fi-edback route handler. Copy this file verbatim into your project at:
//   app/api/fi-edback/route.ts
import { createFeedbackRouteHandler } from "fi-edback";

export const { POST } = createFeedbackRouteHandler();
