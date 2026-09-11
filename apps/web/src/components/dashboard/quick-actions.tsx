import {
  ArrowUpRight,
  BriefcaseBusiness,
  Megaphone,
  UserCheck,
  UserPlus,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type QuickAction = {
  title: string;
  description: string;
  icon: typeof UserPlus;
};

const actions: QuickAction[] = [
  {
    title: "Add Employee",
    description: "Create a new employee profile",
    icon: UserPlus,
  },
  {
    title: "Approve Leave",
    description: "Review pending leave requests",
    icon: UserCheck,
  },
  {
    title: "Create Announcement",
    description: "Share an update with employees",
    icon: Megaphone,
  },
  {
    title: "Open Position",
    description: "Create a new job opening",
    icon: BriefcaseBusiness,
  },
];

export function QuickActions() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>

        <p className="mt-2 text-sm text-muted-foreground">
          Common actions to help you move faster.
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-2">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.title}
                type="button"
                className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-2.5 text-left transition-all duration-[var(--motion-fast)] hover:border-border/60 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground transition-colors duration-[var(--motion-fast)] group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {action.title}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>

                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--motion-fast)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}