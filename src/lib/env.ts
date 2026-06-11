/** Returns true only when the feedback widget is explicitly enabled. */
export function isEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_FEEDBACK === "true";
}

/** Returns the project slug that tags all feedback rows, or null if unset. */
export function getProjectSlug(): string | null {
  return process.env.NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG ?? null;
}

/** Returns the Neon pooled DATABASE_URL (server-only), or null if unset. */
export function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL ?? null;
}
