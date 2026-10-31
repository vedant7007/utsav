/**
 * Phrases that try to steer the model from inside user text. Event briefs and planning
 * questions almost never address an AI system, so matches are counted, logged and neutralised
 * by fencing plus the instruction hierarchy in the system prompt.
 */
const INJECTION_PATTERNS: readonly RegExp[] = [
  /\b(?:ignore|disregard|forget|override)\s+(?:all\s+|any\s+)?(?:the\s+|your\s+)?(?:previous|prior|above|earlier|system)\s+(?:instructions?|prompts?|rules|directions)/gi,
  /\byou\s+are\s+(?:now\s+)?(?:an?\s+)?(?:unrestricted|jailbroken|different|new)\s+(?:ai|assistant|model|chatbot)/gi,
  /\b(?:new|updated|revised|real)\s+(?:system\s+)?instructions?\s*:/gi,
  /\b(?:reveal|print|show|repeat|output)\s+(?:your|the)\s+(?:system\s+prompt|hidden\s+prompt|instructions)/gi,
  /\bsystem\s+prompt\b/gi,
  /\b(?:developer|god|dan)\s+mode\b/gi,
  /<\/?\s*(?:system|assistant|instructions?)\s*>/gi,
  /\[\/?(?:INST|SYS)\]/g,
];

const FENCE_TAG = "host_input";
const FENCE_PATTERN = new RegExp(`<\\/?\\s*${FENCE_TAG}[^>]*>`, "gi");

/**
 * Counts suspected prompt-injection phrases in untrusted text.
 * @param text - free text from the user.
 */
export function countInjectionAttempts(text: string): number {
  return INJECTION_PATTERNS.reduce(
    (total, pattern) => total + (text.match(pattern)?.length ?? 0),
    0,
  );
}

/**
 * Wraps untrusted text in a labelled fence. Fence tags already in the text are stripped first
 * so the content cannot close the block early and pose as instructions.
 * @param label - short identifier for the block.
 * @param text - untrusted text.
 */
export function fenceUntrusted(label: string, text: string): string {
  const safeLabel = label.replace(/[^A-Za-z0-9_-]/g, "");
  const cleaned = text.replace(FENCE_PATTERN, "");
  return `<${FENCE_TAG} id="${safeLabel}">\n${cleaned}\n</${FENCE_TAG}>`;
}
