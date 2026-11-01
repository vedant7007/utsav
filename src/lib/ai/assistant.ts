import "server-only";
import { errorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { LIMITS } from "@/lib/planner/constants";
import type { ChatTurn, EventBrief } from "@/lib/planner/schema";
import { countInjectionAttempts } from "@/lib/security/prompt-defense";
import { MAX_OUTPUT_TOKENS, TEMPERATURE, type TextModel } from "./gemini";
import { ASSISTANT_SYSTEM_PROMPT, assistantPrompt } from "./prompts";

export interface AssistantAnswer {
  reply: string;
  source: "gemini" | "offline";
}

/** Rule-based replies by topic, so the chat stays useful without an API key. */
const OFFLINE_TOPICS: { pattern: RegExp; reply: (brief: EventBrief) => string }[] = [
  {
    pattern: /budget|cost|cheap|save|afford|money|price/,
    reply: () =>
      "To stretch the budget: lock the venue and caterer first since they are the biggest lines, pick seasonal decor, send digital invitations, and keep the 5% contingency untouched until the final week.",
  },
  {
    pattern: /vendor|caterer|photograph|decorat|dj|book/,
    reply: () =>
      "For each vendor: collect three quotes, check recent full-event work rather than highlights, and sign a written agreement with dates, inclusions and cancellation terms. The Vendors tab tracks each step.",
  },
  {
    pattern: /time|when|schedule|late|week|month/,
    reply: (brief) =>
      `Your Timeline tab schedules every task back from ${brief.date}. Anything marked "Do soon" should be done this week. Add it to your calendar with the .ics download.`,
  },
];

const OFFLINE_DEFAULT =
  "I can help with budget splits, vendor booking, timelines and ideas for this celebration. Add a Gemini API key to unlock fully personalised answers.";

/**
 * Picks a rule-based reply for a question.
 * @param message - the host's question.
 * @param brief - the event being planned.
 */
export function offlineReply(message: string, brief: EventBrief): string {
  const text = message.toLowerCase();
  const topic = OFFLINE_TOPICS.find(({ pattern }) => pattern.test(text));
  return topic ? topic.reply(brief) : OFFLINE_DEFAULT;
}

/**
 * Answers one planning question. Falls back to rule-based guidance if the model is missing or
 * fails, so the host always gets a reply.
 * @param model - the configured model, or null in offline mode.
 * @param brief - the event being planned.
 * @param history - earlier turns, already length-limited by validation.
 * @param message - the new question.
 */
export async function answerQuestion(
  model: TextModel | null,
  brief: EventBrief,
  history: ChatTurn[],
  message: string,
): Promise<AssistantAnswer> {
  if (!model) return { reply: offlineReply(message, brief), source: "offline" };

  const untrusted = [message, ...history.map((turn) => turn.content)].join(" ");
  const suspicious = countInjectionAttempts(untrusted);
  if (suspicious > 0) logger.warn("prompt_injection_suspected", { source: "chat", suspicious });

  try {
    const reply = await model.generate({
      system: ASSISTANT_SYSTEM_PROMPT,
      prompt: assistantPrompt(brief, history, message),
      maxOutputTokens: MAX_OUTPUT_TOKENS.chat,
      temperature: TEMPERATURE.chat,
    });
    // Capped below the history limit so the reply can be sent back as context next turn.
    return { reply: reply.slice(0, LIMITS.chatReplyMax).trim(), source: "gemini" };
  } catch (error) {
    logger.error("assistant_failed", { model: model.id, message: errorMessage(error) });
    return { reply: offlineReply(message, brief), source: "offline" };
  }
}
