import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Home } from "lucide-react";
import { ActivityContributions } from "@/app/dashboard/components/activity-contributions";
import { BookmarkedActivitiesList } from "@/app/dashboard/components/bookmarked-activities-list";
import { ActivitiesSection } from "@/app/dashboard/components/activities-section";
import {
  ContributionGraphSkeleton,
  BookmarkedActivitiesSkeleton,
  ActivitiesSkeleton,
} from "@/app/dashboard/components/page-skeleton";
import { CollapsibleSection } from "@/components/collapsible-section";

type SearchParams = {
  page?: string;
  search?: string;
  status?: string;
};

type DashboardProps = {
  searchParams: Promise<SearchParams>;
};

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const params = await searchParams;

  return (
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
        <Suspense fallback={<ContributionGraphSkeleton />}>
          <ActivityContributions userId={userId} />
        </Suspense>
      </CollapsibleSection>

      <CollapsibleSection
        id="bookmarked-activities"
        title="Bookmarked activities"
        iconName="star"
      >
        <Suspense fallback={<BookmarkedActivitiesSkeleton />}>
          <BookmarkedActivitiesList userId={userId} />
        </Suspense>
      </CollapsibleSection>

      <Suspense
        fallback={
          <CollapsibleSection
            id="activities"
            title="Activities"
            iconName="activity"
          >
            <ActivitiesSkeleton />
          </CollapsibleSection>
        }
      >
        <ActivitiesSection userId={userId} searchParams={params} />
      </Suspense>
    </div>
  );
}
