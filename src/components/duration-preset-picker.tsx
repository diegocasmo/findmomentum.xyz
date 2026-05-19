"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MS_PER_MIN } from "@/lib/utils/time";
import { cn } from "@/lib/utils";

const DEFAULT_PRESETS_MINUTES = [5, 10, 15, 20, 30] as const;

type DurationPresetPickerProps = {
  value: number;
  onChange: (ms: number) => void;
  minMs?: number;
  presetsMinutes?: readonly number[];
  className?: string;
};

export function DurationPresetPicker({
  value,
  onChange,
  minMs,
  presetsMinutes = DEFAULT_PRESETS_MINUTES,
  className,
}: DurationPresetPickerProps) {
  return (
    <div
      role="group"
      aria-label="Duration presets"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {presetsMinutes.map((minutes) => {
        const presetMs = minutes * MS_PER_MIN;
        const isSelected = value === presetMs;
        const isDisabled = minMs !== undefined && presetMs < minMs;

        const chip = (
          <Button
            key={minutes}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            aria-pressed={isSelected}
            aria-label={`${minutes} minutes`}
            aria-disabled={isDisabled || undefined}
            className={cn(
              "transition-transform duration-75 active:scale-95",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => {
              if (isDisabled) return;
              onChange(presetMs);
            }}
          >
            {minutes}m
          </Button>
        );

        if (!isDisabled) return chip;

        return (
          <Tooltip key={minutes}>
            <TooltipTrigger asChild>
              <span>{chip}</span>
            </TooltipTrigger>
            <TooltipContent>Less than elapsed time</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
