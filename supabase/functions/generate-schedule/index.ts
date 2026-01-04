import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to verify JWT and get user
async function verifyAuth(req: Request, supabaseAdmin: any) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.replace("Bearer ", "");
  
  // Verify the JWT and get user
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  
  if (authError || !user) {
    console.error("Auth error:", authError);
    throw new Error("Invalid or expired token");
  }

  return user;
}

// Helper function to check user role
async function checkUserRole(supabaseAdmin: any, userId: string, allowedRoles: string[]) {
  const { data: userRoles, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (roleError) {
    console.error("Role check error:", roleError);
    throw new Error("Failed to verify user role");
  }

  const roles = userRoles?.map((r: any) => r.role) || [];
  const hasAllowedRole = roles.some((role: string) => allowedRoles.includes(role));

  if (!hasAllowedRole) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}`);
  }

  return roles;
}

// Helper function to check if user is competition creator or admin
async function checkCompetitionAccess(supabaseAdmin: any, userId: string, competitionId: string, roles: string[]) {
  // Admin federasi can access all competitions
  if (roles.includes("admin_federasi")) {
    return true;
  }

  // Panitia can only access competitions they created
  if (roles.includes("panitia")) {
    const { data: competition, error } = await supabaseAdmin
      .from("competitions")
      .select("created_by")
      .eq("id", competitionId)
      .single();

    if (error || !competition) {
      throw new Error("Competition not found");
    }

    if (competition.created_by !== userId) {
      throw new Error("Access denied. You can only manage competitions you created");
    }
  }

  return true;
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

    // Verify JWT token
    const user = await verifyAuth(req, supabaseAdmin);
    console.log(`Authenticated user: ${user.id}`);

    // Check if user has required role (admin_federasi or panitia)
    const roles = await checkUserRole(supabaseAdmin, user.id, ["admin_federasi", "panitia"]);
    console.log(`User roles: ${roles.join(", ")}`);

    const { competitionId } = await req.json();
    console.log(`Generating schedule for competition: ${competitionId}`);

    // Verify user has access to this competition
    await checkCompetitionAccess(supabaseAdmin, user.id, competitionId, roles);

    // Get competition details
    const { data: competition, error: compError } = await supabaseAdmin
      .from("competitions")
      .select("*")
      .eq("id", competitionId)
      .single();

    if (compError) throw compError;

    const { format, start_date } = competition;
    console.log(`Competition format: ${format}, Start date: ${start_date}`);

    // Get all teams
    const { data: teams, error: teamsError } = await supabaseAdmin
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
    const { error: insertError } = await supabaseAdmin.from("matches").insert(matches);

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
    
    const status = error.message.includes("Access denied") || 
                   error.message.includes("Invalid") ||
                   error.message.includes("Missing") ? 401 : 400;
    
    return new Response(
      JSON.stringify({
        error: error?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: status,
      }
    );
  }
});
