import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TransferWindowsTableProps {
  windows: any[];
  onRefresh: () => void;
  onEdit: (window: any) => void;
}

export function TransferWindowsTable({ windows, onRefresh, onEdit }: TransferWindowsTableProps) {
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transfer_windows")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Transfer window berhasil dihapus");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      regular: "Transfer Reguler",
      mid_season: "Transfer Tengah Musim",
      special: "Transfer Khusus",
      emergency: "Transfer Darurat",
    };
    return types[type] || type;
  };

  const getWindowStatus = (window: any) => {
    const now = new Date();
    const start = new Date(window.start_date);
    const end = new Date(window.end_date);
    
    if (window.is_active && now >= start && now <= end) {
      return { label: "Aktif", variant: "default" as const };
    } else if (now < start) {
      return { label: "Akan Datang", variant: "secondary" as const };
    } else {
      return { label: "Berakhir", variant: "outline" as const };
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Window</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Tanggal Mulai</TableHead>
            <TableHead>Tanggal Berakhir</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {windows.map((window) => (
            <TableRow key={window.id}>
              <TableCell className="font-medium">{window.name}</TableCell>
              <TableCell>{getTypeLabel(window.window_type)}</TableCell>
              <TableCell>
                {format(new Date(window.start_date), "dd MMM yyyy", { locale: id })}
              </TableCell>
              <TableCell>
                {format(new Date(window.end_date), "dd MMM yyyy", { locale: id })}
              </TableCell>
              <TableCell>
                {(() => {
                  const status = getWindowStatus(window);
                  return <Badge variant={status.variant}>{status.label}</Badge>;
                })()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(window)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Transfer Window</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus transfer window ini? Aksi ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(window.id)}>
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
