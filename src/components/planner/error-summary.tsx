import type { Ref } from "react";

interface ErrorSummaryProps {
  entries: Array<[string, string]>;
  ref?: Ref<HTMLDivElement>;
}

/** Lists every validation error with a link to its field. Receives focus after a failed submit. */
export function ErrorSummary({ entries, ref }: ErrorSummaryProps) {
  if (entries.length === 0) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="mt-5 rounded-2xl border-2 border-alert bg-alert-soft p-4"
      aria-labelledby="error-summary-title"
    >
      <h3 id="error-summary-title" className="font-bold text-alert">
        Please fix {entries.length === 1 ? "this detail" : `these ${entries.length} details`}
      </h3>
      <ul className="mt-2 list-disc pl-5">
        {entries.map(([key, message]) => (
          <li key={key}>
            <a className="font-semibold text-alert underline" href={`#field-${key}`}>
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
