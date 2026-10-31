"use client";

import { checklistProgress, type VendorGroup } from "@/lib/planner/checklist";

interface VendorPanelProps {
  checklist: VendorGroup[];
  done: string[];
  onToggle: (taskId: string) => void;
}

/** Vendor-by-vendor checklist with progress that is announced to assistive technology. */
export function VendorPanel({ checklist, done, onToggle }: VendorPanelProps) {
  const doneSet = new Set(done);
  const progress = checklistProgress(checklist, doneSet);

  return (
    <section aria-labelledby="vendor-heading" className="space-y-5">
      <div className="sticker bg-mint p-5">
        <h2 id="vendor-heading" className="display text-3xl">
          Vendor checklist
        </h2>
        <label htmlFor="vendor-progress" className="mt-2 block font-bold">
          {progress.completed} of {progress.total} tasks done ({progress.percent}%)
        </label>
        <progress
          id="vendor-progress"
          className="mt-2 h-4 w-full accent-[#c4005f]"
          max={progress.total}
          value={progress.completed}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {checklist.map((group) => {
          const groupDone = group.tasks.filter((task) => doneSet.has(task.id)).length;
          return (
            <fieldset key={group.id} className="sticker p-5">
              <legend className="sr-only">{group.vendor}</legend>
              <div className="flex items-baseline justify-between gap-2" aria-hidden="true">
                <h3 className="text-lg font-extrabold">{group.vendor}</h3>
                <span className="rounded-full border-2 border-ink bg-sun px-2 text-sm font-bold">
                  {groupDone}/{group.tasks.length}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {group.tasks.map((task) => {
                  const checked = doneSet.has(task.id);
                  return (
                    <li key={task.id}>
                      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-sun">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(task.id)}
                          className="mt-1 h-5 w-5 shrink-0 accent-[#c4005f]"
                        />
                        <span className={checked ? "text-muted line-through" : ""}>
                          {task.text}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}
