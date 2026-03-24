import { useQuery } from "@tanstack/react-query";

const PAIRS = ["USD-BRL","EUR-BRL","GBP-BRL","PYG-BRL","ARS-BRL","CLP-BRL","COP-BRL","UYU-BRL"];
const CACHE_KEY = "fluxy_exchange_rates";

const FALLBACK_RATES: Record<string, { bid: number; ask: number; pctChange: number }> = {
  USD: { bid: 5.15, ask: 5.16, pctChange: 0 },
  EUR: { bid: 5.60, ask: 5.61, pctChange: 0 },
  GBP: { bid: 6.50, ask: 6.51, pctChange: 0 },
  PYG: { bid: 0.00068, ask: 0.00069, pctChange: 0 },
  ARS: { bid: 0.0058, ask: 0.006, pctChange: 0 },
  CLP: { bid: 0.0055, ask: 0.0056, pctChange: 0 },
  COP: { bid: 0.0012, ask: 0.0013, pctChange: 0 },
  UYU: { bid: 0.12, ask: 0.13, pctChange: 0 },
};

export interface ExchangeRate {
  code: string;
  name: string;
  bid: number;
  ask: number;
  pctChange: number;
}

export interface ExchangeRatesResult {
  rates: Record<string, ExchangeRate>;
  loading: boolean;
  error: boolean;
  lastUpdated: Date | null;
  stale: boolean;
  convert: (amount: number, from: string, to: string) => number;
}

function loadCache(): { rates: Record<string, ExchangeRate>; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveCache(rates: Record<string, ExchangeRate>) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, ts: Date.now() }));
}

async function fetchRates(): Promise<Record<string, ExchangeRate>> {
  const url = `https://economia.awesomeapi.com.br/json/last/${PAIRS.join(",")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  const data = await res.json();

  const rates: Record<string, ExchangeRate> = {};
  for (const key of Object.keys(data)) {
    const item = data[key];
    const code = item.code; // e.g. "USD"
    rates[code] = {
      code,
      name: item.name,
      bid: parseFloat(item.bid),
      ask: parseFloat(item.ask),
      pctChange: parseFloat(item.pctChange || "0"),
    };
  }
  saveCache(rates);
  return rates;
}

export function useExchangeRates(): ExchangeRatesResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: fetchRates,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const cached = loadCache();
  const rates = data ?? cached?.rates ?? Object.fromEntries(
    Object.entries(FALLBACK_RATES).map(([code, v]) => [code, { code, name: `${code}/BRL`, ...v }])
  );
  const stale = !data && !cached;
  const lastUpdated = data ? new Date() : cached ? new Date(cached.ts) : null;

  const convert = (amount: number, from: string, to: string): number => {
    if (from === to) return amount;
    // Convert via BRL as pivot
    let inBRL = amount;
    if (from !== "BRL") {
      const rate = rates[from];
      inBRL = rate ? amount * rate.bid : amount;
    }
    if (to === "BRL") return inBRL;
    const toRate = rates[to];
    return toRate && toRate.bid > 0 ? inBRL / toRate.bid : inBRL;
  };

  return { rates, loading: isLoading, error: isError || stale, lastUpdated, stale, convert };
}
