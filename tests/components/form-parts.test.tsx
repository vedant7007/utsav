// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorSummary } from "@/components/planner/error-summary";
import { EventTypePicker } from "@/components/planner/event-type-picker";
import { PriorityPicker } from "@/components/planner/priority-picker";
import { PlanHeader } from "@/components/plan/plan-header";
import { Field } from "@/components/ui/field";
import { buildPlan } from "@/lib/planner/plan";
import { makeBrief, TODAY } from "../fixtures";
import { axeViolations } from "./a11y";

describe("Field", () => {
  it("wires label, hint and error to the control", async () => {
    const { container } = render(
      <Field name="budget" label="Total budget" hint="Whole amount" error="Too small">
        {(control) => <input {...control} />}
      </Field>,
    );
    const input = screen.getByLabelText("Total budget");
    expect(input).toHaveAttribute("id", "field-budget");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Whole amount Too small");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("omits describedby when there is nothing to describe", () => {
    render(
      <Field name="city" label="City">
        {(control) => <input {...control} />}
      </Field>,
    );
    expect(screen.getByLabelText("City")).not.toHaveAttribute("aria-describedby");
  });
});

describe("ErrorSummary", () => {
  it("renders nothing without errors and links each error to its field", () => {
    const { container, rerender } = render(<ErrorSummary entries={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(
      <ErrorSummary
        entries={[
          ["title", "Give your event a name"],
          ["guests", "Add at least one guest"],
        ]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Please fix these 2 details");
    expect(screen.getByRole("link", { name: "Give your event a name" })).toHaveAttribute(
      "href",
      "#field-title",
    );
  });
});

describe("pickers", () => {
  it("reports the chosen event type", async () => {
    const onChange = vi.fn();
    render(<EventTypePicker value="wedding" onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: /Birthday/ }));
    expect(onChange).toHaveBeenCalledWith("birthday");
  });

  it("disables unchecked priorities once three are chosen", () => {
    render(
      <PriorityPicker value={["venue", "food", "decor"]} error="Pick fewer" onToggle={vi.fn()} />,
    );
    expect(screen.getByRole("checkbox", { name: /Photography/ })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /Venue/ })).toBeEnabled();
    expect(screen.getByRole("group", { name: /What matters most/ })).toHaveAccessibleDescription(
      /Pick fewer/,
    );
  });
});

describe("PlanHeader", () => {
  it("names the largest budget category for screen readers and wires the actions", async () => {
    const plan = buildPlan(makeBrief(), TODAY);
    const onEdit = vi.fn();
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<PlanHeader plan={plan} countdown="Today" onEdit={onEdit} onReset={vi.fn()} />);
    const largest = [...plan.budget.lines].sort((a, b) => b.amount - a.amount)[0];
    expect(
      screen.getByRole("img", { name: new RegExp(`largest is ${largest?.label}`) }),
    ).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Edit details" }));
    await userEvent.click(screen.getByRole("button", { name: "Print or save PDF" }));
    expect(onEdit).toHaveBeenCalled();
    expect(print).toHaveBeenCalled();
  });
});
