import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, Check, X, Search } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TicketOrderDetailDialog } from "./TicketOrderDetailDialog";

interface TicketOrdersTableProps {
  orders: any[];
  onRefresh: () => void;
}

export function TicketOrdersTable({ orders, onRefresh }: TicketOrdersTableProps) {
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500">Dikonfirmasi</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      case "expired":
        return <Badge variant="secondary">Kadaluarsa</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Belum Bayar</Badge>;
      case "paid":
        return <Badge className="bg-green-500">Lunas</Badge>;
      case "failed":
        return <Badge variant="destructive">Gagal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("ticket_orders")
        .update({
          status: "confirmed",
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", orderId);
      
      if (error) throw error;
      toast({ title: "Pembayaran dikonfirmasi" });
      onRefresh();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal", description: error.message });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("ticket_orders")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", orderId);
      
      if (error) throw error;
      toast({ title: "Pesanan dibatalkan" });
      onRefresh();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal", description: error.message });
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(search.toLowerCase()) ||
    order.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
    order.buyer_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Belum ada pesanan tiket.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Order</TableHead>
              <TableHead>Pembeli</TableHead>
              <TableHead>Pertandingan</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pembayaran</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="w-[120px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.buyer_name}</div>
                    <div className="text-xs text-muted-foreground">{order.buyer_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.matches?.home_club?.short_name || order.matches?.home_club?.name} vs{" "}
                    {order.matches?.away_club?.short_name || order.matches?.away_club?.name}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                <TableCell className="text-sm">
                  {format(new Date(order.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {order.status === "pending" && order.payment_status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleConfirmPayment(order.id)}
                          title="Konfirmasi Pembayaran"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelOrder(order.id)}
                          title="Batalkan"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TicketOrderDetailDialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
        order={selectedOrder}
        onRefresh={onRefresh}
      />
    </div>
  );
}
