const generateContent = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
  ThinkingLevel: { MINIMAL: "MINIMAL" },
}));

import { GeminiModel, MAX_OUTPUT_TOKENS, minimalThinking, resetModelForTests } from "@/lib/ai/gemini";

const options = { system: "sys", prompt: "hello", maxOutputTokens: MAX_OUTPUT_TOKENS.chat };

beforeEach(() => generateContent.mockReset());

describe("GeminiModel", () => {
  it("sends the system prompt, token cap and disables thinking", async () => {
    generateContent.mockResolvedValue({ text: "  hi  " });
    const model = new GeminiModel("key", ["gemini-2.5-flash"]);
    expect(await model.generate({ ...options, jsonSchema: { type: "object" } })).toBe("hi");
    const request = generateContent.mock.calls[0]?.[0];
    expect(request.model).toBe("gemini-2.5-flash");
    expect(request.config).toMatchObject({
      systemInstruction: "sys",
      maxOutputTokens: MAX_OUTPUT_TOKENS.chat,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
    });
    expect(request.config.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it("uses a thinking level for Gemini 3 models", () => {
    expect(minimalThinking("gemini-3.5-flash-lite")).toEqual({ thinkingLevel: "MINIMAL" });
  });

  it("falls back to the next model on overload", async () => {
    generateContent.mockRejectedValueOnce(Object.assign(new Error("busy"), { status: 503 })).mockResolvedValueOnce({ text: "ok" });
    const model = new GeminiModel("key", ["model-a", "model-b"]);
    expect(await model.generate(options)).toBe("ok");
    expect(generateContent.mock.calls[1]?.[0].model).toBe("model-b");
  });

  it("does not retry client errors and rejects empty answers", async () => {
    generateContent.mockRejectedValue(Object.assign(new Error("bad"), { status: 400 }));
    await expect(new GeminiModel("key", ["a", "b"]).generate(options)).rejects.toThrow("bad");
    expect(generateContent).toHaveBeenCalledTimes(1);

    generateContent.mockReset().mockResolvedValue({ text: "" });
    await expect(new GeminiModel("key", ["a"]).generate(options)).rejects.toThrow(/empty/);
  });

  it("throws a clear error when no model is configured", async () => {
    await expect(new GeminiModel("key", []).generate(options)).rejects.toThrow(/No Gemini model/);
  });
});

describe("route modules", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetModelForTests();
  });

  it("health reports offline mode without leaking configuration", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    resetModelForTests();
    const { GET } = await import("@/app/api/health/route");
    const response = GET();
    expect(await response.json()).toEqual({ status: "ok", ai: "offline" });
  });

  it("plan and assistant routes export POST handlers on the Node.js runtime", async () => {
    const plan = await import("@/app/api/plan/route");
    const assistant = await import("@/app/api/assistant/route");
    expect(typeof plan.POST).toBe("function");
    expect(typeof assistant.POST).toBe("function");
    expect(plan.runtime).toBe("nodejs");
    expect(assistant.dynamic).toBe("force-dynamic");
  });
});
