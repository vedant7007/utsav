import { PlannerApp } from "@/components/planner/planner-app";
import { todayIso } from "@/lib/planner/format";

export default function HomePage() {
  return <PlannerApp today={todayIso()} />;
}
