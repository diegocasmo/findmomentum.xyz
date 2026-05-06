import { useForm } from "react-hook-form";
import type { ActivityWithCategories, CategoryOption } from "@/types";
import { CategoryPicker } from "@/components/category-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { createActivitySchema } from "@/app/schemas/create-activity-schema";
import { updateActivitySchema } from "@/app/schemas/update-activity-schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ActivityIcon,
  Loader2Icon,
  PlusCircleIcon,
  Pencil,
  X,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useTransition } from "react";
import { createActivityAction } from "@/app/actions/create-activity-action";
import { updateActivityAction } from "@/app/actions/update-activity-action";
import { setFormErrors } from "@/lib/utils/form";
import { useRouter } from "next/navigation";
import { RootFormError } from "@/components/root-form-error";

type FormData = {
  activityId?: string;
  name: string;
  description: string;
  categoryIds: string[];
};

type UpsertActivityFormProps = {
  activity?: ActivityWithCategories;
  categories: CategoryOption[];
  onSuccess: () => void;
};

export function UpsertActivityForm({
  activity,
  categories,
  onSuccess,
}: UpsertActivityFormProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCategories, setOptimisticCategories] = useState<CategoryOption[]>([]);
  const [isCategoryPending, setIsCategoryPending] = useState(false);
  const router = useRouter();

  const augmentedCategories: CategoryOption[] = [
    ...categories,
    ...optimisticCategories.filter(
      (opt) => !categories.some((c) => c.id === opt.id)
    ),
  ];

  const handleCategoryCreated = (cat: CategoryOption) => {
    setOptimisticCategories((prev) => [...prev, cat]);
  };

  const form = useForm<FormData>({
    resolver: zodResolver(
      activity ? updateActivitySchema : createActivitySchema
    ),
    defaultValues: {
      ...(activity && { activityId: activity.id }),
      name: activity?.name || "",
      description: activity?.description || "",
      categoryIds: activity?.categories?.map((ac) => ac.categoryId) ?? [],
    },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description);
        data.categoryIds.forEach((id) => formData.append("categoryIds", id));
        if (activity) {
          formData.append("activityId", activity.id);
        }

        const result = activity
          ? await updateActivityAction(formData)
          : await createActivityAction(formData);

        if (result.success) {
          if (activity) {
            router.refresh();
          } else {
            router.push(`/dashboard/activities/${result.data.id}`);
          }

          onSuccess();
        } else {
          setFormErrors(form.setError, result.errors);
        }
      } catch (error) {
        console.error(
          `Activity ${activity ? "update" : "create"} error:`,
          error
        );
        form.setError("root", {
          type: "manual",
          message: "An unexpected error occurred. Please try again.",
        });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-background flex-1 min-h-0 overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="activity-name"
                  className="text-lg font-semibold flex items-center"
                >
                  <ActivityIcon className="w-5 h-5 mr-2" />
                  Name
                </FormLabel>
                <FormControl>
                  <Input
                    id="activity-name"
                    placeholder="e.g., Morning Jog, Meditation"
                    {...field}
                    autoComplete="off"
                    className="text-base"
                  />
                </FormControl>
                <FormDescription>
                  Choose a clear and concise name for your activity.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categories</FormLabel>
                <CategoryPicker
                  categories={augmentedCategories}
                  selectedIds={field.value}
                  onChange={field.onChange}
                  onCategoryCreated={handleCategoryCreated}
                  onPendingChange={setIsCategoryPending}
                  trigger={
                    <FormControl>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label="Select categories"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            (e.currentTarget as HTMLDivElement).click();
                          }
                        }}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors md:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-wrap items-center gap-1.5 min-h-9 cursor-pointer"
                      >
                        {field.value.length === 0 ? (
                          <span className="text-muted-foreground">
                            Select categories
                          </span>
                        ) : (
                          field.value.map((id: string) => {
                            const cat = augmentedCategories.find((c) => c.id === id);
                            if (!cat) return null;
                            return (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="font-normal pl-2 pr-0 py-0 [&:has(button:hover)]:bg-secondary"
                              >
                                <span>{cat.name}</span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${cat.name}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    field.onChange(
                                      field.value.filter((v: string) => v !== id)
                                    );
                                  }}
                                  className="relative inline-flex items-center justify-center rounded-sm ml-1 mr-1 hover:bg-secondary-foreground/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring before:absolute before:inset-[-15px] before:content-['']"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </Badge>
                            );
                          })
                        )}
                        <ChevronDown className="ml-auto h-4 w-4 opacity-50 shrink-0 self-center" />
                      </div>
                    </FormControl>
                  }
                />
                <FormDescription>Tag this activity with categories.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  htmlFor="activity-description"
                  className="text-lg font-semibold"
                >
                  Description (Optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    id="activity-description"
                    placeholder="Describe your activity..."
                    {...field}
                    className="text-base"
                    rows={4}
                  />
                </FormControl>
                <FormDescription>
                  Provide additional details about your activity (max 500
                  characters).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <RootFormError message={form.formState.errors.root?.message} />
          <div className="pt-6">
            <Button
              type="submit"
              className="w-full text-base font-semibold"
              disabled={isCategoryPending || isPending}
            >
              {isPending ? (
                <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
              ) : activity ? (
                <Pencil className="h-4 w-4 mr-2" />
              ) : (
                <PlusCircleIcon className="mr-2 h-4 w-4" />
              )}
              {activity
                ? isPending
                  ? "Updating..."
                  : "Update"
                : isPending
                  ? "Creating..."
                  : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
