"use client";

import * as React from "react";
import { Accordion as Primitive } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = Primitive.Root;
export function AccordionItem({ className, ...props }: React.ComponentProps<typeof Primitive.Item>) { return <Primitive.Item className={cn("border-b last:border-b-0", className)} {...props} />; }
export function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof Primitive.Trigger>) { return <Primitive.Header className="flex"><Primitive.Trigger className={cn("group flex flex-1 items-center justify-between py-4 text-left text-sm font-semibold outline-none transition hover:text-[#168e64] focus-visible:ring-2 focus-visible:ring-ring", className)} {...props}>{children}<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" /></Primitive.Trigger></Primitive.Header>; }
export function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof Primitive.Content>) { return <Primitive.Content className="overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" {...props}><div className={cn("pb-4 leading-6", className)}>{children}</div></Primitive.Content>; }
