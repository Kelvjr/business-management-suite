"use client";

import * as React from "react";
import { Switch as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof Primitive.Root>) { return <Primitive.Root className={cn("inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent bg-input outline-none transition-colors data-[state=checked]:bg-[#1ca270] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", className)} {...props}><Primitive.Thumb className="pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5" /></Primitive.Root>; }
