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

export function margemCor(pct) {
  if (pct >= 25) return "#1D6A3A";
  if (pct >= 15) return "#C4820E";
  return "#9B2C22";
}
