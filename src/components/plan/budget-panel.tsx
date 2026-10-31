"use client";

import { useId, useState } from "react";
import { Rangoli, RANGOLI_COLORS } from "@/components/brand/rangoli";
import { type BudgetPlan, buildBudget, summariseSpend } from "@/lib/planner/budget";
import { formatMoney, formatPercent } from "@/lib/planner/format";
import type { EventBrief } from "@/lib/planner/schema";

interface BudgetPanelProps {
  brief: EventBrief;
  budget: BudgetPlan;
  actuals: Record<string, number>;
  onActualChange: (lineId: string, amount: number) => void;
}

/** Rounds a slider value to a friendly step so amounts read cleanly. */
function niceStep(total: number): number {
  const magnitude = 10 ** Math.max(Math.floor(Math.log10(Math.max(total, 1))) - 2, 0);
  return Math.max(magnitude, 1);
}

/**
 * Budget split with a what-if simulator (drag budget or guest count and watch every line and
 * the per-guest figure update), a rangoli chart linked to the table, and a spend tracker.
 */
export function BudgetPanel({ brief, budget, actuals, onActualChange }: BudgetPanelProps) {
  const captionId = useId();
  const [total, setTotal] = useState(budget.total);
  const [guests, setGuests] = useState(brief.guests);
  const [active, setActive] = useState<string | null>(null);
  const whatIf = total !== budget.total || guests !== brief.guests;
  const view = whatIf
    ? buildBudget(brief.eventType, total, guests, budget.currency, brief.priorities)
    : budget;
  const summary = summariseSpend(view.lines, actuals);
  const money = (amount: number) => formatMoney(amount, budget.currency);
  const step = niceStep(budget.total);

  return (
    <section aria-labelledby="budget-heading" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="sticker flex flex-col items-center p-5 text-ink">
          <Rangoli
            petals={view.lines.map((line) => ({
              id: line.id,
              label: line.label,
              share: line.share,
            }))}
            activeId={active}
            size={280}
            label={`Budget rangoli: ${view.lines.map((line) => `${line.label} ${formatPercent(line.share)}`).join(", ")}`}
            className="h-auto w-full max-w-[280px]"
          />
          <p className="mt-2 text-center text-sm text-muted">Point at a row to find its petal.</p>
        </div>

        <div className="sticker p-6">
          <h2 id="budget-heading" className="display text-3xl">
            What if?
          </h2>
          <p className="mt-1 text-muted">
            Drag to test a different budget or guest list. Your saved plan stays as it is.
          </p>
          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="whatif-budget" className="field-label">
                Total budget: <span className="tabular-nums">{money(total)}</span>
              </label>
              <input
                id="whatif-budget"
                type="range"
                min={Math.max(step, Math.round((budget.total * 0.25) / step) * step)}
                max={Math.round((budget.total * 2) / step) * step}
                step={step}
                value={total}
                onChange={(event) => setTotal(Number(event.target.value))}
                aria-valuetext={money(total)}
              />
            </div>
            <div>
              <label htmlFor="whatif-guests" className="field-label">
                Guests: <span className="tabular-nums">{guests}</span>
              </label>
              <input
                id="whatif-guests"
                type="range"
                min={Math.max(1, Math.round(brief.guests * 0.25))}
                max={Math.max(brief.guests * 2, 10)}
                step={1}
                value={guests}
                onChange={(event) => setGuests(Number(event.target.value))}
              />
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Budget" value={money(view.total)} tone="bg-sun" />
            <Stat
              label="Per guest"
              value={money(view.perGuest)}
              tone={view.tight ? "bg-alert-soft" : "bg-mint"}
            />
            <Stat label="Spent" value={money(summary.actualTotal)} tone="bg-blush" />
          </dl>
          <div aria-live="polite" className="mt-4 space-y-3">
            {view.tight && (
              <p className="rounded-2xl border-2 border-ink bg-sun p-3">
                <strong>Tight budget:</strong> {money(view.perGuest)} per guest is lean for this
                kind of event. See the saving tips in Ideas, or trim the guest list.
              </p>
            )}
            {whatIf && (
              <p className="flex flex-wrap items-center gap-3 font-semibold">
                Showing a what-if scenario.
                <button
                  type="button"
                  className="btn btn-ghost min-h-11 py-1.5 text-sm"
                  onClick={() => {
                    setTotal(budget.total);
                    setGuests(brief.guests);
                  }}
                >
                  Back to my plan
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {summary.overCount > 0 && (
        <p
          role="status"
          className="rounded-2xl border-2 border-alert bg-alert-soft p-4 font-bold text-alert"
        >
          {summary.overCount} {summary.overCount === 1 ? "category is" : "categories are"} over
          budget. Move money from the contingency buffer or another line.
        </p>
      )}

      <div className="sticker overflow-x-auto p-5">
        <h3 className="display text-2xl">Budget breakdown and spend tracker</h3>
        <table
          className="mt-3 w-full min-w-[600px] border-collapse text-left"
          aria-describedby={captionId}
        >
          <caption id={captionId} className="sr-only">
            Planned amount, share of total and actual spend for each category. Priority categories
            are marked.
          </caption>
          <thead>
            <tr className="border-b-2 border-ink text-sm">
              <th scope="col" className="py-2 pr-3">
                Category
              </th>
              <th scope="col" className="py-2 pr-3">
                Share
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                Planned
              </th>
              <th scope="col" className="py-2 text-right">
                Actual spend
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row, index) => {
              const line = view.lines[index];
              const inputId = `actual-${row.id}`;
              const color = RANGOLI_COLORS[index % RANGOLI_COLORS.length];
              return (
                <tr
                  key={row.id}
                  className={`border-b border-ink/15 align-middle ${active === row.id ? "bg-sun" : ""}`}
                  onMouseEnter={() => setActive(row.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(row.id)}
                  onBlur={() => setActive(null)}
                >
                  <th scope="row" className="py-2.5 pr-3 font-semibold">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-ink"
                        style={{ backgroundColor: color }}
                      />
                      {row.label}
                      {line?.priority && (
                        <span className="rounded-full border border-ink bg-mint px-2 py-0.5 text-xs font-bold">
                          Priority
                        </span>
                      )}
                    </span>
                  </th>
                  <td className="py-2.5 pr-3 tabular-nums">{formatPercent(line?.share ?? 0)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{money(row.planned)}</td>
                  <td className="py-2.5 text-right">
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
                      className="field-input w-36 text-right tabular-nums"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <th scope="row" className="py-2.5 pr-3">
                Total
              </th>
              <td className="py-2.5 pr-3">100%</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{money(summary.plannedTotal)}</td>
              <td className="py-2.5 text-right tabular-nums">{money(summary.actualTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-2xl border-2 border-ink p-3 ${tone}`}>
      <dt className="text-sm font-bold text-muted">{label}</dt>
      <dd className="mt-0.5 text-lg font-extrabold tabular-nums">{value}</dd>
    </div>
  );
}
