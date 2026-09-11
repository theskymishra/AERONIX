"use client";

import { CommandCenter } from "./command-center";
import { MobileNavigation } from "./mobile-navigation";
import { Notifications } from "./notifications";
import { ProfileMenu } from "./profile-menu";

export function TopNavigation() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNavigation />

        <span className="text-sm font-medium text-muted-foreground">
          Dashboard
        </span>
      </div>

      <div className="flex items-center gap-2">
        <CommandCenter />

        <Notifications />

        <ProfileMenu />
      </div>
    </header>
  );
}