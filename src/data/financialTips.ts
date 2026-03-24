export interface FinancialTip {
  id: string;
  category: 'moradia' | 'alimentacao' | 'transporte' | 'cartao' | 'poupanca' | 'investimento' | 'emergencia' | 'geral';
  title: string;
  content: string;
  benchmark?: { label: string; value: string; source: string };
  triggerCondition?: string;
}

export const CATEGORY_META: Record<FinancialTip['category'], { label: string; icon: string }> = {
  moradia: { label: 'Moradia', icon: '🏠' },
  alimentacao: { label: 'Alimentação', icon: '🍽️' },
  transporte: { label: 'Transporte', icon: '🚗' },
  cartao: { label: 'Cartão de Crédito', icon: '💳' },
  poupanca: { label: 'Poupança', icon: '🐷' },
  investimento: { label: 'Investimentos', icon: '📈' },
  emergencia: { label: 'Fundo de Emergência', icon: '🛡️' },
  geral: { label: 'Geral', icon: '💡' },
};

export const financialTips: FinancialTip[] = [
  // MORADIA
  {
    id: 'moradia-30pct',
    category: 'moradia',
    title: 'O ideal é gastar no máximo 30% da renda com moradia',
    content: 'Inclui aluguel, condomínio, IPTU, seguro e contas de luz/água/gás. Se você ganha R$ 5.000, o teto saudável é R$ 1.500/mês com moradia. Acima disso, o orçamento fica apertado para outras necessidades.',
    benchmark: { label: 'Limite saudável', value: '30% da renda líquida', source: 'Regra 50/30/20 — Elizabeth Warren' },
    triggerCondition: 'moradia_acima_30pct',
  },

  // CARTÃO DE CRÉDITO
  {
    id: 'cartao-30pct',
    category: 'cartao',
    title: 'Nunca comprometa mais de 30% da renda com fatura do cartão',
    content: 'O cartão de crédito rotativo cobra em média 400% ao ano no Brasil. Use o cartão como ferramenta de organização, não como extensão de renda. Prefira débito automático para despesas fixas.',
    benchmark: { label: 'Limite recomendado', value: '30% da renda', source: 'Serasa e Banco Central do Brasil' },
    triggerCondition: 'tem_conta_cartao',
  },
  {
    id: 'cartao-total',
    category: 'cartao',
    title: 'Pague sempre o valor total da fatura',
    content: 'Pagar o mínimo é a armadilha mais cara das finanças pessoais. Uma dívida de R$ 1.000 no rotativo pode se tornar R$ 5.000 em 12 meses. Se não consegue pagar o total, negocie um parcelamento com juros menores.',
  },

  // ALIMENTAÇÃO
  {
    id: 'alimentacao-15-20',
    category: 'alimentacao',
    title: 'O ideal é gastar entre 15% e 20% da renda com alimentação',
    content: 'Isso inclui supermercado, feira, delivery e restaurantes. Planejar as refeições da semana e fazer lista de compras pode reduzir o desperdício em até 30%.',
    benchmark: { label: 'Faixa saudável', value: '15-20% da renda', source: 'POF/IBGE 2023' },
    triggerCondition: 'alimentacao_acima_20pct',
  },

  // TRANSPORTE
  {
    id: 'transporte-10pct',
    category: 'transporte',
    title: 'Transporte saudável: até 10% da renda',
    content: 'Inclui combustível, seguro, manutenção, transporte público e apps de mobilidade. Se os gastos com transporte passam de 15%, avalie alternativas como carona, bicicleta ou transporte público.',
    benchmark: { label: 'Limite saudável', value: '10% da renda', source: 'Regra 50/30/20' },
    triggerCondition: 'transporte_acima_10pct',
  },

  // POUPANÇA
  {
    id: 'poupanca-10pct',
    category: 'poupanca',
    title: 'Pague a si mesmo primeiro: poupe no mínimo 10% da renda',
    content: 'Antes de pagar qualquer conta, separe pelo menos 10% da renda para poupança ou investimentos. Automatize essa transferência no dia do pagamento para não "esquecer".',
    benchmark: { label: 'Meta mínima', value: '10-20% da renda', source: 'George S. Clason — O Homem mais Rico da Babilônia' },
    triggerCondition: 'poupanca_abaixo_10pct',
  },
  {
    id: 'regra-50-30-20',
    category: 'poupanca',
    title: 'Regra 50/30/20: a base de uma vida financeira equilibrada',
    content: '50% para necessidades (moradia, alimentação, transporte, saúde), 30% para desejos (lazer, restaurantes, assinaturas), 20% para poupança e investimentos. Criada pela senadora Elizabeth Warren no livro All Your Worth (2005).',
    benchmark: { label: 'Distribuição ideal', value: '50% / 30% / 20%', source: 'Elizabeth Warren — All Your Worth (2005)' },
  },

  // FUNDO DE EMERGÊNCIA
  {
    id: 'emergencia-6meses',
    category: 'emergencia',
    title: 'Tenha reserva para 6 meses de despesas',
    content: 'Antes de investir em renda variável, construa sua reserva de emergência em aplicações de liquidez diária como Tesouro Selic ou CDB com resgate diário. Essa reserva deve cobrir de 3 a 6 meses de despesas fixas.',
    benchmark: { label: 'Reserva ideal', value: '3-6 meses de despesas fixas', source: 'Banco Central do Brasil' },
    triggerCondition: 'sem_fundo_emergencia',
  },

  // INVESTIMENTOS
  {
    id: 'investimento-cedo',
    category: 'investimento',
    title: 'Comece cedo: o tempo é seu maior aliado nos investimentos',
    content: 'R$ 300/mês investidos por 30 anos a 10% ao ano = R$ 678.000. Os mesmos R$ 300/mês por 20 anos = R$ 228.000. 10 anos a mais triplicam o resultado graças aos juros compostos.',
    triggerCondition: 'sem_investimentos',
  },
  {
    id: 'investimento-diversificar',
    category: 'investimento',
    title: 'Diversifique: não coloque todos os ovos na mesma cesta',
    content: 'Uma carteira diversificada reduz o risco sem necessariamente reduzir o retorno. Combine renda fixa, ações, fundos imobiliários e outras classes de acordo com seu perfil.',
    benchmark: { label: 'Mínimo recomendado', value: 'Mínimo 3 classes de ativos', source: 'Teoria Moderna do Portfólio — Markowitz' },
  },

  // GERAL
  {
    id: 'geral-registrar',
    category: 'geral',
    title: 'Registre todos os gastos por 30 dias',
    content: 'A maioria das pessoas subestima seus gastos em 30-40%. Registrar por um mês inteiro revela os "vazamentos" do orçamento — aquele cafezinho diário, assinaturas esquecidas, compras por impulso.',
  },
  {
    id: 'geral-parcelas',
    category: 'geral',
    title: 'Evite parcelar o que não é necessário',
    content: 'Parcelar cria compromissos futuros que limitam sua liberdade financeira. Prefira poupar e comprar à vista — muitas vezes com desconto de 5% a 15%. Parcele apenas itens de alto valor e necessidade real.',
  },
];

/** Returns the tooltip text for a budget category's healthy % badge */
export function getBenchmarkTooltip(categoryName: string): string | null {
  const lower = categoryName.toLowerCase();
  if (lower.includes('morad') || lower.includes('aluguel') || lower.includes('condomínio'))
    return 'Especialistas recomendam no máximo 30% da renda com moradia (Regra 50/30/20)';
  if (lower.includes('alimenta') || lower.includes('mercado') || lower.includes('restaurante'))
    return 'O ideal é entre 15% e 20% da renda com alimentação (IBGE)';
  if (lower.includes('transport') || lower.includes('combustível') || lower.includes('uber'))
    return 'Saudável: até 10% da renda com transporte (Regra 50/30/20)';
  if (lower.includes('cartão') || lower.includes('cartao') || lower.includes('crédito'))
    return 'Nunca comprometa mais de 30% da renda com fatura do cartão (Serasa/BCB)';
  if (lower.includes('saúde') || lower.includes('saude'))
    return 'Reserve até 10% da renda para saúde e plano médico';
  if (lower.includes('educação') || lower.includes('educacao') || lower.includes('curso'))
    return 'Investir em educação: até 10% da renda (Regra 50/30/20)';
  if (lower.includes('lazer') || lower.includes('entretenimento'))
    return 'Lazer saudável: até 5% da renda para manter equilíbrio';
  return null;
}
