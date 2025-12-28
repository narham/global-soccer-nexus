import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Ticket, Plus, Minus, CheckCircle } from "lucide-react";

const purchaseSchema = z.object({
  buyer_name: z.string().min(2, "Nama wajib diisi"),
  buyer_email: z.string().email("Email tidak valid"),
  buyer_phone: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface TicketPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: any;
  onSuccess: () => void;
}

interface CategoryQuantity {
  categoryId: string;
  quantity: number;
  price: number;
  name: string;
}

export function TicketPurchaseDialog({ open, onOpenChange, match, onSuccess }: TicketPurchaseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<CategoryQuantity[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const { toast } = useToast();

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      buyer_name: "",
      buyer_email: "",
      buyer_phone: "",
    },
  });

  useEffect(() => {
    if (match?.id && open) {
      fetchCategories();
      setOrderSuccess(false);
      setOrderNumber("");
      setSelectedCategories([]);
    }
  }, [match?.id, open]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("match_ticket_categories")
      .select("*")
      .eq("match_id", match.id)
      .eq("status", "open")
      .order("price");
    setCategories(data || []);
  };

  const updateQuantity = (categoryId: string, delta: number, price: number, name: string) => {
    setSelectedCategories((prev) => {
      const existing = prev.find((c) => c.categoryId === categoryId);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) {
          return prev.filter((c) => c.categoryId !== categoryId);
        }
        return prev.map((c) =>
          c.categoryId === categoryId ? { ...c, quantity: newQty } : c
        );
      } else if (delta > 0) {
        return [...prev, { categoryId, quantity: 1, price, name }];
      }
      return prev;
    });
  };

  const getQuantity = (categoryId: string) => {
    return selectedCategories.find((c) => c.categoryId === categoryId)?.quantity || 0;
  };

  const totalAmount = selectedCategories.reduce(
    (sum, c) => sum + c.price * c.quantity,
    0
  );

  const totalTickets = selectedCategories.reduce(
    (sum, c) => sum + c.quantity,
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: PurchaseFormData) => {
    if (totalTickets === 0) {
      toast({ variant: "destructive", title: "Pilih tiket terlebih dahulu" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Generate order number
      const { data: orderNumberData } = await supabase.rpc("generate_order_number");
      const newOrderNumber = orderNumberData || `TKT${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("ticket_orders")
        .insert({
          order_number: newOrderNumber,
          user_id: user?.id || null,
          match_id: match.id,
          status: "pending",
          total_amount: totalAmount,
          payment_status: "pending",
          buyer_name: data.buyer_name,
          buyer_email: data.buyer_email,
          buyer_phone: data.buyer_phone || null,
          expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create individual tickets
      const ticketsToCreate: any[] = [];
      for (const category of selectedCategories) {
        for (let i = 0; i < category.quantity; i++) {
          const { data: ticketCode } = await supabase.rpc("generate_ticket_code");
          ticketsToCreate.push({
            order_id: order.id,
            category_id: category.categoryId,
            ticket_code: ticketCode || `T${Date.now()}${i}`,
            barcode_data: `${newOrderNumber}-${ticketCode}`,
            status: "active",
          });
        }
      }

      const { error: ticketsError } = await supabase
        .from("tickets")
        .insert(ticketsToCreate);

      if (ticketsError) throw ticketsError;

      setOrderNumber(newOrderNumber);
      setOrderSuccess(true);
      toast({ title: "Pesanan berhasil dibuat!" });
      onSuccess();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal membuat pesanan", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedCategories([]);
    setOrderSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            {orderSuccess ? "Pesanan Berhasil!" : "Beli Tiket"}
          </DialogTitle>
          <DialogDescription>
            {match?.home_club?.name} vs {match?.away_club?.name}
          </DialogDescription>
        </DialogHeader>

        {orderSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">Pesanan Anda Berhasil Dibuat</p>
              <p className="text-muted-foreground">Nomor Order: {orderNumber}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Silakan lakukan pembayaran dalam waktu 24 jam untuk mengkonfirmasi pesanan Anda.
            </p>
            <Button onClick={handleClose} className="w-full">
              Tutup
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Category Selection */}
              <div className="space-y-3">
                <h4 className="font-semibold">Pilih Tiket</h4>
                {categories.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Tidak ada tiket tersedia untuk pertandingan ini.
                  </p>
                ) : (
                  categories.map((category) => {
                    const available = category.total_quota - category.sold_count;
                    const qty = getQuantity(category.id);
                    return (
                      <Card key={category.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{category.category_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(category.price)}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              Tersedia: {available}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(category.id, -1, category.price, category.category_name)}
                              disabled={qty === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{qty}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(category.id, 1, category.price, category.category_name)}
                              disabled={qty >= available}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {totalTickets > 0 && (
                <>
                  <Separator />

                  {/* Buyer Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Informasi Pembeli</h4>
                    <FormField
                      control={form.control}
                      name="buyer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama pembeli" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="buyer_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="buyer_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. Telepon</FormLabel>
                          <FormControl>
                            <Input placeholder="08xxxxxxxxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Summary */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span>Total Tiket</span>
                      <span className="font-medium">{totalTickets}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Bayar</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Buat Pesanan
                  </Button>
                </>
              )}
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
