import type { ReactNode } from "react";
import Link from "next/link";
import { FileText, FolderTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardQuickActionsProps = {
  /** Dashboard sidebar: list-style rows, full width. */
  compact?: boolean;
};

function Row({
  href,
  title,
  description,
  className,
  iconClass,
  children,
}: {
  href: string;
  title: string;
  description: string;
  className?: string;
  iconClass: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full min-h-16 items-start gap-3 rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-black/20 hover:bg-stone-50/80",
        className,
      )}
    >
      <span
        className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", iconClass)}
      >
        {children}
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-semibold text-gray-900">{title}</span>
        <span className="mt-0.5 block text-xs text-gray-400">{description}</span>
      </span>
    </Link>
  );
}

export function DashboardQuickActions({ compact }: DashboardQuickActionsProps) {
  if (compact) {
    return (
      <div className="w-full rounded-2xl border border-black/10 bg-white p-5 shadow-sm shadow-black/[0.02]">
        <h3 className="text-base font-semibold text-gray-900">Quick actions</h3>
        <p className="mt-0.5 text-xs text-gray-400">Frequently used sales workflows.</p>
        <div className="mt-4 flex flex-col gap-2.5">
          <Row
            href="/sales/add"
            title="Add sale"
            description="Create a new transaction"
            iconClass="bg-fuchsia-700 text-white"
          >
            <Plus className="size-4" />
          </Row>
          <Row
            href="/sales/categories"
            title="Categories"
            description="Manage product and service groupings"
            iconClass="bg-stone-50 text-stone-800"
          >
            <FolderTree className="size-4" />
          </Row>
          <Row
            href="/reports"
            title="View reports"
            description="Open full analytics"
            iconClass="bg-stone-50 text-stone-800"
          >
            <FileText className="size-4" />
          </Row>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col rounded-[20px] bg-white p-5 shadow-sm">
      <h3 className="text-lg font-medium text-black">Quick Actions</h3>
      <p className="mt-1 text-xs font-medium text-neutral-400">
        Shortcuts for common tasks.
      </p>
      <div className="mt-4 flex flex-col gap-2.5">
        <Button
          asChild
          className="mx-auto h-9 w-full max-w-60 rounded-[5px] bg-fuchsia-700 text-xs font-medium text-white hover:bg-fuchsia-800"
        >
          <Link href="/sales/add" className="inline-flex items-center gap-2">
            <Plus className="size-3.5" />
            Add a new sale
          </Link>
        </Button>
        <Button
          asChild
          className="mx-auto h-9 w-full max-w-60 rounded-[5px] bg-orange-500 text-xs font-medium text-white hover:bg-orange-600"
        >
          <Link href="/sales" className="inline-flex items-center gap-2">
            <FolderTree className="size-3.5" />
            View categories
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="mx-auto h-9 w-full max-w-60 rounded-[5px] border-neutral-400 text-xs font-medium text-neutral-500 hover:text-neutral-700"
        >
          <Link href="/reports" className="inline-flex items-center gap-2">
            <FileText className="size-3.5" />
            View Reports
          </Link>
        </Button>
      </div>
    </div>
  );
}
