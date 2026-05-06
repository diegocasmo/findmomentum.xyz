"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ActivityIcon, ChevronLeft } from "lucide-react";
import { ActivityActions } from "@/app/dashboard/components/activity-actions";
import { BookmarkButton } from "@/components/bookmark-button";
import type { ActivityWithTasksAndTimeEntries, CategoryOption } from "@/types";
import { Badge } from "@/components/ui/badge";

type ActivityHeaderProps = {
  activity: ActivityWithTasksAndTimeEntries;
  categories: CategoryOption[];
};

export function ActivityHeader({ activity, categories }: ActivityHeaderProps) {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  return (
    <div className="flex flex-col gap-4 pb-4 sm:pb-0">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
          asChild
        >
          <Link href={returnUrl} aria-label="Back to previous page">
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <ActivityIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <span className="truncate">{activity.name}</span>
            <BookmarkButton
              activityId={activity.id}
              isBookmarked={!!activity.bookmarkedAt}
            />
          </h1>
          {activity.description && (
            <p className="mt-1 text-sm sm:text-base md:text-lg text-muted-foreground line-clamp-2">
              {activity.description}
            </p>
          )}
          {activity.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {activity.categories.map((ac) => (
                <Badge key={ac.id} variant="secondary" title={ac.category.name}>
                  {ac.category.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center sm:self-center ml-auto sm:ml-0">
          <ActivityActions activity={activity} redirectUrl={returnUrl} categories={categories} />
        </div>
      </div>
    </div>
  );
}
