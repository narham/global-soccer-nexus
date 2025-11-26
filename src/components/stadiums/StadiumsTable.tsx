import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/TableActions";

interface StadiumsTableProps {
  stadiums: any[];
  onEdit: (stadium: any) => void;
  onDelete: (id: string) => void;
}

export const StadiumsTable = ({ stadiums, onEdit, onDelete }: StadiumsTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      default: return "destructive";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Disetujui";
      case "pending": return "Pending";
      default: return "Ditolak";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Stadion</TableHead>
          <TableHead>Kota</TableHead>
          <TableHead>Kapasitas</TableHead>
          <TableHead>Klub Pemilik</TableHead>
          <TableHead>Status Lisensi AFC</TableHead>
          <TableHead className="w-[100px]">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stadiums.map((stadium) => (
          <TableRow key={stadium.id}>
            <TableCell className="font-medium">{stadium.name}</TableCell>
            <TableCell>{stadium.city}</TableCell>
            <TableCell>{stadium.capacity?.toLocaleString()}</TableCell>
            <TableCell>{stadium.owner_club?.name || "-"}</TableCell>
            <TableCell>
              <Badge variant={getStatusColor(stadium.afc_license_status)}>
                {getStatusLabel(stadium.afc_license_status)}
              </Badge>
            </TableCell>
            <TableCell>
              <TableActions
                onEdit={() => onEdit(stadium)}
                onDelete={() => onDelete(stadium.id)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
