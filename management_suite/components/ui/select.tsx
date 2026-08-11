"use client";

import * as React from "react";
import { Select as Primitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = Primitive.Root;
export const SelectValue = Primitive.Value;
export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof Primitive.Trigger>) { return <Primitive.Trigger className={cn("flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary/50 focus:ring-3 focus:ring-primary/10 data-[placeholder]:text-muted-foreground", className)} {...props}>{children}<Primitive.Icon asChild><ChevronDown className="size-4 text-muted-foreground" /></Primitive.Icon></Primitive.Trigger>; }
export function SelectContent({ className, children, ...props }: React.ComponentProps<typeof Primitive.Content>) { return <Primitive.Portal><Primitive.Content position="popper" sideOffset={5} className={cn("z-[60] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border bg-popover p-1.5 shadow-xl", className)} {...props}><Primitive.Viewport>{children}</Primitive.Viewport></Primitive.Content></Primitive.Portal>; }
export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof Primitive.Item>) { return <Primitive.Item className={cn("relative flex cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none focus:bg-muted", className)} {...props}><span className="absolute left-2.5"><Primitive.ItemIndicator><Check className="size-4" /></Primitive.ItemIndicator></span><Primitive.ItemText>{children}</Primitive.ItemText></Primitive.Item>; }
