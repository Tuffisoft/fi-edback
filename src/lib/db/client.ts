import type { NeonQueryFunction } from "@neondatabase/serverless";

export type NeonQueryFn = NeonQueryFunction<false, false>;

const clientCache = new Map<string, NeonQueryFn>();

export async function getNeonClient(databaseUrl: string): Promise<NeonQueryFn> {
  const cached = clientCache.get(databaseUrl);
  if (cached) return cached;

  const { neon } = await import("@neondatabase/serverless");
  const client = neon(databaseUrl) as NeonQueryFn;
  clientCache.set(databaseUrl, client);
  return client;
}
