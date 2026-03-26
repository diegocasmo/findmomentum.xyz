import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getActivities } from "@/lib/services/get-activities";
import { auth } from "@/lib/auth";
import { Home } from "lucide-react";
import { ActivitiesList } from "@/app/dashboard/components/activities-list";
import { ActivityFilters } from "@/app/dashboard/components/activity-filters";
import { PageSkeleton } from "@/app/dashboard/components/page-skeleton";
import { ActivityContributions } from "@/app/dashboard/components/activity-contributions";
import { BookmarkedActivitiesList } from "@/app/dashboard/components/bookmarked-activities-list";
import { Pagination } from "@/app/dashboard/components/pagination";
import { CollapsibleSection } from "@/components/collapsible-section";
import type { CompletionStatus } from "@/types";

type SearchParams = {
  page?: string;
  search?: string;
  status?: string;
};

type DashboardProps = {
  searchParams: Promise<SearchParams>;
};

async function getActivitiesData({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: SearchParams;
}) {
  const page = searchParams.page ? Number.parseInt(searchParams.page, 10) : 1;
  const searchQuery = searchParams.search;
  const completionStatus = searchParams.status as CompletionStatus | undefined;

  return getActivities({
    userId,
    page,
    limit: 10,
    searchQuery,
    completionStatus,
  });
}

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

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/sign-in");
  }

  // Get paginated activities with filters
  const params = await searchParams;
  const { activities, totalPages, currentPage, totalCount } =
    await getActivitiesData({ userId, searchParams: params });

  const activityDescription = getActivityDescription({
    totalCount,
    currentPage,
    totalPages,
  });

  return (
    <Suspense fallback={<PageSkeleton />}>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center mb-2 sm:mb-0">
          <Home className="w-6 h-6 md:w-8 md:h-8 mr-2 text-primary" />
          Home
        </h1>

        <CollapsibleSection
          id="activity-completion"
          title="Year-to-date activity completion"
          iconName="check-square"
        >
          <ActivityContributions userId={userId} />
        </CollapsibleSection>

        <CollapsibleSection
          id="bookmarked-activities"
          title="Bookmarked activities"
          iconName="star"
        >
          <BookmarkedActivitiesList userId={userId} />
        </CollapsibleSection>

        <CollapsibleSection
          id="activities"
          title="Activities"
          description={activityDescription}
          iconName="activity"
        >
          <ActivityFilters />
          <ActivitiesList activities={activities} />
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        </CollapsibleSection>
      </div>
    </Suspense>
  );
}
