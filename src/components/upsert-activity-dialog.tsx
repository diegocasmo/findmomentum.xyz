import { useState } from "react";
import type { ActivityWithCategories, CategoryOption } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UpsertActivityForm } from "@/components/upsert-activity-form";

type UpsertActivityDialogProps = {
  children: React.ReactNode;
  activity?: ActivityWithCategories;
  categories: CategoryOption[];
};

export function UpsertActivityDialog({
  children,
  activity,
  categories,
}: UpsertActivityDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[90%] w-full">
        <DialogHeader>
          <DialogTitle>
            {activity ? "Update" : "Create New"} Activity
          </DialogTitle>
          <DialogDescription>
            {activity
              ? "Update the activity by filling out the form below."
              : "Create a new activity by filling out the form below."}
          </DialogDescription>
        </DialogHeader>
        <UpsertActivityForm
          activity={activity}
          categories={categories}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
