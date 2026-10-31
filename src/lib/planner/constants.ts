/** Event types Utsav plans for. The problem brief names weddings, birthdays and community events. */
export const EVENT_TYPES = ["wedding", "birthday", "anniversary", "community"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Currencies the budget planner formats. INR is the default audience. */
export const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Budget categories a user can mark as a priority to receive a larger share. */
export const PRIORITY_OPTIONS = [
  "venue",
  "food",
  "decor",
  "photography",
  "entertainment",
  "attire",
] as const;
export type Priority = (typeof PRIORITY_OPTIONS)[number];

export const EVENT_LABELS: Record<EventType, string> = {
  wedding: "Wedding",
  birthday: "Birthday",
  anniversary: "Anniversary",
  community: "Community event",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  venue: "Venue",
  food: "Food and catering",
  decor: "Decor",
  photography: "Photography",
  entertainment: "Entertainment",
  attire: "Attire and styling",
};

/** Input limits shared by client validation, server validation and the prompt builder. */
export const LIMITS = {
  nameMax: 80,
  cityMax: 60,
  themeMax: 120,
  notesMax: 500,
  guestsMin: 1,
  guestsMax: 5000,
  budgetMin: 1,
  budgetMax: 1_000_000_000,
  maxPlanningDays: 730,
  chatMessageMax: 600,
  /** Longest assistant reply kept; must fit inside a history turn. */
  chatReplyMax: 1_100,
  chatHistoryMax: 6,
} as const;

/** Share of the budget moved towards priorities, taken from non-priority categories. */
export const PRIORITY_BOOST = 0.3;

/**
 * Minimum comfortable spend per guest, per currency. Below this the plan raises a
 * "tight budget" warning with saving tips. Figures are deliberately conservative.
 */
export const MIN_PER_GUEST: Record<EventType, Record<Currency, number>> = {
  wedding: { INR: 1200, USD: 60, EUR: 55, GBP: 50 },
  birthday: { INR: 400, USD: 20, EUR: 18, GBP: 16 },
  anniversary: { INR: 600, USD: 30, EUR: 28, GBP: 25 },
  community: { INR: 150, USD: 8, EUR: 7, GBP: 6 },
};

/** Guest count above which large-event logistics (parking, security, crowd flow) are added. */
export const LARGE_EVENT_GUESTS = 150;
