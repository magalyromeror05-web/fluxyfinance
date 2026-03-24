// Healthy budget benchmarks — recommended % of monthly income per category
// These map to category names (case-insensitive match)

export interface HealthyBenchmark {
  categoryPattern: string; // matches category name (contains, case-insensitive)
  percent: number;
  label: string;
  icon: string;
}

export const HEALTHY_BENCHMARKS: HealthyBenchmark[] = [
  { categoryPattern: "moradia", percent: 30, label: "Moradia", icon: "🏠" },
  { categoryPattern: "aluguel", percent: 30, label: "Moradia", icon: "🏠" },
  { categoryPattern: "condomínio", percent: 30, label: "Moradia", icon: "🏠" },
  { categoryPattern: "energia", percent: 30, label: "Moradia", icon: "🏠" },
  { categoryPattern: "alimentação", percent: 15, label: "Alimentação", icon: "🍽️" },
  { categoryPattern: "supermercado", percent: 15, label: "Alimentação", icon: "🍽️" },
  { categoryPattern: "restaurante", percent: 15, label: "Alimentação", icon: "🍽️" },
  { categoryPattern: "transporte", percent: 10, label: "Transporte", icon: "🚗" },
  { categoryPattern: "uber", percent: 10, label: "Transporte", icon: "🚗" },
  { categoryPattern: "assinatura", percent: 5, label: "Assinaturas / Lazer", icon: "📺" },
  { categoryPattern: "lazer", percent: 5, label: "Assinaturas / Lazer", icon: "📺" },
  { categoryPattern: "streaming", percent: 5, label: "Assinaturas / Lazer", icon: "📺" },
  { categoryPattern: "saúde", percent: 10, label: "Saúde", icon: "🏥" },
  { categoryPattern: "educação", percent: 10, label: "Educação", icon: "📚" },
  { categoryPattern: "reserva", percent: 10, label: "Reserva de emergência", icon: "🛡️" },
  { categoryPattern: "emergência", percent: 10, label: "Reserva de emergência", icon: "🛡️" },
  { categoryPattern: "investimento", percent: 10, label: "Investimentos", icon: "📈" },
];

// Summary benchmarks for the overview chart (unique groups)
export const BENCHMARK_GROUPS = [
  { label: "Moradia", percent: 30, icon: "🏠" },
  { label: "Alimentação", percent: 15, icon: "🍽️" },
  { label: "Transporte", percent: 10, icon: "🚗" },
  { label: "Assinaturas / Lazer", percent: 5, icon: "📺" },
  { label: "Saúde", percent: 10, icon: "🏥" },
  { label: "Educação", percent: 10, icon: "📚" },
  { label: "Reserva de emergência", percent: 10, icon: "🛡️" },
  { label: "Investimentos", percent: 10, icon: "📈" },
];

/**
 * Find the healthy % for a given category name.
 * Returns undefined if no match found.
 */
export function getHealthyPercent(categoryName: string): number | undefined {
  const lower = categoryName.toLowerCase();
  const match = HEALTHY_BENCHMARKS.find((b) =>
    lower.includes(b.categoryPattern)
  );
  return match?.percent;
}

/**
 * Get the benchmark label for a category name.
 */
export function getHealthyLabel(categoryName: string): string | undefined {
  const lower = categoryName.toLowerCase();
  const match = HEALTHY_BENCHMARKS.find((b) =>
    lower.includes(b.categoryPattern)
  );
  return match?.label;
}
