import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { computeItem, margemCor, COMISSAO_MINIMA } from "@/lib/calc";
import { formatMoney, formatPct, isUrl, urlHref } from "@/lib/format";
import CampoNumero from "@/components/CampoNumero";

const OUTROS = "__outros__";
const campo =
  "w-full border border-slate-300 rounded px-1 py-1 text-xs font-semibold focus:outline-none focus:border-azul";

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
  const r = computeItem(item);
  const cor = margemCor(r.margemPct);
  const comissaoBaixa = r.comissaoValor < COMISSAO_MINIMA;
  const referencias = item.referencias || [];
  const iconRef = useRef(null);

  const [outrosAtivo, setOutrosAtivo] = useState(
    Boolean(item.fornecedor) && !fornecedores.includes(item.fornecedor)
  );
  const [refAberta, setRefAberta] = useState(false);
  const [refPinada, setRefPinada] = useState(false);
  const [popoverPos, setPopoverPos] = useState(null);
  const [novaRef, setNovaRef] = useState("");

  const custoIconRef = useRef(null);
  const [custoAberto, setCustoAberto] = useState(false);
  const [custoPinado, setCustoPinado] = useState(false);
  const [custoPopoverPos, setCustoPopoverPos] = useState(null);

  function set(field, value) {
    const isTexto = field === "nome" || field === "fornecedor" || field === "notasInternas";
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
    setRefAberta(false);
    setRefPinada(false);
  }

  function removerReferencia(i) {
    onChange({ ...item, referencias: referencias.filter((_, idx) => idx !== i) });
  }

  // Margem líquida do item == valor da comissão (é assim que a cascata é definida:
  // tudo que sobra depois de custo/frete/imposto é exatamente a comissão da GP).
  // Editar a margem direto resolve a comissão % necessária pra chegar nesse valor,
  // sem mexer em custo, frete ou imposto.
  function setMargemDesejada(valor) {
    const novaMargem = parseFloat(valor) || 0;
    const base = (item.custoUnit || 0) * (item.quantidade || 0) + (item.frete || 0) + (item.outrosCustos || 0);
    const novaComissaoPct = base > 0 ? Math.round((novaMargem / base) * 100 * 10000) / 10000 : 0;
    onChange({ ...item, comissaoPct: novaComissaoPct });
  }

  // Forçar o preço unitário ou o total de venda: custo, frete e % de imposto
  // ficam travados como estão, e a comissão % é recalculada pra fechar
  // exatamente no preço forçado (imposto em % nunca muda, só o R$ dele, já
  // que a base onde ele incide muda).
  function resolverComissaoPorPrecoTotal(precoVendaTotalDesejado) {
    const base = (item.custoUnit || 0) * (item.quantidade || 0) + (item.frete || 0) + (item.outrosCustos || 0);
    if (base <= 0) return 0;
    const aposComissao = precoVendaTotalDesejado / (1 + (item.impostoPct || 0) / 100);
    return Math.round((aposComissao / base - 1) * 100 * 10000) / 10000;
  }

  function setPrecoUnitarioDesejado(valor) {
    const novoUnitario = parseFloat(valor) || 0;
    const novoTotal = novoUnitario * (item.quantidade || 0);
    onChange({ ...item, comissaoPct: resolverComissaoPorPrecoTotal(novoTotal) });
  }

  function setPrecoTotalDesejado(valor) {
    const novoTotal = parseFloat(valor) || 0;
    onChange({ ...item, comissaoPct: resolverComissaoPorPrecoTotal(novoTotal) });
  }

  function atualizarPosicaoPopover() {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 4, left: rect.left });
    }
  }

  function abrirPopover() {
    if (!refPinada) {
      atualizarPosicaoPopover();
      setRefAberta(true);
    }
  }

  function fecharPopover() {
    if (!refPinada) setRefAberta(false);
  }

  function alternarPin() {
    const novoPin = !refPinada;
    if (novoPin) atualizarPosicaoPopover();
    setRefPinada(novoPin);
    setRefAberta(novoPin);
  }

  function atualizarPosicaoCustoPopover() {
    if (custoIconRef.current) {
      const rect = custoIconRef.current.getBoundingClientRect();
      setCustoPopoverPos({ top: rect.bottom + 4, left: rect.left });
    }
  }

  function abrirCustoPopover() {
    if (!custoPinado) {
      atualizarPosicaoCustoPopover();
      setCustoAberto(true);
    }
  }

  function fecharCustoPopover() {
    if (!custoPinado) setCustoAberto(false);
  }

  function alternarCustoPin() {
    const novoPin = !custoPinado;
    if (novoPin) atualizarPosicaoCustoPopover();
    setCustoPinado(novoPin);
    setCustoAberto(novoPin);
  }

  return (
    <tr className="border-b border-slate-200 align-middle text-xs">
      <td className="text-left px-1 py-1 min-w-[140px] align-top">
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
      </td>
      <td className="px-1 py-1 min-w-[64px] align-top">
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

          <div className="relative shrink-0" onMouseEnter={abrirPopover} onMouseLeave={fecharPopover}>
            <button
              ref={iconRef}
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

            {refAberta &&
              popoverPos &&
              createPortal(
                <div
                  className="fixed z-50 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-left normal-case"
                  style={{ top: popoverPos.top, left: popoverPos.left }}
                  onMouseEnter={() => setRefAberta(true)}
                  onMouseLeave={fecharPopover}
                >
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
                      autoFocus
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
      <td className="px-1 py-1 align-top min-w-[58px]">
        <input
          type="number"
          step="1"
          value={item.quantidade}
          onFocus={selecionarTudo}
          onChange={(e) => set("quantidade", e.target.value)}
          className={campo + " text-center"}
        />
      </td>
      <td className="px-1 py-1 align-top min-w-[52px]">
        <input
          type="number"
          step="0.5"
          value={item.custoUnit}
          onFocus={selecionarTudo}
          onChange={(e) => set("custoUnit", e.target.value)}
          className={campo + " text-center"}
        />
        <div className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap">
          {formatMoney(r.custoTotal)}
        </div>
      </td>
      <td className="px-1 py-1 align-top min-w-[68px]">
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="10"
            value={item.frete}
            onFocus={selecionarTudo}
            onChange={(e) => set("frete", e.target.value)}
            className={campo + " text-center"}
          />
          <div className="relative shrink-0" onMouseEnter={abrirCustoPopover} onMouseLeave={fecharCustoPopover}>
            <button
              ref={custoIconRef}
              type="button"
              onClick={alternarCustoPin}
              title="Outros custos e notas internas (uso interno, nunca aparece pro cliente)"
              className={
                "w-5 h-5 rounded text-[10px] leading-none border " +
                (item.outrosCustos > 0 || item.notasInternas
                  ? "bg-amarelo/20 border-amarelo text-amarelo font-bold"
                  : "border-slate-300 text-slate-400")
              }
            >
              $
            </button>

            {custoAberto &&
              custoPopoverPos &&
              createPortal(
                <div
                  className="fixed z-50 w-60 bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-left normal-case"
                  style={{ top: custoPopoverPos.top, left: custoPopoverPos.left }}
                  onMouseEnter={() => setCustoAberto(true)}
                  onMouseLeave={fecharCustoPopover}
                >
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    Outros custos (R$)
                  </label>
                  <CampoNumero
                    value={item.outrosCustos || 0}
                    onChange={(v) => set("outrosCustos", v)}
                    className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-semibold focus:outline-none focus:border-azul mb-2"
                  />
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                    Notas internas — nunca aparece pro cliente
                  </label>
                  <textarea
                    value={item.notasInternas || ""}
                    onChange={(e) => set("notasInternas", e.target.value)}
                    rows={3}
                    placeholder="Ex: placa de peça R$120, bancagem R$80..."
                    className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-azul resize-none"
                  />
                </div>,
                document.body
              )}
          </div>
        </div>
        {item.outrosCustos > 0 && (
          <div className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap">
            +{formatMoney(item.outrosCustos)}
          </div>
        )}
      </td>
      <td className="px-1 py-1 align-top min-w-[56px]">
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
            "text-[9px] mt-0.5 whitespace-nowrap font-semibold " +
            (comissaoBaixa ? "text-vermelho" : "text-slate-500")
          }
        >
          {formatMoney(r.comissaoValor)}
          {comissaoBaixa && " (< 150)"}
        </div>
      </td>
      <td className="px-1 py-1 align-top min-w-[56px]">
        <input
          type="number"
          step="1"
          value={item.impostoPct}
          onFocus={selecionarTudo}
          onChange={(e) => set("impostoPct", e.target.value)}
          className={campo + " text-center"}
        />
        <div className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap">
          {formatMoney(r.impostoValor)}
        </div>
      </td>
      <td className="px-1 py-1 align-top min-w-[84px]">
        <CampoNumero
          value={Math.round(r.precoUnitario * 10000) / 10000}
          casasDecimais={4}
          onChange={setPrecoUnitarioDesejado}
          title="Forçar o preço unitário recalcula a comissão % (custo, frete e imposto ficam travados)"
          className={campo + " text-center"}
        />
      </td>
      <td className="px-1 py-1 align-top min-w-[104px]">
        <CampoNumero
          value={Math.round(r.precoVendaTotal * 100) / 100}
          onChange={setPrecoTotalDesejado}
          title="Forçar o total recalcula a comissão % (custo, frete e imposto ficam travados)"
          className={campo + " text-center"}
        />
      </td>
      <td className="px-1 py-1 text-center align-top min-w-[80px]" style={{ color: cor }}>
        <CampoNumero
          value={Math.round(r.margem * 100) / 100}
          onChange={setMargemDesejada}
          title="Editar a margem direto ajusta a comissão % pra chegar nesse valor"
          className={campo + " text-center font-extrabold"}
          style={{ color: cor }}
        />
        <div className="text-[9px] font-semibold opacity-80" style={{ color: cor }}>
          {formatPct(r.margemPct)}
        </div>
      </td>
      <td className="px-1 py-1 text-center whitespace-nowrap align-top">
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
