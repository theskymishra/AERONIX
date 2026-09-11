import type { ElementType } from "react";

import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardCheck,
  FileWarning,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";

type AttentionItem = {
  title: string;
  description: string;
  count: string;
  icon: ElementType;
  priority: "high" | "medium" | "low";
};

const attentionItems: AttentionItem[] = [
  {
    title: "Leave approvals",
    description: "Requests waiting for review",
    count: "3",
    icon: CalendarClock,
    priority: "high",
  },
  {
    title: "Attendance exceptions",
    description: "Employees with unusual attendance",
    count: "7",
    icon: AlertCircle,
    priority: "medium",
  },
  {
    title: "Goals to review",
    description: "Quarterly goals awaiting action",
    count: "5",
    icon: ClipboardCheck,
    priority: "medium",
  },
  {
    title: "Priority positions",
    description: "Open roles requiring attention",
    count: "6",
    icon: BriefcaseBusiness,
    priority: "low",
  },
  {
    title: "Documents expiring",
    description: "Employee documents need renewal",
    count: "2",
    icon: FileWarning,
    priority: "low",
  },
];

const priorityStyles = {
  high: "border-destructive/20 bg-destructive/10 text-destructive",
  medium: "border-primary/20 bg-primary/10 text-primary",
  low: "border-border/60 bg-muted/50 text-muted-foreground",
};

export function AttentionPanel() {
  return (
    <Card className="h-full min-h-[320px] overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Things need your attention</CardTitle>

          <p className="mt-2 text-sm text-muted-foreground">
            Actions and exceptions that may need your review.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          23 total
        </span>
      </CardHeader>

      <CardContent>
        <div className="divide-y divide-border/60">
          {attentionItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                className="group flex w-full items-center gap-3 py-3.5 text-left transition-colors duration-[var(--motion-fast)] first:pt-0 last:pb-0 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    priorityStyles[item.priority],
                  )}
                >
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {item.title}
                    </span>

                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                      {item.count}
                    </span>
                  </div>

                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--motion-fast)] group-hover:translate-x-0.5 group-hover:text-foreground" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}