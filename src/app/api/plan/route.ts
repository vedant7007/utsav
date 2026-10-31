import { getModel } from "@/lib/ai/gemini";
import { createPlanHandler } from "@/lib/http/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createPlanHandler({ model: getModel });
