import { margemCor } from "@/lib/calc";
import { formatMoney, formatPct } from "@/lib/format";

export default function MargemBadge({ margem, margemPct, compact = false }) {
  const cor = margemCor(margemPct);

  if (compact) {
    return (
      <span className="font-bold" style={{ color: cor }}>
        {formatMoney(margem)}
        <span className="block text-xs font-semibold opacity-80">{formatPct(margemPct)}</span>
      </span>
    );
  }

  return (
    <div className="rounded-xl p-4 text-center text-white" style={{ backgroundColor: cor }}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Margem líquida</div>
      <div className="text-2xl font-extrabold mt-0.5">{formatMoney(margem)}</div>
      <div className="text-sm font-semibold mt-0.5">{formatPct(margemPct)} do orçamento</div>
    </div>
  );
}
