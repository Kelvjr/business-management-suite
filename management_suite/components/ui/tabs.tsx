"use client";

import * as React from "react";
import { Tabs as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Tabs = Primitive.Root;
export function TabsList({ className, ...props }: React.ComponentProps<typeof Primitive.List>) { return <Primitive.List className={cn("inline-flex items-center gap-1 rounded-xl bg-muted p-1", className)} {...props} />; }
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof Primitive.Trigger>) { return <Primitive.Trigger className={cn("rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
export function TabsContent({ className, ...props }: React.ComponentProps<typeof Primitive.Content>) { return <Primitive.Content className={cn("mt-5 outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />; }
