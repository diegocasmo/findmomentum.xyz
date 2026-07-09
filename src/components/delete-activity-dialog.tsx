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
import { softDeleteActivityAction } from "@/app/actions/soft-delete-activity-action";
import { toast } from "@/hooks/use-toast";
import type { Activity } from "@prisma/client";

type DeleteActivityDialogProps = {
  activity: Activity;
  redirectUrl?: string;
  children: React.ReactNode;
};

const ERROR_MESSAGE_CONFIG: Parameters<typeof toast>[0] = {
  title: "Error",
  description: "Failed to delete the activity. Please try again.",
  variant: "destructive",
};

export function DeleteActivityDialog({
  activity,
  redirectUrl,
  children,
}: DeleteActivityDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await softDeleteActivityAction(activity.id);
        if (result.success) {
          toast({
            title: "Activity deleted",
            description: `"${activity.name}" has been successfully deleted.`,
          });

          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            setIsOpen(false);
            router.refresh();
          }
        } else {
          toast(ERROR_MESSAGE_CONFIG);
        }
      } catch (error) {
        console.error("Activity deletion error:", error);
        toast(ERROR_MESSAGE_CONFIG);
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px] max-w-[90%] w-full">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will delete the activity &quot;{activity.name}&quot;.
            This action cannot be undone.
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
