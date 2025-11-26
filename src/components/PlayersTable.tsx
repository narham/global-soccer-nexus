import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
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

interface Player {
  id: string;
  full_name: string;
  position: string;
  shirt_number: number | null;
  nationality: string;
  date_of_birth: string;
  injury_status: string | null;
  clubs?: {
    name: string;
  } | null;
}

interface PlayersTableProps {
  players: Player[];
  onRefresh: () => void;
}

export const PlayersTable = ({ players, onRefresh }: PlayersTableProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();

  const getPositionColor = (position: string) => {
    switch (position) {
      case "GK":
        return "secondary";
      case "DF":
        return "default";
      case "MF":
        return "outline";
      case "FW":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getInjuryColor = (status: string | null) => {
    switch (status) {
      case "fit":
        return "default";
      case "cedera":
        return "destructive";
      case "pemulihan":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInjuryLabel = (status: string | null) => {
    switch (status) {
      case "fit":
        return "Fit";
      case "cedera":
        return "Cedera";
      case "pemulihan":
        return "Pemulihan";
      default:
        return "—";
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const totalPages = Math.ceil(players.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPlayers = players.slice(startIndex, endIndex);

  const handleView = (player: Player) => {
    navigate(`/players/${player.id}`);
  };

  const handleEdit = (player: Player) => {
    toast({
      title: "Edit Pemain",
      description: `Mengedit data ${player.full_name}`,
    });
  };

  const handleDelete = (player: Player) => {
    toast({
      title: "Hapus Pemain",
      description: `${player.full_name} berhasil dihapus`,
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
              <TableHead className="w-12">Foto</TableHead>
              <TableHead className="hidden sm:table-cell w-20">No. Punggung</TableHead>
              <TableHead>Nama Pemain</TableHead>
              <TableHead>Posisi</TableHead>
              <TableHead className="hidden md:table-cell">Klub</TableHead>
              <TableHead className="hidden lg:table-cell">Kewarganegaraan</TableHead>
              <TableHead className="hidden xl:table-cell">Usia</TableHead>
              <TableHead className="hidden lg:table-cell">Status</TableHead>
              <TableHead className="w-12">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Tidak ada data pemain
                </TableCell>
              </TableRow>
            ) : (
              currentPlayers.map((player, index) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                  <TableCell>
                    <User className="h-6 w-6 text-primary" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell font-bold text-lg">
                    {player.shirt_number || "—"}
                  </TableCell>
                  <TableCell className="font-medium">{player.full_name}</TableCell>
                  <TableCell>
                    <Badge variant={getPositionColor(player.position)}>
                      {player.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {player.clubs?.name || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{player.nationality}</TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {calculateAge(player.date_of_birth)} tahun
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={getInjuryColor(player.injury_status)}>
                      {getInjuryLabel(player.injury_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TableActions
                      onView={() => handleView(player)}
                      onEdit={() => handleEdit(player)}
                      onDelete={() => handleDelete(player)}
                      itemName={player.full_name}
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
          Menampilkan {startIndex + 1}-{Math.min(endIndex, players.length)} dari {players.length} pemain
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
