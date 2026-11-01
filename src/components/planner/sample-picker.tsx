import type { SampleBrief } from "@/lib/planner/samples";

interface SamplePickerProps {
  samples: SampleBrief[];
  onPick: (sample: SampleBrief) => void;
}

/** One-click sample events so a host can see a full plan before typing anything. */
export function SamplePicker({ samples, onPick }: SamplePickerProps) {
  return (
    <div
      className="no-print mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-sun p-3"
      role="group"
      aria-label="Try a sample event"
    >
      <span className="px-1 font-bold">No details yet? Try a sample:</span>
      {samples.map((sample) => (
        <button
          key={sample.id}
          type="button"
          className="chip hover:bg-blush"
          onClick={() => onPick(sample)}
        >
          {sample.label}
        </button>
      ))}
    </div>
  );
}
