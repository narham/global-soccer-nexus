import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Table } from "lucide-react";
import { exportCompetitionStatsToPDF, exportCompetitionStatsToExcel } from "@/lib/export-utils";
import { toast } from "sonner";

interface CompetitionStatsExportMenuProps {
  standings: any[];
  competitionName: string;
}

export function CompetitionStatsExportMenu({ standings, competitionName }: CompetitionStatsExportMenuProps) {
  const handleExportPDF = () => {
    try {
      exportCompetitionStatsToPDF(standings, competitionName);
      toast.success("Klasemen berhasil diexport ke PDF");
    } catch (error: any) {
      toast.error("Gagal export ke PDF: " + error.message);
    }
  };

  const handleExportExcel = () => {
    try {
      exportCompetitionStatsToExcel(standings, competitionName);
      toast.success("Klasemen berhasil diexport ke Excel");
    } catch (error: any) {
      toast.error("Gagal export ke Excel: " + error.message);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Klasemen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Format Export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Export ke PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <Table className="mr-2 h-4 w-4" />
          Export ke Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
