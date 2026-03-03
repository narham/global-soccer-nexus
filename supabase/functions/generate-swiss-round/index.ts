import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyAuth(req: Request, supabaseAdmin: any) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new Error("Invalid or expired token");
  return user;
}

async function checkUserRole(supabaseAdmin: any, userId: string, allowedRoles: string[]) {
  const { data: userRoles, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error("Failed to verify user role");
  const roles = userRoles?.map((r: any) => r.role) || [];
  if (!roles.some((r: string) => allowedRoles.includes(r))) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}`);
  }
  return roles;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const user = await verifyAuth(req, supabaseAdmin);
    await checkUserRole(supabaseAdmin, user.id, ["admin_federasi", "panitia"]);

    const { competitionId } = await req.json();
    console.log(`Generating next Swiss round for competition: ${competitionId}`);

    // Get competition
    const { data: competition, error: compError } = await supabaseAdmin
      .from("competitions").select("*").eq("id", competitionId).single();
    if (compError) throw compError;
    if (competition.format !== "swiss_system") throw new Error("Competition is not Swiss System format");

    // Get all teams
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from("competition_teams").select("*").eq("competition_id", competitionId);
    if (teamsError) throw teamsError;
    if (!teams || teams.length < 2) throw new Error("Tidak cukup tim untuk generate ronde");

    // Get existing matches
    const { data: existingMatches, error: matchError } = await supabaseAdmin
      .from("matches").select("*").eq("competition_id", competitionId)
      .order("matchday", { ascending: true });
    if (matchError) throw matchError;

    // Determine current round number
    const maxRound = existingMatches?.reduce((max: number, m: any) => Math.max(max, m.matchday || 0), 0) || 0;
    const nextRound = maxRound + 1;
    const maxRounds = Math.ceil(Math.log2(teams.length));

    if (nextRound > maxRounds) {
      throw new Error(`Semua ${maxRounds} ronde sudah selesai. Swiss System telah lengkap.`);
    }

    // Check all matches in current round are finished
    const currentRoundMatches = existingMatches?.filter((m: any) => m.matchday === maxRound) || [];
    const unfinished = currentRoundMatches.filter((m: any) => m.status !== "finished");
    if (unfinished.length > 0 && maxRound > 0) {
      throw new Error(`Masih ada ${unfinished.length} pertandingan di Ronde ${maxRound} yang belum selesai.`);
    }

    // Build played pairs set
    const playedPairs = new Set<string>();
    existingMatches?.forEach((m: any) => {
      const pair = [m.home_club_id, m.away_club_id].sort().join("-");
      playedPairs.add(pair);
    });

    // Get standings for pairing
    const { data: standings, error: standError } = await supabaseAdmin
      .from("standings").select("*").eq("competition_id", competitionId)
      .order("points", { ascending: false })
      .order("goal_difference", { ascending: false })
      .order("goals_for", { ascending: false });
    
    // Build team points map
    const teamPoints: { [clubId: string]: number } = {};
    teams.forEach((t: any) => { teamPoints[t.club_id] = 0; });
    standings?.forEach((s: any) => { teamPoints[s.club_id] = s.points || 0; });

    // Sort teams by points (descending)
    const sortedClubIds = Object.entries(teamPoints)
      .sort((a, b) => b[1] - a[1])
      .map(([clubId]) => clubId);

    // Swiss pairing: match teams with same/similar points, avoiding rematches
    const paired = new Set<string>();
    const newMatches: any[] = [];
    const startDate = new Date(competition.start_date);
    // Offset by existing match days
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + (nextRound - 1) * 7);

    for (let i = 0; i < sortedClubIds.length; i++) {
      const teamA = sortedClubIds[i];
      if (paired.has(teamA)) continue;

      for (let j = i + 1; j < sortedClubIds.length; j++) {
        const teamB = sortedClubIds[j];
        if (paired.has(teamB)) continue;

        const pairKey = [teamA, teamB].sort().join("-");
        if (playedPairs.has(pairKey)) continue;

        // Valid pair found
        paired.add(teamA);
        paired.add(teamB);

        // Alternate home/away based on round
        const isEvenRound = nextRound % 2 === 0;
        newMatches.push({
          competition_id: competitionId,
          home_club_id: isEvenRound ? teamB : teamA,
          away_club_id: isEvenRound ? teamA : teamB,
          match_date: new Date(currentDate).toISOString(),
          round: `Ronde ${nextRound}`,
          matchday: nextRound,
          status: "scheduled",
        });
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      }
    }

    if (newMatches.length === 0) {
      throw new Error("Tidak bisa membuat pairing baru. Semua kemungkinan pasangan sudah bertemu.");
    }

    // Insert matches
    const { error: insertError } = await supabaseAdmin.from("matches").insert(newMatches);
    if (insertError) throw insertError;

    console.log(`Generated ${newMatches.length} matches for Swiss Round ${nextRound}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Ronde ${nextRound} berhasil dibuat: ${newMatches.length} pertandingan`,
        matchesCreated: newMatches.length,
        round: nextRound,
        totalRounds: maxRounds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error:", error);
    const status = error.message.includes("Access denied") || error.message.includes("Invalid") ? 401 : 400;
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status }
    );
  }
});
