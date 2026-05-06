import { Badge } from "@/components/ui/badge";

type CategoryBadgeProps = {
  children: React.ReactNode;
  title?: string;
};

export function CategoryBadge({ children, title }: CategoryBadgeProps) {
  return (
    <Badge variant="secondary" title={title}>
      {children}
    </Badge>
  );
}
