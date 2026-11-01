type Level = "warn" | "error";

/** Fields attached to a log line. Never pass secrets or user free text here. */
export type LogFields = Record<string, string | number | boolean | undefined>;

/**
 * Writes one structured JSON log line, which hosting platforms index and filter. Only warnings
 * and errors are emitted; they go to stderr through console.warn and console.error.
 */
function write(level: Level, event: string, fields: LogFields): void {
  const line = JSON.stringify({ level, event, ...fields, time: new Date().toISOString() });
  if (level === "error") console.error(line);
  else console.warn(line);
}

/** Minimal structured logger for server code. */
export const logger = {
  warn: (event: string, fields: LogFields = {}) => write("warn", event, fields),
  error: (event: string, fields: LogFields = {}) => write("error", event, fields),
};
