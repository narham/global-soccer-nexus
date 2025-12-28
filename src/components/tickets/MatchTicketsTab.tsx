import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TicketCategoriesTable } from "./TicketCategoriesTable";
import { TicketOrdersTable } from "./TicketOrdersTable";
import { Ticket, ShoppingCart, BarChart3 } from "lucide-react";

interface MatchTicketsTabProps {
  matchId: string;
}

export function MatchTicketsTab({ matchId }: MatchTicketsTabProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchOrders()]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("match_ticket_categories")
      .select("*")
      .eq("match_id", matchId)
      .order("price");
    setCategories(data || []);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("ticket_orders")
      .select(`
        *,
        matches:match_id(
          home_club:home_club_id(name, short_name),
          away_club:away_club_id(name, short_name)
        )
      `)
      .eq("match_id", matchId)
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate stats
  const totalQuota = categories.reduce((sum, c) => sum + c.total_quota, 0);
  const totalSold = categories.reduce((sum, c) => sum + c.sold_count, 0);
  const totalRevenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const occupancyRate = totalQuota > 0 ? ((totalSold / totalQuota) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Kuota</CardDescription>
            <CardTitle className="text-2xl">{totalQuota}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tiket Terjual</CardDescription>
            <CardTitle className="text-2xl">{totalSold}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Occupancy Rate</CardDescription>
            <CardTitle className="text-2xl">{occupancyRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pendapatan</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Kategori Tiket
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pesanan ({orders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <TicketCategoriesTable
                categories={categories}
                matchId={matchId}
                onRefresh={fetchCategories}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <TicketOrdersTable orders={orders} onRefresh={fetchOrders} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
