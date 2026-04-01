const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PLUGGY_CLIENT_ID = Deno.env.get("PLUGGY_CLIENT_ID");
    const PLUGGY_CLIENT_SECRET = Deno.env.get("PLUGGY_CLIENT_SECRET");

    if (!PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET) {
      throw new Error("Pluggy credentials not configured");
    }

    // Authenticate with Pluggy API
    const authResponse = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: PLUGGY_CLIENT_ID,
        clientSecret: PLUGGY_CLIENT_SECRET,
      }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.text();
      throw new Error(`Pluggy auth failed: ${authResponse.status} - ${errorData}`);
    }

    const { apiKey } = await authResponse.json();

    // Create a connect token for the widget
    const connectResponse = await fetch("https://api.pluggy.ai/connect_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({}),
    });

    if (!connectResponse.ok) {
      const errorData = await connectResponse.text();
      throw new Error(`Pluggy connect token failed: ${connectResponse.status} - ${errorData}`);
    }

    const { accessToken } = await connectResponse.json();

    return new Response(
      JSON.stringify({ accessToken, apiKey }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
