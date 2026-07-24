import { margemCores } from "@/lib/calc";
import { formatMoney, formatPct } from "@/lib/format";

export default function MargemBadge({ margem, margemPct, compact = false, titulo = "Margem líquida", descricao }) {
  const cor = margemCores(margemPct);

  if (compact) {
    return (
      <span className="font-bold" style={{ color: cor.solid }}>
        {formatMoney(margem)}
        <span className="block text-xs font-semibold opacity-80">{formatPct(margemPct)}</span>
      </span>
    );
  }

  return (
    <div
      className="rounded-2xl p-[18px] text-center text-white"
      style={{ backgroundColor: cor.solid, boxShadow: `0 6px 18px ${cor.shadow}` }}
    >
      <div className="text-[11px] font-extrabold uppercase tracking-wide opacity-90">
        {titulo} · {cor.label}
      </div>
      <div className="text-[30px] font-black mt-1 leading-none">{formatMoney(margem)}</div>
      <div className="text-sm font-extrabold mt-1.5 opacity-95">{formatPct(margemPct)} do orçamento</div>
      {descricao && <div className="text-[10px] mt-2 opacity-80">{descricao}</div>}
    </div>
  );
}
