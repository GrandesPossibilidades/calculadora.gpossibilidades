import { computeItem, margemCor, COMISSAO_MINIMA } from "@/lib/calc";
import { formatMoney, formatPct } from "@/lib/format";

export default function ItemRow({ item, onChange, onRemove }) {
  const r = computeItem(item);
  const cor = margemCor(r.margemPct);
  const comissaoBaixa = r.comissaoValor < COMISSAO_MINIMA;

  function set(field, value) {
    onChange({ ...item, [field]: field === "nome" ? value : parseFloat(value) || 0 });
  }

  return (
    <tr className="border-b border-slate-200 align-middle">
      <td className="text-left px-2 py-1.5 min-w-[160px]">
        <input
          type="text"
          value={item.nome}
          placeholder="Descrição"
          onChange={(e) => set("nome", e.target.value)}
          className="w-full min-w-[140px] border border-slate-300 rounded-md px-2 py-1.5 font-semibold focus:outline-none focus:border-azul"
        />
      </td>
      <td className="px-1.5 py-1.5">
        <input
          type="number"
          step="0.5"
          value={item.custoUnit}
          onChange={(e) => set("custoUnit", e.target.value)}
          className="w-20 text-center border border-slate-300 rounded-md px-1.5 py-1.5 font-semibold focus:outline-none focus:border-azul"
        />
      </td>
      <td className="px-1.5 py-1.5">
        <input
          type="number"
          step="1"
          value={item.quantidade}
          onChange={(e) => set("quantidade", e.target.value)}
          className="w-16 text-center border border-slate-300 rounded-md px-1.5 py-1.5 font-semibold focus:outline-none focus:border-azul"
        />
      </td>
      <td className="px-1.5 py-1.5">
        <input
          type="number"
          step="10"
          value={item.frete}
          onChange={(e) => set("frete", e.target.value)}
          className="w-20 text-center border border-slate-300 rounded-md px-1.5 py-1.5 font-semibold focus:outline-none focus:border-azul"
        />
      </td>
      <td className="px-1.5 py-1.5">
        <input
          type="number"
          step="1"
          value={item.comissaoPct}
          onChange={(e) => set("comissaoPct", e.target.value)}
          className="w-16 text-center border border-slate-300 rounded-md px-1.5 py-1.5 font-semibold focus:outline-none focus:border-azul"
        />
        {comissaoBaixa && (
          <div className="text-[10px] font-semibold text-vermelho mt-0.5 whitespace-nowrap">
            &lt; {formatMoney(COMISSAO_MINIMA)}
          </div>
        )}
      </td>
      <td className="px-1.5 py-1.5">
        <input
          type="number"
          step="1"
          value={item.impostoPct}
          onChange={(e) => set("impostoPct", e.target.value)}
          className="w-16 text-center border border-slate-300 rounded-md px-1.5 py-1.5 font-semibold focus:outline-none focus:border-azul"
        />
      </td>
      <td className="px-2 py-1.5 text-center font-bold whitespace-nowrap">{formatMoney(r.precoUnitario)}</td>
      <td className="px-2 py-1.5 text-center font-bold whitespace-nowrap">{formatMoney(r.precoVendaTotal)}</td>
      <td className="px-2 py-1.5 text-center font-extrabold whitespace-nowrap" style={{ color: cor }}>
        {formatMoney(r.margem)}
        <div className="text-[11px] font-semibold opacity-80">{formatPct(r.margemPct)}</div>
      </td>
      <td className="px-2 py-1.5 text-center">
        <button
          onClick={onRemove}
          aria-label="Remover item"
          className="text-vermelho font-bold text-lg leading-none px-1"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
