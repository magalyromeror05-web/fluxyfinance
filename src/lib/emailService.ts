import { supabase } from "@/integrations/supabase/client";

async function sendEmail(
  templateType: string,
  recipientEmail: string,
  recipientName: string,
  userId: string | null,
  variables: Record<string, string> = {}
) {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        templateType,
        recipientEmail,
        recipientName,
        userId,
        variables,
      },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: err };
  }
}

export const emailService = {
  sendWelcome: (email: string, name: string, userId: string) =>
    sendEmail("welcome", email, name, userId, {
      link_app: window.location.origin + "/dashboard",
    }),

  sendBudgetAlert: (
    email: string,
    name: string,
    userId: string,
    categoria: string,
    percentual: string,
    valorGasto: string,
    valorOrcado: string,
    mes: string
  ) =>
    sendEmail("budget_alert", email, name, userId, {
      categoria,
      percentual,
      valor_gasto: valorGasto,
      valor_orcado: valorOrcado,
      mes,
      link_orcamentos: window.location.origin + "/orcamentos",
    }),

  sendMonthlyReport: (
    email: string,
    name: string,
    userId: string,
    mes: string,
    entradas: string,
    saidas: string,
    saldo: string,
    diagnostico: string
  ) =>
    sendEmail("monthly_report", email, name, userId, {
      mes,
      total_entradas: entradas,
      total_saidas: saidas,
      saldo,
      diagnostico,
      link_relatorio: window.location.origin + "/relatorios",
    }),

  sendNewsletter: (
    email: string,
    name: string,
    userId: string | null,
    variables: Record<string, string>
  ) => sendEmail("newsletter", email, name, userId, variables),

  sendCustom: sendEmail,
};
