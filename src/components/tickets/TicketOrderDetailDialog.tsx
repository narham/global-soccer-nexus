import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, QrCode, Download, CheckCircle } from "lucide-react";

interface TicketOrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onRefresh: () => void;
}

export function TicketOrderDetailDialog({ open, onOpenChange, order, onRefresh }: TicketOrderDetailDialogProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order?.id) {
      fetchTickets();
    }
  }, [order?.id]);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tickets")
      .select(`
        *,
        category:category_id(category_name, price)
      `)
      .eq("order_id", order.id)
      .order("created_at");
    setTickets(data || []);
    setLoading(false);
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
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500">Dikonfirmasi</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Detail Pesanan {order.order_number}
          </DialogTitle>
          <DialogDescription>Informasi lengkap pesanan tiket</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Pembeli</h4>
              <p className="font-medium">{order.buyer_name}</p>
              <p className="text-sm text-muted-foreground">{order.buyer_email}</p>
              {order.buyer_phone && <p className="text-sm text-muted-foreground">{order.buyer_phone}</p>}
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
              <div className="flex gap-2 mt-1">
                {getStatusBadge(order.status)}
                <Badge variant={order.payment_status === "paid" ? "default" : "outline"}>
                  {order.payment_status === "paid" ? "Lunas" : "Belum Bayar"}
                </Badge>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Tanggal Order</h4>
              <p>{format(new Date(order.created_at), "dd MMMM yyyy HH:mm", { locale: id })}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Total</h4>
              <p className="text-lg font-bold">{formatCurrency(order.total_amount)}</p>
            </div>
          </div>

          <Separator />

          {/* Tickets */}
          <div>
            <h4 className="font-semibold mb-3">Tiket ({tickets.length})</h4>
            {loading ? (
              <p className="text-muted-foreground">Memuat tiket...</p>
            ) : tickets.length === 0 ? (
              <p className="text-muted-foreground">Tidak ada tiket</p>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded">
                        <QrCode className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium">{ticket.ticket_code}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticket.category?.category_name} - {formatCurrency(ticket.category?.price || 0)}
                        </p>
                        {ticket.seat_number && (
                          <p className="text-xs text-muted-foreground">
                            Kursi: {ticket.seat_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ticket.is_checked_in ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Check-in
                        </Badge>
                      ) : (
                        <Badge variant="outline">{ticket.status}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {order.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Catatan</h4>
                <p className="text-sm">{order.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
