/** One headline figure inside a definition list. */
export function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-2xl border-2 border-ink p-3 ${tone}`}>
      <dt className="text-sm font-bold text-muted">{label}</dt>
      <dd className="mt-0.5 text-lg font-extrabold tabular-nums">{value}</dd>
    </div>
  );
}
