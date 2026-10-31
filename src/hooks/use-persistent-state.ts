"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * React state mirrored to localStorage. Reads happen after mount to keep server and client
 * renders identical; storage errors (private mode, quota) are ignored so the app keeps working.
 * @param key - storage key.
 * @param initial - value used before hydration and when storage is empty or invalid.
 * @param validate - turns unknown stored JSON into a trusted value, or null to reject it.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  validate: (value: unknown) => T | null,
): [T, (next: T | ((previous: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed = validate(JSON.parse(raw));
        // Restoring persisted state after mount is the intended effect here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed !== null) setValue(parsed);
      }
    } catch {
      // Corrupt or inaccessible storage: start fresh.
    }
    setHydrated(true);
    // validate is expected to be stable for a given key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(previous) : next;
        try {
          if (resolved === null || resolved === undefined) window.localStorage.removeItem(key);
          else window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage full or blocked: keep the in-memory value.
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update, hydrated];
}
