import "server-only";
import { errorStatus, isTimeoutOrAbort } from "@/lib/errors";
import { GoogleGenAI, type ThinkingConfig, ThinkingLevel } from "@google/genai";

/** Lowest-cost current Gemini model; planning ideas do not need a larger one. */
export const DEFAULT_MODEL = "gemini-3.5-flash-lite";
/** Used when the primary model is overloaded, rate limited or retired. */
export const FALLBACK_MODEL = "gemini-flash-lite-latest";
/** Hard ceilings that cap spend per request. */
export const MAX_OUTPUT_TOKENS = { ideas: 1_800, chat: 400 } as const;
export const REQUEST_TIMEOUT_MS = 15_000;
/** Sampling temperatures: ideas benefit from variety, chat answers from consistency. */
export const TEMPERATURE = { ideas: 0.7, chat: 0.6 } as const;

export interface GenerateOptions {
  system: string;
  prompt: string;
  maxOutputTokens: number;
  /** When set, the model must answer with JSON matching this schema. */
  jsonSchema?: object;
  temperature?: number;
}

/** Minimal model interface. Routes depend on this, so tests can inject a fake model. */
export interface TextModel {
  readonly id: string;
  generate(options: GenerateOptions): Promise<string>;
}

/**
 * Whether an error is worth retrying on the fallback model: overload, quota, timeouts, or a
 * 404 from a model that Google has retired.
 */
export function isRetryable(error: unknown): boolean {
  const status = errorStatus(error);
  if (status === 404 || status === 429 || (status !== undefined && status >= 500)) return true;
  return isTimeoutOrAbort(error);
}

/**
 * Thinking tokens are billed and short planning outputs do not need them. Gemini 2.5 takes a
 * token budget; Gemini 3 and later take a level.
 */
export function minimalThinking(model: string): ThinkingConfig {
  return model.startsWith("gemini-2.5")
    ? { thinkingBudget: 0 }
    : { thinkingLevel: ThinkingLevel.MINIMAL };
}

/** Google Gemini through the official @google/genai SDK. */
export class GeminiModel implements TextModel {
  readonly id: string;
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly models: readonly string[] = [DEFAULT_MODEL, FALLBACK_MODEL],
  ) {
    this.client = new GoogleGenAI({ apiKey });
    this.id = `gemini:${models[0] ?? DEFAULT_MODEL}`;
  }

  async generate({
    system,
    prompt,
    maxOutputTokens,
    jsonSchema,
    temperature = TEMPERATURE.ideas,
  }: GenerateOptions): Promise<string> {
    let lastError: unknown = new Error("No Gemini model configured");
    for (const model of this.models) {
      try {
        const response = await this.client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: system,
            maxOutputTokens,
            temperature,
            thinkingConfig: minimalThinking(model),
            abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            ...(jsonSchema
              ? { responseMimeType: "application/json", responseJsonSchema: jsonSchema }
              : {}),
          },
        });
        const text = response.text?.trim();
        if (!text) throw new Error("Gemini returned an empty response");
        return text;
      } catch (error) {
        lastError = error;
        if (!isRetryable(error)) break;
      }
    }
    throw lastError;
  }
}

let cached: TextModel | null | undefined;

/**
 * Returns the configured model, or null when no API key is set (offline mode).
 * The instance is created once per server process.
 */
export function getModel(): TextModel | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configured = process.env.GEMINI_MODEL?.trim();
  const primary = configured === undefined || configured === "" ? DEFAULT_MODEL : configured;
  cached = apiKey ? new GeminiModel(apiKey, [...new Set([primary, FALLBACK_MODEL])]) : null;
  return cached;
}

/** Clears the memoised model; used by tests that change environment variables. */
export function resetModelForTests(): void {
  cached = undefined;
}
