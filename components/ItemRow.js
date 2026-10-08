import { createPortal } from "react-dom";
import { formatMoney, formatPct, isUrl, urlHref } from "@/lib/format";
import CampoNumero from "@/components/CampoNumero";
import useItemRow, { OUTROS } from "@/lib/useItemRow";

const campo =
  "w-full border border-[#d3dbe6] rounded-[7px] px-2.5 py-2 text-sm font-semibold text-[#1b2a41] focus:outline-none focus:border-azul";

function selecionarTudo(e) {
  e.target.select();
}

function autoAltura(e) {
  e.target.style.height = "auto";
  e.target.style.height = `${e.target.scrollHeight}px`;
}

export default function ItemRow({
  item,
  onChange,
  onRemove,
  onDuplicar,
  onMoverCima,
  onMoverBaixo,
  fornecedores,
  aoCadastrarFornecedor,
}) {
  const {
    r,
    cor,
    comissaoBaixa,
    referencias,
    outrosAtivo,
    set,
    selecionarFornecedor,
    confirmarNovoFornecedor,
    novaRef,
    setNovaRef,
    adicionarReferencia,
    removerReferencia,
    setMargemDesejada,
    setCustoTotalDesejado,
    setPrecoUnitarioDesejado,
    setPrecoTotalDesejado,
    iconRef,
    popoverRef,
    refAberta,
    popoverPos,
    alternarPopoverRef,
    outrosCustosItens,
    adicionarCustoItem,
    removerCustoItem,
    atualizarCustoItem,
    custoIconRef,
    custoPopoverRef,
    custoAberto,
    custoPopoverPos,
    alternarPopoverCusto,
  } = useItemRow({ item, onChange, fornecedores, aoCadastrarFornecedor });
  const incluido = item.incluido !== false;

  return (
    <tr
      className={
        "bg-[#fbfcfe] shadow-[0_1px_2px_rgba(15,32,64,.04)] align-middle text-xs " +
        (incluido ? "" : "opacity-50")
      }
    >
      <td className="text-left px-2 py-1.5 min-w-[220px] rounded-l-lg align-top">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={incluido}
            onChange={(e) => onChange({ ...item, incluido: e.target.checked })}
            title={incluido ? "No orçamento — desmarque pra tirar (o item fica guardado)" : "Fora do orçamento — marque pra incluir de volta"}
            aria-label="Incluir este item no orçamento"
            className="mt-2.5 h-4 w-4 shrink-0 accent-[#1b3a6b] cursor-pointer"
          />
          <textarea
            rows={1}
            value={item.nome}
            placeholder="Descrição"
            onChange={(e) => {
              set("nome", e.target.value);
              autoAltura(e);
            }}
            className={campo + " min-w-[120px] resize-none leading-snug"}
          />
        </div>
      </td>
      <td className="px-1 py-1.5 min-w-[150px] align-top">
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

          <div className="relative shrink-0">
            <button
              ref={iconRef}
              type="button"
              onClick={alternarPopoverRef}
              title="Referências do fornecedor (link, código...)"
              className={
                "w-6 h-6 rounded-md text-[10px] leading-none border " +
                (referencias.length > 0
                  ? "bg-amarelo/15 border-amarelo text-amarelo font-bold"
                  : "border-[#d3dbe6] text-slate-400")
              }
            >
              {referencias.length > 0 ? referencias.length : "✎"}
            </button>

            {refAberta &&
              popoverPos &&
              createPortal(
                <div
                  ref={popoverRef}
                  className="fixed z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-[0_12px_34px_rgba(15,32,64,.25)] p-3 text-left normal-case"
                  style={{ top: popoverPos.top, left: popoverPos.left }}
                >
                  <div className="text-[11px] font-extrabold text-azul uppercase tracking-wide mb-2">
                    Referências do fornecedor
                  </div>
                  {referencias.length === 0 && (
                    <p className="text-[12px] text-slate-400 mb-1">Nenhuma referência ainda.</p>
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
                  <div className="flex gap-1.5 mt-2">
                    <input
                      type="text"
                      autoFocus
                      value={novaRef}
                      onChange={(e) => setNovaRef(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && adicionarReferencia()}
                      placeholder="Nova referência"
                      className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-azul"
                    />
                    <button
                      onClick={adicionarReferencia}
                      className="bg-azul text-white rounded-lg px-2.5 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>,
                document.body
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
      <td className="px-1 py-1.5 align-top min-w-[76px]">
        <input
          type="number"
          step="1"
          value={item.quantidade}
          onFocus={selecionarTudo}
          onChange={(e) => set("quantidade", e.target.value)}
          className={campo + " text-center"}
        />
      </td>
      <td className="px-1 py-1.5 align-top min-w-[100px]">
        <input
          type="number"
          step="0.5"
          value={item.custoUnit}
          onFocus={selecionarTudo}
          onChange={(e) => set("custoUnit", e.target.value)}
          className={campo + " text-center"}
        />
        <CampoNumero
          value={Math.round(r.custoTotal * 100) / 100}
          onChange={setCustoTotalDesejado}
          title="Custo total do item — pode digitar aqui o total do fornecedor que o custo unitário é recalculado"
          className="w-full mt-0.5 border border-[#e3e9f2] rounded-[5px] px-1 py-0.5 text-[11px] text-slate-500 text-center focus:outline-none focus:border-azul focus:text-[#1b2a41]"
        />
      </td>
      <td className="px-1 py-1.5 align-top min-w-[140px]">
        <div className="relative">
          <button
            ref={custoIconRef}
            type="button"
            onClick={alternarPopoverCusto}
            title="Outros custos — uso interno, nunca aparece pro cliente"
            className={
              "w-full flex items-center justify-center gap-1.5 rounded-[7px] border px-2 py-1.5 text-[13px] font-bold " +
              (outrosCustosItens.length > 0
                ? "bg-amarelo/15 border-amarelo text-[#8a5a06]"
                : "border-[#d3dbe6] text-slate-400 hover:border-azul")
            }
          >
            <span className="text-[14px] leading-none">$</span>
            {formatMoney(r.outrosCustos)}
          </button>

          {custoAberto &&
            custoPopoverPos &&
            createPortal(
              <div
                ref={custoPopoverRef}
                className="fixed z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-[0_12px_34px_rgba(15,32,64,.25)] p-3 text-left normal-case"
                style={{ top: custoPopoverPos.top, left: custoPopoverPos.left }}
              >
                <div className="text-[11px] font-extrabold text-azul uppercase tracking-wide mb-2">
                  Outros custos
                </div>
                {outrosCustosItens.length === 0 && (
                  <p className="text-[12px] text-slate-400 mb-2">Nenhum custo adicionado ainda.</p>
                )}
                <div className="flex flex-col gap-1.5 mb-2">
                  {outrosCustosItens.map((custo, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={custo.descricao}
                        onChange={(e) => atualizarCustoItem(i, "descricao", e.target.value)}
                        placeholder="Descrição (ex: frete, saquinho...)"
                        className="flex-1 min-w-0 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-azul"
                      />
                      <CampoNumero
                        value={custo.valor || 0}
                        onChange={(v) => atualizarCustoItem(i, "valor", v)}
                        className="w-20 shrink-0 border border-slate-300 rounded-lg px-1.5 py-1.5 text-xs font-semibold text-center focus:outline-none focus:border-azul"
                      />
                      <button
                        onClick={() => removerCustoItem(i)}
                        className="shrink-0 text-vermelho font-bold px-0.5"
                        aria-label="Remover custo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={adicionarCustoItem}
                  className="w-full text-xs font-bold border border-dashed border-azul text-azul rounded-lg py-1.5 hover:bg-blue-50"
                >
                  + Adicionar outros custos
                </button>
                {outrosCustosItens.length > 0 && (
                  <div className="flex justify-between mt-2 pt-2 border-t border-slate-100 text-xs font-extrabold text-[#1b2a41]">
                    <span>Total</span>
                    <span>{formatMoney(r.outrosCustos)}</span>
                  </div>
                )}
              </div>,
              document.body
            )}
        </div>
      </td>
      <td className="px-1 py-1.5 align-top min-w-[84px]">
        <input
          type="number"
          step="1"
          value={item.comissaoPct}
          onFocus={selecionarTudo}
          onChange={(e) => set("comissaoPct", e.target.value)}
          className={campo + " text-center"}
        />
        <div
          className={
            "text-[11px] mt-0.5 text-center whitespace-nowrap font-bold " +
            (comissaoBaixa ? "text-vermelho" : "text-[#1b2a41]")
          }
        >
          {formatMoney(r.comissaoValor)}
          {comissaoBaixa && " (< 150)"}
        </div>
      </td>
      <td className="px-1 py-1.5 align-top min-w-[84px]">
        <input
          type="number"
          step="1"
          value={item.impostoPct}
          onFocus={selecionarTudo}
          onChange={(e) => set("impostoPct", e.target.value)}
          className={campo + " text-center"}
        />
        <div className="text-[11px] text-slate-400 mt-0.5 text-center whitespace-nowrap">
          {formatMoney(r.impostoValor)}
        </div>
      </td>
      <td className="px-1 py-1.5 align-top min-w-[120px]">
        <CampoNumero
          value={Math.round(r.precoUnitario * 10000) / 10000}
          casasDecimais={4}
          onChange={setPrecoUnitarioDesejado}
          title="Forçar o preço unitário recalcula a comissão % (custo, outros custos e imposto ficam travados)"
          className={campo + " text-center"}
        />
      </td>
      <td className="px-1 py-1.5 align-top min-w-[140px]">
        <CampoNumero
          value={Math.round(r.precoVendaTotal * 100) / 100}
          onChange={setPrecoTotalDesejado}
          title="Forçar o total recalcula a comissão % (custo, outros custos e imposto ficam travados)"
          className={campo + " text-center font-bold text-azul"}
        />
      </td>
      <td className="px-1.5 py-1.5 text-center align-top min-w-[130px]">
        <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: cor.bg, border: `1px solid ${cor.bd}` }}>
          <CampoNumero
            value={Math.round(r.margem * 100) / 100}
            onChange={setMargemDesejada}
            title="Editar a margem direto ajusta a comissão % pra chegar nesse valor"
            className="w-full border-none bg-transparent text-[14px] font-black text-center focus:outline-none"
            style={{ color: cor.fg }}
          />
          <div className="text-[11px] font-extrabold" style={{ color: cor.fg }}>
            {formatPct(r.margemPct)}
          </div>
        </div>
      </td>
      <td className="px-1 py-1.5 text-center whitespace-nowrap align-top rounded-r-lg">
        <button
          onClick={() => onMoverCima?.()}
          disabled={!onMoverCima}
          aria-label="Mover item para cima"
          className="text-slate-400 hover:text-azul disabled:opacity-20 font-bold text-xs leading-none px-0.5"
        >
          ▲
        </button>
        <button
          onClick={() => onMoverBaixo?.()}
          disabled={!onMoverBaixo}
          aria-label="Mover item para baixo"
          className="text-slate-400 hover:text-azul disabled:opacity-20 font-bold text-xs leading-none px-0.5"
        >
          ▼
        </button>
        <button
          onClick={onDuplicar}
          aria-label="Duplicar item"
          title="Duplicar item"
          className="text-slate-400 hover:text-azul font-bold text-xs leading-none px-0.5"
        >
          ⧉
        </button>
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
