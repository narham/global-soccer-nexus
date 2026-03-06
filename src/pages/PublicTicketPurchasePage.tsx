import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Ticket, CalendarDays, MapPin, Search, ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TicketPurchaseDialog } from "@/components/tickets/TicketPurchaseDialog";
import { PublicNav } from "@/components/public/PublicNav";

export default function PublicTicketPurchasePage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableMatches();
  }, []);

  const fetchAvailableMatches = async () => {
    setLoading(true);
    // Get matches that have open ticket categories
    const { data: categories } = await supabase
      .from("match_ticket_categories")
      .select("match_id")
      .eq("status", "open");

    if (!categories || categories.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const matchIds = [...new Set(categories.map(c => c.match_id))];

    const { data } = await supabase
      .from("matches")
      .select(`
        id, match_date, status, venue,
        home_club:home_club_id(name, short_name, logo_url),
        away_club:away_club_id(name, short_name, logo_url),
        competition:competition_id(name, season)
      `)
      .in("id", matchIds)
      .in("status", ["scheduled", "live"])
      .gte("match_date", new Date().toISOString())
      .order("match_date");

    // Fetch categories for each match
    const matchesWithCats = await Promise.all(
      (data || []).map(async (match) => {
        const { data: cats } = await supabase
          .from("match_ticket_categories")
          .select("*")
          .eq("match_id", match.id)
          .eq("status", "open")
          .order("price");
        const totalQuota = (cats || []).reduce((s, c) => s + c.total_quota, 0);
        const totalSold = (cats || []).reduce((s, c) => s + c.sold_count, 0);
        const minPrice = cats && cats.length > 0 ? Math.min(...cats.map(c => c.price)) : 0;
        return { ...match, categories: cats || [], totalQuota, totalSold, available: totalQuota - totalSold, minPrice };
      })
    );

    setMatches(matchesWithCats.filter(m => m.available > 0));
    setLoading(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const filteredMatches = matches.filter(m => {
    const text = `${m.home_club?.name} ${m.away_club?.name} ${m.competition?.name} ${m.venue || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/public")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Ticket className="h-8 w-8 text-primary" />
              Beli Tiket Pertandingan
            </h1>
            <p className="text-muted-foreground">Pilih pertandingan dan beli tiket secara online</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari pertandingan, tim, kompetisi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-semibold mb-2">Tidak Ada Tiket Tersedia</h3>
              <p className="text-muted-foreground">Saat ini belum ada pertandingan dengan tiket yang tersedia.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMatches.map(match => (
              <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-all group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Match Info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {match.competition?.name} • {match.competition?.season}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-center gap-6 mb-4">
                        <div className="text-center flex-1">
                          {match.home_club?.logo_url && (
                            <img src={match.home_club.logo_url} alt="" className="w-12 h-12 mx-auto mb-2 object-contain" />
                          )}
                          <p className="font-bold text-lg">{match.home_club?.short_name || match.home_club?.name}</p>
                        </div>
                        <div className="text-center px-4">
                          <span className="text-2xl font-bold text-muted-foreground">VS</span>
                        </div>
                        <div className="text-center flex-1">
                          {match.away_club?.logo_url && (
                            <img src={match.away_club.logo_url} alt="" className="w-12 h-12 mx-auto mb-2 object-contain" />
                          )}
                          <p className="font-bold text-lg">{match.away_club?.short_name || match.away_club?.name}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {format(new Date(match.match_date), "EEEE, dd MMMM yyyy • HH:mm", { locale: idLocale })}
                        </span>
                        {match.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {match.venue}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ticket Info & CTA */}
                    <div className="bg-muted/50 p-6 flex flex-col items-center justify-center gap-3 md:min-w-[220px] border-t md:border-t-0 md:border-l">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Mulai dari</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(match.minPrice)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{match.available} tiket tersedia</span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => { setSelectedMatch(match); setShowPurchase(true); }}
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        Beli Tiket
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedMatch && (
        <TicketPurchaseDialog
          open={showPurchase}
          onOpenChange={setShowPurchase}
          match={selectedMatch}
          onSuccess={fetchAvailableMatches}
        />
      )}
    </div>
  );
}
