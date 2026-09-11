"use client";

import { useState } from "react";
import { Menu, Settings } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { navigation } from "./sidebar";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <DialogContent
        showCloseButton={true}
        className="left-0 top-0 h-dvh w-[280px] translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 border-r border-border p-0 sm:max-w-[280px]"
      >
        <DialogTitle className="sr-only">AERONIX navigation</DialogTitle>

        <DialogDescription className="sr-only">
          Navigate through the AERONIX HR application.
        </DialogDescription>

        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-border px-6">
            <div>
              <div className="text-lg font-semibold tracking-tight">
                AERONIX
              </div>
              <div className="text-xs text-muted-foreground">HR</div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}