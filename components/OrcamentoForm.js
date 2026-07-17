"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { computeItem, computeTotals, COMISSAO_MINIMA } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import { EMPRESAS, EMPRESA_PADRAO } from "@/lib/empresas";
import { FORNECEDORES_PADRAO } from "@/lib/fornecedores";
import { createClient } from "@/lib/supabase/client";
import ItemRow from "@/components/ItemRow";
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
    setItens((prev) => [...prev, novoItem(defComissao, defImposto)]);
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
    <div className="max-w-5xl mx-auto p-3 sm:p-4 flex flex-col gap-4">
      {isEdit && (
        <div
          className={
            "flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2.5 border " +
            (aprovado ? "bg-green-50 border-verde" : "bg-blue-50 border-blue-100")
          }
        >
          <span className="text-sm font-bold text-azul">Orçamento nº {inicial.numero}</span>
          <div className="flex flex-wrap gap-2">
            {souGabriel ? (
              <button
                onClick={alternarAprovado}
                disabled={alternandoAprovado}
                className={
                  "text-xs font-bold rounded-md px-3 py-1.5 disabled:opacity-60 " +
                  (aprovado
                    ? "bg-verde text-white hover:opacity-90"
                    : "border border-slate-300 text-slate-600 hover:bg-white")
                }
              >
                {alternandoAprovado ? "..." : aprovado ? "✓ Aprovado para envio" : "Aprovar para envio"}
              </button>
            ) : (
              <span
                className={
                  "text-xs font-bold rounded-md px-3 py-1.5 " +
                  (aprovado ? "bg-verde text-white" : "border border-slate-300 text-slate-500")
                }
              >
                {aprovado ? "✓ Aprovado para envio" : "Aguardando aprovação"}
              </span>
            )}
            <button
              onClick={copiarLink}
              className="text-xs font-bold border border-azul text-azul rounded-md px-3 py-1.5 hover:bg-white"
            >
              {linkCopiado ? "Link copiado!" : "Copiar link para compartilhar"}
            </button>
          </div>
        </div>
      )}

      <section className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-azul border-b-2 border-slate-100 pb-1.5 mb-3">
          Cliente e emitente
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            value={numero}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Nº (automático)"
            className="sm:w-36 border border-slate-300 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-azul"
          />
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nome do cliente (ex: Marista Tijuca)"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-azul"
          />
          <input
            type="text"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Descrição / observação (ex: agendas + brindes)"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-azul"
          />
          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-azul"
          >
            {Object.values(EMPRESAS).map((e) => (
              <option key={e.codigo} value={e.codigo}>
                {e.codigo} — {e.nomeFantasia}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <input
            type="text"
            value={prazoEntrega}
            onChange={(e) => setPrazoEntrega(e.target.value)}
            placeholder="Prazo de entrega (opcional, ex: 15 dias úteis após aprovação da arte)"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-azul"
          />
          <input
            type="text"
            value={condicoesPagamento}
            onChange={(e) => setCondicoesPagamento(e.target.value)}
            placeholder="Condições de pagamento (opcional, ex: Boleto, 21 dias)"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-azul"
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-azul border-b-2 border-slate-100 pb-1.5 mb-3">
          Itens do orçamento
        </h2>

        <div className="bg-slate-50 rounded-lg p-3 mb-3 flex flex-wrap items-center gap-4">
          <span className="text-sm font-semibold">Padrão geral →</span>
          <label className="text-xs flex items-center gap-1.5">
            Comissão
            <input
              type="number"
              value={defComissao}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setDefComissao(parseFloat(e.target.value) || 0)}
              className="w-16 border border-slate-300 rounded-md px-2 py-1 text-center font-semibold"
            />
            %
          </label>
          <label className="text-xs flex items-center gap-1.5">
            Imposto
            <input
              type="number"
              value={defImposto}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setDefImposto(parseFloat(e.target.value) || 0)}
              className="w-16 border border-slate-300 rounded-md px-2 py-1 text-center font-semibold"
            />
            %
          </label>
          <button
            onClick={aplicarPadraoATodos}
            className="text-xs font-bold border border-azul text-azul rounded-md px-3 py-1.5 hover:bg-blue-50"
          >
            Aplicar a todos
          </button>
          <span className="text-xs text-slate-500 basis-full">
            O padrão preenche itens novos. Cada item pode ter comissão e imposto próprios.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-azul text-white text-[10px] uppercase">
                <th className="text-left px-1 py-1.5 rounded-l-md">Item</th>
                <th className="px-1 py-1.5">Fornecedor</th>
                <th className="px-1 py-1.5">Qtd</th>
                <th className="px-1 py-1.5">Custo unit. compra</th>
                <th className="px-1 py-1.5">Frete</th>
                <th className="px-1 py-1.5">Com. %</th>
                <th className="px-1 py-1.5">Imp. %</th>
                <th className="px-1.5 py-1.5">Preço unit.</th>
                <th className="px-1.5 py-1.5">Total</th>
                <th className="px-1.5 py-1.5">Margem</th>
                <th className="px-1 py-1.5 rounded-r-md" />
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

        <button
          onClick={addItem}
          className="w-full mt-3 py-3 text-sm font-bold border-2 border-dashed border-azul text-azul rounded-xl hover:bg-blue-50"
        >
          + Adicionar item
        </button>

        {itensComissaoBaixa.length > 0 && (
          <p className="mt-3 text-xs font-semibold text-vermelho">
            Atenção: {itensComissaoBaixa.length} item(ns) com comissão abaixo de{" "}
            {formatMoney(COMISSAO_MINIMA)} — pode não valer a pena o trabalho.
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-azul border-b-2 border-slate-100 pb-1.5 mb-3">
          Resultado do orçamento
        </h2>
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Custo total do material</span>
            <span className="font-semibold">{formatMoney(totals.custoTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Custo total do frete</span>
            <span className="font-semibold">{formatMoney(totals.freteTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Custo total do imposto</span>
            <span className="font-semibold">{formatMoney(totals.impostoTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1">
            <span className="text-azul font-semibold">Preço total cobrado (cliente)</span>
            <span className="font-bold text-azul">{formatMoney(totals.precoTotal)}</span>
          </div>
        </div>

        <div className="mt-3">
          <MargemBadge
            margem={totals.margemTotal}
            margemPct={totals.margemPct}
            titulo="Margem líquida (lucro real)"
            descricao={`= ${formatMoney(totals.precoTotal)} − ${formatMoney(totals.custoTotal)} − ${formatMoney(totals.freteTotal)} − ${formatMoney(totals.impostoTotal)}`}
          />
        </div>

        {erro && <p className="mt-3 text-sm font-semibold text-vermelho">{erro}</p>}
        {salvo && <p className="mt-3 text-sm font-semibold text-verde">Orçamento salvo!</p>}

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 py-3 text-sm font-bold bg-verde text-white rounded-xl disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar orçamento"}
          </button>
          <button
            onClick={() => gerarPDF("cliente")}
            disabled={Boolean(gerandoPdf)}
            className="flex-1 py-3 text-sm font-bold bg-azul text-white rounded-xl disabled:opacity-60"
          >
            {gerandoPdf === "cliente" ? "Gerando..." : "PDF Cliente"}
          </button>
          <button
            onClick={() => gerarPDF("fornecedor")}
            disabled={Boolean(gerandoPdf)}
            className="flex-1 py-3 text-sm font-bold bg-slate-700 text-white rounded-xl disabled:opacity-60"
          >
            {gerandoPdf === "fornecedor" ? "Gerando..." : "PDF Fornecedor"}
          </button>
        </div>
      </section>
    </div>
  );
}
