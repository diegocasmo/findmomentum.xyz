"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  ChevronDown,
  CheckSquare,
  ActivityIcon,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ICONS = {
  "check-square": CheckSquare,
  activity: ActivityIcon,
  star: Star,
} satisfies Record<string, LucideIcon>;

interface CollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  iconName?: keyof typeof ICONS;
  children: ReactNode;
  defaultExpanded?: boolean;
  titleClassName?: string;
}

export function CollapsibleSection({
  id,
  title,
  description,
  iconName,
  children,
  defaultExpanded = true,
  titleClassName,
}: CollapsibleSectionProps) {
  const storageKey = `section-collapsed-${id}`;

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? stored === "true" : defaultExpanded;
    }
    return defaultExpanded;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, isExpanded.toString());
  }, [isExpanded, storageKey]);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const IconComponent = iconName ? ICONS[iconName] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {IconComponent && (
            <IconComponent className="w-5 h-5 mr-2 text-primary" />
          )}
          <h2 className={cn("text-xl font-semibold", titleClassName)}>
            {title}
          </h2>
          {description ? (
            <span className="ml-2 text-sm text-muted-foreground">
              {description}
            </span>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-controls={`${id}-content`}
          aria-label={title}
        >
          <ChevronDown
            className={cn(
              "text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
              isExpanded && "rotate-180"
            )}
          />
        </Button>
      </div>

      <div
        id={`${id}-content`}
        inert={!isExpanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
