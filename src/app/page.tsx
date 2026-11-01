import type { JSX } from "react";
import { PlannerApp } from "@/components/planner/planner-app";
import { todayIso } from "@/lib/planner/format";

export default function HomePage(): JSX.Element {
  return <PlannerApp today={todayIso()} />;
}
