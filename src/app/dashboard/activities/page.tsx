import ActivityManager from "./ActivityManager";
import { getAllActivities } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const activities = await getAllActivities();
  return <ActivityManager activities={activities} />;
}
