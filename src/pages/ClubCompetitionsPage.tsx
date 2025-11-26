import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function ClubCompetitionsPage() {
  const { id: clubId } = useParams();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions();
  }, [clubId]);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from("competition_teams")
        .select(`
          *,
          competition:competitions(*)
        `)
        .eq("club_id", clubId);

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error: any) {
      console.error("Error fetching competitions:", error);
      toast.error("Gagal memuat kompetisi");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      upcoming: "secondary",
      ongoing: "default",
      finished: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kompetisi yang Diikuti</h1>
        <p className="text-muted-foreground">
          Kelola pendaftaran pemain untuk setiap kompetisi
        </p>
      </div>

      {competitions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Klub belum terdaftar di kompetisi manapun
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {competitions.map((ct) => (
            <Card key={ct.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {ct.competition.logo_url && (
                      <img
                        src={ct.competition.logo_url}
                        alt={ct.competition.name}
                        className="h-12 w-12 object-contain"
                      />
                    )}
                    <div>
                      <CardTitle>{ct.competition.name}</CardTitle>
                      <CardDescription>{ct.competition.season}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(ct.competition.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(ct.competition.start_date).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  {ct.group_name && (
                    <Badge variant="outline">Grup {ct.group_name}</Badge>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() =>
                    navigate(`/clubs/${clubId}/competitions/${ct.competition_id}/players`)
                  }
                >
                  <Users className="h-4 w-4 mr-2" />
                  Kelola Pemain Terdaftar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
