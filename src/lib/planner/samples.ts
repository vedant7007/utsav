import type { EventBriefInput } from "./schema";
import { addDays } from "./timeline";

/** Ready-made briefs so a first-time visitor can see a full plan in one click. */
export function sampleBriefs(
  today: string,
): { id: string; label: string; brief: EventBriefInput }[] {
  return [
    {
      id: "wedding",
      label: "Hyderabad wedding",
      brief: {
        eventType: "wedding",
        title: "Ananya and Rohan's Wedding",
        date: addDays(today, 120),
        city: "Hyderabad",
        guests: 250,
        budget: 1_500_000,
        currency: "INR",
        theme: "Royal Deccan with marigold and pearls",
        priorities: ["food", "photography"],
        notes: "Many vegetarian and Jain guests; grandparents need step-free access.",
      },
    },
    {
      id: "birthday",
      label: "Kid's space birthday",
      brief: {
        eventType: "birthday",
        title: "Aarav turns 8",
        date: addDays(today, 25),
        city: "Pune",
        guests: 30,
        budget: 40_000,
        currency: "INR",
        theme: "Outer space adventure",
        priorities: ["entertainment"],
        notes: "Two children have nut allergies.",
      },
    },
    {
      id: "community",
      label: "Neighbourhood Diwali mela",
      brief: {
        eventType: "community",
        title: "Green Park Diwali Mela",
        date: addDays(today, 20),
        city: "Bengaluru",
        guests: 400,
        budget: 200_000,
        currency: "INR",
        theme: "Eco-friendly festival of lights",
        priorities: ["food", "entertainment"],
        notes: "Zero single-use plastic. Need a kids' zone.",
      },
    },
  ];
}
