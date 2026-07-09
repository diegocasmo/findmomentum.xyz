import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { softDeleteTaskAction } from "@/app/actions/soft-delete-task-action";
import { toast } from "@/hooks/use-toast";
import type { Task } from "@prisma/client";

type DeleteTaskDialogProps = {
  task: Task;
  redirectUrl?: string;
};

const ERROR_MESSAGE_CONFIG: Parameters<typeof toast>[0] = {
  title: "Error",
  description: "Failed to delete the task. Please try again.",
  variant: "destructive",
};

export function DeleteTaskDialog({ task, redirectUrl }: DeleteTaskDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await softDeleteTaskAction(task.id);
        if (result.success) {
          toast({
            title: "Task deleted",
            description: `"${task.name}" has been successfully deleted.`,
          });

          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            router.refresh();
            setIsOpen(false);
          }
        } else {
          toast(ERROR_MESSAGE_CONFIG);
        }
      } catch (error) {
        console.error("Task deletion error:", error);
        toast(ERROR_MESSAGE_CONFIG);
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full cursor-pointer hover:text-destructive focus:text-destructive justify-start"
          aria-label={`Delete ${task.name}`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px] max-w-[90%] w-full">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will delete the task &quot;{task.name}&quot;. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
