import { ActivityCard } from "@/app/dashboard/components/activity-card";
import { NoActivities } from "@/app/dashboard/components/no-activities";
import type { ActivityWithTasksAndTimeEntries } from "@/types";

type ActivitiesListProps = {
  activities: ActivityWithTasksAndTimeEntries[];
  timezone?: string;
};

export function ActivitiesList({
  activities,
  timezone = "UTC",
}: ActivitiesListProps) {
  if (activities.length === 0) return <NoActivities />;

  return (
    <ul className="space-y-4">
      {activities.map((activity) => (
        <li key={activity.id}>
          <ActivityCard activity={activity} timezone={timezone} />
        </li>
      ))}
    </ul>
  );
}
