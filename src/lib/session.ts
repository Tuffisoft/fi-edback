import { SESSION_COOKIE_NAME } from "./config";

function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Returns an existing anonymous session ID from a cookie, or generates and
 * stores a new one. Not HttpOnly so the client can read it before submitting.
 *
 * Must only be called client-side (document must be defined).
 */
export function getOrCreateSessionId(): string {
  if (typeof document === "undefined") return "";

  const cookies = Object.fromEntries(
    document.cookie
      .split("; ")
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf("=");
        return [c.slice(0, idx), c.slice(idx + 1)];
      }),
  );

  const existing = cookies[SESSION_COOKIE_NAME];
  if (existing) return existing;

  const id = generateId();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${SESSION_COOKIE_NAME}=${id}; expires=${expires}; path=/; SameSite=Lax`;
  return id;
}
