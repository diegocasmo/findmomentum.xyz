"use client";

import React, { useRef, useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useCommandState } from "cmdk";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast, toast as _toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Category } from "@prisma/client";
import { createCategoryAction } from "@/app/actions/create-category-action";
import { updateCategoryAction } from "@/app/actions/update-category-action";
import { deleteCategoryAction } from "@/app/actions/delete-category-action";
import { CATEGORY_NAME_MAX_LENGTH } from "@/app/schemas/create-category-schema";

const GENERIC_ERROR_CONFIG: Parameters<typeof _toast>[0] = {
  title: "Error",
  description: "Something went wrong. Please try again.",
  variant: "destructive",
};

type CategoryPickerProps = {
  categories: Pick<Category, "id" | "name">[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCategoryCreated?: (cat: Pick<Category, "id" | "name">) => void;
  onPendingChange?: (pending: boolean) => void;
  mode?: "manage" | "filter";
  className?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(value);
      else if (ref != null) ref.current = value;
    }
  };
}

type CategoryPickerInnerProps = CategoryPickerProps & {
  forwardedRef: React.ForwardedRef<HTMLInputElement>;
};

function CategoryPickerInner({
  categories,
  selectedIds,
  onChange,
  onCategoryCreated,
  onPendingChange,
  mode = "manage",
  className,
  id,
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
  forwardedRef,
}: CategoryPickerInnerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Pick<Category, "id" | "name"> | null>(null);
  const [chipPendingRemoval, setChipPendingRemoval] = useState<string | null>(null);
  const [listId, setListId] = useState<string | undefined>(undefined);

  const editInputRef = useRef<HTMLInputElement>(null);
  // guards rename-blur ↔ Pencil-click race
  const nextEditingIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const composingRef = useRef(false);
  const closeCauseRef = useRef<"escape" | "outside" | "blur" | null>(null);
  const suppressNextOpenRef = useRef(false);
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  });

  const highlightedItemId = useCommandState((s) => s.selectedItemId);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );
  const trimmedSearch = search.trim().toLowerCase();
  const sorted = sortedCategories.filter((c) =>
    c.name.toLowerCase().includes(trimmedSearch)
  );
  const hasExactMatch = categories.some(
    (c) => c.name.toLowerCase() === trimmedSearch
  );
  const showCreateItem =
    mode !== "filter" && trimmedSearch.length > 0 && !hasExactMatch;

  const handleCreate = (name: string) => {
    if (isPending) return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("name", name);
        const result = await createCategoryAction(fd);
        if (result.success) {
          toast({
            title: "Category created",
            description: `"${name}" has been created.`,
          });
          onChange([...selectedIdsRef.current, result.data.id]);
          onCategoryCreated?.({ id: result.data.id, name: result.data.name });
          setSearch("");
          router.refresh();
        } else {
          toast(GENERIC_ERROR_CONFIG);
        }
      } catch (err) {
        console.error("Error creating category:", err);
        toast(GENERIC_ERROR_CONFIG);
      }
    });
  };

  const handleRename = (categoryId: string, name: string) => {
    if (isPending) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setEditingId(null);
      setEditValue("");
      return;
    }
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("categoryId", categoryId);
        fd.append("name", trimmed);
        const result = await updateCategoryAction(fd);
        if (result.success) {
          toast({
            title: "Category renamed",
            description: `Renamed to "${trimmed}".`,
          });
          setEditingId(null);
          setEditValue("");
          router.refresh();
        } else {
          toast(GENERIC_ERROR_CONFIG);
          setEditingId(null);
          setEditValue("");
        }
      } catch (err) {
        console.error("Error renaming category:", err);
        toast(GENERIC_ERROR_CONFIG);
        setEditingId(null);
        setEditValue("");
      }
    });
  };

  const handleDelete = (category: Pick<Category, "id" | "name">) => {
    if (isPending) return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("categoryId", category.id);
        const result = await deleteCategoryAction(fd);
        if (result.success) {
          const count = result.data.affectedActivitiesCount;
          toast({
            title: "Category deleted",
            description: `"${category.name}" was deleted. ${count} ${count === 1 ? "activity" : "activities"} affected.`,
          });
          setDeleteTarget(null);
          onChange(selectedIdsRef.current.filter((id) => id !== category.id));
          router.refresh();
        } else {
          toast(GENERIC_ERROR_CONFIG);
          setDeleteTarget(null);
        }
      } catch (err) {
        console.error("Error deleting category:", err);
        toast(GENERIC_ERROR_CONFIG);
        setDeleteTarget(null);
      }
    });
  };

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const handleOpenChange = (next: boolean) => {
    if (!next && deleteTarget !== null) return;
    setOpen(next);
    if (!next) {
      setSearch("");
      setEditingId(null);
      setEditValue("");
      setChipPendingRemoval(null);
    }
  };

  const handleInteractOutside = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (target && anchorRef.current?.contains(target)) {
      e.preventDefault();
      return;
    }
    if (deleteTarget !== null) {
      e.preventDefault();
      return;
    }
    closeCauseRef.current = "outside";
  };

  const handleCloseAutoFocus = (e: Event) => {
    e.preventDefault();
    const cause = closeCauseRef.current;
    closeCauseRef.current = null;
    if (cause === "escape") {
      suppressNextOpenRef.current = true;
      inputRef.current?.focus();
    }
  };

  const handleInputFocus = () => {
    if (suppressNextOpenRef.current) {
      suppressNextOpenRef.current = false;
      return;
    }
    if (!open) setOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (chipPendingRemoval !== null) setChipPendingRemoval(null);
    if (!open) setOpen(true);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setChipPendingRemoval(null);
    closeCauseRef.current = "blur";
    if (deleteTarget !== null) return;
    const next = e.relatedTarget as HTMLElement | null;
    if (next) {
      if (anchorRef.current?.contains(next)) return;
      if (next.closest("[data-radix-popper-content-wrapper]")) return;
    }
    setOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        closeCauseRef.current = "escape";
        setOpen(false);
        setChipPendingRemoval(null);
      }
      return;
    }
    if (e.key === "Backspace" && search === "") {
      e.preventDefault();
      if (selectedIds.length === 0) return;
      if (chipPendingRemoval !== null) {
        onChange(selectedIds.filter((id) => id !== chipPendingRemoval));
        setChipPendingRemoval(null);
      } else {
        setChipPendingRemoval(selectedIds[selectedIds.length - 1]);
      }
      return;
    }
    if (chipPendingRemoval !== null) setChipPendingRemoval(null);
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
      setOpen(true);
    }
  };

  // Build a lookup map for selected category names
  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            className={cn(
              "flex w-full flex-wrap items-center gap-1.5 min-h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors md:text-sm focus-within:outline-none focus-within:ring-1 focus-within:ring-ring cursor-text",
              className
            )}
            onClick={(e) => {
              if (e.target === e.currentTarget) inputRef.current?.focus();
            }}
          >
            {selectedIds.map((catId) => {
              const cat = categoryById.get(catId);
              if (!cat) return null;
              return (
                <Badge
                  key={catId}
                  variant="secondary"
                  className={cn(
                    "font-normal text-sm pl-2 pr-0 py-0.5 [&:has(button:hover)]:bg-secondary",
                    chipPendingRemoval === catId && "ring-2 ring-destructive bg-destructive/10"
                  )}
                >
                  <span>{cat.name}</span>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Remove ${cat.name}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(selectedIds.filter((v) => v !== catId));
                      setChipPendingRemoval(null);
                      inputRef.current?.focus();
                    }}
                    className="relative inline-flex items-center justify-center rounded-sm ml-1 mr-1 hover:bg-secondary-foreground/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring before:absolute before:inset-[-15px] before:content-['']"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              );
            })}
            <input
              ref={mergeRefs(inputRef, forwardedRef)}
              id={id}
              aria-describedby={ariaDescribedby}
              aria-invalid={ariaInvalid}
              role="combobox"
              aria-expanded={open}
              aria-controls={open ? listId : undefined}
              aria-activedescendant={open ? highlightedItemId : undefined}
              aria-autocomplete="list"
              aria-label={mode === "filter" ? "Search categories" : "Search or create categories"}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={CATEGORY_NAME_MAX_LENGTH}
              value={search}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              placeholder={
                selectedIds.length === 0
                  ? mode === "filter"
                    ? "Search categories…"
                    : "Search or create categories…"
                  : ""
              }
              className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] overflow-hidden"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={handleCloseAutoFocus}
          onInteractOutside={handleInteractOutside}
        >
          <CommandList
            ref={(node) => {
              if (node && node.id !== listId) setListId(node.id);
            }}
            className="max-h-[40vh] overflow-y-auto"
          >
            <CommandEmpty>
              {mode === "filter"
                ? "No categories yet."
                : "Type to create your first category…"}
            </CommandEmpty>
            {showCreateItem && (
              <CommandItem
                key="__create__"
                value="__create__"
                onSelect={() => handleCreate(search.trim())}
              >
                Create &apos;{search.trim()}&apos;
              </CommandItem>
            )}
            {sorted.map((category) => (
              <CommandItem
                key={category.id}
                value={category.id}
                className={cn(
                  "group flex items-center",
                  mode === "filter" && "py-1.5 pl-2 pr-8"
                )}
                onSelect={() => {
                  if (editingId === category.id || isPending) return;
                  const next = selectedIds.includes(category.id)
                    ? selectedIds.filter((id) => id !== category.id)
                    : [...selectedIds, category.id];
                  onChange(next);
                  setSearch("");
                  setChipPendingRemoval(null);
                }}
              >
                {mode === "filter" ? (
                  selectedIds.includes(category.id) && (
                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )
                ) : (
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIds.includes(category.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                )}
                {editingId === category.id ? (
                  <Input
                    ref={editInputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    maxLength={CATEGORY_NAME_MAX_LENGTH}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") handleRename(category.id, editValue);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditValue("");
                      }
                    }}
                    onBlur={() => {
                      if (
                        nextEditingIdRef.current !== null &&
                        nextEditingIdRef.current !== category.id
                      ) {
                        setEditingId(null);
                        setEditValue("");
                        return;
                      }
                      if (
                        editValue.trim() &&
                        editValue.trim() !== category.name
                      ) {
                        handleRename(category.id, editValue);
                      } else {
                        setEditingId(null);
                        setEditValue("");
                      }
                    }}
                  />
                ) : (
                  <>
                    <span className="flex-1 truncate">{category.name}</span>
                    {mode !== "filter" && (
                      <span className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 [@media(hover:none)_and_(pointer:coarse)]:opacity-100">
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={`Rename ${category.name}`}
                          className="rounded p-1.5 hover:bg-foreground/10 hover:text-foreground transition-colors"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            nextEditingIdRef.current = category.id;
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(category.id);
                            setEditValue(category.name);
                            nextEditingIdRef.current = null;
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={`Delete ${category.name}`}
                          className="rounded p-1.5 hover:bg-foreground/10 hover:text-foreground transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(category);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                  </>
                )}
              </CommandItem>
            ))}
          </CommandList>
        </PopoverContent>
      </Popover>
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &apos;{deleteTarget?.name}&apos;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const CategoryPicker = React.forwardRef<HTMLInputElement, CategoryPickerProps>(
  function CategoryPicker(props, forwardedRef) {
    return (
      <Command shouldFilter={false} className="!bg-transparent text-foreground rounded-none border-none p-0 h-auto overflow-visible">
        <CategoryPickerInner {...props} forwardedRef={forwardedRef} />
      </Command>
    );
  }
);
CategoryPicker.displayName = "CategoryPicker";
