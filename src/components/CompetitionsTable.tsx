import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "./TableActions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Competition {
  id: string;
  name: string;
  season: string;
  type: string;
  format: string;
  status: string | null;
  start_date: string;
  end_date: string | null;
  num_teams: number | null;
}

interface CompetitionsTableProps {
  competitions: Competition[];
  onRefresh: () => void;
}

export const CompetitionsTable = ({ competitions, onRefresh }: CompetitionsTableProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "default";
      case "upcoming":
        return "secondary";
      case "finished":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "upcoming":
        return "Akan Datang";
      case "finished":
        return "Selesai";
      default:
        return "—";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "liga":
        return "Liga";
      case "piala":
        return "Piala";
      case "youth_league":
        return "Liga Muda";
      default:
        return type;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case "round_robin":
        return "Round Robin";
      case "knockout":
        return "Knockout";
      case "group_knockout":
        return "Grup + Knockout";
      default:
        return format;
    }
  };

  const totalPages = Math.ceil(competitions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompetitions = competitions.slice(startIndex, endIndex);

  const handleView = (competition: Competition) => {
    navigate(`/competitions/${competition.id}`);
  };

  const handleEdit = (competition: Competition) => {
    toast({
      title: "Edit Kompetisi",
      description: `Mengedit data ${competition.name}`,
    });
  };

  const handleDelete = (competition: Competition) => {
    toast({
      title: "Hapus Kompetisi",
      description: `${competition.name} berhasil dihapus`,
    });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead className="w-12">Logo</TableHead>
              <TableHead>Nama Kompetisi</TableHead>
              <TableHead className="hidden sm:table-cell">Musim</TableHead>
              <TableHead className="hidden md:table-cell">Jenis</TableHead>
              <TableHead className="hidden lg:table-cell">Format</TableHead>
              <TableHead className="hidden xl:table-cell">Jumlah Tim</TableHead>
              <TableHead className="hidden lg:table-cell">Tanggal Mulai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCompetitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Tidak ada data kompetisi
                </TableCell>
              </TableRow>
            ) : (
              currentCompetitions.map((competition, index) => (
                <TableRow key={competition.id}>
                  <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                  <TableCell>
                    <Trophy className="h-6 w-6 text-primary" />
                  </TableCell>
                  <TableCell className="font-medium">{competition.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{competition.season}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {getTypeLabel(competition.type)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {getFormatLabel(competition.format)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-center">
                    {competition.num_teams || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {format(new Date(competition.start_date), "d MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(competition.status)}>
                      {getStatusLabel(competition.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TableActions
                      onView={() => handleView(competition)}
                      onEdit={() => handleEdit(competition)}
                      onDelete={() => handleDelete(competition)}
                      itemName={competition.name}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {startIndex + 1}-{Math.min(endIndex, competitions.length)} dari {competitions.length} kompetisi
        </div>
        <div className="flex items-center gap-2">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value={10}>10 / halaman</option>
            <option value={25}>25 / halaman</option>
            <option value={50}>50 / halaman</option>
          </select>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              Awal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </Button>
            <div className="flex items-center px-3 text-sm">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Akhir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
