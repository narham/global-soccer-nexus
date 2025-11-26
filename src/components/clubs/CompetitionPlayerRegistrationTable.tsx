import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CompetitionPlayerRegistrationTableProps {
  registrations: any[];
  onEdit: (registration: any) => void;
  onDelete: (id: string) => void;
}

export default function CompetitionPlayerRegistrationTable({
  registrations,
  onEdit,
  onDelete,
}: CompetitionPlayerRegistrationTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    const labels: any = {
      pending: "Menunggu",
      approved: "Disetujui",
      rejected: "Ditolak",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPositionBadge = (position: string) => {
    const colors: any = {
      GK: "bg-yellow-500",
      DF: "bg-blue-500",
      MF: "bg-green-500",
      FW: "bg-red-500",
    };
    return (
      <Badge className={colors[position] || "bg-gray-500"}>
        {position}
      </Badge>
    );
  };

  if (registrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Belum ada pemain terdaftar</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pemain</TableHead>
            <TableHead>Posisi</TableHead>
            <TableHead>No. Punggung</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tgl Daftar</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((reg) => (
            <TableRow key={reg.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={reg.player.photo_url} />
                    <AvatarFallback>
                      {reg.player.full_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{reg.player.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {reg.player.nationality}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{getPositionBadge(reg.player.position)}</TableCell>
              <TableCell>
                <Badge variant="outline">#{reg.shirt_number}</Badge>
              </TableCell>
              <TableCell>{getStatusBadge(reg.status)}</TableCell>
              <TableCell>
                {new Date(reg.registered_at).toLocaleDateString("id-ID")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {reg.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(reg)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(reg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {reg.status === "rejected" && reg.rejection_reason && (
                    <div className="text-sm text-muted-foreground max-w-xs">
                      Alasan: {reg.rejection_reason}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
