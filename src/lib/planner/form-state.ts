import { LIMITS, type Priority } from "./constants";
import { validateEventDate } from "./plan";
import { type EventBrief, type EventBriefInput, eventBriefSchema, fieldErrors } from "./schema";

/** Raw form values, kept as strings until submit so partial input never throws. */
export interface FormState {
  eventType: string;
  title: string;
  date: string;
  city: string;
  guests: string;
  budget: string;
  currency: string;
  theme: string;
  priorities: Priority[];
  notes: string;
}

export const EMPTY_FORM: FormState = {
  eventType: "wedding",
  title: "",
  date: "",
  city: "",
  guests: "",
  budget: "",
  currency: "INR",
  theme: "",
  priorities: [],
  notes: "",
};

/** Field order on screen, used to list errors in the same order the host reads them. */
export const FIELD_ORDER = [
  "eventType",
  "title",
  "date",
  "guests",
  "budget",
  "currency",
  "city",
  "theme",
  "priorities",
  "notes",
] as const;

/**
 * Fills the form from an existing or sample brief.
 * @param brief - brief to edit.
 */
export function toFormState(brief: EventBriefInput): FormState {
  return {
    eventType: brief.eventType,
    title: brief.title,
    date: brief.date,
    city: brief.city ?? "",
    guests: String(brief.guests),
    budget: String(brief.budget),
    currency: brief.currency ?? "INR",
    theme: brief.theme ?? "",
    priorities: [...(brief.priorities ?? [])],
    notes: brief.notes ?? "",
  };
}

/**
 * Adds or removes a priority, never exceeding the allowed count.
 * @param priorities - current selection.
 * @param priority - priority to toggle.
 */
export function togglePriority(priorities: Priority[], priority: Priority): Priority[] {
  if (priorities.includes(priority)) return priorities.filter((item) => item !== priority);
  if (priorities.length >= LIMITS.prioritiesMax) return priorities;
  return [...priorities, priority];
}

export type FormResult =
  { ok: true; brief: EventBrief } | { ok: false; errors: Record<string, string> };

/**
 * Validates the form with the same schema the server uses, plus the date window check.
 * @param form - raw form values.
 * @param today - today's date, YYYY-MM-DD.
 */
export function validateForm(form: FormState, today: string): FormResult {
  const result = eventBriefSchema.safeParse(form);
  const errors = result.success ? {} : fieldErrors(result.error);
  const dateError = form.date ? validateEventDate(form.date, today) : null;
  if (dateError && !errors.date) errors.date = dateError;
  if (result.success && !dateError) return { ok: true, brief: result.data };
  return { ok: false, errors };
}

/**
 * Lists errors in on-screen field order.
 * @param errors - messages keyed by field.
 */
export function orderedErrors(errors: Record<string, string>): Array<[string, string]> {
  return FIELD_ORDER.flatMap((key) => {
    const message = errors[key];
    return message ? [[key, message] satisfies [string, string]] : [];
  });
}

/**
 * Builds `aria-describedby` for a field from its optional hint and error.
 * @param name - field name.
 * @param hasHint - whether a `${name}-hint` element exists.
 * @param hasError - whether a `${name}-error` element exists.
 */
export function describedBy(name: string, hasHint: boolean, hasError: boolean): string | undefined {
  const ids = [hasHint ? `${name}-hint` : "", hasError ? `${name}-error` : ""].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}
