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
    console.log(`Generating groups for competition: ${competitionId}`);

    // Verify user has access to this competition
    await checkCompetitionAccess(supabaseAdmin, user.id, competitionId, roles);

    // Get competition details
    const { data: competition, error: compError } = await supabaseAdmin
      .from("competitions")
      .select("num_groups, num_teams")
      .eq("id", competitionId)
      .single();

    if (compError) throw compError;

    const numGroups = competition.num_groups || 4;
    console.log(`Number of groups: ${numGroups}`);

    // Get all teams ordered by seed (AFC seeding system)
    const { data: teams, error: teamsError } = await supabaseAdmin
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
    const { error: updateError } = await supabaseAdmin
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
