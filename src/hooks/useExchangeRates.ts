import { useQuery } from "@tanstack/react-query";

const PAIRS = ["USD-BRL", "EUR-BRL", "GBP-BRL", "PYG-BRL", "ARS-BRL"];
const BCB_CODES = ["USD", "EUR", "GBP", "PYG", "ARS"];
const CACHE_KEY = "fluxy_exchange_rates";

const FALLBACK_RATES: Record<string, { bid: number; ask: number; pctChange: number }> = {
  USD: { bid: 5.15, ask: 5.16, pctChange: 0 },
  EUR: { bid: 5.60, ask: 5.61, pctChange: 0 },
  GBP: { bid: 6.50, ask: 6.51, pctChange: 0 },
  PYG: { bid: 0.00068, ask: 0.00069, pctChange: 0 },
  ARS: { bid: 0.0058, ask: 0.006, pctChange: 0 },
};

export interface ExchangeRate {
  code: string;
  name: string;
  bid: number;
  ask: number;
  pctChange: number;
  source: "awesome" | "bcb" | "fallback";
  updatedAt?: string;
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

function formatBcbDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${date.getFullYear()}`;
}

async function fetchBcbRate(code: string): Promise<ExchangeRate | null> {
  for (let offset = 0; offset < 8; offset++) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const bcbDate = formatBcbDate(date);
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${code}'&@dataCotacao='${bcbDate}'&$format=json`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    const item = data?.value?.at(-1);
    if (item) {
      return {
        code,
        name: `${code}/BRL`,
        bid: Number(item.cotacaoCompra),
        ask: Number(item.cotacaoVenda),
        pctChange: 0,
        source: "bcb",
        updatedAt: item.dataHoraCotacao,
      };
    }
  }
  return null;
}

async function fetchAwesomeRates(): Promise<Record<string, ExchangeRate>> {
  const url = `https://economia.awesomeapi.com.br/json/last/${PAIRS.join(",")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("AwesomeAPI exchange-rate request failed");
  const data = await res.json();

  const rates: Record<string, ExchangeRate> = {};
  for (const key of Object.keys(data)) {
    const item = data[key];
    const code = item.code;
    rates[code] = {
      code,
      name: item.name,
      bid: Number(item.bid),
      ask: Number(item.ask),
      pctChange: Number(item.pctChange || "0"),
      source: "awesome",
      updatedAt: item.create_date,
    };
  }
  return rates;
}

async function fetchRates(): Promise<Record<string, ExchangeRate>> {
  try {
    const rates = await fetchAwesomeRates();
    saveCache(rates);
    return rates;
  } catch {
    const bcbRates = await Promise.all(BCB_CODES.map(fetchBcbRate));
    const rates = Object.fromEntries(bcbRates.filter(Boolean).map((rate) => [rate!.code, rate!])) as Record<string, ExchangeRate>;
    if (Object.keys(rates).length === 0) throw new Error("BCB PTAX fallback returned no rates");
    saveCache(rates);
    return rates;
  }
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
    Object.entries(FALLBACK_RATES).map(([code, v]) => [code, { code, name: `${code}/BRL`, source: "fallback" as const, ...v }])
  );
  const stale = !data && !cached;
  const lastUpdated = data ? new Date() : cached ? new Date(cached.ts) : null;

  const convert = (amount: number, from: string, to: string): number => {
    if (from === to) return amount;
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
