"use client";

import { ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportRowsToCsv,
  exportRowsToExcel,
  exportRowsToPdf,
  type ExportRow,
} from "@/lib/exporters";

type DashboardExportMenuProps = {
  rows: ExportRow[];
  fileBaseName: string;
  pdfTitle: string;
  /** Merged into the trigger button. */
  triggerClassName?: string;
};

export function DashboardExportMenu({
  rows,
  fileBaseName,
  pdfTitle,
  triggerClassName,
}: DashboardExportMenuProps) {
  const disabled = rows.length === 0;

  function runExport(action: () => void, label: string) {
    try {
      action();
      toast.success(`${label} export complete`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export data.";
      toast.error(message);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="outline"
          className={
            triggerClassName ??
            "h-7 rounded-[5px] border-stone-300 bg-white px-3 text-xs font-semibold text-stone-950 shadow-none hover:bg-zinc-50"
          }
        >
          <Download className="size-3.5 shrink-0" />
          Export
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[9rem]">
        <DropdownMenuItem
          onSelect={() => runExport(() => exportRowsToCsv(rows, fileBaseName), "CSV")}
        >
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            runExport(() => exportRowsToPdf(rows, fileBaseName, pdfTitle), "PDF")
          }
        >
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            runExport(() => exportRowsToExcel(rows, fileBaseName), "Excel")
          }
        >
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
