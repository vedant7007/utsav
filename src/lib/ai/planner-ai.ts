import {
  type AiIdeas,
  aiIdeasSchema,
  AI_IDEAS_JSON_SCHEMA,
  type ChatTurn,
  type EventBrief,
} from "@/lib/planner/schema";
import { countInjectionAttempts } from "@/lib/security/prompt-defense";
import { stableKey, TtlLruCache } from "./cache";
import { MAX_OUTPUT_TOKENS, type TextModel } from "./gemini";
import {
  ASSISTANT_SYSTEM_PROMPT,
  assistantPrompt,
  IDEAS_SYSTEM_PROMPT,
  ideasPrompt,
} from "./prompts";

const ideasCache = new TtlLruCache<AiIdeas>(200, 30 * 60_000);

/** Removes Markdown code fences some models wrap around JSON. */
export function stripJsonFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

/**
 * Parses and validates model output. Lists are trimmed to schema limits before validation so a
 * slightly verbose model still yields a usable result.
 * @returns validated ideas, or null if the output is unusable.
 */
export function parseIdeas(raw: string): AiIdeas | null {
  try {
    const data = JSON.parse(stripJsonFence(raw)) as Record<string, unknown>;
    const trim = (value: unknown, max: number) =>
      Array.isArray(value) ? value.slice(0, max) : value;
    // Optional extras are validated on their own, so one bad colour code drops only the
    // palette (curated defaults fill it later) instead of discarding every idea.
    const extra = <K extends "palette" | "runSheet" | "inviteMessage">(key: K, value: unknown) => {
      const parsed = aiIdeasSchema.shape[key].safeParse(value);
      return parsed.success ? parsed.data : undefined;
    };
    const result = aiIdeasSchema.safeParse({
      ...data,
      decor: trim(data.decor, 6),
      food: trim(data.food, 6),
      activities: trim(data.activities, 6),
      savingTips: trim(data.savingTips, 5),
      extraTasks: trim(data.extraTasks, 4),
      palette: extra("palette", trim(data.palette, 5)),
      runSheet: extra("runSheet", trim(data.runSheet, 8)),
      inviteMessage: extra("inviteMessage", data.inviteMessage),
    });
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Outcome of an ideas request, including why AI was skipped, for transparent UI messages. */
export interface IdeasOutcome {
  ideas: AiIdeas | null;
  reason: "ok" | "cached" | "offline" | "invalid" | "error";
}

/**
 * Asks Gemini for personalised ideas. Never throws: any failure returns null so the caller
 * falls back to curated ideas and the host still gets a complete plan.
 * @param model - the configured model, or null in offline mode.
 * @param brief - validated event brief.
 */
export async function generateIdeas(
  model: TextModel | null,
  brief: EventBrief,
): Promise<IdeasOutcome> {
  if (!model) return { ideas: null, reason: "offline" };
  // The date affects only scheduling, which is deterministic, so it is left out of the key.
  const key = stableKey({ ...brief, date: undefined, model: model.id });
  const hit = ideasCache.get(key);
  if (hit) return { ideas: hit, reason: "cached" };

  const suspicious = countInjectionAttempts(
    `${brief.title} ${brief.theme} ${brief.notes} ${brief.city}`,
  );
  if (suspicious > 0)
    console.warn(`[utsav] ${suspicious} suspected prompt-injection phrase(s) in a brief`);

  try {
    const raw = await model.generate({
      system: IDEAS_SYSTEM_PROMPT,
      prompt: ideasPrompt(brief),
      maxOutputTokens: MAX_OUTPUT_TOKENS.ideas,
      jsonSchema: AI_IDEAS_JSON_SCHEMA,
    });
    const ideas = parseIdeas(raw);
    if (!ideas) return { ideas: null, reason: "invalid" };
    ideasCache.set(key, ideas);
    return { ideas, reason: "ok" };
  } catch (error) {
    console.error("[utsav] ideas generation failed:", (error as Error).message);
    return { ideas: null, reason: "error" };
  }
}

/** Offline assistant replies, keyed by topic, so the chat stays useful without a key. */
export function offlineReply(message: string, brief: EventBrief): string {
  const text = message.toLowerCase();
  if (/budget|cost|cheap|save|afford|money|price/.test(text)) {
    return "To stretch the budget: lock the venue and caterer first since they are the biggest lines, pick seasonal decor, send digital invitations, and keep the 5% contingency untouched until the final week.";
  }
  if (/vendor|caterer|photograph|decorat|dj|book/.test(text)) {
    return "For each vendor: collect three quotes, check recent full-event work rather than highlights, and sign a written agreement with dates, inclusions and cancellation terms. The Vendors tab tracks each step.";
  }
  if (/time|when|schedule|late|week|month/.test(text)) {
    return `Your Timeline tab schedules every task back from ${brief.date}. Anything marked "rushed" should be done this week. Add it to your calendar with the .ics download.`;
  }
  return "I can help with budget splits, vendor booking, timelines and ideas for this celebration. Add a Gemini API key to unlock fully personalised answers.";
}

/**
 * Answers one planning question. Falls back to rule-based guidance if the model is missing
 * or fails, so the host always gets a reply.
 */
export async function answerQuestion(
  model: TextModel | null,
  brief: EventBrief,
  history: ChatTurn[],
  message: string,
): Promise<{ reply: string; source: "gemini" | "offline" }> {
  if (!model) return { reply: offlineReply(message, brief), source: "offline" };
  if (countInjectionAttempts(message) > 0)
    console.warn("[utsav] suspected prompt injection in chat");
  try {
    const reply = await model.generate({
      system: ASSISTANT_SYSTEM_PROMPT,
      prompt: assistantPrompt(brief, history, message),
      maxOutputTokens: MAX_OUTPUT_TOKENS.chat,
      temperature: 0.6,
    });
    return { reply: reply.slice(0, 1_500), source: "gemini" };
  } catch (error) {
    console.error("[utsav] assistant failed:", (error as Error).message);
    return { reply: offlineReply(message, brief), source: "offline" };
  }
}

/** Clears the ideas cache; used by tests. */
export function clearIdeasCache(): void {
  ideasCache.clear();
}
