"use client";

import { type SubmitEvent, useEffect, useMemo, useRef, useState, type JSX } from "react";
import {
  EMPTY_FORM,
  type FormState,
  orderedErrors,
  toFormState,
  togglePriority,
  validateForm,
} from "@/lib/planner/form-state";
import { sampleBriefs } from "@/lib/planner/samples";
import type { EventBrief, EventBriefInput } from "@/lib/planner/schema";
import { BriefFields, NotesField, type UpdateField } from "./brief-fields";
import { ErrorSummary } from "./error-summary";
import { EventTypePicker } from "./event-type-picker";
import { PriorityPicker } from "./priority-picker";
import { SamplePicker } from "./sample-picker";
import { SubmitBar } from "./submit-bar";

interface PlannerFormProps {
  today: string;
  initial?: EventBriefInput | null;
  busy: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (brief: EventBrief) => void;
}

/** Collects and validates the event brief. Errors are summarised at the top and linked to fields. */
export function PlannerForm({
  today,
  initial,
  busy,
  serverErrors = {},
  onSubmit,
}: PlannerFormProps): JSX.Element {
  const [form, setForm] = useState<FormState>(initial ? toFormState(initial) : EMPTY_FORM);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [failedSubmits, setFailedSubmits] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const samples = useMemo(() => sampleBriefs(today), [today]);
  const errors: Record<string, string | undefined> = { ...serverErrors, ...clientErrors };

  // After a failed submit, move focus to the summary so screen reader users hear what to fix.
  useEffect(() => {
    if (failedSubmits > 0) summaryRef.current?.focus();
  }, [failedSubmits]);

  const update: UpdateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = validateForm(form, today);
    setClientErrors(result.ok ? {} : result.errors);
    if (result.ok) onSubmit(result.brief);
    else setFailedSubmits((count) => count + 1);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="brief-heading"
      aria-busy={busy}
      className="sticker p-5 sm:p-9"
    >
      <h2 id="brief-heading" className="display text-4xl sm:text-5xl">
        Tell Utsav about your celebration
      </h2>
      <p className="mt-2 text-muted">
        Fields marked with an asterisk are required. Everything else makes the plan more personal.
      </p>

      <SamplePicker
        samples={samples}
        onPick={(sample) => {
          setForm(toFormState(sample.brief));
          setClientErrors({});
        }}
      />
      <ErrorSummary
        ref={summaryRef}
        entries={orderedErrors({ ...serverErrors, ...clientErrors })}
      />
      <EventTypePicker value={form.eventType} onChange={(type) => update("eventType", type)} />

      <BriefFields form={form} errors={errors} today={today} update={update} />
      <PriorityPicker
        value={form.priorities}
        error={errors.priorities}
        onToggle={(priority) => update("priorities", togglePriority(form.priorities, priority))}
      />

      <NotesField form={form} errors={errors} update={update} />
      <SubmitBar busy={busy} />
    </form>
  );
}
