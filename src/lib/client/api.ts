import { todayIso } from "@/lib/planner/format";
import { buildPlan, type EventPlan } from "@/lib/planner/plan";
import type { ChatTurn, EventBrief } from "@/lib/planner/schema";

export type AiStatus = "ok" | "cached" | "offline" | "invalid" | "error" | "local";

export interface PlanResult {
  plan: EventPlan;
  ai: AiStatus;
}

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

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: { message?: string; fields?: Record<string, string> };
  };
  if (!response.ok) {
    throw new ApiError(data.error?.message ?? "Something went wrong.", response.status, data.error?.fields);
  }
  return data as T;
}

/**
 * Requests a plan from the server. If the network or server is unavailable, the same
 * deterministic planner runs in the browser so the host still gets a full plan.
 * Validation and rate-limit errors are surfaced instead of being masked.
 */
export async function requestPlan(brief: EventBrief, signal?: AbortSignal): Promise<PlanResult> {
  try {
    return await postJson<PlanResult>("/api/plan", brief, signal);
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) throw error;
    if ((error as Error).name === "AbortError") throw error;
    return { plan: buildPlan(brief, todayIso()), ai: "local" };
  }
}

/** Sends one assistant question. */
export function askAssistant(
  brief: EventBrief,
  history: ChatTurn[],
  message: string,
  signal?: AbortSignal,
): Promise<{ reply: string; source: "gemini" | "offline" }> {
  return postJson("/api/assistant", { brief, history, message }, signal);
}
