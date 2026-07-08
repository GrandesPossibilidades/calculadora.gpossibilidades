import { useState } from "react";
import { computeItem, margemCor, COMISSAO_MINIMA } from "@/lib/calc";
import { formatMoney, formatPct } from "@/lib/format";
import { FORNECEDORES } from "@/lib/fornecedores";

const OUTROS = "__outros__";

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

  function set(field, value) {
    const isTexto = field === "nome" || field === "fornecedor";
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

  const campoClasse =
    "w-full border border-slate-300 rounded-md px-2 py-2 text-center font-semibold text-base focus:outline-none focus:border-azul";

  return (
    <div className="border border-slate-200 rounded-xl p-3 flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <input
          type="text"
          value={item.nome}
          placeholder="Descrição do item"
          onChange={(e) => set("nome", e.target.value)}
          className="flex-1 border border-slate-300 rounded-md px-2 py-2 font-semibold text-base focus:outline-none focus:border-azul"
        />
        <button
          onClick={onRemove}
          aria-label="Remover item"
          className="text-vermelho font-bold text-xl leading-none px-2 py-1.5"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label className="col-span-2 sm:col-span-1 flex flex-col gap-1 text-[11px] font-semibold text-slate-500 uppercase">
          Fornecedor
          <select
            value={outrosAtivo ? OUTROS : item.fornecedor || ""}
            onChange={(e) => selecionarFornecedor(e.target.value)}
            className={campoClasse + " text-left"}
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
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm font-semibold focus:outline-none focus:border-azul"
            />
          )}
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500 uppercase">
          Qtd
          <input
            type="number"
            step="1"
            value={item.quantidade}
            onFocus={selecionarTudo}
            onChange={(e) => set("quantidade", e.target.value)}
            className={campoClasse}
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500 uppercase">
          Custo unit. compra
          <input
            type="number"
            step="0.5"
            value={item.custoUnit}
            onFocus={selecionarTudo}
            onChange={(e) => set("custoUnit", e.target.value)}
            className={campoClasse}
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500 uppercase">
          Frete
          <input
            type="number"
            step="10"
            value={item.frete}
            onFocus={selecionarTudo}
            onChange={(e) => set("frete", e.target.value)}
            className={campoClasse}
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500 uppercase">
          Comissão %
          <input
            type="number"
            step="1"
            value={item.comissaoPct}
            onFocus={selecionarTudo}
            onChange={(e) => set("comissaoPct", e.target.value)}
            className={campoClasse}
          />
          {comissaoBaixa && (
            <span className="text-[10px] font-semibold text-vermelho normal-case">
              abaixo de {formatMoney(COMISSAO_MINIMA)}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500 uppercase">
          Imposto %
          <input
            type="number"
            step="1"
            value={item.impostoPct}
            onFocus={selecionarTudo}
            onChange={(e) => set("impostoPct", e.target.value)}
            className={campoClasse}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2 border-t border-slate-100 text-sm">
        <span>
          Preço unit.: <b>{formatMoney(r.precoUnitario)}</b>
        </span>
        <span>
          Total: <b>{formatMoney(r.precoVendaTotal)}</b>
        </span>
        <span style={{ color: cor }}>
          Margem: <b>{formatMoney(r.margem)}</b> ({formatPct(r.margemPct)})
        </span>
      </div>
    </div>
  );
}
