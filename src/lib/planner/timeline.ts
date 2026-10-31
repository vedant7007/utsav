import { type EventType, LARGE_EVENT_GUESTS } from "./constants";

const MS_PER_DAY = 86_400_000;

export type MilestonePhase = "early" | "build-up" | "final-week" | "event-day" | "after";

export interface Milestone {
  id: string;
  title: string;
  /** Planned lead time before the event, from the template. Negative means after. */
  daysBefore: number;
  /** Scheduled calendar date, YYYY-MM-DD. */
  date: string;
  phase: MilestonePhase;
  /** True when the ideal lead time had already passed and the task was pulled forward. */
  rushed: boolean;
  source: "template" | "ai";
}

export interface TimelinePlan {
  milestones: Milestone[];
  daysUntil: number;
  compressed: boolean;
}

interface MilestoneTemplate {
  id: string;
  title: string;
  daysBefore: number;
  minGuests?: number;
}

const SHARED_END: MilestoneTemplate[] = [
  { id: "confirm-vendors", title: "Reconfirm every vendor's timing and contact", daysBefore: 2 },
  { id: "day-of", title: "Event day: run sheet in hand, enjoy the moment", daysBefore: 0 },
  { id: "thank-you", title: "Send thank-you notes and settle final invoices", daysBefore: -3 },
];

export const TIMELINE_TEMPLATES: Record<EventType, MilestoneTemplate[]> = {
  wedding: [
    { id: "budget", title: "Agree the budget and guest list with both families", daysBefore: 240 },
    { id: "venue", title: "Shortlist and book the venue", daysBefore: 210 },
    { id: "muhurat", title: "Fix the muhurat and the ceremony schedule", daysBefore: 200 },
    { id: "photo", title: "Book photographer and videographer", daysBefore: 180 },
    { id: "caterer", title: "Book caterer and plan menu tastings", daysBefore: 150 },
    { id: "decor", title: "Finalise decorator and mandap design", daysBefore: 120 },
    { id: "attire", title: "Order wedding outfits and jewellery", daysBefore: 110 },
    { id: "save-date", title: "Send save-the-dates", daysBefore: 90 },
    { id: "invites", title: "Send invitations (digital and printed)", daysBefore: 60 },
    { id: "stay", title: "Block rooms and transport for outstation guests", daysBefore: 45 },
    {
      id: "mehendi",
      title: "Book mehendi artist, makeup and sangeet choreography",
      daysBefore: 40,
    },
    { id: "rsvp", title: "Chase RSVPs and confirm the final headcount", daysBefore: 14 },
    {
      id: "parking",
      title: "Arrange parking, valet and security",
      daysBefore: 14,
      minGuests: LARGE_EVENT_GUESTS,
    },
    { id: "payments", title: "Clear advance payments and share the run sheet", daysBefore: 7 },
    ...SHARED_END,
  ],
  birthday: [
    { id: "budget", title: "Set the budget, guest list and theme", daysBefore: 45 },
    { id: "venue", title: "Book the venue or prepare the home space", daysBefore: 35 },
    { id: "invites", title: "Send invitations", daysBefore: 21 },
    { id: "entertainment", title: "Book entertainment, games or a host", daysBefore: 21 },
    { id: "cake", title: "Order the cake and finalise the menu", daysBefore: 10 },
    { id: "decor", title: "Buy decor, balloons and return gifts", daysBefore: 7 },
    { id: "rsvp", title: "Confirm RSVPs and dietary needs", daysBefore: 5 },
    {
      id: "parking",
      title: "Plan parking and guest arrival",
      daysBefore: 5,
      minGuests: LARGE_EVENT_GUESTS,
    },
    ...SHARED_END,
  ],
  anniversary: [
    { id: "budget", title: "Decide the format, budget and guest list", daysBefore: 60 },
    { id: "venue", title: "Reserve the venue or restaurant", daysBefore: 45 },
    { id: "invites", title: "Send invitations", daysBefore: 30 },
    { id: "photo", title: "Book a photographer", daysBefore: 30 },
    { id: "memories", title: "Collect photos and messages for a memory reel", daysBefore: 21 },
    { id: "music", title: "Book live music or create the playlist", daysBefore: 14 },
    { id: "gift", title: "Arrange the gift and keepsakes", daysBefore: 10 },
    { id: "rsvp", title: "Confirm RSVPs and seating", daysBefore: 5 },
    ...SHARED_END,
  ],
  community: [
    { id: "goals", title: "Define goals, audience and the organising committee", daysBefore: 90 },
    { id: "permits", title: "Apply for venue, police and municipal permissions", daysBefore: 75 },
    { id: "sponsors", title: "Approach sponsors and local partners", daysBefore: 60 },
    { id: "venue", title: "Confirm the venue, stage and sound", daysBefore: 45 },
    { id: "volunteers", title: "Recruit volunteers and assign roles", daysBefore: 30 },
    {
      id: "promo",
      title: "Launch promotion: posters, WhatsApp groups, social media",
      daysBefore: 28,
    },
    { id: "food", title: "Confirm food stalls or caterer", daysBefore: 21 },
    { id: "safety", title: "Plan first aid, fire safety and an emergency route", daysBefore: 14 },
    {
      id: "crowd",
      title: "Plan crowd flow, parking and security",
      daysBefore: 14,
      minGuests: LARGE_EVENT_GUESTS,
    },
    { id: "briefing", title: "Brief volunteers and walk through the venue", daysBefore: 3 },
    ...SHARED_END,
  ],
};

/**
 * Parses YYYY-MM-DD as a UTC midnight timestamp, so date maths never shifts across time zones.
 * @param isoDate - calendar date string.
 */
export function parseIsoDate(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00Z`);
}

/**
 * Formats a UTC timestamp as YYYY-MM-DD.
 * @param time - milliseconds since the epoch.
 */
export function toIsoDate(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

/**
 * Whole days from `fromIso` to `toIso`. Negative when `toIso` is earlier.
 */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseIsoDate(toIso) - parseIsoDate(fromIso)) / MS_PER_DAY);
}

/**
 * Adds days to a calendar date.
 * @param isoDate - starting date.
 * @param days - days to add; may be negative.
 */
export function addDays(isoDate: string, days: number): string {
  return toIsoDate(parseIsoDate(isoDate) + days * MS_PER_DAY);
}

function phaseFor(daysBefore: number): MilestonePhase {
  if (daysBefore < 0) return "after";
  if (daysBefore === 0) return "event-day";
  if (daysBefore <= 7) return "final-week";
  if (daysBefore <= 45) return "build-up";
  return "early";
}

/** A task to merge into the timeline, for example one suggested by the AI. */
export interface ExtraTask {
  title: string;
  daysBefore: number;
}

/**
 * Builds a dated timeline. Tasks whose ideal lead time has already passed are scheduled
 * between today and the event, keeping their original order, and marked as rushed.
 * @param eventType - template to use.
 * @param eventDate - event date, YYYY-MM-DD.
 * @param guests - guest count, which unlocks large-event tasks.
 * @param today - today's date, YYYY-MM-DD (injected for deterministic tests).
 * @param extraTasks - additional tasks, e.g. from Gemini.
 */
export function buildTimeline(
  eventType: EventType,
  eventDate: string,
  guests: number,
  today: string,
  extraTasks: ExtraTask[] = [],
): TimelinePlan {
  const daysUntil = daysBetween(today, eventDate);
  const templates = TIMELINE_TEMPLATES[eventType].filter(
    (template) => template.minGuests === undefined || guests > template.minGuests,
  );
  const tasks = [
    ...templates.map((template) => ({ ...template, source: "template" as const })),
    ...extraTasks.map((task, index) => ({
      id: `ai-${index + 1}`,
      title: task.title,
      daysBefore: task.daysBefore,
      source: "ai" as const,
    })),
  ].sort((a, b) => b.daysBefore - a.daysBefore);

  const available = Math.max(daysUntil, 0);
  const isOverdue = (daysBefore: number) => daysBefore > available && daysBefore > 0;
  const overdue = tasks.filter((task) => isOverdue(task.daysBefore));
  // Overdue tasks are spread across a catch-up window at the start of the runway (about three
  // days per task, never past the event), keeping their original order.
  const window = Math.min(available, Math.max(overdue.length * 3, 1));
  const step = overdue.length > 1 ? window / (overdue.length - 1) : 0;
  let overdueIndex = 0;

  const milestones = tasks
    .map((task): Milestone => {
      const rushed = isOverdue(task.daysBefore);
      let lead = task.daysBefore;
      if (rushed) {
        lead = Math.max(Math.round(available - step * overdueIndex), 0);
        overdueIndex += 1;
      }
      return {
        id: task.id,
        title: task.title,
        daysBefore: task.daysBefore,
        date: addDays(eventDate, -lead),
        phase: phaseFor(lead),
        rushed,
        source: task.source,
      };
    })
    // Chronological order; the sort is stable, so same-day tasks keep their template order.
    .sort((a, b) => a.date.localeCompare(b.date));

  return { milestones, daysUntil, compressed: overdue.length > 0 };
}
