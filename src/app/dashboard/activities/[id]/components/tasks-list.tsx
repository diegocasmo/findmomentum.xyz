"use client";

import { useCallback, useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "@/app/dashboard/activities/[id]/components/task-card";
import { NoTasks } from "@/app/dashboard/activities/[id]/components/no-tasks";
import type { TaskWithTimeEntries } from "@/types";
import { updateTaskPositionAction } from "@/app/actions/update-task-position-action";
import { toast } from "@/hooks/use-toast";
import { Loader2Icon } from "lucide-react";

const findTaskIndex = (tasks: TaskWithTimeEntries[], id: string) =>
  tasks.findIndex((item) => item.id === id);

const getNewPosition = (
  tasks: TaskWithTimeEntries[],
  newIndex: number,
  oldIndex: number
): string => {
  if (newIndex === 0) return "top";
  if (newIndex === tasks.length - 1) return "bottom";
  return tasks[newIndex > oldIndex ? newIndex : newIndex - 1].id;
};

const ERROR_MESSAGE_CONFIG: Parameters<typeof toast>[0] = {
  title: "Error",
  description: "Failed to update task position. Please try again.",
  variant: "destructive" as const,
};

type TasksListProps = {
  tasks: TaskWithTimeEntries[];
};

export function TasksList({ tasks: initialTasks }: TasksListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localTasks, setLocalTasks] =
    useState<TaskWithTimeEntries[]>(initialTasks);

  useEffect(() => {
    setLocalTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateTaskPosition = useCallback(
    async (taskId: string, newPosition: string) => {
      const formData = new FormData();
      formData.append("taskId", taskId);
      formData.append("newPosition", newPosition);

      try {
        const result = await updateTaskPositionAction(formData);
        if (result.success) {
          router.refresh();
        } else {
          toast(ERROR_MESSAGE_CONFIG);
        }
      } catch (error) {
        console.error("Error updating task position:", error);
        setLocalTasks(initialTasks); // Revert to original order
        toast(ERROR_MESSAGE_CONFIG);
      }
    },
    [router, initialTasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = findTaskIndex(localTasks, active.id as string);
        const newIndex = findTaskIndex(localTasks, over.id as string);

        setLocalTasks((tasks) => arrayMove(tasks, oldIndex, newIndex));

        startTransition(async () => {
          const newPosition = getNewPosition(localTasks, newIndex, oldIndex);
          await updateTaskPosition(active.id as string, newPosition);
        });
      }
    },
    [localTasks, updateTaskPosition]
  );

  if (localTasks.length === 0) {
    return <NoTasks />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localTasks}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-4 relative">
          {localTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {isPending && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <Loader2Icon className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
