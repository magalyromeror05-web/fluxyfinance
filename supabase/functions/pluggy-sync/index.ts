import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { itemId, userId, connectionId } = await req.json();

    if (!itemId || !userId || !connectionId) {
      return new Response(
        JSON.stringify({ error: "itemId, userId, and connectionId are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const PLUGGY_CLIENT_ID = Deno.env.get("PLUGGY_CLIENT_ID")!;
    const PLUGGY_CLIENT_SECRET = Deno.env.get("PLUGGY_CLIENT_SECRET")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Authenticate with Pluggy
    const authRes = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: PLUGGY_CLIENT_ID, clientSecret: PLUGGY_CLIENT_SECRET }),
    });

    if (!authRes.ok) throw new Error("Pluggy auth failed");
    const { apiKey } = await authRes.json();

    const pluggyHeaders = {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    };

    // 2. Fetch item info
    const itemRes = await fetch(`https://api.pluggy.ai/items/${itemId}`, {
      headers: pluggyHeaders,
    });
    if (!itemRes.ok) throw new Error("Failed to fetch Pluggy item");
    const item = await itemRes.json();

    // Update connection with item info
    await supabase
      .from("connections")
      .update({
        status: item.status === "UPDATED" ? "connected" : "expiring",
        last_sync_at: new Date().toISOString(),
        external_connection_id: itemId,
      })
      .eq("id", connectionId);

    // 3. Fetch accounts
    const accountsRes = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
      headers: pluggyHeaders,
    });
    if (!accountsRes.ok) throw new Error("Failed to fetch Pluggy accounts");
    const { results: pluggyAccounts } = await accountsRes.json();

    let syncedAccounts = 0;
    let syncedTransactions = 0;
    const accountIdMap: Record<string, string> = {};

    for (const acc of pluggyAccounts) {
      const accountData = {
        user_id: userId,
        connection_id: connectionId,
        institution_name: item.connector?.name || "Banco",
        account_name: acc.name || acc.number || "Conta",
        type: mapAccountType(acc.type),
        currency: acc.currencyCode || "BRL",
        balance: acc.balance ?? 0,
        provider_account_id: acc.id,
        last_sync_at: new Date().toISOString(),
        status: "active",
      };

      // Upsert by provider_account_id
      const { data: existing } = await supabase
        .from("accounts")
        .select("id")
        .eq("provider_account_id", acc.id)
        .eq("user_id", userId)
        .maybeSingle();

      let accountId: string;
      if (existing) {
        await supabase.from("accounts").update(accountData).eq("id", existing.id);
        accountId = existing.id;
      } else {
        const { data: inserted } = await supabase
          .from("accounts")
          .insert(accountData)
          .select("id")
          .single();
        accountId = inserted!.id;
      }

      accountIdMap[acc.id] = accountId;
      syncedAccounts++;

      // 4. Fetch transactions for this account (last 30 days)
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const fromStr = from.toISOString().split("T")[0];
      const toStr = new Date().toISOString().split("T")[0];

      const txRes = await fetch(
        `https://api.pluggy.ai/transactions?accountId=${acc.id}&from=${fromStr}&to=${toStr}&pageSize=500`,
        { headers: pluggyHeaders }
      );

      if (!txRes.ok) continue;
      const { results: pluggyTxs } = await txRes.json();

      for (const tx of pluggyTxs || []) {
        const txData = {
          user_id: userId,
          account_id: accountId,
          connection_id: connectionId,
          posted_at: tx.date,
          amount: tx.amount ?? 0,
          currency: tx.currencyCode || "BRL",
          description_raw: tx.description || "",
          merchant: tx.description || tx.descriptionRaw || "Sem descrição",
          category_source: tx.category ? "provider" : "manual",
          institution_name: item.connector?.name || null,
          source: "pluggy",
          status: "posted",
          external_transaction_id: tx.id,
          raw: tx,
        };

        const { data: existingTx } = await supabase
          .from("transactions")
          .select("id")
          .eq("external_transaction_id", tx.id)
          .eq("user_id", userId)
          .maybeSingle();

        if (existingTx) {
          await supabase.from("transactions").update(txData).eq("id", existingTx.id);
        } else {
          await supabase.from("transactions").insert(txData);
        }
        syncedTransactions++;
      }
    }

    // Update accounts_count on connection
    await supabase
      .from("connections")
      .update({ accounts_count: syncedAccounts })
      .eq("id", connectionId);

    return new Response(
      JSON.stringify({
        success: true,
        syncedAccounts,
        syncedTransactions,
      }),
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

function mapAccountType(pluggyType: string): string {
  const map: Record<string, string> = {
    BANK: "checking",
    CREDIT: "credit",
    INVESTMENT: "investment",
    SAVINGS: "savings",
  };
  return map[pluggyType] || "checking";
}
