import * as React from "react";

import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "cn";

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm transition-[border-color,box-shadow,background-color] duration-[var(--motion-standard)] outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "hover:border-foreground/20",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:bg-background/50 dark:hover:border-foreground/20",
        "dark:disabled:bg-muted/50",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };