export function formatMoney(v) {
  return (v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Preço unitário precisa do valor exato (não arredondado a 2 casas), senão
// unitário × quantidade não bate com o total na nota fiscal quando a
// quantidade é grande (o arredondamento de centavos se multiplica).
export function formatMoneyPreciso(v) {
  return (v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function formatPct(v) {
  return `${(v || 0).toFixed(1).replace(".", ",")}%`;
}

export function isUrl(texto) {
  return /^(https?:\/\/|www\.)/i.test((texto || "").trim());
}

export function urlHref(texto) {
  const t = texto.trim();
  return t.toLowerCase().startsWith("www.") ? `https://${t}` : t;
}
