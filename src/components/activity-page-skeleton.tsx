import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ActivityPageSkeleton() {
  return (
    <div className="container mx-auto space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex-grow grid grid-cols-1 gap-8 h-full">
        <Card className="flex flex-col">
          <CardHeader className="space-y-4 p-4">
            <div className="flex items-center justify-between flex-col space-y-4">
              <Skeleton className="h-44 w-44 rounded-full" />
              <Skeleton className="h-10 w-36" />
            </div>
            <CardTitle className="text-2xl font-semibold flex justify-between items-center">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-36" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-auto p-4">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
