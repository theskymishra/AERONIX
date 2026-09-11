import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";

type MetricTrend = {
  value: string;
  label: string;
  direction: "up" | "down" | "neutral";
};

type MetricCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: MetricTrend;
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: MetricCardProps) {
  const isPositive = trend?.direction === "up";
  const isNegative = trend?.direction === "down";

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {value}
            </div>

            {description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {trend && (
            <div
              className={cn(
                "flex shrink-0 items-center gap-1 text-xs font-medium",
                isPositive && "text-primary",
                isNegative && "text-destructive",
                !isPositive && !isNegative && "text-muted-foreground",
              )}
            >
              {isPositive && <ArrowUpRight className="size-3.5" />}
              {isNegative && <ArrowDownRight className="size-3.5" />}

              <span>{trend.value}</span>
            </div>
          )}
        </div>

        {trend?.label && (
          <p className="mt-2 text-xs text-muted-foreground">
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}