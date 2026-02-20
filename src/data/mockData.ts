// AtlasCash Mock Data

export type Currency = "BRL" | "USD" | "PYG";

export const CURRENCY_LABELS: Record<Currency, { symbol: string; name: string; flag: string }> = {
  BRL: { symbol: "R$", name: "Real Brasileiro", flag: "🇧🇷" },
  USD: { symbol: "US$", name: "Dólar Americano", flag: "🇺🇸" },
  PYG: { symbol: "₲", name: "Guarani Paraguaio", flag: "🇵🇾" },
};

export type ConnectionStatus = "connected" | "expiring" | "disconnected";
export type CategorySource = "provider" | "rule" | "ai" | "manual";

// ─── Connections ───────────────────────────────────────────────────────────
export interface Connection {
  id: string;
  provider: string;
  providerType: "open_finance" | "wise" | "aggregator" | "manual";
  country: "BR" | "US" | "PY";
  status: ConnectionStatus;
  consentExpiresAt: string;
  accountsCount: number;
  logo: string;
}

export const mockConnections: Connection[] = [
  {
    id: "conn-1",
    provider: "Pluggy (Open Finance BR)",
    providerType: "open_finance",
    country: "BR",
    status: "connected",
    consentExpiresAt: "2025-09-14",
    accountsCount: 3,
    logo: "🏦",
  },
  {
    id: "conn-2",
    provider: "Wise",
    providerType: "wise",
    country: "US",
    status: "connected",
    consentExpiresAt: "2025-12-01",
    accountsCount: 2,
    logo: "💸",
  },
  {
    id: "conn-3",
    provider: "Salt Edge (PY)",
    providerType: "aggregator",
    country: "PY",
    status: "expiring",
    consentExpiresAt: "2025-03-05",
    accountsCount: 1,
    logo: "🏛️",
  },
];

// ─── Accounts ──────────────────────────────────────────────────────────────
export interface Account {
  id: string;
  connectionId: string;
  institutionName: string;
  accountName: string;
  type: "checking" | "savings" | "credit" | "investment" | "wallet";
  currency: Currency;
  balance: number;
  lastSyncAt: string;
  status: ConnectionStatus;
}

export const mockAccounts: Account[] = [
  {
    id: "acc-1",
    connectionId: "conn-1",
    institutionName: "Nubank",
    accountName: "Conta Corrente",
    type: "checking",
    currency: "BRL",
    balance: 12480.5,
    lastSyncAt: "2025-02-20T08:30:00Z",
    status: "connected",
  },
  {
    id: "acc-2",
    connectionId: "conn-1",
    institutionName: "Itaú",
    accountName: "Conta Corrente",
    type: "checking",
    currency: "BRL",
    balance: 3210.0,
    lastSyncAt: "2025-02-20T08:30:00Z",
    status: "connected",
  },
  {
    id: "acc-3",
    connectionId: "conn-1",
    institutionName: "Itaú",
    accountName: "Poupança",
    type: "savings",
    currency: "BRL",
    balance: 8900.0,
    lastSyncAt: "2025-02-20T08:30:00Z",
    status: "connected",
  },
  {
    id: "acc-4",
    connectionId: "conn-2",
    institutionName: "Wise",
    accountName: "USD Balance",
    type: "wallet",
    currency: "USD",
    balance: 4250.75,
    lastSyncAt: "2025-02-20T09:00:00Z",
    status: "connected",
  },
  {
    id: "acc-5",
    connectionId: "conn-2",
    institutionName: "Wise",
    accountName: "BRL Balance",
    type: "wallet",
    currency: "BRL",
    balance: 1820.0,
    lastSyncAt: "2025-02-20T09:00:00Z",
    status: "connected",
  },
  {
    id: "acc-6",
    connectionId: "conn-3",
    institutionName: "Banco Continental PY",
    accountName: "Cuenta Corriente",
    type: "checking",
    currency: "PYG",
    balance: 14500000,
    lastSyncAt: "2025-02-19T15:00:00Z",
    status: "expiring",
  },
];

// ─── Categories ────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  type: "income" | "expense" | "transfer";
  icon: string;
}

export const mockCategories: Category[] = [
  { id: "cat-1", name: "Moradia", parentId: null, type: "expense", icon: "🏠" },
  { id: "cat-1-1", name: "Aluguel", parentId: "cat-1", type: "expense", icon: "🏠" },
  { id: "cat-1-2", name: "Condomínio", parentId: "cat-1", type: "expense", icon: "🏗️" },
  { id: "cat-1-3", name: "Energia", parentId: "cat-1", type: "expense", icon: "⚡" },
  { id: "cat-2", name: "Alimentação", parentId: null, type: "expense", icon: "🍽️" },
  { id: "cat-2-1", name: "Supermercado", parentId: "cat-2", type: "expense", icon: "🛒" },
  { id: "cat-2-2", name: "Restaurante", parentId: "cat-2", type: "expense", icon: "🍜" },
  { id: "cat-3", name: "Transporte", parentId: null, type: "expense", icon: "🚗" },
  { id: "cat-3-1", name: "Uber / App", parentId: "cat-3", type: "expense", icon: "📱" },
  { id: "cat-4", name: "Assinaturas", parentId: null, type: "expense", icon: "📺" },
  { id: "cat-4-1", name: "Streaming", parentId: "cat-4", type: "expense", icon: "🎬" },
  { id: "cat-4-2", name: "SaaS / Software", parentId: "cat-4", type: "expense", icon: "💻" },
  { id: "cat-5", name: "Receita", parentId: null, type: "income", icon: "💰" },
  { id: "cat-5-1", name: "Salário", parentId: "cat-5", type: "income", icon: "💼" },
  { id: "cat-5-2", name: "Freelance", parentId: "cat-5", type: "income", icon: "🎯" },
  { id: "cat-6", name: "Transferência", parentId: null, type: "transfer", icon: "↔️" },
];

// ─── Transactions ──────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  accountId: string;
  postedAt: string;
  amount: number;
  currency: Currency;
  descriptionRaw: string;
  merchant: string;
  categoryId: string;
  categorySource: CategorySource;
  institutionName: string;
}

export const mockTransactions: Transaction[] = [
  { id: "tx-1", accountId: "acc-1", postedAt: "2025-02-20T10:00:00Z", amount: -2800, currency: "BRL", descriptionRaw: "ALUGUEL FEV/2025", merchant: "Imobiliária Central", categoryId: "cat-1-1", categorySource: "rule", institutionName: "Nubank" },
  { id: "tx-2", accountId: "acc-1", postedAt: "2025-02-19T14:30:00Z", amount: -189.9, currency: "BRL", descriptionRaw: "PAGUEI IFOOD*SUSHI", merchant: "iFood", categoryId: "cat-2-2", categorySource: "ai", institutionName: "Nubank" },
  { id: "tx-3", accountId: "acc-1", postedAt: "2025-02-18T09:00:00Z", amount: 12000, currency: "BRL", descriptionRaw: "SALARIO EMPRESA ABC", merchant: "Empresa ABC", categoryId: "cat-5-1", categorySource: "provider", institutionName: "Nubank" },
  { id: "tx-4", accountId: "acc-1", postedAt: "2025-02-17T11:00:00Z", amount: -435.0, currency: "BRL", descriptionRaw: "SUPERMERCADO EXTRA", merchant: "Extra", categoryId: "cat-2-1", categorySource: "rule", institutionName: "Nubank" },
  { id: "tx-5", accountId: "acc-2", postedAt: "2025-02-16T16:00:00Z", amount: -79.9, currency: "BRL", descriptionRaw: "NETFLIX.COM", merchant: "Netflix", categoryId: "cat-4-1", categorySource: "rule", institutionName: "Itaú" },
  { id: "tx-6", accountId: "acc-4", postedAt: "2025-02-20T08:00:00Z", amount: -29.0, currency: "USD", descriptionRaw: "NOTION.SO MONTHLY", merchant: "Notion", categoryId: "cat-4-2", categorySource: "rule", institutionName: "Wise" },
  { id: "tx-7", accountId: "acc-4", postedAt: "2025-02-18T12:00:00Z", amount: 1500.0, currency: "USD", descriptionRaw: "FREELANCE PAYMENT CLIENT XYZ", merchant: "Client XYZ", categoryId: "cat-5-2", categorySource: "ai", institutionName: "Wise" },
  { id: "tx-8", accountId: "acc-4", postedAt: "2025-02-15T10:00:00Z", amount: -15.99, currency: "USD", descriptionRaw: "GITHUB COPILOT", merchant: "GitHub", categoryId: "cat-4-2", categorySource: "rule", institutionName: "Wise" },
  { id: "tx-9", accountId: "acc-6", postedAt: "2025-02-19T09:00:00Z", amount: -1500000, currency: "PYG", descriptionRaw: "SUPERMERCADO STOCK PY", merchant: "Stock PY", categoryId: "cat-2-1", categorySource: "ai", institutionName: "Banco Continental PY" },
  { id: "tx-10", accountId: "acc-6", postedAt: "2025-02-17T14:00:00Z", amount: 15000000, currency: "PYG", descriptionRaw: "CREDITO SALARIO", merchant: "Empresa PY S.A.", categoryId: "cat-5-1", categorySource: "provider", institutionName: "Banco Continental PY" },
];

// ─── Rules ─────────────────────────────────────────────────────────────────
export interface Rule {
  id: string;
  priority: number;
  matchType: "contains" | "starts_with" | "regex" | "merchant_equals";
  matchValue: string;
  categoryId: string;
  usageCount: number;
}

export const mockRules: Rule[] = [
  { id: "rule-1", priority: 1, matchType: "contains", matchValue: "ALUGUEL", categoryId: "cat-1-1", usageCount: 12 },
  { id: "rule-2", priority: 2, matchType: "merchant_equals", matchValue: "Netflix", categoryId: "cat-4-1", usageCount: 8 },
  { id: "rule-3", priority: 3, matchType: "merchant_equals", matchValue: "Notion", categoryId: "cat-4-2", usageCount: 4 },
  { id: "rule-4", priority: 4, matchType: "contains", matchValue: "SUPERMERCADO", categoryId: "cat-2-1", usageCount: 22 },
  { id: "rule-5", priority: 5, matchType: "merchant_equals", matchValue: "GitHub", categoryId: "cat-4-2", usageCount: 3 },
  { id: "rule-6", priority: 6, matchType: "starts_with", matchValue: "SALARIO", categoryId: "cat-5-1", usageCount: 6 },
];

// ─── Contracts ─────────────────────────────────────────────────────────────
export type ContractStatus = "active" | "paid" | "overdue";

export interface ContractInstallment {
  number: number;
  dueDate: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  transactionId?: string;
}

export interface Contract {
  id: string;
  title: string;
  principalAmount: number;
  currency: Currency;
  interestRate: number;
  rateType: "monthly" | "yearly";
  installments: number;
  firstDueDate: string;
  lender: string;
  status: ContractStatus;
  notes: string;
  schedule: ContractInstallment[];
}

export const mockContracts: Contract[] = [
  {
    id: "cont-1",
    title: "Financiamento Veículo",
    principalAmount: 48000,
    currency: "BRL",
    interestRate: 1.49,
    rateType: "monthly",
    installments: 48,
    firstDueDate: "2023-03-10",
    lender: "Banco Itaú",
    status: "active",
    notes: "Veículo Honda Civic 2022",
    schedule: [
      { number: 1, dueDate: "2023-03-10", amount: 1180.5, status: "paid", transactionId: "tx-old-1" },
      { number: 2, dueDate: "2023-04-10", amount: 1180.5, status: "paid" },
      { number: 24, dueDate: "2025-02-10", amount: 1180.5, status: "paid" },
      { number: 25, dueDate: "2025-03-10", amount: 1180.5, status: "pending" },
      { number: 26, dueDate: "2025-04-10", amount: 1180.5, status: "pending" },
    ],
  },
  {
    id: "cont-2",
    title: "Empréstimo Pessoal Wise",
    principalAmount: 5000,
    currency: "USD",
    interestRate: 8.5,
    rateType: "yearly",
    installments: 12,
    firstDueDate: "2024-08-01",
    lender: "Wise Credit",
    status: "active",
    notes: "Capital de giro",
    schedule: [
      { number: 1, dueDate: "2024-08-01", amount: 434.17, status: "paid" },
      { number: 6, dueDate: "2025-01-01", amount: 434.17, status: "paid" },
      { number: 7, dueDate: "2025-02-01", amount: 434.17, status: "paid" },
      { number: 8, dueDate: "2025-03-01", amount: 434.17, status: "pending" },
    ],
  },
];

// ─── Dashboard stats (derived helpers) ────────────────────────────────────
export function getBalanceByCurrency(accounts: Account[]) {
  return {
    BRL: accounts.filter(a => a.currency === "BRL").reduce((s, a) => s + a.balance, 0),
    USD: accounts.filter(a => a.currency === "USD").reduce((s, a) => s + a.balance, 0),
    PYG: accounts.filter(a => a.currency === "PYG").reduce((s, a) => s + a.balance, 0),
  };
}

export function getMonthlyByCurrency(transactions: Transaction[], currency: Currency) {
  const txs = transactions.filter(t => t.currency === currency);
  const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return { income, expenses };
}

export function formatCurrency(amount: number, currency: Currency): string {
  const { symbol } = CURRENCY_LABELS[currency];
  if (currency === "PYG") {
    return `${symbol} ${Math.round(amount).toLocaleString("es-PY")}`;
  }
  return `${symbol} ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
