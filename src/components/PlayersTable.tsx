import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, UserCheck } from "lucide-react";
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
import { PlayerRegistrationStatusBadge } from "./players/PlayerRegistrationStatusBadge";
import { useUserRole } from "@/hooks/useUserRole";
import { MobileTableCard, MobileTableRow } from "@/components/ui/mobile-table-card";

interface Player {
  id: string;
  full_name: string;
  position: string;
  shirt_number: number | null;
  nationality: string;
  date_of_birth: string;
  injury_status: string | null;
  registration_status?: string;
  current_club_id?: string | null;
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
  const { isAdminKlub } = useUserRole();

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
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
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
              <TableHead className="hidden lg:table-cell">Status Cedera</TableHead>
              {isAdminKlub && <TableHead>Status Registrasi</TableHead>}
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
                    {player.clubs?.name ? (
                      player.clubs.name
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Free Agent
                      </Badge>
                    )}
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
                  {isAdminKlub && (
                    <TableCell>
                      <PlayerRegistrationStatusBadge 
                        status={player.registration_status || 'approved'} 
                      />
                    </TableCell>
                  )}
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {currentPlayers.length === 0 ? (
          <MobileTableCard>
            <div className="text-center py-4 text-muted-foreground">
              Tidak ada data pemain
            </div>
          </MobileTableCard>
        ) : (
          currentPlayers.map((player, index) => (
            <MobileTableCard key={player.id} onClick={() => handleView(player)}>
              <div className="flex items-start gap-3 mb-3">
                <User className="h-12 w-12 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {player.shirt_number && (
                      <span className="text-2xl font-bold text-primary">
                        {player.shirt_number}
                      </span>
                    )}
                    <h3 className="font-semibold text-base truncate">{player.full_name}</h3>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={getPositionColor(player.position)}>
                      {player.position}
                    </Badge>
                    {player.injury_status && (
                      <Badge variant={getInjuryColor(player.injury_status)}>
                        {getInjuryLabel(player.injury_status)}
                      </Badge>
                    )}
                    {isAdminKlub && (
                      <PlayerRegistrationStatusBadge 
                        status={player.registration_status || 'approved'} 
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-0 border-t pt-2">
                <MobileTableRow label="Klub" value={player.clubs?.name || "—"} />
                <MobileTableRow label="Kewarganegaraan" value={player.nationality} />
                <MobileTableRow 
                  label="Usia" 
                  value={`${calculateAge(player.date_of_birth)} tahun`} 
                />
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <div 
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TableActions
                    onView={() => handleView(player)}
                    onEdit={() => handleEdit(player)}
                    onDelete={() => handleDelete(player)}
                    itemName={player.full_name}
                  />
                </div>
              </div>
            </MobileTableCard>
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Menampilkan {startIndex + 1}-{Math.min(endIndex, players.length)} dari {players.length} pemain
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm min-h-[44px] md:min-h-0"
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
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            >
              Awal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            >
              Prev
            </Button>
            <div className="flex items-center px-3 text-sm min-h-[44px] md:min-h-0">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            >
              Akhir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
