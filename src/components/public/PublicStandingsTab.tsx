import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trophy, ExternalLink, RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { MobileTableCard, MobileTableRow } from "@/components/ui/mobile-table-card";

export const PublicStandingsTab = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);

  const refreshData = async () => {
    await fetchCompetitions();
    if (selectedCompetition) {
      await fetchStandings();
    }
  };

  const { pullDistance, isRefreshing, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh({
    onRefresh: refreshData,
    threshold: 80,
  });

  useEffect(() => {
    const element = document.getElementById("standings-container");
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart as any);
    element.addEventListener("touchmove", handleTouchMove as any);
    element.addEventListener("touchend", handleTouchEnd as any);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart as any);
      element.removeEventListener("touchmove", handleTouchMove as any);
      element.removeEventListener("touchend", handleTouchEnd as any);
    };
  }, [selectedCompetition]);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (selectedCompetition) {
      fetchStandings();
    }
  }, [selectedCompetition]);

  const fetchCompetitions = async () => {
    try {
      const { data } = await supabase
        .from("competitions")
        .select("*")
        .eq("approval_status", "approved")
        .order("start_date", { ascending: false });

      if (data && data.length > 0) {
        setCompetitions(data);
        setSelectedCompetition(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching competitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async () => {
    setLoadingStandings(true);
    try {
      const { data } = await supabase
        .from("standings")
        .select(`
          *,
          club:clubs(id, name, logo_url, short_name)
        `)
        .eq("competition_id", selectedCompetition)
        .order("position", { ascending: true });

      setStandings(data || []);
    } catch (error) {
      console.error("Error fetching standings:", error);
    } finally {
      setLoadingStandings(false);
    }
  };

  const selectedComp = competitions.find(c => c.id === selectedCompetition);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Belum ada kompetisi yang tersedia
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="standings-container" className="space-y-4 relative">
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 z-50 transition-all"
          style={{ transform: `translate(-50%, ${pullDistance}px)` }}
        >
          <div className="bg-primary text-primary-foreground rounded-full p-2">
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Klasemen Kompetisi
              </CardTitle>
              <CardDescription>Lihat klasemen dan statistik tim</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Pilih kompetisi" />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name} ({comp.season})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCompetition && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link to={`/public/competitions/${selectedCompetition}`}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Detail
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedComp && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Format</p>
                  <p className="font-medium capitalize">{selectedComp.format.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipe</p>
                  <p className="font-medium capitalize">{selectedComp.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Season</p>
                  <p className="font-medium">{selectedComp.season}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className="capitalize">{selectedComp.status}</Badge>
                </div>
              </div>
            </div>
          )}

          {loadingStandings ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : standings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Klasemen belum tersedia untuk kompetisi ini
            </p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Tim</TableHead>
                      <TableHead className="text-center">Main</TableHead>
                      <TableHead className="text-center">M</TableHead>
                      <TableHead className="text-center">S</TableHead>
                      <TableHead className="text-center">K</TableHead>
                      <TableHead className="text-center">GM</TableHead>
                      <TableHead className="text-center">GK</TableHead>
                      <TableHead className="text-center">SG</TableHead>
                      <TableHead className="text-center font-bold">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((standing) => (
                      <TableRow key={standing.id}>
                        <TableCell className="font-medium">
                          <Badge variant={standing.position <= 3 ? "default" : "outline"}>
                            {standing.position || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link to={`/public/clubs/${standing.club.id}`} className="flex items-center gap-2 hover:opacity-80">
                            {standing.club.logo_url && (
                              <img 
                                src={standing.club.logo_url} 
                                alt={standing.club.name}
                                className="h-6 w-6 object-contain"
                              />
                            )}
                            <span className="font-medium">{standing.club.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">{standing.played}</TableCell>
                        <TableCell className="text-center">{standing.won}</TableCell>
                        <TableCell className="text-center">{standing.drawn}</TableCell>
                        <TableCell className="text-center">{standing.lost}</TableCell>
                        <TableCell className="text-center">{standing.goals_for}</TableCell>
                        <TableCell className="text-center">{standing.goals_against}</TableCell>
                        <TableCell className="text-center">{standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}</TableCell>
                        <TableCell className="text-center font-bold">{standing.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {standings.map((standing, index) => (
                  <MobileTableCard 
                    key={standing.id}
                    onClick={() => window.location.href = `/public/clubs/${standing.club.id}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Badge 
                        variant={standing.position <= 3 ? "default" : "outline"}
                        className="text-xl px-3 py-1"
                      >
                        {standing.position}
                      </Badge>
                      {standing.club.logo_url && (
                        <img 
                          src={standing.club.logo_url} 
                          alt={standing.club.name}
                          className="h-10 w-10 object-contain"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{standing.club.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {standing.played} pertandingan
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{standing.points}</div>
                        <div className="text-xs text-muted-foreground">poin</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm border-t pt-2">
                      <div>
                        <div className="text-muted-foreground text-xs">M-S-K</div>
                        <div className="font-medium">{standing.won}-{standing.drawn}-{standing.lost}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Gol</div>
                        <div className="font-medium">{standing.goals_for}:{standing.goals_against}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Selisih</div>
                        <div className="font-medium">{standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}</div>
                      </div>
                    </div>
                  </MobileTableCard>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
