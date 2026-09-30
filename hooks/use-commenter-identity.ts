"use client";

import { useCallback, useState } from "react";
import {
  clearIdentityCookie,
  readIdentityCookie,
  writeIdentityCookie,
} from "@/lib/comments/identity-cookie";
import type { CommenterIdentity } from "@/lib/comments/types";

/**
 * Guest commenter identity, backed by the `pm_commenter` cookie.
 *
 * The cookie is read on demand (never during the server render, so there is no
 * hydration mismatch) and written whenever the visitor saves or changes their
 * details. `clear()` forgets them so they can comment as someone else.
 */
export function useCommenterIdentity() {
  const [identity, setIdentity] = useState<CommenterIdentity | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /** Lazily pulls the stored identity into state. Idempotent. */
  const hydrate = useCallback((): CommenterIdentity | null => {
    const stored = readIdentityCookie();
    setHydrated(true);
    setIdentity(stored);
    return stored;
  }, []);

  const save = useCallback((next: CommenterIdentity) => {
    writeIdentityCookie(next);
    setIdentity(next);
    setHydrated(true);
  }, []);

  const clear = useCallback(() => {
    clearIdentityCookie();
    setIdentity(null);
    setHydrated(true);
  }, []);

  return { identity, hydrated, hydrate, save, clear };
}
