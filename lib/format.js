export function formatMoney(v) {
  return (v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

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
