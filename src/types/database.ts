// Supabase-friendly snake_case types matching the database schema

export type Currency = "BRL" | "USD" | "PYG" | "EUR" | "GBP" | "ARS" | "CLP" | "COP" | "UYU";
export type ConnectionStatus = "connected" | "expiring" | "disconnected";
export type CategorySource = "provider" | "rule" | "ai" | "manual";
export type AccountType = "checking" | "savings" | "credit" | "investment" | "wallet";
export type MatchType = "contains" | "starts_with" | "regex" | "merchant_equals";
export type ContractStatus = "active" | "paid" | "overdue";
export type InstallmentStatus = "paid" | "pending" | "overdue";

export interface DbConnection {
  id: string;
  user_id: string;
  provider: string;
  provider_type: string;
  country: string;
  status: ConnectionStatus;
  consent_expires_at: string | null;
  accounts_count: number;
  logo: string | null;
  created_at: string;
  last_sync_at: string | null;
  external_connection_id: string | null;
}

export interface DbAccount {
  id: string;
  user_id: string;
  connection_id: string | null;
  institution_name: string;
  account_name: string;
  type: string;
  currency: string;
  balance: number;
  last_sync_at: string | null;
  status: string;
  created_at: string;
  provider_account_id: string | null;
}

export interface DbCategory {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  type: string;
  icon: string;
  created_at: string;
}

export interface DbTransaction {
  id: string;
  user_id: string;
  account_id: string | null;
  posted_at: string;
  amount: number;
  currency: string;
  description_raw: string | null;
  merchant: string;
  category_id: string | null;
  category_source: string;
  institution_name: string | null;
  source: string;
  status: string;
  created_at: string;
  connection_id: string | null;
  external_transaction_id: string | null;
  raw: unknown;
}

export interface DbRule {
  id: string;
  user_id: string;
  priority: number;
  match_type: string;
  match_value: string;
  category_id: string | null;
  usage_count: number;
  created_at: string;
}

export interface DbContract {
  id: string;
  user_id: string;
  title: string;
  principal_amount: number;
  currency: string;
  interest_rate: number | null;
  rate_type: string | null;
  installments: number | null;
  first_due_date: string | null;
  lender: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface DbContractInstallment {
  id: string;
  contract_id: string;
  number: number;
  due_date: string;
  amount: number;
  status: string;
  transaction_id: string | null;
}

export interface DbBudget {
  id: string;
  user_id: string;
  category_id: string | null;
  currency: string;
  amount: number;
  period: string;
  healthy_pct: number | null;
  name: string;
  period_month: string | null;
  period_start_day: number;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

// Currency display helpers
export const CURRENCY_LABELS: Record<string, { symbol: string; name: string; flag: string }> = {
  BRL: { symbol: "R$", name: "Real Brasileiro", flag: "🇧🇷" },
  USD: { symbol: "US$", name: "Dólar Americano", flag: "🇺🇸" },
  PYG: { symbol: "₲", name: "Guarani Paraguaio", flag: "🇵🇾" },
  EUR: { symbol: "€", name: "Euro", flag: "🇪🇺" },
  GBP: { symbol: "£", name: "Libra Esterlina", flag: "🇬🇧" },
  ARS: { symbol: "AR$", name: "Peso Argentino", flag: "🇦🇷" },
  CLP: { symbol: "CL$", name: "Peso Chileno", flag: "🇨🇱" },
  COP: { symbol: "CO$", name: "Peso Colombiano", flag: "🇨🇴" },
  UYU: { symbol: "UY$", name: "Peso Uruguaio", flag: "🇺🇾" },
};

export function formatCurrency(amount: number, currency: string): string {
  const info = CURRENCY_LABELS[currency] || { symbol: currency };
  if (currency === "PYG") {
    return `${info.symbol} ${Math.round(amount).toLocaleString("es-PY")}`;
  }
  return `${info.symbol} ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
