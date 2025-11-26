import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  transferId: string;
  type: "approved" | "rejected" | "club_approved" | "pending_approval";
  comment?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { transferId, type, comment }: NotificationRequest = await req.json();

    // Fetch transfer details
    const { data: transfer, error: transferError } = await supabase
      .from("player_transfers")
      .select(`
        *,
        player:player_id (full_name),
        from_club:from_club_id (name),
        to_club:to_club_id (name)
      `)
      .eq("id", transferId)
      .single();

    if (transferError) throw transferError;

    // Get relevant email addresses based on notification type
    let recipients: string[] = [];
    let subject = "";
    let htmlContent = "";

    const playerName = transfer.player.full_name;
    const fromClub = transfer.from_club?.name || "Free Agent";
    const toClub = transfer.to_club.name;

    if (type === "approved") {
      // Notify all parties: from club, to club, federation
      subject = `Transfer Disetujui: ${playerName}`;
      htmlContent = `
        <h2>Transfer Pemain Disetujui</h2>
        <p>Transfer pemain <strong>${playerName}</strong> dari <strong>${fromClub}</strong> ke <strong>${toClub}</strong> telah disetujui oleh Federasi.</p>
        <p>Status: Transfer Selesai</p>
        ${comment ? `<p>Catatan: ${comment}</p>` : ""}
      `;
    } else if (type === "rejected") {
      // Notify submitting club
      subject = `Transfer Ditolak: ${playerName}`;
      htmlContent = `
        <h2>Transfer Pemain Ditolak</h2>
        <p>Transfer pemain <strong>${playerName}</strong> dari <strong>${fromClub}</strong> ke <strong>${toClub}</strong> telah ditolak.</p>
        <p><strong>Alasan Penolakan:</strong></p>
        <p>${comment || "Tidak ada alasan yang diberikan"}</p>
      `;
    } else if (type === "club_approved") {
      // Notify next approver in chain
      subject = `Approval Transfer Diperlukan: ${playerName}`;
      htmlContent = `
        <h2>Transfer Memerlukan Persetujuan Anda</h2>
        <p>Transfer pemain <strong>${playerName}</strong> dari <strong>${fromClub}</strong> ke <strong>${toClub}</strong> memerlukan persetujuan Anda.</p>
        <p>Status: ${transfer.status === "pending_club_to" ? "Menunggu Persetujuan Klub Tujuan" : "Menunggu Persetujuan Federasi"}</p>
        <p>Silakan login ke sistem untuk mereview transfer ini.</p>
      `;
    } else if (type === "pending_approval") {
      // Initial notification to first approver
      subject = `Transfer Pemain Baru: ${playerName}`;
      htmlContent = `
        <h2>Transfer Pemain Diajukan</h2>
        <p>Transfer baru telah diajukan untuk pemain <strong>${playerName}</strong>.</p>
        <p><strong>Dari:</strong> ${fromClub}</p>
        <p><strong>Ke:</strong> ${toClub}</p>
        <p><strong>Jenis:</strong> ${transfer.transfer_type}</p>
        <p>Silakan login ke sistem untuk mereview transfer ini.</p>
      `;
    }

    // For demo purposes, send to a test email
    // In production, fetch actual club admin emails from database
    const { error: emailError } = await resend.emails.send({
      from: "Football Transfer System <onboarding@resend.dev>",
      to: ["admin@example.com"], // Replace with actual email fetching logic
      subject,
      html: htmlContent,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      throw emailError;
    }

    console.log(`Transfer notification sent for ${transferId}, type: ${type}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-transfer-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
