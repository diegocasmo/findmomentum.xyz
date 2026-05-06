"use client";

import { useRef, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
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
  trigger?: React.ReactNode;
};

export function CategoryPicker({
  categories,
  selectedIds,
  onChange,
  onCategoryCreated,
  onPendingChange,
  mode = "manage",
  trigger,
}: CategoryPickerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Pick<Category, "id" | "name"> | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  // guards rename-blur ↔ Pencil-click race
  const nextEditingIdRef = useRef<string | null>(null);

  const trimmedSearch = search.trim().toLowerCase();
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(trimmedSearch)
  );
  const selected = filtered
    .filter((c) => selectedIds.includes(c.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const unselected = filtered
    .filter((c) => !selectedIds.includes(c.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const sorted = [...selected, ...unselected];
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
          onChange([...selectedIds, result.data.id]);
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
          onChange(selectedIds.filter((id) => id !== category.id));
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

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!next && deleteTarget !== null) return;
          setOpen(next);
          if (!next) {
            setSearch("");
            setEditingId(null);
            setEditValue("");
          }
        }}
      >
        <PopoverTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm">
              {selectedIds.length > 0
                ? `${selectedIds.length} selected`
                : "Select categories"}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              maxLength={CATEGORY_NAME_MAX_LENGTH}
              placeholder={mode === "filter" ? "Search…" : "Search or create…"}
            />
            <CommandList>
              <CommandEmpty>
                {mode === "filter"
                  ? "No categories yet."
                  : "Type to create your first category…"}
              </CommandEmpty>
              {sorted.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.id}
                  className="group flex items-center"
                  onSelect={() => {
                    if (editingId === category.id || isPending) return;
                    const next = selectedIds.includes(category.id)
                      ? selectedIds.filter((id) => id !== category.id)
                      : [...selectedIds, category.id];
                    onChange(next);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIds.includes(category.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
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
                        <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 [@media(hover:none)_and_(pointer:coarse)]:opacity-100">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label={`Rename ${category.name}`}
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
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label={`Delete ${category.name}`}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(category);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </>
                  )}
                </CommandItem>
              ))}
              {showCreateItem && (
                <CommandItem
                  key="__create__"
                  value="__create__"
                  onSelect={() => handleCreate(search.trim())}
                >
                  Create &apos;{search.trim()}&apos;
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
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
