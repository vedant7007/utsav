// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { PlanWorkspace } from "@/components/plan/plan-workspace";
import type { PlanProgress } from "@/lib/planner/restore";
import { buildPlan } from "@/lib/planner/plan";
import { addDays } from "@/lib/planner/timeline";
import { makeBrief } from "../fixtures";
import { axeViolations } from "./a11y";

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const plan = buildPlan(
  makeBrief({ date: addDays(today, 40), eventType: "birthday", guests: 20, budget: 30_000 }),
  today,
);

function Harness({ onReset = vi.fn(), onEdit = vi.fn() }) {
  const [progress, setProgress] = useState<PlanProgress>({ done: [], actuals: {} });
  return (
    <PlanWorkspace
      plan={plan}
      aiStatus="offline"
      progress={progress}
      onProgressChange={setProgress}
      onEdit={onEdit}
      onReset={onReset}
    />
  );
}

describe("PlanWorkspace", () => {
  it("renders the overview accessibly with an offline notice", async () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole("heading", { level: 1, name: "Test Wedding" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("offline mode");
    expect(screen.getAllByText("40 days to go").length).toBeGreaterThan(0);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("supports arrow-key navigation between tabs", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    overview.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Budget" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Budget" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Ask Utsav" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowLeft}{Home}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });

  it("tracks actual spend and warns when a category goes over", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("tab", { name: "Budget" }));
    const panel = screen.getByRole("tabpanel", { name: "Budget" });
    const venue = within(panel).getByLabelText("Actual spend on Venue");
    await user.type(venue, "999999");
    expect(within(panel).getByText(/1 category is over budget/)).toBeInTheDocument();
    expect(venue).toHaveAttribute("aria-invalid", "true");
    await user.clear(venue);
    expect(within(panel).queryByText(/over budget/)).not.toBeInTheDocument();
  });

  it("ticks vendor tasks and updates progress", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("tab", { name: "Vendors" }));
    const panel = screen.getByRole("tabpanel", { name: "Vendors" });
    const boxes = within(panel).getAllByRole("checkbox");
    await user.click(boxes[0] as HTMLElement);
    expect(
      within(panel).getByText(new RegExp(`1 of ${boxes.length} tasks done`)),
    ).toBeInTheDocument();
    await user.click(boxes[0] as HTMLElement);
    expect(
      within(panel).getByText(new RegExp(`0 of ${boxes.length} tasks done`)),
    ).toBeInTheDocument();
  });

  it("exports the timeline as an .ics file", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:utsav");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    render(<Harness />);
    await user.click(screen.getByRole("tab", { name: "Timeline" }));
    await user.click(screen.getByRole("button", { name: /Add to calendar/ }));
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 1_100));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:utsav");
  });

  it("shows ideas with their source and exposes edit and reset actions", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    const onEdit = vi.fn();
    render(<Harness onReset={onReset} onEdit={onEdit} />);
    await user.click(screen.getByRole("tab", { name: "Ideas" }));
    expect(screen.getByText(/Curated suggestions/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit details" }));
    await user.click(screen.getByRole("button", { name: "Start a new plan" }));
    expect(onEdit).toHaveBeenCalled();
    expect(onReset).toHaveBeenCalled();
  });
});
