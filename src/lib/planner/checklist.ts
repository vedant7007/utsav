import { type EventType, LARGE_EVENT_GUESTS } from "./constants";

export interface VendorTask {
  id: string;
  text: string;
}

export interface VendorGroup {
  id: string;
  vendor: string;
  /** Budget line this vendor is paid from, used to link the checklist with the budget. */
  budgetLineId: string;
  tasks: VendorTask[];
}

interface VendorTemplate {
  id: string;
  vendor: string;
  budgetLineId: string;
  tasks: string[];
  minGuests?: number;
}

const QUOTES = "Collect three quotes and compare inclusions";
const CONTRACT = "Sign a written agreement with dates, inclusions and cancellation terms";

export const VENDOR_TEMPLATES: Record<EventType, VendorTemplate[]> = {
  wedding: [
    {
      id: "venue",
      vendor: "Venue",
      budgetLineId: "venue",
      tasks: [QUOTES, "Check capacity, power backup and rain plan", CONTRACT],
    },
    {
      id: "caterer",
      vendor: "Caterer",
      budgetLineId: "catering",
      tasks: [QUOTES, "Book a tasting session", "Share dietary needs and the final headcount"],
    },
    {
      id: "decorator",
      vendor: "Decorator",
      budgetLineId: "decor",
      tasks: ["Share the theme moodboard", "Approve mandap and stage designs", CONTRACT],
    },
    {
      id: "photographer",
      vendor: "Photographer and videographer",
      budgetLineId: "photo",
      tasks: [
        "Review full wedding albums, not only highlights",
        "Share the must-have shot list",
        CONTRACT,
      ],
    },
    {
      id: "makeup",
      vendor: "Makeup and mehendi artists",
      budgetLineId: "attire",
      tasks: ["Book a trial", "Confirm call times for each function"],
    },
    {
      id: "music",
      vendor: "DJ, band and choreographer",
      budgetLineId: "music",
      tasks: [
        "Share the playlist and do-not-play list",
        "Confirm sound limits and curfew at the venue",
      ],
    },
    {
      id: "officiant",
      vendor: "Pandit or officiant",
      budgetLineId: "venue",
      tasks: ["Confirm the muhurat and ritual items list", "Arrange pickup and drop"],
    },
    {
      id: "transport",
      vendor: "Transport",
      budgetLineId: "transport",
      tasks: ["Book cars for the baraat and guest shuttles", "Share the pickup schedule"],
    },
    {
      id: "security",
      vendor: "Security and valet",
      budgetLineId: "contingency",
      minGuests: LARGE_EVENT_GUESTS,
      tasks: ["Book valet parking", "Plan gate entry and crowd control"],
    },
  ],
  birthday: [
    {
      id: "venue",
      vendor: "Venue",
      budgetLineId: "venue",
      tasks: [QUOTES, "Check timings, decor rules and cleanup", CONTRACT],
    },
    {
      id: "bakery",
      vendor: "Bakery",
      budgetLineId: "food",
      tasks: ["Finalise cake flavour, size and message", "Confirm delivery time"],
    },
    {
      id: "caterer",
      vendor: "Caterer or restaurant",
      budgetLineId: "food",
      tasks: [QUOTES, "Note allergies and kids' menu needs"],
    },
    {
      id: "decor",
      vendor: "Decor and balloons",
      budgetLineId: "decor",
      tasks: ["Share theme colours", "Confirm setup time"],
    },
    {
      id: "entertainer",
      vendor: "Entertainer or games host",
      budgetLineId: "fun",
      tasks: ["Agree the activity plan by age group", "Confirm duration and equipment"],
    },
    {
      id: "photographer",
      vendor: "Photographer",
      budgetLineId: "photo",
      tasks: ["Share key moments: cake cutting, family photo"],
    },
  ],
  anniversary: [
    {
      id: "venue",
      vendor: "Venue or restaurant",
      budgetLineId: "venue",
      tasks: [QUOTES, "Reserve private seating", CONTRACT],
    },
    {
      id: "caterer",
      vendor: "Caterer",
      budgetLineId: "catering",
      tasks: ["Plan a menu with the couple's favourite dishes", "Confirm the final headcount"],
    },
    {
      id: "florist",
      vendor: "Florist and decorator",
      budgetLineId: "decor",
      tasks: ["Choose flowers and table settings"],
    },
    {
      id: "music",
      vendor: "Musician or DJ",
      budgetLineId: "music",
      tasks: ["Request the couple's song for the first dance"],
    },
    {
      id: "photographer",
      vendor: "Photographer",
      budgetLineId: "photo",
      tasks: ["Plan a family portrait slot"],
    },
  ],
  community: [
    {
      id: "venue",
      vendor: "Venue and permissions",
      budgetLineId: "venue",
      tasks: [
        "Apply for police and municipal permission",
        "Get written venue confirmation",
        CONTRACT,
      ],
    },
    {
      id: "av",
      vendor: "Stage, sound and lighting",
      budgetLineId: "av",
      tasks: [QUOTES, "Confirm generator backup", "Schedule a sound check"],
    },
    {
      id: "food",
      vendor: "Food stalls or caterer",
      budgetLineId: "food",
      tasks: ["Check food safety licences", "Plan water stations and waste bins"],
    },
    {
      id: "printer",
      vendor: "Printer and signage",
      budgetLineId: "promo",
      tasks: ["Design posters and directional signs", "Print volunteer badges"],
    },
    {
      id: "medical",
      vendor: "First aid and safety",
      budgetLineId: "safety",
      tasks: [
        "Book a first-aid team or ambulance on standby",
        "Mark fire exits and the assembly point",
      ],
    },
    {
      id: "cleanup",
      vendor: "Cleanup crew",
      budgetLineId: "safety",
      tasks: ["Arrange segregated waste bins", "Book a post-event cleanup slot"],
    },
    {
      id: "security",
      vendor: "Security",
      budgetLineId: "safety",
      minGuests: LARGE_EVENT_GUESTS,
      tasks: ["Plan entry, exit and crowd barriers", "Share an emergency contact list"],
    },
  ],
};

/**
 * Builds the vendor checklist for an event.
 * @param eventType - template to use.
 * @param guests - guest count, which unlocks large-event vendors.
 * @param notes - host notes; dietary keywords add a catering task.
 */
export function buildChecklist(eventType: EventType, guests: number, notes: string): VendorGroup[] {
  const dietary = /\b(vegan|vegetarian|jain|halal|gluten|allerg|diabet|nut)/i.test(notes);
  return VENDOR_TEMPLATES[eventType]
    .filter((vendor) => vendor.minGuests === undefined || guests > vendor.minGuests)
    .map((vendor) => {
      const tasks = [...vendor.tasks];
      const isFood = ["caterer", "food"].includes(vendor.id);
      if (dietary && isFood) tasks.push("Confirm the special dietary requirements in your notes");
      return {
        id: vendor.id,
        vendor: vendor.vendor,
        budgetLineId: vendor.budgetLineId,
        tasks: tasks.map((text, index) => ({ id: `${vendor.id}-${index + 1}`, text })),
      };
    });
}

/**
 * Counts completed checklist tasks.
 * @param groups - the checklist.
 * @param done - ids of completed tasks.
 */
export function checklistProgress(
  groups: VendorGroup[],
  done: ReadonlySet<string>,
): { completed: number; total: number; percent: number } {
  const ids = groups.flatMap((group) => group.tasks.map((task) => task.id));
  const completed = ids.filter((id) => done.has(id)).length;
  const total = ids.length;
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}
