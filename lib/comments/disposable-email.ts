import { isDisposableEmail as fakeoutCheck } from "fakeout";

/**
 * Disposable-email gate, ported from PMEngineerLK-NextJS
 * (`lib/validation/email.ts`), which also uses the `fakeout` package.
 *
 * `fakeout` ships a ~5k-domain blocklist and answers synchronously, so the
 * only thing to optimise here is the per-process memo.
 */
const domainCache = new Map<string, boolean>();

/** True when `email` belongs to a known throwaway provider. Fails open. */
export function isDisposableEmail(email: string): boolean {
  try {
    const domain = email.split("@").pop()?.toLowerCase();
    if (!domain) return false;

    const cached = domainCache.get(domain);
    if (cached !== undefined) return cached;

    const result = fakeoutCheck(email);
    domainCache.set(domain, result);
    return result;
  } catch (error) {
    console.error("[comments] disposable-email check failed:", error);
    return false;
  }
}
