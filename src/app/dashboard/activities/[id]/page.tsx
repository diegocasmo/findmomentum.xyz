import { Suspense } from "react";
import dynamic from "next/dynamic";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getActivity } from "@/lib/services/get-activity";
import { TasksList } from "@/app/dashboard/activities/[id]/components/tasks-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodoIcon, PlusCircleIcon } from "lucide-react";
import { ActivityTimer } from "@/app/dashboard/activities/[id]/components/activity-timer";
import { CompleteActivity } from "@/components/complete-activity";
import { UpsertTaskDialog } from "@/components/upsert-task-dialog";
import { ActivityPageSkeleton } from "@/components/activity-page-skeleton";
import { ActivityHeader } from "@/app/dashboard/activities/[id]/components/activity-header";
import { Button } from "@/components/ui/button";

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

  const activity = await getActivity({ id: activityId, userId });

  if (!activity) {
    notFound();
  }

  return (
    <Suspense fallback={<ActivityPageSkeleton />}>
      <div className="container mx-auto space-y-8 h-full flex flex-col">
        <ActivityHeader activity={activity} />
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
                <CardTitle className="text-2xl font-semibold flex justify-between items-center">
                  <div className="flex items-center">
                    <ListTodoIcon className="w-6 h-6 mr-2 text-primary" />
                    Tasks
                  </div>
                  <div>
                    <UpsertTaskDialog
                      activityId={activity.id}
                      aria-label="Create new task"
                    >
                      <Button variant="outline" className="w-full">
                        <PlusCircleIcon className="mr-2 h-4 w-4" />
                        Create Task
                      </Button>
                    </UpsertTaskDialog>
                  </div>
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
