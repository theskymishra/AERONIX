"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Command,
  Search,
  Users,
  Building2,
  CalendarDays,
  BarChart3,
  Settings,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const commands = [
  {
    label: "Search employees",
    description: "Find employees across AERONIX",
    icon: Users,
  },
  {
    label: "Open organization",
    description: "Explore your organization",
    icon: Building2,
  },
  {
    label: "View attendance",
    description: "Check attendance records",
    icon: CalendarDays,
  },
  {
    label: "View performance",
    description: "Review performance insights",
    icon: BarChart3,
  },
  {
    label: "Open settings",
    description: "Manage AERONIX settings",
    icon: Settings,
  },
];

export function CommandCenter() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredCommands = commands.filter((command) => {
    const searchText = `${command.label} ${command.description}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  return (
    <>
      <button
        type="button"
        aria-label="Open Command Center"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="size-4" />

        <span className="hidden sm:inline">Search</span>

        <span className="hidden items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium sm:flex">
          <Command className="size-3" />
          K
        </span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);

          if (!nextOpen) {
            setQuery("");
          }
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">AERONIX Command Center</DialogTitle>

          <DialogDescription className="sr-only">
            Search and quickly access AERONIX features.
          </DialogDescription>

          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />

            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search AERONIX..."
              className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />

            <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
              ESC
            </kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((command) => {
                const Icon = command.icon;

                return (
                  <button
                    key={command.label}
                    type="button"
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{command.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {command.description}
                      </p>
                    </div>

                    <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-10 text-center">
                <p className="text-sm font-medium">No results found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different search.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Command className="size-3" />
              <span>K</span>
              <span className="ml-1">to open</span>
              <span className="mx-1">•</span>
              <span>ESC</span>
              <span>to close</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}