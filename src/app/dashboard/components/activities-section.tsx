import { getActivities } from "@/lib/services/get-activities";
import { getCategories } from "@/lib/services/get-categories";
import { ActivityFilters } from "@/app/dashboard/components/activity-filters";
import { ActivitiesList } from "@/app/dashboard/components/activities-list";
import { Pagination } from "@/app/dashboard/components/pagination";
import { CollapsibleSection } from "@/components/collapsible-section";

import type { CompletionStatus } from "@/types";

export type ActivitiesSearchParams = {
  page?: string;
  search?: string;
  status?: string;
  categories?: string;
};

type ActivitiesSectionProps = {
  userId: string;
  searchParams: ActivitiesSearchParams;
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

  const validStatuses: CompletionStatus[] = ["completed", "incomplete"];
  const requestedStatuses = searchParams.status?.split(",").filter(Boolean) ?? [];
  const selectedStatuses = requestedStatuses.filter(
    (s): s is CompletionStatus => validStatuses.some((status) => status === s)
  );

  const categories = await getCategories({ userId });
  const requestedCategoryIds =
    searchParams.categories?.split(",").filter(Boolean) ?? [];
  const userCategoryIdSet = new Set(categories.map((c) => c.id));
  const selectedCategoryIds = requestedCategoryIds.filter((id) =>
    userCategoryIdSet.has(id)
  );

  const { activities, totalPages, currentPage, totalCount } =
    await getActivities({
      userId,
      page,
      limit: 10,
      searchQuery,
      completionStatuses: selectedStatuses,
      categoryIds: selectedCategoryIds,
    });

  const description = getActivityDescription({
    totalCount,
    currentPage,
    totalPages,
  });

  return (
    <CollapsibleSection
      id="activities"
      title="Activities"
      iconName="activity"
      description={description}
    >
      <ActivityFilters
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        selectedStatuses={selectedStatuses}
      />
      <ActivitiesList activities={activities} categories={categories} />
      <Pagination totalPages={totalPages} currentPage={currentPage} />
    </CollapsibleSection>
  );
}
