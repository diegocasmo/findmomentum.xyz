"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircleIcon, ClockIcon, TrophyIcon, StarIcon } from "lucide-react";
import { formatMsAsDuration, getActivityTotalDuration } from "@/lib/utils/time";
import type { ActivityWithTasksAndTimeEntries } from "@/types";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useWindowSize } from "@/hooks/use-window-size";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

type ActivityCompletedCardProps = {
  activity: ActivityWithTasksAndTimeEntries;
};

export function ActivityCompletedCard({
  activity,
}: ActivityCompletedCardProps) {
  const { width, height } = useWindowSize();
  const searchParams = useSearchParams();
  const [celebrate, setCelebrate] = useState(false);
  const totalDuration = getActivityTotalDuration(activity);

  useEffect(() => {
    setCelebrate(searchParams.get("celebrate") === "true");
  }, [searchParams]);

  return (
    <Card className="w-full max-w-3xl shadow-lg border-secondary">
      <CardHeader className="flex justify-center items-center pb-6">
        <div className="mb-4">
          <div
            className={`w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center ${
              celebrate ? "animate-bounce" : ""
            }`}
          >
            <TrophyIcon className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="text-center">
          <CardTitle className="text-3xl font-bold text-primary mb-2">
            Activity Completed 🎉
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10">
            <span className="text-lg font-medium">Total Time:</span>
            <span className="text-2xl font-bold text-primary">
              {formatMsAsDuration(totalDuration)}
            </span>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground/80 flex items-center">
              <StarIcon className="w-6 h-6 mr-2 text-yellow-500" />
              Completed Tasks:
            </h3>
            {activity.tasks.map((task) => (
              <div
                key={task.id}
                className="flex justify-between items-center bg-secondary/50 p-4 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-foreground/90">
                    {task.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground/70">
                    {formatMsAsDuration(task.durationMs)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      {celebrate && (
        <Confetti numberOfPieces={50} width={width} height={height} />
      )}
    </Card>
  );
}
