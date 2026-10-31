import { z } from "zod";
import { CURRENCIES, EVENT_TYPES, LIMITS, PRIORITY_OPTIONS } from "./constants";

/** Strips control characters and collapses whitespace in free text from users. */
export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const text = (max: number) => z.string().transform(cleanText).pipe(z.string().max(max));

/** ISO calendar date (YYYY-MM-DD) that is also a real date, e.g. not 2026-02-30. */
export const isoDateSchema = z
  .string()
  .min(1, "Choose the event date")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a real calendar date");

/** Everything the planner needs to know about an event. Validated on client and server. */
export const eventBriefSchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  title: text(LIMITS.nameMax).pipe(z.string().min(1, "Give your event a name")),
  date: isoDateSchema,
  city: text(LIMITS.cityMax).default(""),
  guests: z.coerce
    .number()
    .int("Guest count must be a whole number")
    .min(LIMITS.guestsMin, "Add at least one guest")
    .max(LIMITS.guestsMax, `Utsav plans for up to ${LIMITS.guestsMax} guests`),
  budget: z.coerce
    .number()
    .finite()
    .min(LIMITS.budgetMin, "Enter a budget greater than zero")
    .max(LIMITS.budgetMax, "That budget is above the supported range"),
  currency: z.enum(CURRENCIES).default("INR"),
  theme: text(LIMITS.themeMax).default(""),
  priorities: z
    .array(z.enum(PRIORITY_OPTIONS))
    .max(3, "Pick up to three priorities")
    .default([])
    .transform((list) => [...new Set(list)]),
  notes: text(LIMITS.notesMax).default(""),
});

export type EventBrief = z.output<typeof eventBriefSchema>;
export type EventBriefInput = z.input<typeof eventBriefSchema>;

/** Personalized ideas returned by Gemini, validated before they reach the UI. */
export const aiIdeasSchema = z.object({
  summary: z.string().min(1).max(400),
  themeConcept: z.string().min(1).max(300),
  decor: z.array(z.string().min(1).max(160)).min(1).max(6),
  food: z.array(z.string().min(1).max(160)).min(1).max(6),
  activities: z.array(z.string().min(1).max(160)).min(1).max(6),
  savingTips: z.array(z.string().min(1).max(200)).min(1).max(5),
  extraTasks: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        daysBefore: z.number().int().min(0).max(LIMITS.maxPlanningDays),
      }),
    )
    .max(4)
    .default([]),
  palette: z
    .array(
      z.object({
        name: z.string().min(1).max(30),
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a #RRGGBB colour"),
      }),
    )
    .min(3)
    .max(5)
    .optional(),
  runSheet: z
    .array(
      z.object({
        time: z.string().min(1).max(12),
        activity: z.string().min(1).max(120),
      }),
    )
    .min(3)
    .max(8)
    .optional(),
  inviteMessage: z.string().min(20).max(600).optional(),
});

export type AiIdeas = z.output<typeof aiIdeasSchema>;
/** Ideas after merging with curated defaults: the optional extras are always present. */
export type PlanIdeas = AiIdeas & Required<Pick<AiIdeas, "palette" | "runSheet" | "inviteMessage">>;

/** JSON schema handed to Gemini's structured output so it answers in the shape above. */
export const AI_IDEAS_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "Two sentences that frame the plan for this host." },
    themeConcept: { type: "string", description: "One vivid, practical theme concept." },
    decor: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
    food: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
    activities: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
    savingTips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
    extraTasks: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          daysBefore: { type: "integer", minimum: 0 },
        },
        required: ["title", "daysBefore"],
      },
    },
    palette: {
      type: "array",
      description: "Colour palette for the theme: evocative names with hex codes.",
      minItems: 4,
      maxItems: 5,
      items: {
        type: "object",
        properties: { name: { type: "string" }, hex: { type: "string", description: "#RRGGBB" } },
        required: ["name", "hex"],
      },
    },
    runSheet: {
      type: "array",
      description: "Event-day schedule in order, with clock times such as 6:30 PM.",
      minItems: 5,
      maxItems: 8,
      items: {
        type: "object",
        properties: { time: { type: "string" }, activity: { type: "string" } },
        required: ["time", "activity"],
      },
    },
    inviteMessage: {
      type: "string",
      description:
        "A warm, ready-to-send WhatsApp invitation under 80 words, with the event name, date and city. No placeholders.",
    },
  },
  required: [
    "summary",
    "themeConcept",
    "decor",
    "food",
    "activities",
    "savingTips",
    "extraTasks",
    "palette",
    "runSheet",
    "inviteMessage",
  ],
} as const;

/** One turn of the planning assistant conversation. */
export const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: text(LIMITS.chatReplyMax).pipe(z.string().min(1)),
});

export const assistantRequestSchema = z.object({
  brief: eventBriefSchema,
  message: text(LIMITS.chatMessageMax).pipe(z.string().min(1, "Type a question first")),
  history: z.array(chatTurnSchema).max(LIMITS.chatHistoryMax).default([]),
});

export type ChatTurn = z.output<typeof chatTurnSchema>;
export type AssistantRequest = z.output<typeof assistantRequestSchema>;

/**
 * Flattens zod issues into a field-to-message map for accessible form errors.
 * @param error - a failed safeParse result's error.
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    result[key] ??= issue.message;
  }
  return result;
}
