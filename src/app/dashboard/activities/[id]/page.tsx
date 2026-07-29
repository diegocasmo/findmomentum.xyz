import { Suspense } from "react";
import dynamic from "next/dynamic";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getActivity } from "@/lib/services/get-activity";
import { getCategories } from "@/lib/services/get-categories";
import {
  TasksList,
  TasksListHeader,
} from "@/app/dashboard/activities/[id]/components/tasks-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimer } from "@/app/dashboard/activities/[id]/components/activity-timer";
import { CompleteActivity } from "@/components/complete-activity";
import { ActivityPageSkeleton } from "@/components/activity-page-skeleton";
import { ActivityHeader } from "@/app/dashboard/activities/[id]/components/activity-header";

const ActivityCompletedCard = dynamic(() =>
  import("@/components/activity-completed-card").then((m) => ({
    default: m.ActivityCompletedCard,
  }))
);

type ActivityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ActivityPage({ params }: ActivityPageProps) {
  const session = await auth();
  const userId = session?.user?.id;
  const activityId = (await params).id;

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const [activity, categories] = await Promise.all([
    getActivity({ id: activityId, userId }),
    getCategories({ userId }),
  ]);

  if (!activity) {
    notFound();
  }

  return (
    <Suspense fallback={<ActivityPageSkeleton />}>
      <div className="container mx-auto space-y-8 h-full flex flex-col">
        <ActivityHeader activity={activity} categories={categories} />
        {activity.completedAt ? (
          <div className="flex justify-center">
            <ActivityCompletedCard activity={activity} />
          </div>
        ) : (
          <div className="flex-grow grid grid-cols-1 gap-8 h-full">
            <Card className="flex flex-col">
              <CardHeader className="space-y-4 p-4">
                <div className="flex items-center justify-between flex-col space-y-4">
                  <ActivityTimer activity={activity} />
                  <CompleteActivity activity={activity} />
                </div>
                <CardTitle className="text-2xl font-semibold">
                  <TasksListHeader activityId={activity.id} />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto p-4">
                <TasksList tasks={activity.tasks} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Suspense>
  );
}
