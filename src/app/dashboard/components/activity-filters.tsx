"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { CategoryPicker } from "@/components/category-picker";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { CompletionStatus, CategoryOption } from "@/types";

const SEARCH_DEBOUNCE_DELAY_MS = 300;

const STATUS_LABELS: Record<CompletionStatus, string> = {
  completed: "Completed",
  incomplete: "Incomplete",
};

const STATUS_OPTIONS: CompletionStatus[] = ["completed", "incomplete"];

function formatSelectedStatusesLabel(selectedStatuses: CompletionStatus[]): string {
  if (selectedStatuses.length === 0) return "All activities";
  return selectedStatuses
    .map((s) => STATUS_LABELS[s])
    .sort((a, b) => a.localeCompare(b))
    .join(", ");
}

type ActivityFiltersProps = {
  categories: CategoryOption[];
  selectedCategoryIds: string[];
  selectedStatuses: CompletionStatus[];
};

export function ActivityFilters({ categories, selectedCategoryIds, selectedStatuses }: ActivityFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialSearchQuery = searchParams.get("search") ?? "";

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusOpen, setStatusOpen] = useState(false);

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

  const handleStatusesChange = useCallback(
    (statuses: CompletionStatus[]) => {
      const sorted = [...statuses].sort();
      updateFilters({ status: sorted.join(",") });
    },
    [updateFilters]
  );

  // Track previous debounced value to avoid unnecessary updates
  const prevDebouncedSearchRef = useRef(debouncedSearchQuery);
  useEffect(() => {
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: syncs local searchQuery state when URL searchParams change externally (e.g., browser back/forward); local state buffers keystrokes for debounced URL updates
    setSearchQuery(searchParams.get("search") ?? "");
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
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[180px] justify-between font-normal hover:bg-background hover:text-foreground"
            >
              <span className="truncate">
                {formatSelectedStatusesLabel(selectedStatuses)}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto min-w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command>
              <CommandList className="p-1">
                {STATUS_OPTIONS.map((status) => (
                  <CommandItem
                    key={status}
                    value={status}
                    className="py-1.5 pl-2 pr-8"
                    onSelect={() => {
                      const next = selectedStatuses.includes(status)
                        ? selectedStatuses.filter((s) => s !== status)
                        : [...selectedStatuses, status];
                      handleStatusesChange(next);
                    }}
                  >
                    {selectedStatuses.includes(status) && (
                      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    {STATUS_LABELS[status]}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="w-full sm:w-[200px] p-[3px]">
        <CategoryPicker
          mode="filter"
          categories={categories}
          selectedIds={selectedCategoryIds}
          onChange={handleCategoriesChange}
          className="w-full"
        />
      </div>
    </div>
  );
}
