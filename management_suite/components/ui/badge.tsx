import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }: React.ComponentProps<"span"> & { variant?: "default" | "outline" }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", variant === "outline" ? "border-border bg-transparent text-foreground" : "border-border bg-muted text-muted-foreground", className)} {...props} />;
}
