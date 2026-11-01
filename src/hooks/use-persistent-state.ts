"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Update<T> = T | ((previous: T) => T);

function isUpdater<T>(next: Update<T>): next is (previous: T) => T {
  return typeof next === "function";
}

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
): [T, (next: Update<T>) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  // The validator is read once per key; holding it in a ref keeps the effect keyed on `key` only.
  const validateRef = useRef(validate);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed = validateRef.current(JSON.parse(raw));
        // Restoring persisted state after mount keeps server and client renders identical.
        if (parsed !== null) setValue(parsed);
      }
    } catch {
      // Corrupt or inaccessible storage: start fresh.
    }
    setHydrated(true);
  }, [key]);

  const update = useCallback(
    (next: Update<T>) => {
      setValue((previous) => {
        const resolved = isUpdater(next) ? next(previous) : next;
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
