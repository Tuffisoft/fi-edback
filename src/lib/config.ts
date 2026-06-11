/** The route path the host app must register at app/api/fi-edback/route.ts */
export const API_PATH = "/api/fi-edback";

/** Cookie name for the anonymous session identifier */
export const SESSION_COOKIE_NAME = "fi_session";

/** Max submissions allowed per session within the rate-limit window */
export const RATE_LIMIT_MAX = 5;

/** Rate-limit window in seconds */
export const RATE_LIMIT_WINDOW_SECONDS = 60;
