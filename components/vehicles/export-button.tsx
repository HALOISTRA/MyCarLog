"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileText, FileDown, Printer, ChevronDown } from "lucide-react";

interface ExportButtonProps {
  vehicleId: string;
}

export function ExportButton({ vehicleId }: ExportButtonProps) {
  const base = `/api/vehicles/${vehicleId}/export`;

  function downloadJson() {
    window.open(base, "_blank");
  }

  function downloadCsv() {
    window.open(`${base}?format=csv`, "_blank");
  }

  function downloadPdf() {
    window.open(`${base}?format=pdf`, "_blank");
  }

  function print() {
    window.print();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Export
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadJson}>
          <FileJson className="h-4 w-4 mr-2 text-blue-600" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadPdf}>
          <FileDown className="h-4 w-4 mr-2 text-red-600" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadCsv}>
          <FileText className="h-4 w-4 mr-2 text-green-600" />
          Service history as CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={print}>
          <Printer className="h-4 w-4 mr-2 text-gray-600" />
          Print vehicle summary
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
