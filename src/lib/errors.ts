/**
 * Extracts a human-readable message from any thrown value.
 * @param error - whatever was caught.
 * @param fallback - message used when nothing useful can be read.
 */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

/** True when an operation was cancelled through an AbortController. */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Reads an HTTP status code from an SDK error, if it carries one.
 * @param error - whatever was caught.
 */
export function errorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const { status } = error;
  return typeof status === "number" ? status : undefined;
}

/** True when an operation hit a timeout or was aborted. */
export function isTimeoutOrAbort(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}
