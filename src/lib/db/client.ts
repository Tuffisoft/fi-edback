import { NeonQueryFunction } from "@neondatabase/serverless";

export type NeonQueryFn = NeonQueryFunction<false, false>;

const clientCache = new Map<string, NeonQueryFn>();

/**
 * neon() is imported dynamically to avoid a static top-level ESM import.
 * Turbopack evaluates static imports at bundle time — even with
 * @neondatabase/serverless in serverExternalPackages, the static
 * `import { neon }` causes `(void 0) is not a function` during server
 * chunk evaluation. Dynamic import defers loading until first request.
 */
export async function getNeonClient(databaseUrl: string): Promise<NeonQueryFn> {
  const cached = clientCache.get(databaseUrl);
  if (cached) return cached;

  const { neon } = await import("@neondatabase/serverless");
  const client = neon(databaseUrl) as NeonQueryFn;
  clientCache.set(databaseUrl, client);
  return client;
}
