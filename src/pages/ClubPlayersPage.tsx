import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClubPlayersTab } from "@/components/clubs/ClubPlayersTab";
import { toast } from "sonner";

const ClubPlayersPage = () => {
  const { id } = useParams();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .eq("current_club_id", id)
          .order("shirt_number", { ascending: true });

        if (error) throw error;
        setPlayers(data || []);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlayers();
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <ClubPlayersTab players={players} />;
};

export default ClubPlayersPage;
