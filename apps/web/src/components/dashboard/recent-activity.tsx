import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  FileText,
  Target,
  UserPlus,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ActivityItem = {
  title: string;
  description: string;
  time: string;
  icon: typeof UserPlus;
};

const activities: ActivityItem[] = [
  {
    title: "New employee joined",
    description: "Aarav Mehta joined the Engineering team",
    time: "12 min ago",
    icon: UserPlus,
  },
  {
    title: "Leave request submitted",
    description: "Priya Sharma requested 2 days of leave",
    time: "34 min ago",
    icon: CalendarCheck,
  },
  {
    title: "Performance review completed",
    description: "Q2 review completed for 18 employees",
    time: "1 hr ago",
    icon: Target,
  },
  {
    title: "Document uploaded",
    description: "New policy document added to HR documents",
    time: "2 hrs ago",
    icon: FileText,
  },
  {
    title: "Position updated",
    description: "Senior Software Engineer position updated",
    time: "3 hrs ago",
    icon: BriefcaseBusiness,
  },
];

export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Recent Activity</CardTitle>

          <p className="mt-2 text-sm text-muted-foreground">
            What's been happening across your organization.
          </p>
        </div>

        <button
          type="button"
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors duration-[var(--motion-fast)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          View all
          <ArrowRight className="size-3.5 transition-transform duration-[var(--motion-fast)] group-hover:translate-x-0.5" />
        </button>
      </CardHeader>

      <CardContent>
        <div className="divide-y divide-border/60">
          {activities.map((activity) => {
            const Icon = activity.icon;

            return (
              <div
                key={`${activity.title}-${activity.time}`}
                className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground">
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {activity.title}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                </div>

                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}