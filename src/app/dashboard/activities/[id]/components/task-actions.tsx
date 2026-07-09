"use client";

import { Ellipsis, Pencil, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteTaskDialog } from "@/app/dashboard/activities/[id]/components/delete-task-dialog";
import { UpsertTaskDialog } from "@/components/upsert-task-dialog";
import type { TaskWithTimeEntries } from "@/types";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { duplicateTaskAction } from "@/app/actions/duplicate-task-action";

type TaskActionsProps = {
  task: TaskWithTimeEntries;
};

export function TaskActions({ task }: TaskActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleDuplicate = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("taskId", task.id);
        const result = await duplicateTaskAction(formData);

        if (result.success) {
          router.refresh();

          toast({
            title: "Success",
            description: "Task duplicated successfully.",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to duplicate task. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Duplicate task error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div
      onClick={(e) => {
        // Prevent click event from bubbling up and causing a side-effects
        // like toggling a task being started/paused
        e.stopPropagation();

        const isFormSubmit =
          (e.target as HTMLElement)?.getAttribute?.("type") === "submit";

        // Make sure form submission is not prevented
        if (!isFormSubmit) {
          e.preventDefault();
        }
      }}
    >
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Ellipsis className="h-4 w-4" />
            <span className="sr-only">Open task menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            asChild
            className="p-0"
          >
            <Button
              variant="ghost"
              className="w-full cursor-pointer justify-start px-4 py-2"
              onClick={handleDuplicate}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {isPending ? "Duplicating..." : "Duplicate"}
            </Button>
          </DropdownMenuItem>
          {task.completedAt ? null : (
            <>
              <DropdownMenuItem asChild>
                <UpsertTaskDialog task={task} aria-label="Update task">
                  <Button
                    variant="ghost"
                    className="w-full cursor-pointer justify-start"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                </UpsertTaskDialog>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem asChild>
            <DeleteTaskDialog task={task} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
