"use client";

import { Settings, Trash2, Pencil, Copy, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpsertActivityDialog } from "@/components/upsert-activity-dialog";
import { DeleteActivityDialog } from "@/components/delete-activity-dialog";
import { BookmarkButton } from "@/components/bookmark-button";
import type { ActivityWithTasksAndTimeEntries, CategoryOption } from "@/types";
import { useRouter } from "next/navigation";
import { createActivityFromTemplateAction } from "@/app/actions/create-activity-from-template-action";
import { useToast } from "@/hooks/use-toast";

type ActivityActionsProps = {
  activity: ActivityWithTasksAndTimeEntries;
  categories: CategoryOption[];
  redirectUrl?: string;
  returnUrl?: string;
};

export function ActivityActions({
  activity,
  categories,
  redirectUrl,
  returnUrl,
}: ActivityActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleUseAsTemplate = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("activityId", activity.id);
        const result = await createActivityFromTemplateAction(formData);

        if (result.success) {
          router.push(
            `/dashboard/activities/${result.data.id}${
              returnUrl ? `?returnUrl=${returnUrl}` : ""
            }`
          );
        } else {
          toast({
            title: "Error",
            description:
              "Failed to create activity from template. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Use as template error:", error);
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
        // Prevent click event from bubbling and causing a side-effects like
        // opening an activity details page
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
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Open activity menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuItem asChild>
            <UpsertActivityDialog activity={activity} categories={categories}>
              <Button
                variant="ghost"
                className="w-full cursor-pointer justify-start"
                aria-label={`Update ${activity.name}`}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Update
              </Button>
            </UpsertActivityDialog>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            asChild
            className="p-0"
          >
            <Button
              variant="ghost"
              className="w-full cursor-pointer justify-start px-4 py-2"
              onClick={handleUseAsTemplate}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {isPending ? "Using as template..." : "Use as template"}
            </Button>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            asChild
            className="p-0"
          >
            <BookmarkButton
              activityId={activity.id}
              isBookmarked={!!activity.bookmarkedAt}
              variant="menu"
            />
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <DeleteActivityDialog activity={activity} redirectUrl={redirectUrl}>
              <Button
                variant="ghost"
                className="w-full cursor-pointer hover:text-destructive focus:text-destructive justify-start"
                aria-label={`Delete ${activity.name}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DeleteActivityDialog>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
