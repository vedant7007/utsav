import { useId } from "react";
import { RANGOLI_COLORS } from "@/components/brand/rangoli";
import type { BudgetLine, SpendRow } from "@/lib/planner/budget";
import { formatPercent } from "@/lib/planner/format";

interface SpendTableProps {
  rows: SpendRow[];
  lines: BudgetLine[];
  total: number;
  actualTotal: number;
  actuals: Record<string, number>;
  activeId: string | null;
  money: (amount: number) => string;
  onActiveChange: (lineId: string | null) => void;
  onActualChange: (lineId: string, amount: number) => void;
}

/** Budget breakdown with an editable actual-spend column, linked to the rangoli chart. */
export function SpendTable(props: SpendTableProps) {
  const { rows, lines, actuals, activeId, money, onActiveChange } = props;
  const captionId = useId();

  return (
    <div className="sticker overflow-x-auto p-5">
      <h3 className="display text-2xl">Budget breakdown and spend tracker</h3>
      <table
        className="mt-3 w-full min-w-[600px] border-collapse text-left"
        aria-describedby={captionId}
      >
        <caption id={captionId} className="sr-only">
          Planned amount, share of total and actual spend for each category. Priority categories are
          marked.
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
          {rows.map((row, index) => {
            const line = lines[index];
            const inputId = `actual-${row.id}`;
            return (
              <tr
                key={row.id}
                className={`border-b border-ink/15 align-middle ${activeId === row.id ? "bg-sun" : ""}`}
                onMouseEnter={() => onActiveChange(row.id)}
                onMouseLeave={() => onActiveChange(null)}
                onFocus={() => onActiveChange(row.id)}
                onBlur={() => onActiveChange(null)}
              >
                <th scope="row" className="py-2.5 pr-3 font-semibold">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 rounded-full border border-ink"
                      style={{ backgroundColor: RANGOLI_COLORS[index % RANGOLI_COLORS.length] }}
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
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {money(line?.amount ?? row.planned)}
                </td>
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
                    onChange={(event) => props.onActualChange(row.id, Number(event.target.value))}
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
            <td className="py-2.5 pr-3 text-right tabular-nums">{money(props.total)}</td>
            <td className="py-2.5 text-right tabular-nums">{money(props.actualTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
