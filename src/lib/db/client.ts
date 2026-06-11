import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Lock both generic params to <false, false> — matches the default neon() call
// signature. Using ReturnType<typeof neon> widens the generics to <boolean, boolean>
// which causes a type mismatch when passing the client to queries.ts.
export type NeonQueryFn = NeonQueryFunction<false, false>;

const clientCache = new Map<string, NeonQueryFn>();

export function getNeonClient(databaseUrl: string): NeonQueryFn {
  const cached = clientCache.get(databaseUrl);
  if (cached) return cached;

  const client = neon(databaseUrl) as NeonQueryFn;
  clientCache.set(databaseUrl, client);
  return client;
}
