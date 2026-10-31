import { EVENT_LABELS, type EventType } from "./constants";
import { formatDate } from "./format";
import type { AiIdeas, EventBrief, PlanIdeas } from "./schema";

/** Curated ideas used when Gemini is unavailable, so the plan is never empty. */
type CuratedSet = Omit<PlanIdeas, "summary" | "themeConcept" | "extraTasks" | "inviteMessage">;

const CURATED: Record<EventType, CuratedSet> = {
  wedding: {
    palette: [
      { name: "Sindoor red", hex: "#B3122E" },
      { name: "Marigold", hex: "#FFB400" },
      { name: "Haldi gold", hex: "#E8A317" },
      { name: "Mehendi green", hex: "#4F6B2A" },
      { name: "Pearl", hex: "#F4EFE6" },
    ],
    runSheet: [
      { time: "9:00 AM", activity: "Decor, mandap and sound check complete" },
      { time: "11:00 AM", activity: "Family arrives; welcome drinks and photos" },
      { time: "12:30 PM", activity: "Baraat and varmala" },
      { time: "1:30 PM", activity: "Ceremony at the muhurat" },
      { time: "3:00 PM", activity: "Lunch for guests" },
      { time: "5:00 PM", activity: "Vidaai and vendor wrap-up" },
    ],
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
    palette: [
      { name: "Party pink", hex: "#E4007C" },
      { name: "Sunny yellow", hex: "#FFC93C" },
      { name: "Sky blue", hex: "#3FA9F5" },
      { name: "Mint", hex: "#7ED6B1" },
    ],
    runSheet: [
      { time: "4:00 PM", activity: "Setup: balloons, cake table and music" },
      { time: "5:00 PM", activity: "Guests arrive; welcome game" },
      { time: "5:45 PM", activity: "Main activity or entertainer" },
      { time: "6:30 PM", activity: "Cake cutting and group photo" },
      { time: "7:00 PM", activity: "Food and return gifts" },
    ],
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
    palette: [
      { name: "Rose", hex: "#C2185B" },
      { name: "Champagne", hex: "#E8D3A9" },
      { name: "Ivory", hex: "#FFF8EC" },
      { name: "Wine", hex: "#5E1A2B" },
    ],
    runSheet: [
      { time: "7:00 PM", activity: "Guests arrive; welcome drinks" },
      { time: "7:30 PM", activity: "Memory reel and speeches" },
      { time: "8:00 PM", activity: "Toast and first dance" },
      { time: "8:30 PM", activity: "Dinner" },
      { time: "9:30 PM", activity: "Cake, music and farewells" },
    ],
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
    palette: [
      { name: "Diya orange", hex: "#F26B1D" },
      { name: "Peacock", hex: "#006D6F" },
      { name: "Rani pink", hex: "#D6006F" },
      { name: "Night sky", hex: "#1A1033" },
    ],
    runSheet: [
      { time: "2:00 PM", activity: "Volunteer briefing and stall setup" },
      { time: "4:00 PM", activity: "Gates open; kids' zone starts" },
      { time: "5:30 PM", activity: "Cultural performances" },
      { time: "7:00 PM", activity: "Main event and sponsor thank-yous" },
      { time: "8:30 PM", activity: "Close, lost and found, cleanup" },
    ],
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
export function curatedIdeas(brief: EventBrief): PlanIdeas {
  const base = CURATED[brief.eventType];
  const theme = brief.theme || "a warm, personal celebration";
  const place = brief.city ? ` in ${brief.city}` : "";
  return {
    summary: `A ${brief.guests}-guest ${brief.eventType}${place} built around ${theme}. Budget, timeline and vendor checklist are ready below.`,
    themeConcept: `Bring "${theme}" to life through colour, food and one signature moment guests will remember.`,
    ...base,
    extraTasks: [],
    inviteMessage: inviteTemplate(brief),
  };
}

/** A plain, ready-to-send invitation used when Gemini is unavailable. */
export function inviteTemplate(brief: EventBrief): string {
  const place = brief.city ? ` in ${brief.city}` : "";
  return `You're invited! Join us for ${brief.title}, our ${EVENT_LABELS[brief.eventType].toLowerCase()}, on ${formatDate(brief.date)}${place}. Your presence will make the day complete. Please reply to confirm so we can plan for you.`;
}

/**
 * Fills any optional extras the AI left out (or that failed validation) from curated data,
 * so every plan has a palette, a run sheet and an invitation.
 */
export function withDefaults(ideas: AiIdeas, brief: EventBrief): PlanIdeas {
  const curated = curatedIdeas(brief);
  return {
    ...ideas,
    palette: ideas.palette ?? curated.palette,
    runSheet: ideas.runSheet ?? curated.runSheet,
    inviteMessage: ideas.inviteMessage ?? curated.inviteMessage,
  };
}
