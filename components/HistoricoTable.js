"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { margemCor, computeItem, computeTotals } from "@/lib/calc";
import { formatMoney, formatPct } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { EMPRESAS } from "@/lib/empresas";

function toCSV(orcamentos) {
  const linhas = ["Nº;Data;Cliente;Observação;Empresa;Custo;Preço Total;Margem R$;Margem %;Criado por"];
  orcamentos.forEach((o) => {
    const data = new Date(o.criado_em).toLocaleDateString("pt-BR");
    linhas.push(
      [
        o.numero ?? "",
        data,
        o.cliente || "",
        o.observacao || "",
        o.empresa || "",
        Number(o.custo_total).toFixed(2),
        Number(o.preco_total).toFixed(2),
        Number(o.margem_total).toFixed(2),
        Number(o.margem_pct).toFixed(1),
        o.criado_por || "",
      ]
        .map((v) => String(v).replace(/;/g, ","))
        .join(";")
    );
  });
  return linhas.join("\n");
}

export default function HistoricoTable({ orcamentos, erro }) {
  const supabase = createClient();
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(null);
  const [linkCopiadoId, setLinkCopiadoId] = useState(null);
  const [carregandoId, setCarregandoId] = useState(null);

  useEffect(() => {
    if (!menuAberto) return;
    function aoClicarFora(e) {
      if (!e.target.closest(`[data-menu-id="${menuAberto}"]`)) {
        setMenuAberto(null);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [menuAberto]);

  const filtrados = useMemo(() => {
    if (!busca.trim()) return orcamentos;
    const termo = busca.trim().toLowerCase();
    return orcamentos.filter((o) => (o.cliente || "").toLowerCase().includes(termo));
  }, [orcamentos, busca]);

  function exportarCSV() {
    if (!filtrados.length) return;
    const blob = new Blob([toCSV(filtrados)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orcamentos_gp.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function buscarItens(orcamentoId) {
    const { data } = await supabase
      .from("orcamento_itens")
      .select("*")
      .eq("orcamento_id", orcamentoId)
      .order("ordem", { ascending: true });

    return (data || []).map((row) => ({
      nome: row.nome,
      fornecedor: row.fornecedor || "",
      referencias: row.referencias || [],
      custoUnit: Number(row.custo_unit),
      quantidade: Number(row.quantidade),
      frete: Number(row.frete),
      comissaoPct: Number(row.comissao_pct),
      impostoPct: Number(row.imposto_pct),
    }));
  }

  async function gerarPDF(o, modo) {
    setCarregandoId(o.id);
    try {
      const itens = await buscarItens(o.id);
      const [{ pdf }, { default: OrcamentoPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/OrcamentoPDF"),
      ]);
      const totals = computeTotals(itens);

      const blob = await pdf(
        <OrcamentoPDF
          modo={modo}
          numero={o.numero}
          cliente={o.cliente}
          observacao={o.observacao}
          prazoEntrega={o.prazo_entrega}
          condicoesPagamento={o.condicoes_pagamento}
          empresa={EMPRESAS[o.empresa] || EMPRESAS.GA}
          itens={itens}
          totals={totals}
          criadoPor={o.criado_por}
          data={o.criado_em}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orcamento_${(o.cliente || "sem-nome").trim().replace(/\s+/g, "_")}_${modo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCarregandoId(null);
      setMenuAberto(null);
    }
  }

  function copiarLink(o) {
    const url = `${window.location.origin}/orcamento/${o.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopiadoId(o.id);
      setTimeout(() => setLinkCopiadoId(null), 2000);
    });
  }

  async function duplicar(o) {
    setCarregandoId(o.id);
    try {
      const itens = await buscarItens(o.id);
      const { data: userData } = await supabase.auth.getUser();
      const criadoPor = userData.user?.user_metadata?.name || userData.user?.email || "Desconhecido";
      const totals = computeTotals(itens);

      const { data: novo, error } = await supabase
        .from("orcamentos")
        .insert({
          cliente: o.cliente,
          observacao: o.observacao,
          prazo_entrega: o.prazo_entrega,
          condicoes_pagamento: o.condicoes_pagamento,
          empresa: o.empresa,
          custo_total: totals.custoTotal,
          preco_total: totals.precoTotal,
          margem_total: totals.margemTotal,
          margem_pct: totals.margemPct,
          criado_por: criadoPor,
        })
        .select()
        .single();

      if (error || !novo) return;

      const itensPayload = itens.map((it, index) => {
        const r = computeItem(it);
        return {
          orcamento_id: novo.id,
          nome: it.nome,
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

      await supabase.from("orcamento_itens").insert(itensPayload);
      router.push(`/orcamento/${novo.id}`);
    } finally {
      setCarregandoId(null);
      setMenuAberto(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-azul border-b-2 border-slate-100 pb-1.5 mb-3">
        Histórico de orçamentos
      </h2>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente..."
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-semibold focus:outline-none focus:border-azul"
        />
        <button
          onClick={exportarCSV}
          className="text-sm font-bold border border-azul text-azul rounded-lg px-4 py-2 hover:bg-blue-50"
        >
          Exportar CSV
        </button>
      </div>

      {erro && <p className="text-sm font-semibold text-vermelho mb-3">{erro}</p>}

      {!filtrados.length ? (
        <p className="text-center text-slate-400 py-8 text-sm">Nenhum orçamento encontrado.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtrados.map((o) => {
            const cor = margemCor(o.margem_pct);
            const carregando = carregandoId === o.id;
            return (
              <div key={o.id} className="relative">
                <a
                  href={`/orcamento/${o.id}`}
                  className={
                    "block border rounded-xl p-3.5 pr-10 transition-colors " +
                    (o.aprovado ? "border-verde bg-green-50 hover:border-verde" : "border-slate-200 hover:border-azul")
                  }
                >
                  <div className="flex justify-between items-baseline gap-2 pr-2">
                    <span className="font-bold text-azul">
                      #{o.numero} — {o.cliente || "(sem nome)"}
                      {o.aprovado && (
                        <span className="ml-2 text-[10px] font-bold text-white bg-verde rounded-full px-2 py-0.5 align-middle">
                          ✓ Aprovado
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(o.criado_em).toLocaleDateString("pt-BR")} · {o.empresa} · {o.criado_por}
                    </span>
                  </div>
                  {o.observacao && <div className="text-xs text-slate-500 mt-1">{o.observacao}</div>}
                  <div className="flex flex-wrap gap-4 text-sm mt-2">
                    <span>
                      Custo: <b>{formatMoney(o.custo_total)}</b>
                    </span>
                    <span>
                      Total: <b>{formatMoney(o.preco_total)}</b>
                    </span>
                    <span style={{ color: cor }}>
                      Margem: <b>{formatMoney(o.margem_total)} ({formatPct(o.margem_pct)})</b>
                    </span>
                  </div>
                </a>

                <div className="absolute top-2 right-1 z-10" data-menu-id={o.id}>
                  <button
                    onClick={() => setMenuAberto(menuAberto === o.id ? null : o.id)}
                    aria-label="Mais opções"
                    className="text-slate-400 hover:text-azul text-xl font-bold leading-none px-2 py-1"
                  >
                    ⋮
                  </button>
                  {menuAberto === o.id && (
                    <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm">
                      <button
                        onClick={() => gerarPDF(o, "cliente")}
                        disabled={carregando}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {carregando ? "Gerando..." : "Gerar PDF Cliente"}
                      </button>
                      <button
                        onClick={() => gerarPDF(o, "fornecedor")}
                        disabled={carregando}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {carregando ? "Gerando..." : "Gerar PDF Fornecedor"}
                      </button>
                      <button
                        onClick={() => copiarLink(o)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50"
                      >
                        {linkCopiadoId === o.id ? "Link copiado!" : "Copiar link"}
                      </button>
                      <button
                        onClick={() => duplicar(o)}
                        disabled={carregando}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {carregando ? "Duplicando..." : "Duplicar orçamento"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
