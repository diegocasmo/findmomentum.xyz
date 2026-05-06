import { ActivityCard } from "@/app/dashboard/components/activity-card";
import { NoActivities } from "@/app/dashboard/components/no-activities";
import type { ActivityWithTasksAndTimeEntries, CategoryOption } from "@/types";

type ActivitiesListProps = {
  activities: ActivityWithTasksAndTimeEntries[];
  categories: CategoryOption[];
};

export function ActivitiesList({ activities, categories }: ActivitiesListProps) {
  if (activities.length === 0) return <NoActivities />;

  return (
    <ul className="space-y-4">
      {activities.map((activity) => (
        <li key={activity.id}>
          <ActivityCard activity={activity} categories={categories} />
        </li>
      ))}
    </ul>
  );
}
