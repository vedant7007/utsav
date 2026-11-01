import { EVENT_LABELS, EVENT_TYPES, type EventType } from "@/lib/planner/constants";

const EVENT_ICONS: Record<EventType, string> = {
  wedding: "💍",
  birthday: "🎂",
  anniversary: "💞",
  community: "🪔",
};

interface EventTypePickerProps {
  value: string;
  onChange: (type: EventType) => void;
}

/** Large radio cards for the kind of celebration. */
export function EventTypePicker({ value, onChange }: EventTypePickerProps) {
  return (
    <fieldset className="mt-6">
      <legend className="field-label">Type of event *</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {EVENT_TYPES.map((type) => {
          const checked = value === type;
          return (
            <label
              key={type}
              className={`flex min-h-14 cursor-pointer items-center gap-2 rounded-2xl border-2 border-ink px-3 py-2 text-lg font-bold transition-transform ${
                checked
                  ? "-translate-y-0.5 bg-marigold shadow-[4px_4px_0_#1a1033]"
                  : "bg-paper hover:bg-sun"
              }`}
            >
              <input
                id={type === EVENT_TYPES[0] ? "field-eventType" : undefined}
                type="radio"
                name="eventType"
                value={type}
                checked={checked}
                onChange={() => onChange(type)}
                className="h-4 w-4 accent-[#c4005f]"
              />
              <span aria-hidden="true">{EVENT_ICONS[type]}</span>
              {EVENT_LABELS[type]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
