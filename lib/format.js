export function formatMoney(v) {
  return (v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatPct(v) {
  return `${(v || 0).toFixed(1).replace(".", ",")}%`;
}
