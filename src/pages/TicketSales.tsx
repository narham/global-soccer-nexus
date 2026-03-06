import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Ticket, ShoppingCart, BarChart3, Search, Eye, TrendingUp, Users, DollarSign, CalendarDays } from "lucide-react";
import { TicketOrderDetailDialog } from "@/components/tickets/TicketOrderDetailDialog";

export default function TicketSales() {
  const [matches, setMatches] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMatch, setSearchMatch] = useState("");
  const [searchOrder, setSearchOrder] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMatches(), fetchAllOrders(), fetchAllCategories()]);
    setLoading(false);
  };

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select(`
        id, match_date, status, venue,
        home_club:home_club_id(name, short_name, logo_url),
        away_club:away_club_id(name, short_name, logo_url),
        competition:competition_id(name, season)
      `)
      .order("match_date", { ascending: false });
    setMatches(data || []);
  };

  const fetchAllOrders = async () => {
    const { data } = await supabase
      .from("ticket_orders")
      .select(`
        *,
        matches:match_id(
          match_date,
          home_club:home_club_id(name, short_name),
          away_club:away_club_id(name, short_name)
        )
      `)
      .order("created_at", { ascending: false });
    setAllOrders(data || []);
  };

  const fetchAllCategories = async () => {
    const { data } = await supabase
      .from("match_ticket_categories")
      .select("*")
      .order("created_at", { ascending: false });
    setAllCategories(data || []);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  // Stats
  const totalRevenue = allOrders
    .filter(o => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalOrders = allOrders.length;
  const paidOrders = allOrders.filter(o => o.payment_status === "paid").length;
  const totalTicketsSold = allCategories.reduce((sum, c) => sum + c.sold_count, 0);
  const totalQuota = allCategories.reduce((sum, c) => sum + c.total_quota, 0);

  // Matches with ticket data
  const matchesWithTickets = matches.map(match => {
    const cats = allCategories.filter(c => c.match_id === match.id);
    const orders = allOrders.filter(o => o.match_id === match.id);
    const quota = cats.reduce((s, c) => s + c.total_quota, 0);
    const sold = cats.reduce((s, c) => s + c.sold_count, 0);
    const revenue = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + Number(o.total_amount), 0);
    return { ...match, categories: cats, orderCount: orders.length, quota, sold, revenue };
  }).filter(m => m.categories.length > 0);

  const filteredMatches = matchesWithTickets.filter(m => {
    const matchName = `${m.home_club?.name} ${m.away_club?.name}`.toLowerCase();
    return matchName.includes(searchMatch.toLowerCase());
  });

  const filteredOrders = allOrders.filter(o => {
    const matchSearch = o.order_number.toLowerCase().includes(searchOrder.toLowerCase()) ||
      o.buyer_name.toLowerCase().includes(searchOrder.toLowerCase()) ||
      o.buyer_email.toLowerCase().includes(searchOrder.toLowerCase());
    const statusMatch = statusFilter === "all" || o.payment_status === statusFilter;
    return matchSearch && statusMatch;
  });

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500/10 text-green-600 border-green-200">Lunas</Badge>;
      case "pending": return <Badge variant="outline">Belum Bayar</Badge>;
      case "failed": return <Badge variant="destructive">Gagal</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-green-500/10 text-green-600 border-green-200">Dikonfirmasi</Badge>;
      case "pending": return <Badge variant="outline">Pending</Badge>;
      case "cancelled": return <Badge variant="destructive">Dibatalkan</Badge>;
      case "expired": return <Badge variant="secondary">Kadaluarsa</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Penjualan Tiket</h1>
        <p className="text-muted-foreground">Kelola penjualan tiket pertandingan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Pendapatan</CardDescription>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{paidOrders} pesanan lunas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Pesanan</CardDescription>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">{paidOrders} lunas, {totalOrders - paidOrders} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Tiket Terjual</CardDescription>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTicketsSold}</div>
            <p className="text-xs text-muted-foreground">dari {totalQuota} kuota</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Occupancy Rate</CardDescription>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalQuota > 0 ? ((totalTicketsSold / totalQuota) * 100).toFixed(1) : 0}%
            </div>
            <Progress value={totalQuota > 0 ? (totalTicketsSold / totalQuota) * 100 : 0} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matches">
        <TabsList>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Per Pertandingan
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Semua Pesanan ({totalOrders})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pertandingan..."
              value={searchMatch}
              onChange={(e) => setSearchMatch(e.target.value)}
              className="pl-8"
            />
          </div>

          {filteredMatches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Belum ada pertandingan dengan tiket.</p>
                <p className="text-sm mt-1">Buat kategori tiket dari halaman detail pertandingan.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredMatches.map(match => {
                const occupancy = match.quota > 0 ? (match.sold / match.quota) * 100 : 0;
                return (
                  <Card key={match.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/matches/${match.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {match.home_club?.short_name || match.home_club?.name} vs {match.away_club?.short_name || match.away_club?.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {match.competition?.name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(match.match_date), "dd MMM yyyy HH:mm", { locale: idLocale })}
                            </span>
                            {match.venue && <span>📍 {match.venue}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Terjual</p>
                            <p className="font-bold">{match.sold}/{match.quota}</p>
                          </div>
                          <div className="text-center min-w-[80px]">
                            <p className="text-xs text-muted-foreground">Occupancy</p>
                            <div className="flex items-center gap-2">
                              <Progress value={occupancy} className="h-2 w-16" />
                              <span className="text-sm font-medium">{occupancy.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Pendapatan</p>
                            <p className="font-bold text-green-600">{formatCurrency(match.revenue)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Pesanan</p>
                            <p className="font-bold">{match.orderCount}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor order, nama, email..."
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="pending">Belum Bayar</SelectItem>
                <SelectItem value="failed">Gagal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Belum ada pesanan tiket.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
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
                      <TableHead className="w-[60px]">Aksi</TableHead>
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
                        <TableCell className="text-sm">
                          {order.matches?.home_club?.short_name || order.matches?.home_club?.name} vs{" "}
                          {order.matches?.away_club?.short_name || order.matches?.away_club?.name}
                        </TableCell>
                        <TableCell>{formatCurrency(Number(order.total_amount))}</TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(order.created_at), "dd MMM yyyy", { locale: idLocale })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <TicketOrderDetailDialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
        order={selectedOrder}
        onRefresh={fetchData}
      />
    </div>
  );
}
