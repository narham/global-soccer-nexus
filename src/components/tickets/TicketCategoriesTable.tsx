import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TicketCategoryFormDialog } from "./TicketCategoryFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TicketCategoriesTableProps {
  categories: any[];
  matchId: string;
  onRefresh: () => void;
}

export function TicketCategoriesTable({ categories, matchId, onRefresh }: TicketCategoriesTableProps) {
  const [editCategory, setEditCategory] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("match_ticket_categories")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      toast({ title: "Kategori tiket berhasil dihapus" });
      onRefresh();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: error.message });
    } finally {
      setDeleteId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500">Buka</Badge>;
      case "closed":
        return <Badge variant="secondary">Tutup</Badge>;
      case "sold_out":
        return <Badge variant="destructive">Habis</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Kategori Tiket</h3>
        <Button size="sm" onClick={() => { setEditCategory(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Kategori
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Belum ada kategori tiket. Tambahkan kategori untuk mulai menjual tiket.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Penjualan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => {
              const soldPercentage = category.total_quota > 0 
                ? (category.sold_count / category.total_quota) * 100 
                : 0;
              return (
                <TableRow key={category.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{category.category_name}</div>
                      {category.description && (
                        <div className="text-xs text-muted-foreground">{category.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(category.price)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {category.sold_count} / {category.total_quota}
                      </div>
                      <Progress value={soldPercentage} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(category.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditCategory(category); setShowForm(true); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(category.id)}
                        disabled={category.sold_count > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <TicketCategoryFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        matchId={matchId}
        category={editCategory}
        onSuccess={onRefresh}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori Tiket?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori tiket ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
