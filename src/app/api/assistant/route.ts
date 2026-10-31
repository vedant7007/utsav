import { getModel } from "@/lib/ai/gemini";
import { createAssistantHandler } from "@/lib/http/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createAssistantHandler({ model: getModel });
