import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/mock-data";
import { statusLabels } from "@/lib/mock-data";

const styles: Record<TaskStatus, string> = {
  queued: "bg-muted text-muted-foreground ring-border",
  running: "bg-info/15 text-info ring-info/30",
  needs_approval: "bg-warning/20 text-warning-foreground ring-warning/40",
  completed: "bg-success/15 text-success ring-success/30",
  failed: "bg-destructive/15 text-destructive ring-destructive/30",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status],
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {statusLabels[status]}
    </span>
  );
}
