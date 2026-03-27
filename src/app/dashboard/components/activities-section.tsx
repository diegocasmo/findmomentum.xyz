import { getActivities } from "@/lib/services/get-activities";
import { ActivityFilters } from "@/app/dashboard/components/activity-filters";
import { ActivitiesList } from "@/app/dashboard/components/activities-list";
import { Pagination } from "@/app/dashboard/components/pagination";

import type { CompletionStatus } from "@/types";

type SearchParams = {
  page?: string;
  search?: string;
  status?: string;
};

type ActivitiesSectionProps = {
  userId: string;
  searchParams: SearchParams;
};

function getActivityDescription({
  totalCount,
  currentPage,
  totalPages,
}: {
  totalCount: number;
  currentPage: number;
  totalPages: number;
}) {
  let description = `(${totalCount})`;

  if (totalPages > 1) {
    description += ` • Page ${currentPage} of ${totalPages}`;
  }

  return description;
}

export async function ActivitiesSection({
  userId,
  searchParams,
}: ActivitiesSectionProps) {
  const page = searchParams.page ? Number.parseInt(searchParams.page, 10) : 1;
  const searchQuery = searchParams.search;
  const completionStatus = searchParams.status as CompletionStatus | undefined;

  const { activities, totalPages, currentPage, totalCount } =
    await getActivities({
      userId,
      page,
      limit: 10,
      searchQuery,
      completionStatus,
    });

  const description = getActivityDescription({
    totalCount,
    currentPage,
    totalPages,
  });

  return (
    <>
      <p className="text-sm text-foreground -mt-2 mb-4">{description}</p>
      <ActivityFilters />
      <ActivitiesList activities={activities} />
      <Pagination totalPages={totalPages} currentPage={currentPage} />
    </>
  );
}
