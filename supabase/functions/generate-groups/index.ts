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
    console.log(`Generating groups for competition: ${competitionId}`);

    // Get competition details
    const { data: competition, error: compError } = await supabase
      .from("competitions")
      .select("num_groups, num_teams")
      .eq("id", competitionId)
      .single();

    if (compError) throw compError;

    const numGroups = competition.num_groups || 4;
    console.log(`Number of groups: ${numGroups}`);

    // Get all teams ordered by seed (AFC seeding system)
    const { data: teams, error: teamsError } = await supabase
      .from("competition_teams")
      .select("*")
      .eq("competition_id", competitionId)
      .order("seed", { ascending: true });

    if (teamsError) throw teamsError;

    if (!teams || teams.length === 0) {
      throw new Error("Tidak ada tim peserta. Tambahkan tim terlebih dahulu.");
    }

    console.log(`Total teams: ${teams.length}`);

    // AFC-style group allocation (pot system)
    const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const teamsPerGroup = Math.ceil(teams.length / numGroups);

    console.log(`Teams per group: ${teamsPerGroup}`);

    // Distribute teams into pots based on seeding
    const pots: any[][] = [];
    for (let i = 0; i < teamsPerGroup; i++) {
      pots[i] = [];
    }

    teams.forEach((team, index) => {
      const potIndex = Math.floor(index / numGroups);
      if (potIndex < teamsPerGroup) {
        pots[potIndex].push(team);
      }
    });

    console.log(`Created ${pots.length} pots`);

    // Allocate teams to groups (snake draft from each pot)
    const updates: any[] = [];
    pots.forEach((pot, potIndex) => {
      pot.forEach((team, teamIndex) => {
        const groupIndex = potIndex % 2 === 0 ? teamIndex : numGroups - 1 - teamIndex;
        const groupName = groupNames[groupIndex % numGroups];

        updates.push({
          id: team.id,
          group_name: groupName,
        });

        console.log(`Team ${team.id} -> Pot ${potIndex + 1} -> Group ${groupName}`);
      });
    });

    // Update all teams with their group assignments
    const { error: updateError } = await supabase
      .from("competition_teams")
      .upsert(updates, { onConflict: "id" });

    if (updateError) throw updateError;

    console.log(`Successfully allocated ${updates.length} teams to ${numGroups} groups`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${updates.length} tim berhasil dibagi ke ${numGroups} grup menggunakan sistem AFC seeding`,
        groupsCreated: numGroups,
        teamsAllocated: updates.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating groups:", error);
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
