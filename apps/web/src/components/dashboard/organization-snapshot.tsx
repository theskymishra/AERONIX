import {
  ArrowUpRight,
  Building2,
  GitBranch,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OrganizationNode = {
  label: string;
  count?: string;
  level: "root" | "department" | "team";
};

const organizationNodes: OrganizationNode[] = [
  {
    label: "Leadership",
    count: "24",
    level: "root",
  },
  {
    label: "Engineering",
    count: "286",
    level: "department",
  },
  {
    label: "People & HR",
    count: "84",
    level: "department",
  },
  {
    label: "Finance",
    count: "72",
    level: "department",
  },
  {
    label: "Product",
    count: "118",
    level: "department",
  },
  {
    label: "Design",
    count: "64",
    level: "department",
  },
];

const organizationStats = [
  {
    label: "Employees",
    value: "1,248",
    icon: Users,
  },
  {
    label: "Departments",
    value: "8",
    icon: Building2,
  },
  {
    label: "Teams",
    value: "42",
    icon: GitBranch,
  },
];

export function OrganizationSnapshot() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <GitBranch className="size-4" />
            </div>

            <CardTitle>Organization DNA</CardTitle>
          </div>

          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Explore how people, departments, and teams connect across your
            organization.
          </p>
        </div>

        <button
          type="button"
          className="group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-[var(--motion-fast)] hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Explore
          <ArrowUpRight className="size-4 transition-transform duration-[var(--motion-fast)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          {/* Organization visualization */}
          <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08),transparent_65%)]" />

            <div className="relative flex min-h-[230px] flex-col items-center justify-center">
              {/* Leadership */}
              <div className="relative z-10">
                <div className="flex size-16 items-center justify-center rounded-full border border-primary/30 bg-background shadow-[var(--elevation-card)]">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="size-5" />
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <p className="text-xs font-semibold">Leadership</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    24 people
                  </p>
                </div>
              </div>

              {/* Connection */}
              <div className="h-8 w-px bg-border" />

              {/* Departments */}
              <div className="relative grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
                {organizationNodes
                  .filter((node) => node.level === "department")
                  .map((node) => (
                    <div
                      key={node.label}
                      className="group relative rounded-lg border border-border/60 bg-background/80 p-3 backdrop-blur-sm transition-all duration-[var(--motion-standard)] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--elevation-card)]"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                          <Building2 className="size-3.5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {node.label}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {node.count} people
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Organization statistics */}
          <div className="grid grid-cols-3 gap-3 lg:w-56 lg:grid-cols-1">
            {organizationStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="size-3.5" />

                    <span className="text-[11px]">{stat.label}</span>
                  </div>

                  <p className="mt-1.5 font-heading text-lg font-semibold tracking-tight">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}