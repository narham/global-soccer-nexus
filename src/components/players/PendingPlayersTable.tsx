import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface PendingPlayer {
  id: string;
  full_name: string;
  position: string;
  nik: string | null;
  created_at: string;
  registration_status: string;
  clubs?: {
    name: string;
  };
}

interface PendingPlayersTableProps {
  players: PendingPlayer[];
  onRefresh?: () => void;
}

export const PendingPlayersTable = ({ players, onRefresh }: PendingPlayersTableProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPlayers = players.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(players.length / itemsPerPage);

  const getPositionColor = (position: string) => {
    const colors = {
      GK: "bg-blue-500",
      DF: "bg-green-500",
      MF: "bg-yellow-500",
      FW: "bg-red-500",
    };
    return colors[position as keyof typeof colors] || "bg-gray-500";
  };

  const isRecent = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return diff < 24 * 60 * 60 * 1000; // Less than 24 hours
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pemain</TableHead>
              <TableHead>Posisi</TableHead>
              <TableHead>Klub Pendaftar</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Tanggal Registrasi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPlayers.map((player) => (
              <TableRow 
                key={player.id}
                className={isRecent(player.created_at) ? "bg-amber-50 dark:bg-amber-950/20" : ""}
              >
                <TableCell className="font-medium">{player.full_name}</TableCell>
                <TableCell>
                  <Badge className={getPositionColor(player.position)}>
                    {player.position}
                  </Badge>
                </TableCell>
                <TableCell>{player.clubs?.name || "-"}</TableCell>
                <TableCell className="font-mono text-sm">{player.nik || "-"}</TableCell>
                <TableCell>
                  {format(new Date(player.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}
                  {isRecent(player.created_at) && (
                    <Badge variant="secondary" className="ml-2 text-xs">Baru</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">🕐 Menunggu</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, players.length)} dari {players.length} pemain
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
