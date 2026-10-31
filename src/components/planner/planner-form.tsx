"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CURRENCIES,
  EVENT_LABELS,
  EVENT_TYPES,
  LIMITS,
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  type Priority,
} from "@/lib/planner/constants";
import { validateEventDate } from "@/lib/planner/plan";
import { sampleBriefs } from "@/lib/planner/samples";
import { type EventBrief, type EventBriefInput, eventBriefSchema, fieldErrors } from "@/lib/planner/schema";

interface FormState {
  eventType: string;
  title: string;
  date: string;
  city: string;
  guests: string;
  budget: string;
  currency: string;
  theme: string;
  priorities: Priority[];
  notes: string;
}

const EMPTY: FormState = {
  eventType: "wedding",
  title: "",
  date: "",
  city: "",
  guests: "",
  budget: "",
  currency: "INR",
  theme: "",
  priorities: [],
  notes: "",
};

const FIELD_ORDER = ["eventType", "title", "date", "guests", "budget", "currency", "city", "theme", "priorities", "notes"];

function toFormState(brief: EventBriefInput): FormState {
  return {
    eventType: brief.eventType,
    title: brief.title,
    date: brief.date,
    city: brief.city ?? "",
    guests: String(brief.guests),
    budget: String(brief.budget),
    currency: brief.currency ?? "INR",
    theme: brief.theme ?? "",
    priorities: [...(brief.priorities ?? [])],
    notes: brief.notes ?? "",
  };
}

interface PlannerFormProps {
  today: string;
  initial?: EventBriefInput | null;
  busy: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (brief: EventBrief) => void;
}

/** Collects and validates the event brief. Errors are summarised at the top and linked to fields. */
export function PlannerForm({ today, initial, busy, serverErrors = {}, onSubmit }: PlannerFormProps) {
  const [form, setForm] = useState<FormState>(initial ? toFormState(initial) : EMPTY);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const samples = useMemo(() => sampleBriefs(today), [today]);
  const errors = { ...serverErrors, ...clientErrors };
  // After a failed submit, move focus to the summary so screen reader users hear what to fix.
  useEffect(() => {
    if (failedSubmits > 0) summaryRef.current?.focus();
  }, [failedSubmits]);

  const errorEntries = FIELD_ORDER.filter((key) => errors[key]).map((key) => [key, errors[key] as string]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function togglePriority(priority: Priority) {
    setForm((previous) => ({
      ...previous,
      priorities: previous.priorities.includes(priority)
        ? previous.priorities.filter((item) => item !== priority)
        : [...previous.priorities, priority],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = eventBriefSchema.safeParse(form);
    const next = result.success ? {} : fieldErrors(result.error);
    const dateError = form.date ? validateEventDate(form.date, today) : null;
    if (dateError && !next.date) next.date = dateError;
    setClientErrors(next);
    if (!result.success || dateError) {
      setFailedSubmits((count) => count + 1);
      return;
    }
    onSubmit(result.data);
  }

  const describedBy = (key: string, hint?: boolean) =>
    [hint ? `${key}-hint` : "", errors[key] ? `${key}-error` : ""].filter(Boolean).join(" ") || undefined;

  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`${key}-error`} className="field-error">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="brief-heading" className="card p-5 sm:p-8">
      <h2 id="brief-heading" className="font-[family-name:var(--font-display)] text-2xl font-bold text-maroon">
        Tell Utsav about your celebration
      </h2>
      <p className="mt-1 text-muted">Fields marked with an asterisk are required.</p>

      <div className="no-print mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Try a sample event">
        <span className="text-sm font-semibold text-muted">Try a sample:</span>
        {samples.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className="rounded-full border border-line bg-cream px-3 py-1.5 text-sm font-semibold text-maroon hover:bg-marigold-soft"
            onClick={() => {
              setForm(toFormState(sample.brief));
              setClientErrors({});
            }}
          >
            {sample.label}
          </button>
        ))}
      </div>

      {errorEntries.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="mt-5 rounded-xl border-2 border-alert bg-alert-soft p-4"
          aria-labelledby="error-summary-title"
        >
          <h3 id="error-summary-title" className="font-bold text-alert">
            Please fix {errorEntries.length === 1 ? "this detail" : `these ${errorEntries.length} details`}
          </h3>
          <ul className="mt-2 list-disc pl-5">
            {errorEntries.map(([key, message]) => (
              <li key={key}>
                <a className="font-semibold text-alert underline" href={`#field-${key}`}>
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="mt-6">
        <legend className="field-label">Type of event *</legend>
        <div id="field-eventType" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EVENT_TYPES.map((type) => (
            <label
              key={type}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 font-semibold ${
                form.eventType === type ? "border-maroon bg-marigold-soft text-maroon" : "border-line bg-paper"
              }`}
            >
              <input
                type="radio"
                name="eventType"
                value={type}
                checked={form.eventType === type}
                onChange={() => update("eventType", type)}
                className="h-4 w-4 accent-[#7a1f2b]"
              />
              {EVENT_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="field-title" className="field-label">
            Event name *
          </label>
          <input
            id="field-title"
            className="field-input"
            value={form.title}
            maxLength={LIMITS.nameMax}
            onChange={(event) => update("title", event.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy("title")}
            aria-required="true"
            autoComplete="off"
          />
          {fieldError("title")}
        </div>

        <div>
          <label htmlFor="field-date" className="field-label">
            Event date *
          </label>
          <input
            id="field-date"
            type="date"
            className="field-input"
            value={form.date}
            min={today}
            onChange={(event) => update("date", event.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={describedBy("date")}
            aria-required="true"
          />
          {fieldError("date")}
        </div>

        <div>
          <label htmlFor="field-guests" className="field-label">
            Expected guests *
          </label>
          <input
            id="field-guests"
            type="number"
            inputMode="numeric"
            min={LIMITS.guestsMin}
            max={LIMITS.guestsMax}
            className="field-input"
            value={form.guests}
            onChange={(event) => update("guests", event.target.value)}
            aria-invalid={Boolean(errors.guests)}
            aria-describedby={describedBy("guests")}
            aria-required="true"
          />
          {fieldError("guests")}
        </div>

        <div>
          <label htmlFor="field-budget" className="field-label">
            Total budget *
          </label>
          <input
            id="field-budget"
            type="number"
            inputMode="numeric"
            min={LIMITS.budgetMin}
            className="field-input"
            value={form.budget}
            onChange={(event) => update("budget", event.target.value)}
            aria-invalid={Boolean(errors.budget)}
            aria-describedby={describedBy("budget", true)}
            aria-required="true"
          />
          <p id="budget-hint" className="field-hint">
            Whole amount for everything, for example 500000.
          </p>
          {fieldError("budget")}
        </div>

        <div>
          <label htmlFor="field-currency" className="field-label">
            Currency
          </label>
          <select
            id="field-currency"
            className="field-input"
            value={form.currency}
            onChange={(event) => update("currency", event.target.value)}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="field-city" className="field-label">
            City
          </label>
          <input
            id="field-city"
            className="field-input"
            value={form.city}
            maxLength={LIMITS.cityMax}
            onChange={(event) => update("city", event.target.value)}
            aria-invalid={Boolean(errors.city)}
            aria-describedby={describedBy("city")}
            autoComplete="address-level2"
          />
          {fieldError("city")}
        </div>

        <div>
          <label htmlFor="field-theme" className="field-label">
            Theme or vibe
          </label>
          <input
            id="field-theme"
            className="field-input"
            value={form.theme}
            maxLength={LIMITS.themeMax}
            onChange={(event) => update("theme", event.target.value)}
            aria-invalid={Boolean(errors.theme)}
            aria-describedby={describedBy("theme", true)}
          />
          <p id="theme-hint" className="field-hint">
            For example: boho garden, retro Bollywood, minimal white.
          </p>
          {fieldError("theme")}
        </div>
      </div>

      <fieldset className="mt-5" aria-describedby={describedBy("priorities", true)}>
        <legend className="field-label">What matters most? (up to 3)</legend>
        <p id="priorities-hint" className="field-hint mb-2">
          Priorities get a bigger share of the budget.
        </p>
        <div id="field-priorities" className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((priority) => {
            const checked = form.priorities.includes(priority);
            const disabled = !checked && form.priorities.length >= 3;
            return (
              <label
                key={priority}
                className={`flex min-h-11 items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-semibold ${
                  checked ? "border-leaf bg-leaf-soft text-leaf" : "border-line bg-paper"
                } ${disabled ? "opacity-60" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => togglePriority(priority)}
                  className="h-4 w-4 accent-[#1d6b4f]"
                />
                {PRIORITY_LABELS[priority]}
              </label>
            );
          })}
        </div>
        {fieldError("priorities")}
      </fieldset>

      <div className="mt-5">
        <label htmlFor="field-notes" className="field-label">
          Anything else? Dietary needs, accessibility, traditions
        </label>
        <textarea
          id="field-notes"
          className="field-input min-h-24"
          value={form.notes}
          maxLength={LIMITS.notesMax}
          onChange={(event) => update("notes", event.target.value)}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={describedBy("notes", true)}
        />
        <p id="notes-hint" className="field-hint">
          {form.notes.length}/{LIMITS.notesMax} characters
        </p>
        {fieldError("notes")}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy} aria-describedby="submit-status">
          {busy ? "Planning your celebration..." : "Create my plan"}
        </button>
        <p id="submit-status" className="text-sm text-muted" aria-live="polite">
          {busy ? "Building budget, timeline, vendors and ideas. This takes a few seconds." : ""}
        </p>
      </div>
    </form>
  );
}
