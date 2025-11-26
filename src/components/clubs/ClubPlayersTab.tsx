import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClubPlayersTabProps {
  players: any[];
}

export const ClubPlayersTab = ({ players }: ClubPlayersTabProps) => {
  const navigate = useNavigate();

  const getPositionBadge = (position: string) => {
    const colors: { [key: string]: string } = {
      GK: "bg-yellow-500",
      DF: "bg-blue-500",
      MF: "bg-green-500",
      FW: "bg-red-500",
    };
    return <Badge className={colors[position] || ""}>{position}</Badge>;
  };

  const getInjuryBadge = (status: string) => {
    if (status === "fit") return <Badge className="bg-green-500">Fit</Badge>;
    if (status === "cedera") return <Badge variant="destructive">Cedera</Badge>;
    return <Badge className="bg-yellow-500">Pemulihan</Badge>;
  };

  const getContractStatus = (contractEnd: string | null) => {
    if (!contractEnd) return null;
    const endDate = new Date(contractEnd);
    const today = new Date();
    const monthsLeft = (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsLeft < 0) return <Badge variant="destructive">Kontrak Habis</Badge>;
    if (monthsLeft < 6) return <Badge className="bg-yellow-500">Segera Berakhir</Badge>;
    return <Badge className="bg-green-500">Aktif</Badge>;
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <User className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Belum ada pemain terdaftar</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Foto</TableHead>
            <TableHead>Nama Pemain</TableHead>
            <TableHead>Posisi</TableHead>
            <TableHead>No. Punggung</TableHead>
            <TableHead>Kewarganegaraan</TableHead>
            <TableHead>Status Cedera</TableHead>
            <TableHead>Kontrak</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => (
            <TableRow
              key={player.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/players/${player.id}`)}
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{player.full_name}</TableCell>
              <TableCell>{getPositionBadge(player.position)}</TableCell>
              <TableCell>{player.shirt_number || "-"}</TableCell>
              <TableCell>{player.nationality}</TableCell>
              <TableCell>{getInjuryBadge(player.injury_status)}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  {getContractStatus(player.contract_end)}
                  {player.contract_end && (
                    <div className="text-xs text-muted-foreground">
                      s/d {new Date(player.contract_end).toLocaleDateString("id-ID")}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {players.some((p) => {
        const monthsLeft = p.contract_end
          ? (new Date(p.contract_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
          : 0;
        return monthsLeft < 6 && monthsLeft > 0;
      }) && (
        <div className="p-4 bg-yellow-50 border-t flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Peringatan Kontrak</p>
            <p className="text-sm text-yellow-700">
              Beberapa pemain memiliki kontrak yang akan berakhir dalam 6 bulan ke depan
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
