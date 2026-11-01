// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { PlanWorkspace } from "@/components/plan/plan-workspace";
import { restorePlan as restoreSaved } from "@/lib/planner/restore";
import { localTodayIso } from "@/lib/planner/format";
import { buildPlan } from "@/lib/planner/plan";
import { addDays } from "@/lib/planner/timeline";
import { makeBrief, TODAY } from "../fixtures";

describe("restoreSaved", () => {
  it("rebuilds numbers and dates from the brief and ignores tampered fields", () => {
    const plan = buildPlan(makeBrief(), TODAY);
    const tampered = {
      plan: {
        ...plan,
        budget: { lines: "boom" },
        ideas: { ...plan.ideas, palette: [{ name: "x", hex: "javascript:" }] },
        ideasSource: "gemini",
      },
      ai: "hacked",
    };
    const restored = restoreSaved(tampered, TODAY);
    expect(restored?.plan.budget.lines.length).toBeGreaterThan(5);
    expect(restored?.plan.ideasSource).toBe("curated");
    expect(restored?.ai).toBe("offline");
  });

  it("keeps validated Gemini ideas and recounts days from today", () => {
    const plan = {
      ...buildPlan(makeBrief({ date: addDays(TODAY, 30) }), TODAY),
      ideasSource: "gemini",
    };
    const restored = restoreSaved({ plan, ai: "ok" }, addDays(TODAY, 10));
    expect(restored?.plan.ideasSource).toBe("gemini");
    expect(restored?.plan.timeline.daysUntil).toBe(20);
  });

  it("rejects storage without a valid brief", () => {
    expect(restoreSaved({ plan: { brief: { title: "" } } }, TODAY)).toBeNull();
    expect(restoreSaved(null, TODAY)).toBeNull();
  });
});

describe("countdown wording", () => {
  const today = localTodayIso();
  const renderFor = (date: string) =>
    render(
      <PlanWorkspace
        plan={buildPlan(makeBrief({ date }), today)}
        aiStatus="ok"
        progress={{ done: [], actuals: {} }}
        onProgressChange={vi.fn()}
        onEdit={vi.fn()}
        onReset={vi.fn()}
      />,
    );

  it.each([
    [0, "Today"],
    [1, "Tomorrow"],
    [5, "5 days to go"],
  ])("shows the right label %i days out", (days, label) => {
    renderFor(addDays(today, days));
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  });
});
