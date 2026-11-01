import "server-only";
import { z } from "zod";
import { errorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { IDEA_LIMITS } from "@/lib/planner/constants";
import {
  type AiIdeas,
  aiIdeasSchema,
  AI_IDEAS_JSON_SCHEMA,
  type EventBrief,
} from "@/lib/planner/schema";
import { countInjectionAttempts } from "@/lib/security/prompt-defense";
import { stableKey, TtlLruCache } from "./cache";
import { MAX_OUTPUT_TOKENS, type TextModel } from "./gemini";
import { IDEAS_SYSTEM_PROMPT, ideasPrompt } from "./prompts";

/** Ideas are cached per brief for half an hour; hosts often resubmit while tweaking a form. */
const CACHE_ENTRIES = 200;
const CACHE_TTL_MS = 30 * 60_000;
const ideasCache = new TtlLruCache<AiIdeas>(CACHE_ENTRIES, CACHE_TTL_MS);

const jsonObjectSchema = z.record(z.string(), z.unknown());
type OptionalExtra = "palette" | "runSheet" | "inviteMessage";

/** Why AI ideas were or were not used; surfaced to the host as a transparent notice. */
export type IdeasReason = "ok" | "cached" | "offline" | "invalid" | "error";

export interface IdeasOutcome {
  ideas: AiIdeas | null;
  reason: IdeasReason;
}

/** Removes Markdown code fences some models wrap around JSON. */
export function stripJsonFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

function trimList(value: unknown, max: number): unknown {
  return Array.isArray(value) ? value.slice(0, max) : value;
}

/**
 * Validates one optional extra on its own, so a single bad value (for example an invalid hex
 * colour) drops only that extra; curated defaults fill the gap later.
 */
function optionalExtra(key: OptionalExtra, value: unknown) {
  const parsed = aiIdeasSchema.shape[key].safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

/**
 * Parses and validates model output. Lists are trimmed to the schema limits first, so a slightly
 * verbose model still yields a usable result.
 * @param raw - text returned by the model.
 * @returns validated ideas, or null if the output is unusable.
 */
export function parseIdeas(raw: string): AiIdeas | null {
  let json: unknown;
  try {
    json = JSON.parse(stripJsonFence(raw));
  } catch {
    return null;
  }
  const object = jsonObjectSchema.safeParse(json);
  if (!object.success) return null;
  const data = object.data;
  const result = aiIdeasSchema.safeParse({
    ...data,
    decor: trimList(data.decor, IDEA_LIMITS.decor),
    food: trimList(data.food, IDEA_LIMITS.food),
    activities: trimList(data.activities, IDEA_LIMITS.activities),
    savingTips: trimList(data.savingTips, IDEA_LIMITS.savingTips),
    extraTasks: trimList(data.extraTasks, IDEA_LIMITS.extraTasks),
    palette: optionalExtra("palette", trimList(data.palette, IDEA_LIMITS.paletteMax)),
    runSheet: optionalExtra("runSheet", trimList(data.runSheet, IDEA_LIMITS.runSheetMax)),
    inviteMessage: optionalExtra("inviteMessage", data.inviteMessage),
  });
  return result.success ? result.data : null;
}

/**
 * Asks Gemini for personalised ideas. Never throws: any failure returns null so the caller falls
 * back to curated ideas and the host still gets a complete plan.
 * @param model - the configured model, or null in offline mode.
 * @param brief - validated event brief.
 */
export async function generateIdeas(
  model: TextModel | null,
  brief: EventBrief,
): Promise<IdeasOutcome> {
  if (!model) return { ideas: null, reason: "offline" };
  // The whole brief is the key: the date appears in the generated invitation.
  const key = stableKey({ ...brief, model: model.id });
  const hit = ideasCache.get(key);
  if (hit) return { ideas: hit, reason: "cached" };

  const suspicious = countInjectionAttempts(
    [brief.title, brief.theme, brief.notes, brief.city].join(" "),
  );
  if (suspicious > 0) logger.warn("prompt_injection_suspected", { source: "brief", suspicious });

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
    logger.error("ideas_generation_failed", { model: model.id, message: errorMessage(error) });
    return { ideas: null, reason: "error" };
  }
}

/** Clears the ideas cache between tests. */
export function clearIdeasCache(): void {
  ideasCache.clear();
}
