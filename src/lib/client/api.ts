import { z } from "zod";
import { isAbortError } from "@/lib/errors";
import { localTodayIso } from "@/lib/planner/format";
import { buildPlan } from "@/lib/planner/plan";
import { restorePlan, type SavedPlan } from "@/lib/planner/restore";
import type { ChatTurn, EventBrief } from "@/lib/planner/schema";

const HTTP_SERVER_ERROR = 500;
const GENERIC_ERROR = "Something went wrong.";

/** Error from the API with optional per-field messages for the form. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const errorBodySchema = z.object({
  error: z.object({
    message: z.string().optional(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

const assistantAnswerSchema = z.object({
  reply: z.string(),
  source: z.enum(["gemini", "offline"]),
});

export type AssistantAnswer = z.output<typeof assistantAnswerSchema>;

/**
 * POSTs JSON and validates the response body before returning it.
 * @param url - same-origin API route.
 * @param body - request payload.
 * @param parse - turns the untrusted response body into a trusted value, or null if invalid.
 * @param signal - optional cancellation signal.
 * @throws ApiError for HTTP errors or an invalid response body.
 */
async function postJson<T>(
  url: string,
  body: unknown,
  parse: (data: unknown) => T | null,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = errorBodySchema.safeParse(data);
    const details = failure.success ? failure.data.error : {};
    throw new ApiError(details.message ?? GENERIC_ERROR, response.status, details.fields);
  }
  const parsed = parse(data);
  if (parsed === null) throw new ApiError(GENERIC_ERROR, HTTP_SERVER_ERROR);
  return parsed;
}

/**
 * Requests a plan from the server. If the network or server is unavailable, the same
 * deterministic planner runs in the browser so the host still gets a full plan. Validation
 * and rate-limit errors are surfaced instead of being masked.
 * @param brief - validated event brief.
 * @param signal - optional cancellation signal.
 */
export async function requestPlan(brief: EventBrief, signal?: AbortSignal): Promise<SavedPlan> {
  try {
    return await postJson("/api/plan", brief, (data) => restorePlan(data, localTodayIso()), signal);
  } catch (error) {
    if (error instanceof ApiError && error.status < HTTP_SERVER_ERROR) throw error;
    if (isAbortError(error)) throw error;
    return { plan: buildPlan(brief, localTodayIso()), ai: "local" };
  }
}

/**
 * Sends one assistant question.
 * @param brief - the event being planned.
 * @param history - recent turns.
 * @param message - the new question.
 * @param signal - optional cancellation signal.
 */
export function askAssistant(
  brief: EventBrief,
  history: ChatTurn[],
  message: string,
  signal?: AbortSignal,
): Promise<AssistantAnswer> {
  return postJson(
    "/api/assistant",
    { brief, history, message },
    (data) => {
      const parsed = assistantAnswerSchema.safeParse(data);
      return parsed.success ? parsed.data : null;
    },
    signal,
  );
}
