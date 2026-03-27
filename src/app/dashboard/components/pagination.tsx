"use client";

import { useOptimistic, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type PaginationProps = {
  totalPages: number;
  currentPage: number;
};

export function Pagination({ totalPages, currentPage }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [optimisticPage, setOptimisticPage] = useOptimistic(currentPage);

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  const goToPage = (pageNumber: number) => {
    startTransition(() => {
      setOptimisticPage(pageNumber);
      router.push(createPageURL(pageNumber));
    });
  };

  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center space-x-2 mt-6 transition-opacity",
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(optimisticPage - 1)}
        disabled={optimisticPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      <div className="flex items-center space-x-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          // Show pages around current page
          let pageNumber;
          if (totalPages <= 5) {
            pageNumber = i + 1;
          } else if (optimisticPage <= 3) {
            pageNumber = i + 1;
          } else if (optimisticPage >= totalPages - 2) {
            pageNumber = totalPages - 4 + i;
          } else {
            pageNumber = optimisticPage - 2 + i;
          }

          return (
            <Button
              key={pageNumber}
              variant={optimisticPage === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(pageNumber)}
            >
              {pageNumber}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(optimisticPage + 1)}
        disabled={optimisticPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  );
}
