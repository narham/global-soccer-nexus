import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowRight } from "lucide-react";
import { TableActions } from "./TableActions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transfer {
  id: string;
  player: any;
  from_club: any;
  to_club: any;
  transfer_type: string;
  transfer_fee: number;
  status: string;
  requires_itc: boolean;
  itc_status: string;
  created_at: string;
}

interface TransfersTableProps {
  transfers: Transfer[];
  onRefresh: () => void;
}

export const TransfersTable = ({ transfers, onRefresh }: TransfersTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "club_approved": return "outline";
      case "awaiting_itc": return "outline";
      case "rejected": return "destructive";
      case "cancelled": return "outline";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Disetujui";
      case "pending": return "Pending";
      case "club_approved": return "Disetujui Klub";
      case "awaiting_itc": return "Menunggu ITC";
      case "rejected": return "Ditolak";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "permanent": return "Permanen";
      case "loan": return "Pinjaman";
      case "free": return "Bebas Transfer";
      case "end_of_contract": return "Habis Kontrak";
      default: return type;
    }
  };

  const getITCBadge = (transfer: Transfer) => {
    if (!transfer.requires_itc) {
      return <Badge variant="outline" className="text-xs">Lokal</Badge>;
    }
    
    switch (transfer.itc_status) {
      case "approved":
        return <Badge variant="default" className="text-xs">ITC ✓</Badge>;
      case "pending":
        return <Badge variant="secondary" className="text-xs">ITC Pending</Badge>;
      case "requested":
        return <Badge variant="outline" className="text-xs">ITC Diminta</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Perlu ITC</Badge>;
    }
  };

  const handleView = (transfer: Transfer) => {
    navigate(`/transfers/${transfer.id}`);
  };

  const handleDelete = async (transfer: Transfer) => {
    try {
      const { error } = await supabase
        .from("player_transfers")
        .delete()
        .eq("id", transfer.id);

      if (error) throw error;
      toast({ title: "Transfer berhasil dihapus" });
      onRefresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus transfer",
        description: error.message,
      });
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Bebas Transfer";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Pagination
  const totalPages = Math.ceil(transfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransfers = transfers.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pemain</TableHead>
              <TableHead>Transfer</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="hidden lg:table-cell">Biaya</TableHead>
              <TableHead className="hidden md:table-cell">ITC</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTransfers.map((transfer) => (
              <TableRow key={transfer.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={transfer.player?.photo_url} />
                      <AvatarFallback>
                        {transfer.player?.full_name?.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{transfer.player?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{transfer.player?.position}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="text-sm">
                      <p className="font-medium">{transfer.from_club?.name || "Free Agent"}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium">{transfer.to_club?.name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getTypeLabel(transfer.transfer_type)}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm font-medium">
                    {formatCurrency(transfer.transfer_fee)}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {getITCBadge(transfer)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(transfer.status)}>
                    {getStatusLabel(transfer.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TableActions
                    onView={() => handleView(transfer)}
                    onDelete={() => handleDelete(transfer)}
                    itemName={transfer.player?.full_name}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tampilkan</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">dari {transfers.length} data</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
