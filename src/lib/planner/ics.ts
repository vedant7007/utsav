import type { Milestone } from "./timeline";
import { addDays } from "./timeline";

/**
 * Escapes text for an iCalendar TEXT value (RFC 5545 section 3.3.11).
 * @param value - raw text.
 */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Folds a content line at 75 octets as RFC 5545 requires, continuing with a leading space.
 * @param line - one unfolded content line.
 */
export function foldIcsLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const charSize = new TextEncoder().encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (size + charSize > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += charSize;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const compact = (isoDate: string) => isoDate.replace(/-/g, "");

/** Short, stable hash so two different plans never share calendar UIDs. */
export function shortHash(value: string): string {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Builds an .ics calendar with one all-day event per milestone, importable into Google
 * Calendar, Outlook and Apple Calendar.
 * @param eventTitle - the celebration's name, used as a prefix.
 * @param milestones - dated milestones.
 * @param stamp - creation timestamp (injected for deterministic tests).
 */
export function buildIcs(
  eventTitle: string,
  milestones: Milestone[],
  stamp: Date = new Date(),
): string {
  const planId = shortHash(eventTitle);
  const dtStamp = stamp
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Utsav//Event Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...milestones.flatMap((milestone) => [
      "BEGIN:VEVENT",
      `UID:${planId}-${milestone.id}-${compact(milestone.date)}@utsav.planner`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${compact(milestone.date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(milestone.date, 1))}`,
      `SUMMARY:${escapeIcsText(`${eventTitle}: ${milestone.title}`)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
