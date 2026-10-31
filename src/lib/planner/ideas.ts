import type { EventBrief } from "./schema";
import type { EventType } from "./constants";
import type { AiIdeas } from "./schema";

/** Curated ideas used when Gemini is unavailable, so the plan is never empty. */
const CURATED: Record<EventType, Omit<AiIdeas, "summary" | "themeConcept" | "extraTasks">> = {
  wedding: {
    decor: [
      "Marigold and mogra garlands with brass urli centrepieces",
      "A floral photo wall that doubles as the entrance arch",
      "Warm fairy-light canopies for the sangeet night",
    ],
    food: [
      "Live chaat and dosa counters for the welcome evening",
      "A regional thali that celebrates both families' cuisines",
      "Kulfi and paan station to close the reception",
    ],
    activities: [
      "Family dance-off at the sangeet with a friendly judge panel",
      "Guestbook of handwritten blessings for the couple",
      "Instant photo booth with props in the wedding colours",
    ],
    savingTips: [
      "Combine haldi and mehendi into one daytime function",
      "Choose seasonal flowers and reuse ceremony decor at the reception",
      "Send digital invitations and print only for elders",
    ],
  },
  birthday: {
    decor: [
      "Balloon garland in the theme colours behind the cake table",
      "A 'then and now' photo line on twine with mini pegs",
      "Personalised name banner and table confetti",
    ],
    food: [
      "Build-your-own mini burger or taco bar",
      "Theme cake with matching cupcakes for easy serving",
      "Mocktail counter with two signature drinks",
    ],
    activities: [
      "Treasure hunt with clues about the birthday person",
      "Karaoke round with a crowd-favourite playlist",
      "Memory jar where guests write a wish",
    ],
    savingTips: [
      "Host at home or in a society clubhouse",
      "Buy decor in bulk and reuse it for the next celebration",
      "Bake cupcakes at home and order a smaller cake",
    ],
  },
  anniversary: {
    decor: [
      "Candlelit tables with photos from each year together",
      "A timeline wall of milestones from the wedding day to now",
      "Fresh roses in the couple's wedding colours",
    ],
    food: [
      "Recreate the dishes served at the original wedding",
      "Plated dinner with a dessert named after the couple",
      "A toast with a signature drink",
    ],
    activities: [
      "Video messages from friends and family played after dinner",
      "Renewal of vows or a short speech by the children",
      "First-dance replay with the original song",
    ],
    savingTips: [
      "Book a weekday dinner slot at a favourite restaurant",
      "Make the memory reel yourself with free editing apps",
      "Keep the guest list to close family and friends",
    ],
  },
  community: {
    decor: [
      "Upcycled bunting made by local school children",
      "Clear signage with large text and icons for accessibility",
      "Fairy-lit stalls with a shared colour theme",
    ],
    food: [
      "Local home-chef stalls with fixed, affordable prices",
      "Free water stations with refillable cups",
      "Food coupons to speed up queues",
    ],
    activities: [
      "Open mic and cultural performances by residents",
      "Kids' corner with drawing and storytelling",
      "Recognition moment for volunteers and sponsors",
    ],
    savingTips: [
      "Seek in-kind sponsorship for sound, printing and water",
      "Borrow chairs and tables from schools or temples",
      "Use free WhatsApp and Instagram promotion before paid ads",
    ],
  },
};

/**
 * Personalised ideas built from templates and the brief, used offline or as an AI fallback.
 * @param brief - validated event brief.
 */
export function curatedIdeas(brief: EventBrief): AiIdeas {
  const base = CURATED[brief.eventType];
  const theme = brief.theme || "a warm, personal celebration";
  const place = brief.city ? ` in ${brief.city}` : "";
  return {
    summary: `A ${brief.guests}-guest ${brief.eventType}${place} built around ${theme}. Budget, timeline and vendor checklist are ready below.`,
    themeConcept: `Bring "${theme}" to life through colour, food and one signature moment guests will remember.`,
    ...base,
    extraTasks: [],
  };
}
