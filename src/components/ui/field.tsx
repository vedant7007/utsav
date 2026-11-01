import type { ReactNode } from "react";
import { describedBy } from "@/lib/planner/form-state";

/** Accessibility attributes shared by every form control. */
export interface FieldControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FieldProps {
  name: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * A labelled form field with an optional hint and error, wired together for assistive tech.
 * The control is rendered by `children`, which receives its id and ARIA attributes.
 */
export function Field({ name, label, hint, error, className, children }: FieldProps) {
  const id = `field-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy(name, Boolean(hint), Boolean(error)),
      })}
      {hint && (
        <p id={`${name}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      <FieldError name={name} error={error} />
    </div>
  );
}

/** The inline error under a field, referenced by the field's `aria-describedby`. */
export function FieldError({ name, error }: { name: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${name}-error`} className="field-error">
      {error}
    </p>
  );
}
