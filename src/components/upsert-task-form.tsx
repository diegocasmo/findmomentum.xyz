import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema } from "@/app/schemas/create-task-schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  ListIcon,
  Loader2Icon,
  ClockIcon,
  PlusCircleIcon,
  Pencil,
} from "lucide-react";
import { useTransition, useRef } from "react";
import { createTaskAction } from "@/app/actions/create-task-action";
import { updateTaskAction } from "@/app/actions/update-task-action";
import { setFormErrors } from "@/lib/utils/form";
import { useRouter } from "next/navigation";
import { DurationInput } from "@/components/duration-input";
import { DurationPresetPicker } from "@/components/duration-preset-picker";
import { RootFormError } from "@/components/root-form-error";
import { getUpdateTaskSchema } from "@/app/schemas/update-task-schema";
import { formatTimeMMss, getTaskElapsedTime } from "@/lib/utils/time";
import type { TaskWithTimeEntries } from "@/types";
import type { z } from "zod";

type TaskFormInput =
  | z.input<typeof createTaskSchema>
  | z.input<ReturnType<typeof getUpdateTaskSchema>>;
type TaskFormOutput =
  | z.output<typeof createTaskSchema>
  | z.output<ReturnType<typeof getUpdateTaskSchema>>;

type UpsertTaskFormProps = {
  activityId?: string;
  autoFocus?: boolean;
  onSuccess: () => void;
  task?: TaskWithTimeEntries;
};

export function UpsertTaskForm({
  activityId,
  autoFocus,
  onSuccess,
  task,
}: UpsertTaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const elapsedMs = task ? getTaskElapsedTime(task) : 0;

  const form = useForm<TaskFormInput, unknown, TaskFormOutput>({
    resolver: zodResolver(
      task ? getUpdateTaskSchema(elapsedMs) : createTaskSchema
    ),
    defaultValues: {
      ...(task
        ? {
            taskId: task.id,
            name: task.name,
            durationMs: task.durationMs,
          }
        : {
            activityId,
            name: "",
            durationMs: 0,
          }),
    },
  });

  async function onSubmit(data: TaskFormOutput) {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("durationMs", data.durationMs.toString());

        if (task) {
          formData.append("taskId", task.id);
        }

        if (activityId) {
          formData.append("activityId", activityId);
        }

        const result = task
          ? await updateTaskAction(formData)
          : await createTaskAction(formData);

        if (result.success) {
          router.refresh();
          onSuccess();
        } else {
          setFormErrors(form.setError, result.errors);
        }
      } catch (error) {
        console.error(`Task ${task ? "update" : "create"} error:`, error);
        form.setError("root", {
          type: "manual",
          message: "An unexpected error occurred. Please try again.",
        });
      }
    });
  }

  return (
    <div className="bg-background rounded-lg shadow-sm p-4 mb-6 max-w-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Add a new task"
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        nameInputRef.current = e;
                      }}
                      autoFocus={autoFocus}
                      autoComplete="off"
                      className="text-sm pr-10"
                    />
                    <ListIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="durationMs"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <DurationInput {...field} value={field.value ?? 0} className="text-sm pr-10" />
                    <ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  </div>
                </FormControl>
                <DurationPresetPicker
                  value={field.value}
                  onChange={field.onChange}
                  elapsedMs={task ? elapsedMs : undefined}
                />
                {task && elapsedMs > 0 ? (
                  <FormDescription>
                    Current elapsed time {formatTimeMMss(elapsedMs)}
                  </FormDescription>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
          <RootFormError message={form.formState.errors.root?.message} />
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
            ) : task ? (
              <Pencil className="h-4 w-4 mr-2" />
            ) : (
              <PlusCircleIcon className="mr-2 h-4 w-4" />
            )}
            {task
              ? isPending
                ? "Updating..."
                : "Update"
              : isPending
              ? "Creating..."
              : "Create"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
