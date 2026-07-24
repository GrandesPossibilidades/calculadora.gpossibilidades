import { createPortal } from "react-dom";
import { formatMoney, formatPct, isUrl, urlHref } from "@/lib/format";
import useItemRow, { OUTROS } from "@/lib/useItemRow";
import CampoNumero from "@/components/CampoNumero";

const campo =
  "border-[1.5px] border-slate-300 rounded-[10px] px-3 py-3 text-[15px] font-semibold text-[#1b2a41] focus:outline-none focus:border-azul box-border";
const rotulo = "flex flex-col gap-1.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide";

function autoAltura(e) {
  e.target.style.height = "auto";
  e.target.style.height = `${e.target.scrollHeight}px`;
}

export default function ItemCardMobile({
  item,
  onChange,
  onRemove,
  onDuplicar,
  onMoverCima,
  onMoverBaixo,
  fornecedores,
  aoCadastrarFornecedor,
  expanded,
  onToggleExpand,
  nomeExibido,
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
    setPrecoUnitarioDesejado,
    setPrecoTotalDesejado,
    iconRef,
    refAberta,
    popoverPos,
    abrirPopover,
    fecharPopover,
    alternarPin,
  } = useItemRow({ item, onChange, fornecedores, aoCadastrarFornecedor });

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,32,64,.05)] border border-[#e3e9f2]"
      style={{ borderLeft: `5px solid ${cor.solid}` }}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between gap-2.5 px-3.5 py-3.5 text-left"
      >
        <span className="text-[15px] font-extrabold text-[#1b2a41] truncate">{nomeExibido}</span>
        <span className="flex items-center gap-2.5 shrink-0">
          <span className="text-right leading-tight">
            <span className="block text-[15px] font-black" style={{ color: cor.solid }}>
              {formatMoney(r.margem)}
            </span>
            <span className="block text-[11px] font-extrabold" style={{ color: cor.solid }}>
              {formatPct(r.margemPct)} margem
            </span>
          </span>
          <span
            className="text-xs text-slate-400 transition-transform duration-150"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </span>
        </span>
      </button>

      <div className="grid grid-cols-4 gap-px bg-[#eef2f7] border-t border-[#eef2f7]">
        <div className="bg-[#fbfcfe] py-2 px-1.5 text-center">
          <div className="text-[9.5px] font-bold text-slate-400 uppercase">Custo un.</div>
          <div className="text-[13px] font-extrabold text-[#1b2a41] mt-0.5">{formatMoney(item.custoUnit)}</div>
        </div>
        <div className="bg-[#fbfcfe] py-2 px-1.5 text-center">
          <div className="text-[9.5px] font-bold text-slate-400 uppercase">Total</div>
          <div className="text-[13px] font-extrabold text-azul mt-0.5">{formatMoney(r.precoVendaTotal)}</div>
        </div>
        <div className="bg-[#fbfcfe] py-2 px-1.5 text-center">
          <div className="text-[9.5px] font-bold text-slate-400 uppercase">Com.</div>
          <div
            className={"text-[13px] font-extrabold mt-0.5 " + (comissaoBaixa ? "text-vermelho" : "text-[#1b2a41]")}
          >
            {item.comissaoPct}%
          </div>
        </div>
        <div className="bg-[#fbfcfe] py-2 px-1.5 text-center">
          <div className="text-[9.5px] font-bold text-slate-400 uppercase">Imp.</div>
          <div className="text-[13px] font-extrabold text-[#1b2a41] mt-0.5">{item.impostoPct}%</div>
        </div>
      </div>

      {expanded && (
        <div className="p-3.5 flex flex-col gap-3 border-t border-[#eef2f7] bg-[#f9fbfd]">
          <label className={rotulo}>
            Descrição
            <textarea
              rows={1}
              value={item.nome}
              placeholder="Descrição do item"
              onChange={(e) => {
                set("nome", e.target.value);
                autoAltura(e);
              }}
              className={campo + " resize-none normal-case font-semibold"}
            />
          </label>

          <label className={rotulo}>
            Fornecedor
            <select
              value={outrosAtivo ? OUTROS : item.fornecedor || ""}
              onChange={(e) => selecionarFornecedor(e.target.value)}
              className={campo + " bg-white normal-case font-semibold"}
            >
              <option value="">Selecionar...</option>
              {fornecedores.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              <option value={OUTROS}>Outros...</option>
            </select>
          </label>

          {outrosAtivo && (
            <input
              type="text"
              value={item.fornecedor}
              placeholder="Nome do fornecedor"
              onChange={(e) => set("fornecedor", e.target.value)}
              onBlur={confirmarNovoFornecedor}
              className={campo}
            />
          )}

          <div className="relative self-start">
            <button
              ref={iconRef}
              type="button"
              onClick={alternarPin}
              className={
                "border-[1.5px] rounded-[10px] px-3.5 py-2.5 text-[13px] font-extrabold " +
                (referencias.length > 0
                  ? "bg-amarelo/15 border-amarelo text-[#8a5a06]"
                  : "bg-white border-slate-300 text-slate-400")
              }
            >
              ✎ Referências do fornecedor ({referencias.length})
            </button>

            {refAberta &&
              popoverPos &&
              createPortal(
                <>
                  <div className="fixed inset-0 z-[49]" onClick={fecharPopover} />
                  <div
                    className="fixed z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-[0_12px_34px_rgba(15,32,64,.25)] p-3 text-left normal-case"
                    style={{
                      top: popoverPos.top,
                      left: Math.max(8, Math.min(popoverPos.left, window.innerWidth - 268)),
                    }}
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
                  </div>
                </>,
                document.body
              )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <label className={rotulo}>
              Quantidade
              <input
                type="number"
                inputMode="numeric"
                value={item.quantidade}
                onFocus={(e) => e.target.select()}
                onChange={(e) => set("quantidade", e.target.value)}
                className={campo + " text-center"}
              />
            </label>
            <label className={rotulo}>
              Custo unit. (R$)
              <input
                type="number"
                inputMode="decimal"
                value={item.custoUnit}
                onFocus={(e) => e.target.select()}
                onChange={(e) => set("custoUnit", e.target.value)}
                className={campo + " text-center"}
              />
            </label>
            <label className={rotulo}>
              Frete (R$)
              <input
                type="number"
                inputMode="decimal"
                value={item.frete}
                onFocus={(e) => e.target.select()}
                onChange={(e) => set("frete", e.target.value)}
                className={campo + " text-center"}
              />
            </label>
            <label className={rotulo}>
              Outros custos (R$)
              <input
                type="number"
                inputMode="decimal"
                value={item.outrosCustos}
                onFocus={(e) => e.target.select()}
                onChange={(e) => set("outrosCustos", e.target.value)}
                className={campo + " text-center"}
              />
            </label>
            <label className={rotulo}>
              Comissão %
              <input
                type="number"
                inputMode="decimal"
                value={item.comissaoPct}
                onFocus={(e) => e.target.select()}
                onChange={(e) => set("comissaoPct", e.target.value)}
                className={campo + " text-center"}
              />
            </label>
            <label className={rotulo}>
              Imposto %
              <input
                type="number"
                inputMode="decimal"
                value={item.impostoPct}
                onFocus={(e) => e.target.select()}
                onChange={(e) => set("impostoPct", e.target.value)}
                className={campo + " text-center"}
              />
            </label>
          </div>

          {comissaoBaixa && (
            <p className="text-xs font-bold text-vermelho -mt-1">Comissão abaixo de R$ 150 — pode não valer o trabalho.</p>
          )}

          <label className={rotulo}>
            Notas internas — nunca aparece pro cliente
            <textarea
              value={item.notasInternas || ""}
              onChange={(e) => set("notasInternas", e.target.value)}
              rows={2}
              placeholder="Ex: placa de peça R$120, bancagem R$80..."
              className={campo + " resize-none normal-case font-medium text-[14px]"}
            />
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1.5 text-[11px] font-extrabold text-azul uppercase tracking-wide">
              Preço unit. (forçar)
              <CampoNumero
                value={Math.round(r.precoUnitario * 10000) / 10000}
                casasDecimais={4}
                onChange={setPrecoUnitarioDesejado}
                className="border-[1.5px] border-[#b9c6da] rounded-[10px] px-3 py-3 text-[15px] font-extrabold text-azul text-center focus:outline-none focus:border-azul box-border"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] font-extrabold text-azul uppercase tracking-wide">
              Total (forçar)
              <CampoNumero
                value={Math.round(r.precoVendaTotal * 100) / 100}
                onChange={setPrecoTotalDesejado}
                className="border-[1.5px] border-[#b9c6da] rounded-[10px] px-3 py-3 text-[15px] font-extrabold text-azul text-center focus:outline-none focus:border-azul box-border"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onMoverCima?.()}
              disabled={!onMoverCima}
              className="shrink-0 w-12 py-3 border-[1.5px] border-slate-300 bg-white rounded-[10px] text-[15px] font-extrabold text-slate-600 disabled:opacity-30"
            >
              ▲
            </button>
            <button
              onClick={() => onMoverBaixo?.()}
              disabled={!onMoverBaixo}
              className="shrink-0 w-12 py-3 border-[1.5px] border-slate-300 bg-white rounded-[10px] text-[15px] font-extrabold text-slate-600 disabled:opacity-30"
            >
              ▼
            </button>
            <button
              onClick={onDuplicar}
              className="flex-1 py-3 border-[1.5px] border-slate-300 bg-white rounded-[10px] text-[13px] font-extrabold text-slate-600"
            >
              ⧉ Duplicar
            </button>
            <button
              onClick={onRemove}
              className="flex-1 py-3 border-[1.5px] border-[#f0c4bd] bg-white rounded-[10px] text-[13px] font-extrabold text-vermelho"
            >
              Remover
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
