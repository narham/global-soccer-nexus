import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy } from "lucide-react";

export const PublicStandingsTab = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);

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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Klasemen Kompetisi
              </CardTitle>
              <CardDescription>Lihat klasemen dan statistik tim</CardDescription>
            </div>
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
            <div className="rounded-md border">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
