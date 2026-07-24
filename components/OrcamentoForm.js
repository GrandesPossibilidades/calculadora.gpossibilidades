"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { computeItem, computeTotals, COMISSAO_MINIMA } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import { EMPRESAS, EMPRESA_PADRAO } from "@/lib/empresas";
import { FORNECEDORES_PADRAO } from "@/lib/fornecedores";
import { createClient } from "@/lib/supabase/client";
import ItemRow from "@/components/ItemRow";
import ItemCardMobile from "@/components/ItemCardMobile";
import MargemBadge from "@/components/MargemBadge";

let uid = 1;
const novoItem = (comissaoPct, impostoPct) => ({
  id: uid++,
  nome: "",
  fornecedor: "",
  referencias: [],
  custoUnit: 0,
  quantidade: 1,
  frete: 0,
  outrosCustos: 0,
  notasInternas: "",
  comissaoPct,
  impostoPct,
});

export default function OrcamentoForm({ inicial }) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = Boolean(inicial?.id);

  const [numero, setNumero] = useState(inicial?.numero ?? "");
  const [cliente, setCliente] = useState(inicial?.cliente ?? "");
  const [observacao, setObservacao] = useState(inicial?.observacao ?? "");
  const [prazoEntrega, setPrazoEntrega] = useState(inicial?.prazoEntrega ?? "");
  const [condicoesPagamento, setCondicoesPagamento] = useState(inicial?.condicoesPagamento ?? "");
  const [aprovado, setAprovado] = useState(inicial?.aprovado ?? false);
  const [alternandoAprovado, setAlternandoAprovado] = useState(false);
  const [enviado, setEnviado] = useState(inicial?.enviado ?? false);
  const [alternandoEnviado, setAlternandoEnviado] = useState(false);
  const [emailUsuario, setEmailUsuario] = useState(null);
  const souGabriel = emailUsuario === "gp@gpossibilidades.com.br";
  const [empresa, setEmpresa] = useState(inicial?.empresa ?? EMPRESA_PADRAO);
  const [defComissao, setDefComissao] = useState(20);
  const [defImposto, setDefImposto] = useState(15);
  const [itens, setItens] = useState(() =>
    inicial?.itens?.length
      ? inicial.itens.map((it) => ({ ...it, id: uid++ }))
      : [novoItem(20, 15), novoItem(20, 15)]
  );

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [salvo, setSalvo] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(null);
  const [fornecedores, setFornecedores] = useState(FORNECEDORES_PADRAO);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    supabase
      .from("fornecedores")
      .select("nome")
      .order("criado_em", { ascending: true })
      .then(({ data }) => {
        if (data?.length) setFornecedores(data.map((f) => f.nome));
      });
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmailUsuario(data.user?.email || null));
  }, [supabase]);

  async function aoCadastrarFornecedor(nome) {
    setFornecedores((prev) => {
      if (prev.some((f) => f.toLowerCase() === nome.toLowerCase())) return prev;
      return [...prev, nome];
    });
    await supabase.from("fornecedores").upsert({ nome }, { onConflict: "nome", ignoreDuplicates: true });
  }

  const totals = useMemo(() => computeTotals(itens), [itens]);
  const itensComissaoBaixa = useMemo(
    () => itens.filter((it) => computeItem(it).comissaoValor < COMISSAO_MINIMA && it.nome),
    [itens]
  );

  function addItem() {
    const novo = novoItem(defComissao, defImposto);
    setItens((prev) => [...prev, novo]);
    setExpandedId(novo.id);
  }

  function aplicarPadraoATodos() {
    setItens((prev) => prev.map((it) => ({ ...it, comissaoPct: defComissao, impostoPct: defImposto })));
  }

  function updateItem(id, novo) {
    setItens((prev) => prev.map((it) => (it.id === id ? novo : it)));
  }

  function removeItem(id) {
    setItens((prev) => prev.filter((it) => it.id !== id));
  }

  function moverItem(id, direcao) {
    setItens((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      const novoIdx = idx + direcao;
      if (novoIdx < 0 || novoIdx >= prev.length) return prev;
      const copia = [...prev];
      [copia[idx], copia[novoIdx]] = [copia[novoIdx], copia[idx]];
      return copia;
    });
  }

  function duplicarItem(id) {
    setItens((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx === -1) return prev;
      const copia = { ...prev[idx], id: uid++ };
      const novoArray = [...prev];
      novoArray.splice(idx + 1, 0, copia);
      return novoArray;
    });
  }

  function copiarLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    });
  }

  async function alternarAprovado() {
    if (!isEdit || !souGabriel) return;
    setAlternandoAprovado(true);
    const novoValor = !aprovado;
    const { error } = await supabase.from("orcamentos").update({ aprovado: novoValor }).eq("id", inicial.id);
    setAlternandoAprovado(false);
    if (!error) setAprovado(novoValor);
  }

  async function alternarEnviado() {
    if (!isEdit) return;
    setAlternandoEnviado(true);
    const novoValor = !enviado;
    const { error } = await supabase.from("orcamentos").update({ enviado: novoValor }).eq("id", inicial.id);
    setAlternandoEnviado(false);
    if (!error) setEnviado(novoValor);
  }

  function mensagemErro(error) {
    if (error?.message?.includes("orcamentos_numero_unique")) {
      return "Esse número de orçamento já está em uso. Escolha outro ou deixe o campo vazio para gerar automaticamente.";
    }
    return error?.message || "Erro desconhecido.";
  }

  async function salvar() {
    setErro(null);
    setSalvo(false);

    if (!itens.length) {
      setErro("Adicione ao menos um item.");
      return;
    }

    setSalvando(true);

    const { data: userData } = await supabase.auth.getUser();
    const criadoPor = userData.user?.user_metadata?.name || userData.user?.email || "Desconhecido";

    const dadosOrcamento = {
      cliente: cliente.trim() || null,
      observacao: observacao.trim() || null,
      prazo_entrega: prazoEntrega.trim() || null,
      condicoes_pagamento: condicoesPagamento.trim() || null,
      aprovado,
      enviado,
      empresa,
      custo_total: totals.custoTotal,
      preco_total: totals.precoTotal,
      margem_total: totals.margemTotal,
      margem_pct: totals.margemPct,
    };

    const numeroInt = numero !== "" ? parseInt(numero, 10) : null;
    if (numeroInt) dadosOrcamento.numero = numeroInt;

    let orcamentoId = inicial?.id;

    if (isEdit) {
      const { error: errUpdate } = await supabase
        .from("orcamentos")
        .update(dadosOrcamento)
        .eq("id", orcamentoId);

      if (errUpdate) {
        setErro(mensagemErro(errUpdate));
        setSalvando(false);
        return;
      }

      const { error: errDel } = await supabase.from("orcamento_itens").delete().eq("orcamento_id", orcamentoId);
      if (errDel) {
        setErro(errDel.message);
        setSalvando(false);
        return;
      }
    } else {
      const { data: orc, error: errOrc } = await supabase
        .from("orcamentos")
        .insert({ ...dadosOrcamento, criado_por: criadoPor })
        .select()
        .single();

      if (errOrc) {
        setErro(mensagemErro(errOrc));
        setSalvando(false);
        return;
      }

      orcamentoId = orc.id;
    }

    const itensPayload = itens.map((it, index) => {
      const r = computeItem(it);
      return {
        orcamento_id: orcamentoId,
        nome: it.nome || "(item)",
        fornecedor: it.fornecedor || null,
        referencias: it.referencias || [],
        ordem: index,
        custo_unit: it.custoUnit,
        quantidade: it.quantidade,
        frete: it.frete,
        outros_custos: it.outrosCustos || 0,
        notas_internas: it.notasInternas?.trim() || null,
        comissao_pct: it.comissaoPct,
        imposto_pct: it.impostoPct,
        preco_unit: r.precoUnitario,
        total_item: r.precoVendaTotal,
        margem_item: r.margem,
      };
    });

    const { error: errItens } = await supabase.from("orcamento_itens").insert(itensPayload);

    setSalvando(false);

    if (errItens) {
      setErro(errItens.message);
      return;
    }

    if (isEdit) {
      setSalvo(true);
      router.refresh();
    } else {
      router.push(`/orcamento/${orcamentoId}`);
    }
  }

  async function gerarPDF(modo) {
    setGerandoPdf(modo);
    try {
      const [{ pdf }, { default: OrcamentoPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/OrcamentoPDF"),
      ]);

      const { data: userData } = await supabase.auth.getUser();
      const criadoPor = userData.user?.user_metadata?.name || userData.user?.email || "";

      const blob = await pdf(
        <OrcamentoPDF
          modo={modo}
          numero={numero || null}
          cliente={cliente}
          observacao={observacao}
          prazoEntrega={prazoEntrega}
          condicoesPagamento={condicoesPagamento}
          empresa={EMPRESAS[empresa]}
          itens={itens}
          totals={totals}
          criadoPor={criadoPor}
          data={new Date()}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orcamento_${(cliente || "sem-nome").trim().replace(/\s+/g, "_") || "orcamento"}_${modo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGerandoPdf(null);
    }
  }

  return (
    <div className="max-w-[1040px] mx-auto px-3 py-3.5 pb-24 md:px-5 md:py-[22px] md:pb-10 flex flex-col gap-3.5">
      {isEdit && (
        <div
          className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl px-4 py-3 border shadow-[0_1px_2px_rgba(15,32,64,.05)]"
          style={{
            background: aprovado ? "#f2fbf5" : "#eef3fb",
            borderColor: aprovado ? "#b7e0c7" : "#d5e0f0",
            borderLeft: `5px solid ${aprovado ? "#12704a" : "#1b3a6b"}`,
          }}
        >
          <span className="text-[15px] font-extrabold text-azul">Orçamento nº {inicial.numero}</span>
          <div className="flex flex-wrap gap-2">
            {souGabriel ? (
              <button
                onClick={alternarAprovado}
                disabled={alternandoAprovado}
                className={
                  "text-xs font-extrabold rounded-full px-3.5 py-1.5 disabled:opacity-60 " +
                  (aprovado
                    ? "bg-verde text-white hover:opacity-90"
                    : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50")
                }
              >
                {alternandoAprovado ? "..." : aprovado ? "✓ Aprovado para envio" : "Aprovar para envio"}
              </button>
            ) : (
              <span
                className={
                  "text-xs font-extrabold rounded-full px-3.5 py-1.5 " +
                  (aprovado ? "bg-verde text-white" : "border border-slate-300 bg-white text-slate-500")
                }
              >
                {aprovado ? "✓ Aprovado para envio" : "Aguardando aprovação"}
              </span>
            )}
            <button
              onClick={alternarEnviado}
              disabled={alternandoEnviado}
              className={
                "text-xs font-extrabold rounded-full px-3.5 py-1.5 disabled:opacity-60 " +
                (enviado
                  ? "bg-azul text-white hover:opacity-90"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50")
              }
            >
              {alternandoEnviado ? "..." : enviado ? "✓ Enviado para o cliente" : "Marcar como enviado"}
            </button>
            <button
              onClick={copiarLink}
              className="text-xs font-extrabold border border-azul text-azul bg-white rounded-full px-3.5 py-1.5 hover:bg-blue-50"
            >
              {linkCopiado ? "Link copiado!" : "Copiar link para compartilhar"}
            </button>
          </div>
        </div>
      )}

      <section className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,32,64,.05)] border border-[#e3e9f2] p-4">
        <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-azul border-b-2 border-slate-100 pb-2 mb-3">
          Cliente e emitente
        </h2>
        <div className="flex flex-wrap gap-2.5">
          <input
            type="number"
            value={numero}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Nº (automático)"
            className="w-full sm:w-[120px] sm:flex-none border-[1.5px] border-slate-300 rounded-[10px] px-3 py-[11px] text-[15px] font-bold text-[#1b2a41] focus:outline-none focus:border-azul"
          />
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nome do cliente (ex: Marista Tijuca)"
            className="flex-1 min-w-[180px] border-[1.5px] border-slate-300 rounded-[10px] px-3 py-[11px] text-[15px] font-bold text-[#1b2a41] focus:outline-none focus:border-azul"
          />
          <input
            type="text"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Descrição / observação (ex: agendas + brindes)"
            className="flex-1 min-w-[180px] border-[1.5px] border-slate-300 rounded-[10px] px-3 py-[11px] text-[15px] font-bold text-[#1b2a41] focus:outline-none focus:border-azul"
          />
          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="flex-1 min-w-[160px] border-[1.5px] border-slate-300 rounded-[10px] px-3 py-[11px] text-sm font-bold text-[#1b2a41] bg-white focus:outline-none focus:border-azul"
          >
            {Object.values(EMPRESAS).map((e) => (
              <option key={e.codigo} value={e.codigo}>
                {e.codigo} — {e.nomeFantasia}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2.5 mt-2.5">
          <input
            type="text"
            value={prazoEntrega}
            onChange={(e) => setPrazoEntrega(e.target.value)}
            placeholder="Prazo de entrega (opcional, ex: 15 dias úteis após aprovação da arte)"
            className="flex-1 min-w-[220px] border-[1.5px] border-slate-300 rounded-[10px] px-3 py-[11px] text-[15px] font-semibold text-[#1b2a41] focus:outline-none focus:border-azul"
          />
          <input
            type="text"
            value={condicoesPagamento}
            onChange={(e) => setCondicoesPagamento(e.target.value)}
            placeholder="Condições de pagamento (opcional, ex: Boleto, 21 dias)"
            className="flex-1 min-w-[220px] border-[1.5px] border-slate-300 rounded-[10px] px-3 py-[11px] text-[15px] font-semibold text-[#1b2a41] focus:outline-none focus:border-azul"
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,32,64,.05)] border border-[#e3e9f2] p-4">
        <div className="flex items-center justify-between gap-2.5 border-b-2 border-slate-100 pb-2 mb-3">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-azul">Itens do orçamento</h2>
          <span className="text-xs font-bold text-slate-400">{itens.length} itens</span>
        </div>

        <div className="bg-[#f4f7fc] border border-[#e3e9f2] rounded-xl p-3 mb-3.5 flex flex-wrap items-center gap-3">
          <span className="text-sm font-extrabold text-azul">Padrão →</span>
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            Comissão
            <input
              type="number"
              value={defComissao}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setDefComissao(parseFloat(e.target.value) || 0)}
              className="w-[52px] border-[1.5px] border-slate-300 rounded-lg px-1.5 py-1.5 text-center font-bold focus:outline-none focus:border-azul"
            />
            %
          </label>
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            Imposto
            <input
              type="number"
              value={defImposto}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setDefImposto(parseFloat(e.target.value) || 0)}
              className="w-[52px] border-[1.5px] border-slate-300 rounded-lg px-1.5 py-1.5 text-center font-bold focus:outline-none focus:border-azul"
            />
            %
          </label>
          <button
            onClick={aplicarPadraoATodos}
            className="text-xs font-extrabold border-[1.5px] border-azul text-azul bg-white rounded-lg px-3 py-1.5 hover:bg-blue-50"
          >
            Aplicar a todos
          </button>
          <span className="text-[11px] text-slate-400 basis-full">
            O padrão preenche itens novos. Cada item pode ter comissão e imposto próprios.
          </span>
        </div>

        <div className="hidden md:block overflow-x-auto -mx-1">
          <table className="w-full text-xs border-separate border-spacing-y-1">
            <thead>
              <tr className="bg-azul text-white text-[10px] uppercase tracking-wide">
                <th className="text-left px-2 py-2 rounded-l-lg">Item</th>
                <th className="px-1 py-2">Fornecedor</th>
                <th className="px-1 py-2">Qtd</th>
                <th className="px-1 py-2">Custo unit.</th>
                <th className="px-1 py-2">Frete</th>
                <th className="px-1 py-2">Com. %</th>
                <th className="px-1 py-2">Imp. %</th>
                <th className="px-1.5 py-2">Preço unit.</th>
                <th className="px-1.5 py-2">Total</th>
                <th className="px-1.5 py-2">Margem</th>
                <th className="px-1 py-2 rounded-r-lg" />
              </tr>
            </thead>
            <tbody>
              {itens.map((it, index) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  fornecedores={fornecedores}
                  aoCadastrarFornecedor={aoCadastrarFornecedor}
                  onChange={(novo) => updateItem(it.id, novo)}
                  onRemove={() => removeItem(it.id)}
                  onDuplicar={() => duplicarItem(it.id)}
                  onMoverCima={index > 0 ? () => moverItem(it.id, -1) : null}
                  onMoverBaixo={index < itens.length - 1 ? () => moverItem(it.id, 1) : null}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden flex flex-col gap-2.5">
          {itens.map((it, index) => (
            <ItemCardMobile
              key={it.id}
              item={it}
              nomeExibido={it.nome || `Item ${index + 1}`}
              fornecedores={fornecedores}
              aoCadastrarFornecedor={aoCadastrarFornecedor}
              onChange={(novo) => updateItem(it.id, novo)}
              onRemove={() => removeItem(it.id)}
              onDuplicar={() => duplicarItem(it.id)}
              onMoverCima={index > 0 ? () => moverItem(it.id, -1) : null}
              onMoverBaixo={index < itens.length - 1 ? () => moverItem(it.id, 1) : null}
              expanded={expandedId === it.id}
              onToggleExpand={() => setExpandedId((prev) => (prev === it.id ? null : it.id))}
            />
          ))}
        </div>

        <button
          onClick={addItem}
          className="w-full mt-3.5 py-[15px] text-sm font-extrabold border-2 border-dashed border-[#b9c6da] text-azul bg-[#f9fbfd] rounded-2xl hover:bg-blue-50 hover:border-azul"
        >
          + Adicionar item
        </button>

        {itensComissaoBaixa.length > 0 && (
          <p className="mt-3 text-xs font-bold text-vermelho">
            ⚠ {itensComissaoBaixa.length} item(ns) com comissão abaixo de {formatMoney(COMISSAO_MINIMA)} — pode não
            valer a pena o trabalho.
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,32,64,.05)] border border-[#e3e9f2] p-4">
        <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-azul border-b-2 border-slate-100 pb-2 mb-3">
          Resultado do orçamento
        </h2>
        <div className="flex flex-col gap-[7px] text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Custo total do material</span>
            <span className="font-bold">{formatMoney(totals.custoTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Custo total do frete</span>
            <span className="font-bold">{formatMoney(totals.freteTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Outros custos</span>
            <span className="font-bold">{formatMoney(totals.outrosCustosTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Custo total do imposto</span>
            <span className="font-bold">{formatMoney(totals.impostoTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 mt-0.5">
            <span className="text-azul font-extrabold">Preço total cobrado (cliente)</span>
            <span className="font-black text-azul text-base">{formatMoney(totals.precoTotal)}</span>
          </div>
        </div>

        <div className="mt-3.5">
          <MargemBadge
            margem={totals.margemTotal}
            margemPct={totals.margemPct}
            titulo="Margem líquida (lucro real)"
            descricao={`= ${formatMoney(totals.precoTotal)} − ${formatMoney(totals.custoTotal)} − ${formatMoney(totals.freteTotal)} − ${formatMoney(totals.outrosCustosTotal)} − ${formatMoney(totals.impostoTotal)}`}
          />
        </div>

        {erro && <p className="mt-3 text-sm font-semibold text-vermelho">{erro}</p>}
        {salvo && <p className="mt-3 text-sm font-semibold text-verde">Orçamento salvo!</p>}

        <div className="flex flex-wrap gap-2.5 mt-4">
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 min-w-[160px] py-[15px] text-sm font-extrabold bg-verde text-white rounded-xl hover:opacity-90 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar orçamento"}
          </button>
          <button
            onClick={() => gerarPDF("cliente")}
            disabled={Boolean(gerandoPdf)}
            className="flex-1 min-w-[130px] py-[15px] text-sm font-extrabold bg-azul text-white rounded-xl hover:opacity-90 disabled:opacity-60"
          >
            {gerandoPdf === "cliente" ? "Gerando..." : "PDF Cliente"}
          </button>
          <button
            onClick={() => gerarPDF("fornecedor")}
            disabled={Boolean(gerandoPdf)}
            className="flex-1 min-w-[130px] py-[15px] text-sm font-extrabold bg-slate-700 text-white rounded-xl hover:opacity-90 disabled:opacity-60"
          >
            {gerandoPdf === "fornecedor" ? "Gerando..." : "PDF Fornecedor"}
          </button>
        </div>
      </section>
    </div>
  );
}
