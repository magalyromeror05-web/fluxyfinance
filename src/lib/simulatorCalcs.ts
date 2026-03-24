/** Price system: fixed monthly payment */
export function calcPrice(pv: number, monthlyRate: number, n: number): number {
  if (monthlyRate === 0) return pv / n;
  const factor = Math.pow(1 + monthlyRate, n);
  return pv * (monthlyRate * factor) / (factor - 1);
}

/** SAC system: fixed amortization, decreasing payments */
export function calcSACSchedule(pv: number, monthlyRate: number, n: number) {
  const amort = pv / n;
  const schedule: Array<{ month: number; payment: number; interest: number; amortization: number; balance: number }> = [];
  let balance = pv;
  for (let i = 1; i <= n; i++) {
    const interest = balance * monthlyRate;
    const payment = amort + interest;
    balance -= amort;
    schedule.push({ month: i, payment, interest, amortization: amort, balance: Math.max(0, balance) });
  }
  return schedule;
}

export function calcPriceSchedule(pv: number, monthlyRate: number, n: number) {
  const pmt = calcPrice(pv, monthlyRate, n);
  const schedule: Array<{ month: number; payment: number; interest: number; amortization: number; balance: number }> = [];
  let balance = pv;
  for (let i = 1; i <= n; i++) {
    const interest = balance * monthlyRate;
    const amortization = pmt - interest;
    balance -= amortization;
    schedule.push({ month: i, payment: pmt, interest, amortization, balance: Math.max(0, balance) });
  }
  return schedule;
}

export type SimulationType = 'rent_change' | 'car_loan' | 'home_loan' | 'subscription' | 'salary_increase' | 'income_loss';

export const SIM_TYPE_META: Record<SimulationType, { label: string; icon: string }> = {
  rent_change: { label: 'Troca de aluguel', icon: '🏠' },
  car_loan: { label: 'Financiamento de carro', icon: '🚗' },
  home_loan: { label: 'Financiamento de imóvel', icon: '🏡' },
  subscription: { label: 'Nova assinatura', icon: '📺' },
  salary_increase: { label: 'Aumento de salário', icon: '📈' },
  income_loss: { label: 'Redução de renda', icon: '📉' },
};

export function getDiagnosisInfo(balance: number, savingsRate: number) {
  if (balance < 0) return { key: 'negative' as const, icon: '🚨', text: 'Orçamento negativo', cls: 'text-destructive' };
  if (balance < 200) return { key: 'limit' as const, icon: '🔴', text: 'Orçamento no limite', cls: 'text-destructive' };
  if (savingsRate < 10) return { key: 'attention' as const, icon: '⚠️', text: 'Atenção — poupança abaixo de 10%', cls: 'text-amber-600' };
  return { key: 'ok' as const, icon: '✅', text: 'Cabe no orçamento', cls: 'text-income' };
}
