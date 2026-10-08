"use client";

import {
  Activity,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Command,
  LayoutDashboard,
  Network,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  UserRoundPlus,
} from "lucide-react";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Employees", icon: Users },
  { label: "Organization", icon: Network },
  { label: "Attendance", icon: CalendarDays },
  { label: "Leave", icon: BriefcaseBusiness },
  { label: "Payroll", icon: CircleDollarSign },
  { label: "Performance", icon: Target },
];

const activities = [
  {
    name: "Rahul Sharma",
    action: "updated his profile",
    time: "12 min ago",
  },
  {
    name: "Priya Menon",
    action: "submitted a leave request",
    time: "34 min ago",
  },
  {
    name: "Arjun Kapoor",
    action: "completed a performance goal",
    time: "1 hr ago",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-[#0d0d0f] lg:flex lg:flex-col">
          <div className="flex h-20 items-center px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
                <Sparkles size={18} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[0.18em]">
                  AERONIX
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  HR
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
              Workspace
            </p>

            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      item.active
                        ? "bg-white/[0.08] text-white"
                        : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                    }`}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="mb-3 mt-8 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
              System
            </p>

            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200">
              <ShieldCheck size={17} />
              <span>Reports & Audit</span>
            </button>

            <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200">
              <Settings size={17} />
              <span>Settings</span>
            </button>
          </nav>

          <div className="border-t border-white/[0.06] p-4">
            <div className="rounded-xl bg-white/[0.04] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
                  TU
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">Test User</p>
                  <p className="truncate text-xs text-zinc-500">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="flex h-20 items-center justify-between border-b border-white/[0.06] px-5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.05] lg:hidden">
                <Command size={18} />
              </button>

              <div className="relative hidden sm:block">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                />
                <input
                  placeholder="Search anything..."
                  className="h-10 w-64 rounded-xl border border-white/[0.07] bg-white/[0.03] pl-9 pr-12 text-sm outline-none placeholder:text-zinc-600 focus:border-white/20"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-zinc-600">
                  ⌘ K
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded-xl p-2.5 text-zinc-500 hover:bg-white/[0.05] hover:text-white">
                <Bell size={18} />
              </button>
              <div className="ml-1 h-8 w-8 rounded-full bg-zinc-800 text-center text-[11px] leading-8">
                TU
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <div className="mb-8">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                Monday · September 2026
              </p>

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Good morning, Test.
                  </h1>
                  <p className="mt-2 text-sm text-zinc-500">
                    Here&apos;s what&apos;s happening across your workforce.
                  </p>
                </div>

                <button className="flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200">
                  <UserRoundPlus size={16} />
                  Add employee
                </button>
              </div>
            </div>

            {/* Hero / Pulse */}
            <div className="mb-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 sm:p-7">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/[0.035] blur-3xl" />

                <div className="relative">
                  <div className="mb-7 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Activity size={16} />
                      Workforce Pulse
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300">
                      Healthy
                    </span>
                  </div>

                  <div className="flex items-end gap-5">
                    <div className="text-6xl font-semibold tracking-tighter">
                      84
                    </div>
                    <div className="pb-2 text-sm text-zinc-500">
                      / 100
                    </div>
                  </div>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full w-[84%] rounded-full bg-white" />
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-sm text-zinc-400">
                    <ArrowUpRight size={15} className="text-emerald-400" />
                    <span className="text-zinc-200">6.4%</span>
                    <span>from last month</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d0f] p-6 sm:p-7">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm text-zinc-400">
                    Attention required
                  </span>
                  <span className="text-xs text-zinc-600">3 items</span>
                </div>

                <div className="space-y-4">
                  <AttentionItem
                    title="2 leave requests"
                    description="Waiting for approval"
                  />
                  <AttentionItem
                    title="Payroll review"
                    description="September cycle closes tomorrow"
                  />
                  <AttentionItem
                    title="4 goals overdue"
                    description="Across 2 departments"
                  />
                </div>

                <button className="mt-6 flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white">
                  View all
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
              <StatCard label="Employees" value="248" change="+12 this month" />
              <StatCard label="Present today" value="231" change="93.1% attendance" />
              <StatCard label="Open positions" value="14" change="6 high priority" />
              <StatCard label="Departments" value="18" change="3 new teams" />
            </div>

            {/* Bottom */}
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d0f] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium">Recent activity</h2>
                    <p className="mt-1 text-xs text-zinc-600">
                      Latest workforce updates
                    </p>
                  </div>

                  <button className="text-xs text-zinc-500 hover:text-white">
                    View timeline
                  </button>
                </div>

                <div className="space-y-5">
                  {activities.map((activity) => (
                    <div
                      key={activity.name}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium">
                          {activity.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm">
                            <span className="font-medium">{activity.name}</span>{" "}
                            <span className="text-zinc-500">
                              {activity.action}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d0f] p-6">
                <div className="mb-6">
                  <h2 className="text-sm font-medium">Organization DNA</h2>
                  <p className="mt-1 text-xs text-zinc-600">
                    Explore how your organization connects.
                  </p>
                </div>

                <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl border border-white/[0.05] bg-[#09090b]">
                  <div className="absolute h-32 w-32 rounded-full border border-white/[0.06]" />
                  <div className="absolute h-20 w-20 rounded-full border border-white/[0.08]" />

                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white text-black shadow-2xl">
                    <Network size={20} />
                  </div>

                  <div className="absolute left-[22%] top-[30%] h-3 w-3 rounded-full bg-zinc-500" />
                  <div className="absolute right-[23%] top-[28%] h-3 w-3 rounded-full bg-zinc-400" />
                  <div className="absolute bottom-[23%] left-[30%] h-3 w-3 rounded-full bg-zinc-600" />
                  <div className="absolute bottom-[25%] right-[30%] h-3 w-3 rounded-full bg-zinc-500" />

                  <div className="absolute inset-x-10 top-1/2 h-px bg-white/[0.05]" />
                  <div className="absolute inset-y-10 left-1/2 w-px bg-white/[0.05]" />
                </div>

                <button className="mt-5 flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white">
                  Open Organization DNA
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d0f] p-5">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{change}</p>
    </div>
  );
}

function AttentionItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-white" />
      <div>
        <p className="text-sm text-zinc-200">{title}</p>
        <p className="mt-1 text-xs text-zinc-600">{description}</p>
      </div>
    </div>
  );
}