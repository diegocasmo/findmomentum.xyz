import {
  HourglassIcon,
  CheckCircle,
  PlayIcon,
  PauseIcon,
  Loader2Icon,
  GripVerticalIcon,
  TimerIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TaskActions } from "@/app/dashboard/activities/[id]/components/task-actions";
import type { TaskWithTimeEntries } from "@/types";
import { TaskRemainingTime } from "@/app/dashboard/activities/[id]/components/task-remaining-time";
import { cn } from "@/lib/utils";
import { useTransition } from "react";
import { playTaskAction } from "@/app/actions/play-task-action";
import { pauseTaskAction } from "@/app/actions/pause-task-action";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { isTaskRunning } from "@/lib/utils/is-task-running";
import { isTaskCompleted } from "@/lib/utils/is-task-completed";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatTimeMMss } from "@/lib/utils/time";
import { Badge } from "@/components/ui/badge";

type TaskCardProps = {
  task: TaskWithTimeEntries;
  color: string;
};

export function TaskCard({ task, color }: TaskCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isRunning = isTaskRunning(task);
  const isCompleted = isTaskCompleted(task);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggleTask = () => {
    if (isCompleted) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("taskId", task.id);

        const action = isRunning ? pauseTaskAction : playTaskAction;
        const result = await action(formData);

        if (result.success) {
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: `Failed to ${
              isRunning ? "pause" : "start"
            } the task. Please try again.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Task toggle error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn("transition-colors duration-200", {
          "hover:bg-secondary cursor-pointer": !isCompleted,
          "border-primary": isRunning,
          "border-green-500": isCompleted,
        })}
        onClick={handleToggleTask}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-grow min-w-0">
              <div
                {...listeners}
                className="touch-none p-2 -m-2 rounded-md hover:bg-secondary/50 transition-colors flex-shrink-0"
                aria-label="Drag to reorder task"
              >
                <GripVerticalIcon className="w-5 h-5 text-muted-foreground cursor-move" />
              </div>
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-muted-foreground" />
                ) : isPending ? (
                  <Loader2Icon className="w-5 h-5 animate-spin" />
                ) : isRunning ? (
                  <PauseIcon className="w-5 h-5" />
                ) : (
                  <PlayIcon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full flex-shrink-0",
                  isCompleted && "opacity-40"
                )}
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-md font-medium truncate",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 mt-1 sm:mt-0">
              <Badge
                variant="outline"
                className="flex items-center gap-1 px-2 py-1 font-normal order-1 sm:order-none"
                title="Initial Duration"
              >
                <TimerIcon className="w-3.5 h-3.5" />
                <span className="text-xs whitespace-nowrap">
                  {formatTimeMMss(task.durationMs)}
                </span>
              </Badge>

              <Badge
                variant="outline"
                className="flex items-center gap-1 px-2 py-1 font-normal order-2 sm:order-none"
                title="Remaining Time"
              >
                <HourglassIcon className="w-3.5 h-3.5" />
                <span className="text-xs whitespace-nowrap">
                  <TaskRemainingTime task={task} />
                </span>
              </Badge>

              <div className="order-3 sm:order-none ml-auto sm:ml-0">
                <TaskActions task={task} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
