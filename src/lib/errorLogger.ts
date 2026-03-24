import { supabase } from "@/integrations/supabase/client";

function classifySeverity(error: unknown): string {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (
    msg.includes("auth") ||
    msg.includes("supabase") ||
    msg.includes("network") ||
    error instanceof TypeError
  ) {
    return "critical";
  }
  return "warning";
}

export async function logError(
  error: unknown,
  page?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const errObj = error instanceof Error ? error : new Error(String(error));

    await supabase.from("error_logs").insert({
      user_id: user?.id ?? null,
      error_message: errObj.message,
      error_stack: errObj.stack ?? null,
      page: page ?? window.location.pathname,
      severity: classifySeverity(error),
      metadata: metadata ? (metadata as any) : null,
    });
  } catch {
    // Silently fail — never break the UI
  }
}
