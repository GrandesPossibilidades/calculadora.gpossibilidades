// Cascata de precificação da GP: custo -> frete -> comissão -> imposto -> preço de venda.
// A comissão é remuneração da GP (não sai do bolso), por isso NÃO é subtraída na margem.
export function computeItem({ custoUnit, quantidade, frete, outrosCustos, comissaoPct, impostoPct }) {
  const custoTotal = (custoUnit || 0) * (quantidade || 0);
  const base = custoTotal + (frete || 0) + (outrosCustos || 0);
  const comissaoValor = base * ((comissaoPct || 0) / 100);
  const aposComissao = base + comissaoValor;
  const impostoValor = aposComissao * ((impostoPct || 0) / 100);
  const precoVendaTotal = aposComissao + impostoValor;
  const precoUnitario = quantidade ? precoVendaTotal / quantidade : 0;
  const margem = precoVendaTotal - custoTotal - (frete || 0) - (outrosCustos || 0) - impostoValor;
  const margemPct = precoVendaTotal ? (margem / precoVendaTotal) * 100 : 0;

  return {
    custoTotal,
    comissaoValor,
    impostoValor,
    precoVendaTotal,
    precoUnitario,
    margem,
    margemPct,
  };
}

export function computeTotals(itens) {
  const totals = itens.reduce(
    (acc, item) => {
      const r = computeItem(item);
      acc.custoTotal += r.custoTotal;
      acc.freteTotal += item.frete || 0;
      acc.outrosCustosTotal += item.outrosCustos || 0;
      acc.impostoTotal += r.impostoValor;
      acc.precoTotal += r.precoVendaTotal;
      acc.margemTotal += r.margem;
      return acc;
    },
    { custoTotal: 0, freteTotal: 0, outrosCustosTotal: 0, impostoTotal: 0, precoTotal: 0, margemTotal: 0 }
  );

  const margemPct = totals.precoTotal ? (totals.margemTotal / totals.precoTotal) * 100 : 0;

  return { ...totals, margemPct };
}

export const COMISSAO_MINIMA = 150;

// Faixas de margem: cor sólida (texto/ícones em fundo escuro), bg/fg/bd (chips
// em fundo claro) e shadow (sombra colorida do bloco grande de margem).
export function margemCores(pct) {
  if (pct >= 25) {
    return { solid: "#12704A", bg: "#E6F4EC", fg: "#0F5C3A", bd: "#B7E0C7", shadow: "rgba(18,112,74,.28)", label: "Boa margem" };
  }
  if (pct >= 15) {
    return { solid: "#B3760A", bg: "#FBF1DB", fg: "#8A5A06", bd: "#EED9A5", shadow: "rgba(179,118,10,.28)", label: "Atenção" };
  }
  return { solid: "#B3352A", bg: "#FBE7E4", fg: "#8F281F", bd: "#F0C4BD", shadow: "rgba(179,53,42,.28)", label: "Margem baixa" };
}

export function margemCor(pct) {
  return margemCores(pct).solid;
}
