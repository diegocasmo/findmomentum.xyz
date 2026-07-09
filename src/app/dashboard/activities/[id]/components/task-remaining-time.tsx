import { useCallback, useEffect, useState, useTransition } from "react";
import { formatTimeMMss } from "@/lib/utils/time";
import type { TaskWithTimeEntries } from "@/types";
import { isTaskRunning } from "@/lib/utils/is-task-running";
import { MS_PER_SECOND } from "@/lib/utils/time";
import { completeTaskAction } from "@/app/actions/complete-task-action";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2Icon } from "lucide-react";
import { getTaskRemainingTime } from "@/lib/utils/time";
import { sendNotification } from "@/components/notification-manager";

type TaskRemainingTimeProps = {
  task: TaskWithTimeEntries;
};

export function TaskRemainingTime({ task }: TaskRemainingTimeProps) {
  const [displayTime, setDisplayTime] = useState(getTaskRemainingTime(task));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleCompleteTask = useCallback(async () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("taskId", task.id);
        const result = await completeTaskAction(formData);

        if (result.success) {
          toast({
            title: "Task completed",
            description: `"${task.name}" has been marked as complete.`,
            variant: "default",
          });
          sendNotification(
            "Task Completed",
            `"${task.name}" has been marked as complete.`
          );
          router.refresh();
        } else {
          toast({
            title: "Failed to complete task",
            description:
              "An error occurred while completing the task. Please try again.",
            variant: "destructive",
          });
          console.error("Failed to complete task:", result.errors);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        console.error("Error completing task:", error);
      }
    });
  }, [task.id, task.name, router, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: prop-sync of displayTime when task changes; running branch (below) drives a 1-second tick countdown
    if (!isTaskRunning(task)) return setDisplayTime(getTaskRemainingTime(task));

    const timerId = setInterval(() => {
      const newRemainingTime = getTaskRemainingTime(task);
      setDisplayTime(newRemainingTime);

      if (newRemainingTime <= 0) {
        clearInterval(timerId);
        void handleCompleteTask();
      }
    }, MS_PER_SECOND);

    return () => clearInterval(timerId);
  }, [task, handleCompleteTask]);

  if (isPending) {
    return (
      <span className="flex items-center">
        <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
      </span>
    );
  }

  return formatTimeMMss(Math.max(0, displayTime));
}
