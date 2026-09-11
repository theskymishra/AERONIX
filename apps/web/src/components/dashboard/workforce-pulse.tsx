import { Activity, ArrowUpRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";

type PulseSignal = {
  label: string;
  value: number;
};

const signals: PulseSignal[] = [
  { label: "Attendance", value: 94 },
  { label: "Performance", value: 87 },
  { label: "Goals", value: 81 },
  { label: "Workload", value: 76 },
  { label: "Retention", value: 89 },
];

const pulseScore = 82;

function getSignalStatus(value: number) {
  if (value >= 85) return "Strong";
  if (value >= 75) return "Stable";
  return "Needs attention";
}

export function WorkforcePulse() {
  return (
    <Card className="h-full min-h-[320px] overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Activity className="size-4" />
            </div>

            <CardTitle>Workforce Pulse</CardTitle>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Organizational signals across the last 30 days.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          30 days
        </span>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-8">
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex size-36 items-center justify-center rounded-full border border-primary/15 bg-primary/[0.04]">
            <div className="absolute inset-3 rounded-full border border-primary/10" />

            <div className="text-center">
              <div className="font-heading text-4xl font-semibold tracking-tight">
                {pulseScore}
              </div>

              <div className="mt-1 text-xs font-medium text-muted-foreground">
                Healthy
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
            <ArrowUpRight className="size-3.5" />
            3.2% vs previous period
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
          {signals.map((signal) => {
            const status = getSignalStatus(signal.value);

            return (
              <div key={signal.label} className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {signal.label}
                  </span>

                  <span className="text-xs font-semibold tabular-nums">
                    {signal.value}
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-[width] duration-[var(--motion-cinematic)]",
                      signal.value >= 85 && "opacity-100",
                      signal.value >= 75 &&
                        signal.value < 85 &&
                        "opacity-75",
                      signal.value < 75 && "opacity-50",
                    )}
                    style={{ width: `${signal.value}%` }}
                  />
                </div>

                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {status}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}