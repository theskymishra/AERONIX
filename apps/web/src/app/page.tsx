import {
  BriefcaseBusiness,
  CalendarOff,
  Users,
  UserCheck,
} from "lucide-react";

import { AttentionPanel } from "@/components/dashboard/attention-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { OrganizationSnapshot } from "@/components/dashboard/organization-snapshot";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { WorkforcePulse } from "@/components/dashboard/workforce-pulse";

const metrics = [
  {
    title: "Total Employees",
    value: "1,248",
    description: "Across all departments",
    icon: Users,
    trend: {
      value: "4.2%",
      label: "vs last month",
      direction: "up" as const,
    },
  },
  {
    title: "Present Today",
    value: "1,176",
    description: "94.2% attendance",
    icon: UserCheck,
    trend: {
      value: "1.8%",
      label: "vs yesterday",
      direction: "up" as const,
    },
  },
  {
    title: "On Leave",
    value: "42",
    description: "3 pending approval",
    icon: CalendarOff,
    trend: {
      value: "2.4%",
      label: "vs last week",
      direction: "down" as const,
    },
  },
  {
    title: "Open Positions",
    value: "18",
    description: "6 high priority",
    icon: BriefcaseBusiness,
    trend: {
      value: "3",
      label: "new this month",
      direction: "neutral" as const,
    },
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section>
        {/* Welcome */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Workforce overview
            </p>

            <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Good morning, Akash
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Here's what's happening across your organization today.
            </p>
          </div>
        </div>

        {/* Workforce Metrics */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        {/* Workforce Pulse + Attention */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <WorkforcePulse />
          </div>

          <div className="lg:col-span-5">
            <AttentionPanel />
          </div>
        </div>

        {/* Organization Snapshot */}
        <div className="mt-6">
          <OrganizationSnapshot />
        </div>

        {/* Recent Activity + Quick Actions */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <RecentActivity />
          </div>

          <div className="lg:col-span-5">
            <QuickActions />
          </div>
        </div>
      </section>
    </div>
  );
}