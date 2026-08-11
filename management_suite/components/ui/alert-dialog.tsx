"use client";

import * as React from "react";
import { AlertDialog as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const AlertDialog = Primitive.Root;
export const AlertDialogTrigger = Primitive.Trigger;
export const AlertDialogCancel = Primitive.Cancel;
export const AlertDialogAction = Primitive.Action;
export function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof Primitive.Content>) { return <Primitive.Portal><Primitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" /><Primitive.Content className={cn("fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 shadow-2xl outline-none", className)} {...props} /></Primitive.Portal>; }
export function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("space-y-2", className)} {...props} />; }
export function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof Primitive.Title>) { return <Primitive.Title className={cn("font-display text-lg font-semibold", className)} {...props} />; }
export function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof Primitive.Description>) { return <Primitive.Description className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />; }
export function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />; }
