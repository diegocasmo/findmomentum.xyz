import { getBookmarkedActivities } from "@/lib/services/get-bookmarked-activities";
import { ActivityCard } from "@/app/dashboard/components/activity-card";
import { NoBookmarkedActivities } from "@/app/dashboard/components/no-bookmarked-activities";
import { getUserTimezone } from "@/lib/utils/timezone";

type BookmarkedActivitiesListProps = {
  userId: string;
};

export async function BookmarkedActivitiesList({
  userId,
}: BookmarkedActivitiesListProps) {
  const [activities, timezone] = await Promise.all([
    getBookmarkedActivities({ userId }),
    getUserTimezone(),
  ]);

  if (activities.length === 0) return <NoBookmarkedActivities />;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity) => (
          <ActivityCard
            activity={activity}
            key={activity.id}
            showCompletedAt={false}
            showDescription={false}
            timezone={timezone}
          />
        ))}
      </div>
    </div>
  );
}
