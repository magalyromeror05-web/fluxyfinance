import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORT_EMAIL = "suporte@fluxy-finance.com";
const FROM_ADDRESS = "Fluxy <onboarding@resend.dev>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // JWT validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ticketId, userEmail, message, pageContext } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeMessage = String(message)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #f5f5f5; padding: 24px;">
        <div style="background: white; border-radius: 12px; overflow: hidden;">
          <div style="background: #1a1a2e; padding: 20px 24px; color: white;">
            <h1 style="margin: 0; font-size: 18px;">🆘 Novo ticket de suporte</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 16px; color: #333; font-size: 14px;">
              <strong>Usuário:</strong> ${userEmail ?? "(sem email)"}
            </p>
            <p style="margin: 0 0 16px; color: #333; font-size: 14px;">
              <strong>Página:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${pageContext ?? "?"}</code>
            </p>
            <p style="margin: 0 0 8px; color: #333; font-size: 14px;"><strong>Mensagem:</strong></p>
            <div style="background: #f9f9f9; border-left: 3px solid #1a1a2e; padding: 12px 16px; border-radius: 4px; color: #333; font-size: 14px; line-height: 1.6;">
              ${safeMessage}
            </div>
            <p style="margin: 24px 0 0; color: #999; font-size: 12px;">
              Ticket ID: ${ticketId ?? "-"}
            </p>
          </div>
        </div>
      </div>
    `;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: SUPPORT_EMAIL,
        reply_to: userEmail || undefined,
        subject: `[Fluxy Suporte] Novo ticket de ${userEmail ?? "usuário"}`,
        html,
      }),
    });

    const resendData = await resendResp.json();

    return new Response(
      JSON.stringify({ success: resendResp.ok, id: resendData.id ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("notify-support-ticket error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
