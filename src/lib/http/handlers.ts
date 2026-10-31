import type { NextResponse } from "next/server";
import { answerQuestion, generateIdeas } from "@/lib/ai/planner-ai";
import type { TextModel } from "@/lib/ai/gemini";
import { todayIso } from "@/lib/planner/format";
import { buildPlan, validateEventDate } from "@/lib/planner/plan";
import { assistantRequestSchema, eventBriefSchema } from "@/lib/planner/schema";
import { chatRateLimiter, planRateLimiter, type SlidingWindowRateLimiter } from "@/lib/security/rate-limit";
import { errorResponse, okResponse, parseJsonRequest } from "./api";

/** Dependencies are injected so route logic is testable without network calls. */
export interface HandlerDeps {
  model: () => TextModel | null;
  today?: () => string;
  limiter?: SlidingWindowRateLimiter;
}

/** POST /api/plan: validates a brief and returns a complete plan with AI ideas when available. */
export function createPlanHandler({ model, today = () => todayIso(), limiter = planRateLimiter }: HandlerDeps) {
  return async function POST(request: Request): Promise<NextResponse> {
    const parsed = await parseJsonRequest(request, eventBriefSchema, limiter);
    if (!parsed.ok) return parsed.response;
    const brief = parsed.data;
    const now = today();
    const dateError = validateEventDate(brief.date, now);
    if (dateError) {
      return errorResponse(422, "validation_failed", "Some details need fixing.", { fields: { date: dateError } });
    }
    const outcome = await generateIdeas(model(), brief);
    const plan = buildPlan(brief, now, outcome.ideas);
    return okResponse({ plan, ai: outcome.reason });
  };
}

/** POST /api/assistant: answers a planning question about the current brief. */
export function createAssistantHandler({ model, limiter = chatRateLimiter }: HandlerDeps) {
  return async function POST(request: Request): Promise<NextResponse> {
    const parsed = await parseJsonRequest(request, assistantRequestSchema, limiter);
    if (!parsed.ok) return parsed.response;
    const { brief, history, message } = parsed.data;
    const answer = await answerQuestion(model(), brief, history, message);
    return okResponse(answer);
  };
}
