import { useState } from "react";
import { computeItem, margemCor, COMISSAO_MINIMA } from "@/lib/calc";
import { formatMoney, formatPct } from "@/lib/format";
import { FORNECEDORES } from "@/lib/fornecedores";

const OUTROS = "__outros__";
const campo =
  "w-full border border-slate-300 rounded px-1 py-1 text-xs font-semibold focus:outline-none focus:border-azul";

function selecionarTudo(e) {
  e.target.select();
}

export default function ItemRow({ item, onChange, onRemove }) {
  const r = computeItem(item);
  const cor = margemCor(r.margemPct);
  const comissaoBaixa = r.comissaoValor < COMISSAO_MINIMA;

  const [outrosAtivo, setOutrosAtivo] = useState(
    Boolean(item.fornecedor) && !FORNECEDORES.includes(item.fornecedor)
  );
  const [refAberta, setRefAberta] = useState(false);

  function set(field, value) {
    const isTexto = field === "nome" || field === "fornecedor" || field === "referencia";
    onChange({ ...item, [field]: isTexto ? value : parseFloat(value) || 0 });
  }

  function selecionarFornecedor(valor) {
    if (valor === OUTROS) {
      setOutrosAtivo(true);
      set("fornecedor", "");
    } else {
      setOutrosAtivo(false);
      set("fornecedor", valor);
    }
  }

  const temReferencia = Boolean(item.referencia);

  return (
    <tr className="border-b border-slate-200 align-middle text-xs">
      <td className="text-left px-1 py-1 min-w-[140px]">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={item.nome}
            placeholder="Descrição"
            onChange={(e) => set("nome", e.target.value)}
            className={campo + " flex-1 min-w-[100px]"}
          />
          <button
            type="button"
            onClick={() => setRefAberta((v) => !v)}
            title={item.referencia || "Adicionar referência (link, código...)"}
            className={
              "shrink-0 w-5 h-5 rounded text-[10px] leading-none border " +
              (temReferencia
                ? "bg-amarelo/20 border-amarelo text-amarelo font-bold"
                : "border-slate-300 text-slate-400")
            }
          >
            ✎
          </button>
        </div>
        {refAberta && (
          <input
            type="text"
            value={item.referencia || ""}
            placeholder="Referência: link, código..."
            onChange={(e) => set("referencia", e.target.value)}
            className={campo + " mt-1"}
          />
        )}
      </td>
      <td className="px-1 py-1 min-w-[110px]">
        <select
          value={outrosAtivo ? OUTROS : item.fornecedor || ""}
          onChange={(e) => selecionarFornecedor(e.target.value)}
          className={campo}
        >
          <option value="">Selecionar...</option>
          {FORNECEDORES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
          <option value={OUTROS}>Outros...</option>
        </select>
        {outrosAtivo && (
          <input
            type="text"
            value={item.fornecedor}
            placeholder="Nome do fornecedor"
            onChange={(e) => set("fornecedor", e.target.value)}
            className={campo + " mt-1"}
          />
        )}
      </td>
      <td className="px-1 py-1">
        <input
          type="number"
          step="1"
          value={item.quantidade}
          onFocus={selecionarTudo}
          onChange={(e) => set("quantidade", e.target.value)}
          className={campo + " w-12 text-center"}
        />
      </td>
      <td className="px-1 py-1">
        <input
          type="number"
          step="0.5"
          value={item.custoUnit}
          onFocus={selecionarTudo}
          onChange={(e) => set("custoUnit", e.target.value)}
          className={campo + " w-16 text-center"}
        />
      </td>
      <td className="px-1 py-1">
        <input
          type="number"
          step="10"
          value={item.frete}
          onFocus={selecionarTudo}
          onChange={(e) => set("frete", e.target.value)}
          className={campo + " w-16 text-center"}
        />
      </td>
      <td className="px-1 py-1">
        <input
          type="number"
          step="1"
          value={item.comissaoPct}
          onFocus={selecionarTudo}
          onChange={(e) => set("comissaoPct", e.target.value)}
          className={campo + " w-12 text-center"}
        />
        {comissaoBaixa && (
          <div className="text-[9px] font-semibold text-vermelho mt-0.5 whitespace-nowrap">
            &lt; {formatMoney(COMISSAO_MINIMA)}
          </div>
        )}
      </td>
      <td className="px-1 py-1">
        <input
          type="number"
          step="1"
          value={item.impostoPct}
          onFocus={selecionarTudo}
          onChange={(e) => set("impostoPct", e.target.value)}
          className={campo + " w-12 text-center"}
        />
      </td>
      <td className="px-1.5 py-1 text-center font-bold whitespace-nowrap">{formatMoney(r.precoUnitario)}</td>
      <td className="px-1.5 py-1 text-center font-bold whitespace-nowrap">{formatMoney(r.precoVendaTotal)}</td>
      <td className="px-1.5 py-1 text-center font-extrabold whitespace-nowrap" style={{ color: cor }}>
        {formatMoney(r.margem)}
        <div className="text-[9px] font-semibold opacity-80">{formatPct(r.margemPct)}</div>
      </td>
      <td className="px-1 py-1 text-center">
        <button
          onClick={onRemove}
          aria-label="Remover item"
          className="text-vermelho font-bold text-base leading-none px-1"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
