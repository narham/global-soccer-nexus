import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface RefereesTableProps {
  referees: any[];
  loading: boolean;
  onEdit: (referee: any) => void;
  onDelete: (id: string) => void;
}

export function RefereesTable({
  referees,
  loading,
  onEdit,
  onDelete,
}: RefereesTableProps) {
  const { isAdminFederasi } = useUserRole();

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (referees.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card">
        <p className="text-muted-foreground">Belum ada data wasit</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Lengkap</TableHead>
            <TableHead>No. Lisensi</TableHead>
            <TableHead>Tipe Lisensi</TableHead>
            <TableHead>Spesialisasi</TableHead>
            <TableHead>Pengalaman</TableHead>
            <TableHead>Berlaku Sampai</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Kontak</TableHead>
            {isAdminFederasi && <TableHead className="text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {referees.map((referee) => (
            <TableRow key={referee.id}>
              <TableCell className="font-medium">{referee.full_name}</TableCell>
              <TableCell>{referee.license_number || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline">{referee.license_type}</Badge>
              </TableCell>
              <TableCell>{referee.specialization || "-"}</TableCell>
              <TableCell>{referee.experience_years} tahun</TableCell>
              <TableCell>
                {referee.license_valid_until
                  ? format(new Date(referee.license_valid_until), "dd MMM yyyy", {
                      locale: localeId,
                    })
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={referee.status === "active" ? "default" : "secondary"}
                >
                  {referee.status === "active" ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{referee.email || "-"}</div>
                  <div className="text-muted-foreground">{referee.phone || "-"}</div>
                </div>
              </TableCell>
              {isAdminFederasi && (
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(referee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(referee.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
