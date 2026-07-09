import { useState } from "react";
import { computeItem, margemCor, COMISSAO_MINIMA } from "@/lib/calc";
import { formatMoney, formatPct, isUrl, urlHref } from "@/lib/format";

const OUTROS = "__outros__";
const campo =
  "w-full border border-slate-300 rounded px-1 py-1 text-xs font-semibold focus:outline-none focus:border-azul";

function selecionarTudo(e) {
  e.target.select();
}

export default function ItemRow({ item, onChange, onRemove, fornecedores, aoCadastrarFornecedor }) {
  const r = computeItem(item);
  const cor = margemCor(r.margemPct);
  const comissaoBaixa = r.comissaoValor < COMISSAO_MINIMA;
  const referencias = item.referencias || [];

  const [outrosAtivo, setOutrosAtivo] = useState(
    Boolean(item.fornecedor) && !fornecedores.includes(item.fornecedor)
  );
  const [refAberta, setRefAberta] = useState(false);
  const [refPinada, setRefPinada] = useState(false);
  const [novaRef, setNovaRef] = useState("");

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

  function confirmarNovoFornecedor(e) {
    const nome = e.target.value.trim();
    if (nome) aoCadastrarFornecedor(nome);
  }

  function adicionarReferencia() {
    const v = novaRef.trim();
    if (!v) return;
    onChange({ ...item, referencias: [...referencias, v] });
    setNovaRef("");
  }

  function removerReferencia(i) {
    onChange({ ...item, referencias: referencias.filter((_, idx) => idx !== i) });
  }

  function abrirPopover() {
    if (!refPinada) setRefAberta(true);
  }

  function fecharPopover() {
    if (!refPinada) setRefAberta(false);
  }

  function alternarPin() {
    const novoPin = !refPinada;
    setRefPinada(novoPin);
    setRefAberta(novoPin);
  }

  return (
    <tr className="border-b border-slate-200 align-middle text-xs">
      <td className="text-left px-1 py-1 min-w-[140px]">
        <input
          type="text"
          value={item.nome}
          placeholder="Descrição"
          onChange={(e) => set("nome", e.target.value)}
          className={campo + " min-w-[120px]"}
        />
      </td>
      <td className="px-1 py-1 min-w-[110px]">
        <div className="flex items-center gap-1">
          <select
            value={outrosAtivo ? OUTROS : item.fornecedor || ""}
            onChange={(e) => selecionarFornecedor(e.target.value)}
            className={campo + " flex-1"}
          >
            <option value="">Selecionar...</option>
            {fornecedores.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            <option value={OUTROS}>Outros...</option>
          </select>

          <div
            className="relative shrink-0"
            onMouseEnter={abrirPopover}
            onMouseLeave={fecharPopover}
          >
            <button
              type="button"
              onClick={alternarPin}
              title="Referências do fornecedor (link, código...)"
              className={
                "w-5 h-5 rounded text-[10px] leading-none border " +
                (referencias.length > 0
                  ? "bg-amarelo/20 border-amarelo text-amarelo font-bold"
                  : "border-slate-300 text-slate-400")
              }
            >
              {referencias.length > 0 ? referencias.length : "✎"}
            </button>

            {refAberta && (
              <div className="absolute z-20 left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-left normal-case">
                {referencias.length === 0 && (
                  <p className="text-[10px] text-slate-400 mb-1">Nenhuma referência ainda.</p>
                )}
                {referencias.map((ref, i) => (
                  <div key={i} className="flex items-center justify-between gap-1 py-0.5">
                    {isUrl(ref) ? (
                      <a
                        href={urlHref(ref)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-azul underline truncate text-xs"
                      >
                        {ref}
                      </a>
                    ) : (
                      <span className="truncate text-xs">{ref}</span>
                    )}
                    <button
                      onClick={() => removerReferencia(i)}
                      className="text-vermelho font-bold px-1 shrink-0"
                      aria-label="Remover referência"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex gap-1 mt-1.5">
                  <input
                    type="text"
                    value={novaRef}
                    onChange={(e) => setNovaRef(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && adicionarReferencia()}
                    placeholder="Nova referência"
                    className="flex-1 border border-slate-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-azul"
                  />
                  <button
                    onClick={adicionarReferencia}
                    className="bg-azul text-white rounded px-2 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {outrosAtivo && (
          <input
            type="text"
            value={item.fornecedor}
            placeholder="Nome do fornecedor"
            onChange={(e) => set("fornecedor", e.target.value)}
            onBlur={confirmarNovoFornecedor}
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
