"use client";

import { type KeyboardEvent, type ReactNode, useId, useRef, type JSX } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  label: string;
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * WAI-ARIA tabs with automatic activation: Arrow keys move between tabs, Home and End jump
 * to the ends, and only the active tab is in the Tab order.
 */
export function Tabs({ label, items, active, onChange }: TabsProps): JSX.Element {
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const item = items[next];
    if (!item) return;
    onChange(item.id);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="no-print flex gap-2 overflow-x-auto pb-3">
        {items.map((item, index) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`min-h-12 whitespace-nowrap rounded-full border-2 border-ink px-5 py-2 text-lg font-bold transition-transform ${
                selected
                  ? "-translate-y-0.5 bg-rani text-white shadow-[4px_4px_0_#1a1033]"
                  : "bg-paper hover:bg-sun"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== active}
          tabIndex={0}
          className="pt-4 focus:outline-none"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
