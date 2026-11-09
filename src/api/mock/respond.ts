/**
 * Answers like the backend would: asynchronously, with a copy the caller may change.
 * Each `src/api/<module>.ts` returns `respond(...)` for now; connecting the app replaces that with a `fetch`
 * through the gateway, with the same types.
 */
export function respond<T>(data: T, delayMs = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), delayMs));
}
