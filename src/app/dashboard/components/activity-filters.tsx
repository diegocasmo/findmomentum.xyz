"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryPicker } from "@/components/category-picker";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { CompletionStatus, CategoryOption } from "@/types";

const SEARCH_DEBOUNCE_DELAY_MS = 300;

function formatSelectedCategoriesLabel(
  categories: CategoryOption[],
  selectedCategoryIds: string[]
): string {
  const count = selectedCategoryIds.length;
  if (count === 0) return "All categories";
  if (count >= 3) return `${count} selected`;
  const selectedNames = categories
    .filter((c) => selectedCategoryIds.includes(c.id))
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b));
  return selectedNames.join(", ");
}

type ActivityFiltersProps = {
  categories: CategoryOption[];
  selectedCategoryIds: string[];
};

export function ActivityFilters({ categories, selectedCategoryIds }: ActivityFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialSearchQuery = searchParams.get("search") ?? "";
  const initialCompletionStatus =
    (searchParams.get("status") as CompletionStatus) ?? "all";

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>(
    initialCompletionStatus
  );

  const debouncedSearchQuery = useDebounce(
    searchQuery,
    SEARCH_DEBOUNCE_DELAY_MS
  );

  // Use a ref to access searchParams without it being a dependency
  // This breaks the circular dependency that causes infinite loops
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const updateFilters = useCallback(
    (newParams: Record<string, string>) => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      if (
        Boolean(newParams.search) ||
        newParams.status !== undefined ||
        newParams.categories !== undefined
      ) {
        params.set("page", "1");
      }
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, startTransition]
  );

  const handleCategoriesChange = useCallback(
    (ids: string[]) => {
      updateFilters({ categories: ids.join(",") });
    },
    [updateFilters]
  );

  // Track previous debounced value to avoid unnecessary updates
  const prevDebouncedSearchRef = useRef(debouncedSearchQuery);
  useEffect(() => {
    // Only update if the debounced value actually changed
    if (prevDebouncedSearchRef.current !== debouncedSearchQuery) {
      prevDebouncedSearchRef.current = debouncedSearchQuery;
      const currentSearch = searchParamsRef.current.get("search") ?? "";
      if (debouncedSearchQuery !== currentSearch) {
        updateFilters({ search: debouncedSearchQuery });
      }
    }
  }, [debouncedSearchQuery, updateFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (value: CompletionStatus) => {
    setCompletionStatus(value);
    updateFilters({ status: value });
  };

  useEffect(() => {
    setSearchQuery(searchParams.get("search") ?? "");
    setCompletionStatus(
      (searchParams.get("status") as CompletionStatus) ?? "all"
    );
  }, [searchParams]);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start gap-4 mb-6 transition-opacity",
        isPending && "opacity-60"
      )}
    >
      <div className="relative flex-1 w-full">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none">
          <Search className="h-full w-full" />
        </div>
        <div className="w-full p-[3px]">
          <Input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 w-full"
          />
        </div>
      </div>
      <div className="w-full sm:w-[180px] p-[3px]">
        <Select value={completionStatus} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activities</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-full sm:w-auto p-[3px]">
        <CategoryPicker
          mode="filter"
          categories={categories}
          selectedIds={selectedCategoryIds}
          onChange={handleCategoriesChange}
          trigger={
            <Button
              variant="outline"
              className="w-full sm:w-[200px] justify-between font-normal"
            >
              <span className="truncate">
                {formatSelectedCategoriesLabel(categories, selectedCategoryIds)}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
