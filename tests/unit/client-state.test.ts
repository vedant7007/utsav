import { errorMessage, errorStatus, isAbortError, isTimeoutOrAbort } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { whatIfRanges } from "@/lib/planner/budget";
import { LIMITS } from "@/lib/planner/constants";
import { countdownLabel } from "@/lib/planner/format";
import {
  describedBy,
  EMPTY_FORM,
  orderedErrors,
  toFormState,
  togglePriority,
  validateForm,
} from "@/lib/planner/form-state";
import { buildPlan } from "@/lib/planner/plan";
import {
  EMPTY_PROGRESS,
  restorePlan,
  restoreProgress,
  setActual,
  toggleTask,
} from "@/lib/planner/restore";
import { addDays } from "@/lib/planner/timeline";
import { liveAnnouncement, recentHistory } from "@/hooks/use-assistant-chat";
import { makeBrief, TODAY } from "../fixtures";

describe("errors", () => {
  it("reads messages from errors, strings and unknown values", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
    expect(errorMessage("plain")).toBe("plain");
    expect(errorMessage({ weird: true }, "fallback")).toBe("fallback");
    expect(errorMessage(new Error(""))).toBe("Something went wrong.");
  });

  it("recognises aborts, timeouts and HTTP statuses", () => {
    expect(isAbortError(new DOMException("stop", "AbortError"))).toBe(true);
    expect(isAbortError(new Error("nope"))).toBe(false);
    expect(isTimeoutOrAbort(new DOMException("slow", "TimeoutError"))).toBe(true);
    expect(isTimeoutOrAbort("TimeoutError")).toBe(false);
    expect(errorStatus({ status: 429 })).toBe(429);
    expect(errorStatus({ status: "429" })).toBeUndefined();
    expect(errorStatus(null)).toBeUndefined();
  });
});

describe("logger", () => {
  it("writes one JSON line per event to the right stream", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logger.warn("ai.fallback", { model: "m", status: 429 });
    logger.error("ai.crash");
    expect(JSON.parse(String(warn.mock.calls[0]?.[0]))).toMatchObject({
      level: "warn",
      event: "ai.fallback",
      model: "m",
      status: 429,
    });
    expect(JSON.parse(String(error.mock.calls[0]?.[0]))).toMatchObject({
      level: "error",
      event: "ai.crash",
    });
    warn.mockRestore();
    error.mockRestore();
  });
});

describe("restoreProgress", () => {
  it("keeps valid task ids and positive finite amounts only", () => {
    const restored = restoreProgress({
      done: ["a", 3, null, "b"],
      actuals: { venue: 500, food: -1, decor: "9", music: Number.NaN, cake: 0 },
    });
    expect(restored).toEqual({ done: ["a", "b"], actuals: { venue: 500 } });
  });

  it("rejects malformed storage", () => {
    expect(restoreProgress(null)).toBeNull();
    expect(restoreProgress({ done: "a", actuals: {} })).toBeNull();
    expect(restoreProgress({ done: [] })).toBeNull();
  });
});

describe("restorePlan", () => {
  it("rejects non-object input and falls back to offline for unknown statuses", () => {
    expect(restorePlan("nope", TODAY)).toBeNull();
    const plan = buildPlan(makeBrief(), TODAY);
    expect(restorePlan({ plan }, TODAY)?.ai).toBe("offline");
    expect(restorePlan({ plan, ai: "cached" }, TODAY)?.ai).toBe("cached");
  });
});

describe("progress updates", () => {
  it("toggles tasks on and off without mutating the input", () => {
    const once = toggleTask(EMPTY_PROGRESS, "book-venue");
    expect(once.done).toEqual(["book-venue"]);
    expect(toggleTask(once, "book-venue").done).toEqual([]);
    expect(EMPTY_PROGRESS.done).toEqual([]);
  });

  it("rounds spend and clears zero, negative or invalid amounts", () => {
    const spent = setActual(EMPTY_PROGRESS, "venue", 1234.6);
    expect(spent.actuals).toEqual({ venue: 1235 });
    expect(setActual(spent, "venue", 0).actuals).toEqual({});
    expect(setActual(spent, "venue", Number.NaN).actuals).toEqual({});
    expect(setActual(spent, "venue", -5).actuals).toEqual({});
  });
});

describe("form state", () => {
  it("round-trips a brief and caps priorities", () => {
    const form = toFormState(makeBrief({ priorities: ["food", "decor"] }));
    expect(form.guests).toBe("200");
    const three = togglePriority(form.priorities, "photography");
    expect(three).toHaveLength(LIMITS.prioritiesMax);
    expect(togglePriority(three, "entertainment")).toBe(three);
    expect(togglePriority(three, "food")).not.toContain("food");
  });

  it("validates with the shared schema and the date window", () => {
    const valid = validateForm(toFormState(makeBrief({ date: addDays(TODAY, 30) })), TODAY);
    expect(valid.ok).toBe(true);
    const past = validateForm(toFormState(makeBrief({ date: addDays(TODAY, -3) })), TODAY);
    expect(past.ok ? null : past.errors.date).toMatch(/today or later/);
    const empty = validateForm(EMPTY_FORM, TODAY);
    expect(empty.ok).toBe(false);
  });

  it("orders errors as they appear on screen and builds describedby ids", () => {
    expect(orderedErrors({ notes: "n", title: "t", unknown: "x" })).toEqual([
      ["title", "t"],
      ["notes", "n"],
    ]);
    expect(describedBy("budget", true, true)).toBe("budget-hint budget-error");
    expect(describedBy("city", false, false)).toBeUndefined();
  });
});

describe("countdownLabel", () => {
  it.each([
    [10, "10 days to go"],
    [1, "Tomorrow"],
    [0, "Today"],
    [-2, "Event has passed"],
  ])("labels %i days", (days, label) => {
    expect(countdownLabel(days)).toBe(label);
  });
});

describe("whatIfRanges", () => {
  it("uses a step that divides the saved total and keeps bounds within limits", () => {
    const ranges = whatIfRanges(500_000, 200);
    expect(500_000 % ranges.step).toBe(0);
    expect(ranges.budgetMin).toBeLessThan(500_000);
    expect(ranges.budgetMax).toBe(1_000_000);
    expect(ranges.guestsMin).toBe(50);
    expect(ranges.guestsMax).toBe(400);
  });

  it("falls back to a step of 1 for odd totals and caps at the platform limits", () => {
    expect(whatIfRanges(123_457, 3).step).toBe(1);
    expect(whatIfRanges(123_457, 3).guestsMax).toBe(10);
    expect(whatIfRanges(LIMITS.budgetMax, LIMITS.guestsMax).budgetMax).toBe(LIMITS.budgetMax);
    expect(whatIfRanges(LIMITS.budgetMax, LIMITS.guestsMax).guestsMax).toBe(LIMITS.guestsMax);
  });
});

describe("assistant history", () => {
  it("keeps only the most recent turns, each within the length limit", () => {
    const turns = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: "x".repeat(LIMITS.chatReplyMax + 50),
    }));
    const history = recentHistory(turns);
    expect(history).toHaveLength(LIMITS.chatHistoryMax);
    expect(history.every((turn) => turn.content.length === LIMITS.chatReplyMax)).toBe(true);
  });

  it("announces thinking, then only the latest reply", () => {
    expect(liveAnnouncement([], true)).toBe("Utsav is thinking.");
    expect(liveAnnouncement([{ role: "user", content: "hi" }], false)).toBe("");
    expect(liveAnnouncement([{ role: "assistant", content: "Hello" }], false)).toBe(
      "Utsav replied: Hello",
    );
  });
});
