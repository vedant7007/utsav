"use client";

import { useId } from "react";
import { type BudgetPlan, summariseSpend } from "@/lib/planner/budget";
import { formatMoney, formatPercent } from "@/lib/planner/format";

interface BudgetPanelProps {
  budget: BudgetPlan;
  actuals: Record<string, number>;
  onActualChange: (lineId: string, amount: number) => void;
}

/** Budget split as an accessible table with inline bars, plus a planned-versus-actual tracker. */
export function BudgetPanel({ budget, actuals, onActualChange }: BudgetPanelProps) {
  const captionId = useId();
  const summary = summariseSpend(budget.lines, actuals);
  const money = (amount: number) => formatMoney(amount, budget.currency);

  return (
    <section aria-labelledby="budget-heading" className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total budget" value={money(budget.total)} />
        <Stat label="Per guest" value={money(budget.perGuest)} />
        <Stat
          label="Spent so far"
          value={money(summary.actualTotal)}
          detail={`${money(Math.max(summary.remaining, 0))} remaining`}
        />
      </div>

      {budget.tight && (
        <p role="note" className="rounded-xl border-l-4 border-marigold bg-marigold-soft p-4">
          <strong>Tight budget:</strong> {money(budget.perGuest)} per guest is lean for this kind of
          event. See the saving tips in the Ideas tab, or trim the guest list.
        </p>
      )}
      {summary.overCount > 0 && (
        <p role="status" className="rounded-xl border-l-4 border-alert bg-alert-soft p-4 font-semibold text-alert">
          {summary.overCount} {summary.overCount === 1 ? "category is" : "categories are"} over budget.
          Move money from the contingency buffer or another line.
        </p>
      )}

      <div className="card overflow-x-auto p-4">
        <h3 id="budget-heading" className="font-[family-name:var(--font-display)] text-xl font-bold text-maroon">
          Budget breakdown
        </h3>
        <table className="mt-3 w-full min-w-[560px] border-collapse text-left" aria-describedby={captionId}>
          <caption id={captionId} className="sr-only">
            Planned amount, share of total and actual spend for each category. Priority categories
            are marked.
          </caption>
          <thead>
            <tr className="border-b border-line text-sm text-muted">
              <th scope="col" className="py-2 pr-3">Category</th>
              <th scope="col" className="py-2 pr-3">Share</th>
              <th scope="col" className="py-2 pr-3 text-right">Planned</th>
              <th scope="col" className="py-2 text-right">Actual spend</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row, index) => {
              const line = budget.lines[index];
              const inputId = `actual-${row.id}`;
              return (
                <tr key={row.id} className="border-b border-line/70 align-middle">
                  <th scope="row" className="py-2 pr-3 font-semibold">
                    {row.label}
                    {line?.priority && (
                      <span className="ml-2 rounded-full bg-leaf-soft px-2 py-0.5 text-xs font-bold text-leaf">
                        Priority
                      </span>
                    )}
                  </th>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="w-10 text-sm tabular-nums">{formatPercent(line?.share ?? 0)}</span>
                      <span aria-hidden="true" className="h-2.5 w-28 overflow-hidden rounded-full bg-cream">
                        <span
                          className="block h-full rounded-full bg-marigold"
                          style={{ width: `${Math.min((line?.share ?? 0) * 250, 100)}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{money(row.planned)}</td>
                  <td className="py-2 text-right">
                    <label htmlFor={inputId} className="sr-only">
                      Actual spend on {row.label}
                    </label>
                    <input
                      id={inputId}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="0"
                      value={actuals[row.id] ?? ""}
                      onChange={(event) => onActualChange(row.id, Number(event.target.value))}
                      aria-invalid={row.over}
                      className={`field-input w-32 text-right tabular-nums ${row.over ? "text-alert" : ""}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <th scope="row" className="py-2 pr-3">Total</th>
              <td className="py-2 pr-3">100%</td>
              <td className="py-2 pr-3 text-right tabular-nums">{money(summary.plannedTotal)}</td>
              <td className="py-2 text-right tabular-nums">{money(summary.actualTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{value}</p>
      {detail && <p className="text-sm text-muted">{detail}</p>}
    </div>
  );
}
