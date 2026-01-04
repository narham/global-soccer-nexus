import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  name: string;
  role: string;
  status: "approved" | "rejected";
  reviewerNotes?: string;
  clubName?: string;
}

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

const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin_klub":
      return "Admin Klub";
    case "wasit":
      return "Wasit";
    case "panitia":
      return "Panitia";
    default:
      return role;
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    // Only admin_federasi can send role notifications
    await checkUserRole(supabaseAdmin, user.id, ["admin_federasi"]);
    console.log("User has admin_federasi role - authorized to send role notifications");

    const { email, name, role, status, reviewerNotes, clubName }: NotificationRequest = await req.json();

    console.log("Sending role notification:", { email, name, role, status });

    const roleLabel = getRoleLabel(role);
    const isApproved = status === "approved";

    const subject = isApproved 
      ? `🎉 Permintaan Role ${roleLabel} Disetujui`
      : `❌ Permintaan Role ${roleLabel} Ditolak`;

    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Sistem Manajemen Sepakbola</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Halo ${name},</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            ${isApproved 
              ? `Permintaan role <strong>${roleLabel}</strong> Anda telah <strong style="color: #10b981;">disetujui</strong>! 🎉`
              : `Permintaan role <strong>${roleLabel}</strong> Anda telah <strong style="color: #ef4444;">ditolak</strong>.`
            }
          </p>
    `;

    if (clubName && isApproved) {
      htmlContent += `
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            <strong>Klub:</strong> ${clubName}
          </p>
      `;
    }

    if (reviewerNotes) {
      htmlContent += `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isApproved ? '#10b981' : '#ef4444'};">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 14px;">Catatan dari Reviewer:</h3>
            <p style="color: #4b5563; margin: 0; white-space: pre-wrap;">${reviewerNotes}</p>
          </div>
      `;
    }

    if (isApproved) {
      htmlContent += `
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Anda sekarang dapat mengakses sistem dengan role <strong>${roleLabel}</strong>. Silakan login untuk mulai menggunakan fitur-fitur yang tersedia.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://app.lovable.dev'}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block;
                      font-weight: bold;">
              Masuk ke Sistem
            </a>
          </div>
      `;
    } else {
      htmlContent += `
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Jika Anda merasa ada kesalahan atau ingin mengajukan ulang dengan informasi yang diperbaiki, silakan login dan edit permintaan Anda.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://app.lovable.dev'}" 
               style="background: #6b7280; 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block;
                      font-weight: bold;">
              Edit Permintaan
            </a>
          </div>
      `;
    }

    htmlContent += `
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
            Email ini dikirim secara otomatis oleh Sistem Manajemen Sepakbola.<br/>
            Jika ada pertanyaan, silakan hubungi administrator federasi.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Sistem Manajemen Sepakbola <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-role-notification function:", error);
    
    const status = error.message.includes("Access denied") || 
                   error.message.includes("Invalid") ||
                   error.message.includes("Missing") ? 401 : 500;
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
