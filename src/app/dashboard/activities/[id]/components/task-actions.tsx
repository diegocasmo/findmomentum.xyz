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
import { isTaskCompleted } from "@/lib/utils/is-task-completed";
import { isolateActionMenuClick } from "@/lib/utils/isolate-action-menu-click";
import { useRef, useState, useTransition } from "react";
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

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
    <div onClick={isolateActionMenuClick}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button ref={menuTriggerRef} variant="outline" size="sm">
            <Ellipsis className="h-4 w-4" />
            <span className="sr-only">Open task menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56"
          align="end"
          forceMount
          onCloseAutoFocus={(event) => {
            // The edit dialog takes focus when the menu closes.
            if (isEditOpen) event.preventDefault();
          }}
        >
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
          {isTaskCompleted(task) ? null : (
            <DropdownMenuItem
              className="min-h-11 cursor-pointer px-4"
              onSelect={() => setIsEditOpen(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Update
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <DeleteTaskDialog task={task} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <UpsertTaskDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          menuTriggerRef.current?.focus();
        }}
      />
    </div>
  );
}
