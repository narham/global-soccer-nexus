import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

interface Club {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  founded_year: number | null;
  license_status: string | null;
  stadium_name: string | null;
}

interface ClubsTableProps {
  clubs: Club[];
  onRefresh: () => void;
}

export const ClubsTable = ({ clubs, onRefresh }: ClubsTableProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();

  const getLicenseColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getLicenseLabel = (status: string | null) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "pending":
        return "Pending";
      default:
        return "Tidak Aktif";
    }
  };

  const totalPages = Math.ceil(clubs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClubs = clubs.slice(startIndex, endIndex);

  const handleView = (club: Club) => {
    navigate(`/clubs/${club.id}`);
  };

  const handleDelete = async (club: Club) => {
    try {
      const { error } = await supabase
        .from("clubs")
        .delete()
        .eq("id", club.id);

      if (error) throw error;
      toast({
        title: "Berhasil",
        description: `${club.name} berhasil dihapus`,
      });
      onRefresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus klub",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead className="w-12">Logo</TableHead>
              <TableHead>Nama Klub</TableHead>
              <TableHead className="hidden md:table-cell">Nama Pendek</TableHead>
              <TableHead className="hidden lg:table-cell">Kota</TableHead>
              <TableHead className="hidden lg:table-cell">Stadion</TableHead>
              <TableHead className="hidden xl:table-cell">Tahun Berdiri</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentClubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Tidak ada data klub
                </TableCell>
              </TableRow>
            ) : (
              currentClubs.map((club, index) => (
                <TableRow key={club.id}>
                  <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                  <TableCell>
                    <Shield className="h-6 w-6 text-primary" />
                  </TableCell>
                  <TableCell className="font-medium">{club.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{club.short_name || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{club.city || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{club.stadium_name || "—"}</TableCell>
                  <TableCell className="hidden xl:table-cell">{club.founded_year || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={getLicenseColor(club.license_status)}>
                      {getLicenseLabel(club.license_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(club)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat
                      </Button>
                      <TableActions
                        onDelete={() => handleDelete(club)}
                        itemName={club.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {startIndex + 1}-{Math.min(endIndex, clubs.length)} dari {clubs.length} klub
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
