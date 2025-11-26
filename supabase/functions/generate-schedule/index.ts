import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { competitionId } = await req.json();
    console.log(`Generating schedule for competition: ${competitionId}`);

    // Get competition details
    const { data: competition, error: compError } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", competitionId)
      .single();

    if (compError) throw compError;

    const { format, start_date } = competition;
    console.log(`Competition format: ${format}, Start date: ${start_date}`);

    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from("competition_teams")
      .select("*")
      .eq("competition_id", competitionId)
      .order("group_name", { ascending: true })
      .order("seed", { ascending: true });

    if (teamsError) throw teamsError;

    if (!teams || teams.length === 0) {
      throw new Error("Tidak ada tim peserta. Tambahkan tim terlebih dahulu.");
    }

    console.log(`Total teams: ${teams.length}`);

    const matches: any[] = [];
    const startDate = new Date(start_date);

    if (format === "round_robin") {
      // Round Robin: every team plays every other team twice (home & away)
      console.log("Generating Round Robin schedule");
      let matchday = 1;
      let currentDate = new Date(startDate);

      // Generate home matches
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matches.push({
            competition_id: competitionId,
            home_club_id: teams[i].club_id,
            away_club_id: teams[j].club_id,
            match_date: new Date(currentDate).toISOString(),
            matchday: matchday,
            status: "scheduled",
          });

          // AFC regulation: minimum 3 days between matches
          currentDate.setDate(currentDate.getDate() + 3);
          if (matches.length % 5 === 0) matchday++;
        }
      }

      // Generate away matches (reverse fixtures)
      const firstHalfMatches = matches.length;
      currentDate.setDate(currentDate.getDate() + 14); // 2-week break between rounds

      for (let i = 0; i < firstHalfMatches; i++) {
        const originalMatch = matches[i];
        matches.push({
          competition_id: competitionId,
          home_club_id: originalMatch.away_club_id,
          away_club_id: originalMatch.home_club_id,
          match_date: new Date(currentDate).toISOString(),
          matchday: matchday,
          status: "scheduled",
        });

        currentDate.setDate(currentDate.getDate() + 3);
        if ((i + 1) % 5 === 0) matchday++;
      }

      console.log(`Generated ${matches.length} round-robin matches`);
    } else if (format === "group_knockout") {
      // Group stage: round robin within each group
      console.log("Generating Group + Knockout schedule");

      const groups: { [key: string]: any[] } = {};
      teams.forEach((team) => {
        const groupName = team.group_name || "A";
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(team);
      });

      console.log(`Found ${Object.keys(groups).length} groups`);

      let matchday = 1;
      let currentDate = new Date(startDate);

      // Generate group stage matches
      Object.entries(groups).forEach(([groupName, groupTeams]) => {
        console.log(`Generating matches for Group ${groupName} (${groupTeams.length} teams)`);

        // Round robin within group
        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            matches.push({
              competition_id: competitionId,
              home_club_id: groupTeams[i].club_id,
              away_club_id: groupTeams[j].club_id,
              match_date: new Date(currentDate).toISOString(),
              matchday: matchday,
              group_name: groupName,
              round: "Group Stage",
              status: "scheduled",
            });

            currentDate.setDate(currentDate.getDate() + 3);
          }
        }

        matchday++;
        currentDate.setDate(currentDate.getDate() + 7); // 1 week between groups
      });

      console.log(`Generated ${matches.length} group stage matches`);
    } else if (format === "knockout") {
      // Simple knockout bracket
      console.log("Generating Knockout schedule");

      const rounds = Math.ceil(Math.log2(teams.length));
      let currentDate = new Date(startDate);
      let currentRound = 1;

      const getRoundName = (round: number, totalRounds: number) => {
        const remaining = totalRounds - round + 1;
        if (remaining === 1) return "Final";
        if (remaining === 2) return "Semi-Final";
        if (remaining === 3) return "Quarter-Final";
        return `Round of ${Math.pow(2, remaining)}`;
      };

      // Generate first round only (subsequent rounds depend on results)
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          matches.push({
            competition_id: competitionId,
            home_club_id: teams[i].club_id,
            away_club_id: teams[i + 1].club_id,
            match_date: new Date(currentDate).toISOString(),
            round: getRoundName(currentRound, rounds),
            status: "scheduled",
          });

          currentDate.setDate(currentDate.getDate() + 7);
        }
      }

      console.log(`Generated ${matches.length} first-round knockout matches`);
    }

    // Insert all matches
    const { error: insertError } = await supabase.from("matches").insert(matches);

    if (insertError) throw insertError;

    console.log(`Successfully created ${matches.length} matches`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${matches.length} pertandingan berhasil dijadwalkan`,
        matchesCreated: matches.length,
        format: format,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating schedule:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
