"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { computeItem, computeTotals, COMISSAO_MINIMA } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import { EMPRESAS, EMPRESA_PADRAO } from "@/lib/empresas";
import { createClient } from "@/lib/supabase/client";
import ItemRow from "@/components/ItemRow";
import MargemBadge from "@/components/MargemBadge";

let uid = 1;
const novoItem = (comissaoPct, impostoPct) => ({
  id: uid++,
  nome: "",
  fornecedor: "",
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
  const [gerandoPdf, setGerandoPdf] = useState(false);

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

  function copiarLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    });
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
        setErro(errUpdate.message);
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
        setErro(errOrc.message);
        setSalvando(false);
        return;
      }

      orcamentoId = orc.id;
    }

    const itensPayload = itens.map((it) => {
      const r = computeItem(it);
      return {
        orcamento_id: orcamentoId,
        nome: it.nome || "(item)",
        fornecedor: it.fornecedor || null,
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

  async function gerarPDF() {
    setGerandoPdf(true);
    try {
      const [{ pdf }, { default: OrcamentoPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/OrcamentoPDF"),
      ]);

      const { data: userData } = await supabase.auth.getUser();
      const criadoPor = userData.user?.user_metadata?.name || userData.user?.email || "";

      const blob = await pdf(
        <OrcamentoPDF
          numero={numero || null}
          cliente={cliente}
          observacao={observacao}
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
      a.download = `orcamento_${(cliente || "sem-nome").trim().replace(/\s+/g, "_") || "orcamento"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4 flex flex-col gap-4">
      {isEdit && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
          <span className="text-sm font-bold text-azul">Orçamento nº {inicial.numero}</span>
          <button
            onClick={copiarLink}
            className="text-xs font-bold border border-azul text-azul rounded-md px-3 py-1.5 hover:bg-white"
          >
            {linkCopiado ? "Link copiado!" : "Copiar link para compartilhar"}
          </button>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-azul text-white text-[11px] uppercase">
                <th className="text-left px-2 py-2 rounded-l-md">Item</th>
                <th className="px-1.5 py-2">Fornecedor</th>
                <th className="px-1.5 py-2">Qtd</th>
                <th className="px-1.5 py-2">Custo unit. compra</th>
                <th className="px-1.5 py-2">Frete</th>
                <th className="px-1.5 py-2">Com. %</th>
                <th className="px-1.5 py-2">Imp. %</th>
                <th className="px-2 py-2">Preço unit.</th>
                <th className="px-2 py-2">Total item</th>
                <th className="px-2 py-2">Margem</th>
                <th className="px-2 py-2 rounded-r-md" />
              </tr>
            </thead>
            <tbody>
              {itens.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  onChange={(novo) => updateItem(it.id, novo)}
                  onRemove={() => removeItem(it.id)}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl p-4 text-center bg-slate-100 text-slate-600">
            <div className="text-xs font-semibold uppercase tracking-wide">Custo total</div>
            <div className="text-2xl font-extrabold mt-0.5">{formatMoney(totals.custoTotal)}</div>
          </div>
          <div className="rounded-xl p-4 text-center bg-blue-50 text-azul">
            <div className="text-xs font-semibold uppercase tracking-wide">Preço total (cliente)</div>
            <div className="text-2xl font-extrabold mt-0.5">{formatMoney(totals.precoTotal)}</div>
          </div>
          <MargemBadge margem={totals.margemTotal} margemPct={totals.margemPct} />
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
            onClick={gerarPDF}
            disabled={gerandoPdf}
            className="flex-1 py-3 text-sm font-bold bg-azul text-white rounded-xl disabled:opacity-60"
          >
            {gerandoPdf ? "Gerando PDF..." : "Gerar PDF"}
          </button>
        </div>
      </section>
    </div>
  );
}
