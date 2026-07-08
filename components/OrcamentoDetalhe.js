"use client";

import { useState } from "react";
import { EMPRESAS } from "@/lib/empresas";
import { formatMoney, formatPct } from "@/lib/format";
import { computeItem, margemCor } from "@/lib/calc";
import MargemBadge from "@/components/MargemBadge";

function mapItem(row) {
  return {
    id: row.id,
    nome: row.nome,
    custoUnit: Number(row.custo_unit),
    quantidade: Number(row.quantidade),
    frete: Number(row.frete),
    comissaoPct: Number(row.comissao_pct),
    impostoPct: Number(row.imposto_pct),
  };
}

export default function OrcamentoDetalhe({ orcamento, itensDb }) {
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const itens = itensDb.map(mapItem);
  const empresa = EMPRESAS[orcamento.empresa] || EMPRESAS.GA;

  async function gerarPDF() {
    setGerandoPdf(true);
    try {
      const [{ pdf }, { default: OrcamentoPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/OrcamentoPDF"),
      ]);

      const blob = await pdf(
        <OrcamentoPDF
          cliente={orcamento.cliente}
          observacao={orcamento.observacao}
          empresa={empresa}
          itens={itens}
          totals={{
            custoTotal: Number(orcamento.custo_total),
            precoTotal: Number(orcamento.preco_total),
            margemTotal: Number(orcamento.margem_total),
            margemPct: Number(orcamento.margem_pct),
          }}
          criadoPor={orcamento.criado_por}
          data={orcamento.criado_em}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orcamento_${(orcamento.cliente || "sem-nome").trim().replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 flex flex-col gap-4">
      <section className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex justify-between items-start gap-2 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-azul">{orcamento.cliente || "(sem nome)"}</h1>
            {orcamento.observacao && <p className="text-sm text-slate-500 mt-0.5">{orcamento.observacao}</p>}
            <p className="text-xs text-slate-400 mt-1">
              {new Date(orcamento.criado_em).toLocaleDateString("pt-BR")} · {empresa.nomeFantasia} · por{" "}
              {orcamento.criado_por}
            </p>
          </div>
          <button
            onClick={gerarPDF}
            disabled={gerandoPdf}
            className="text-sm font-bold bg-azul text-white rounded-lg px-4 py-2 disabled:opacity-60"
          >
            {gerandoPdf ? "Gerando..." : "Gerar PDF"}
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-azul text-white text-[11px] uppercase">
              <th className="text-left px-2 py-2 rounded-l-md">Item</th>
              <th className="px-2 py-2">Qtd</th>
              <th className="px-2 py-2">Custo unit.</th>
              <th className="px-2 py-2">Frete</th>
              <th className="px-2 py-2">Com. %</th>
              <th className="px-2 py-2">Imp. %</th>
              <th className="px-2 py-2">Preço unit.</th>
              <th className="px-2 py-2">Total item</th>
              <th className="px-2 py-2 rounded-r-md">Margem</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => {
              const r = computeItem(it);
              const cor = margemCor(r.margemPct);
              return (
                <tr key={it.id} className="border-b border-slate-100">
                  <td className="px-2 py-1.5 text-left font-semibold">{it.nome}</td>
                  <td className="px-2 py-1.5 text-center">{it.quantidade}</td>
                  <td className="px-2 py-1.5 text-center">{formatMoney(it.custoUnit)}</td>
                  <td className="px-2 py-1.5 text-center">{formatMoney(it.frete)}</td>
                  <td className="px-2 py-1.5 text-center">{it.comissaoPct}%</td>
                  <td className="px-2 py-1.5 text-center">{it.impostoPct}%</td>
                  <td className="px-2 py-1.5 text-center font-semibold">{formatMoney(r.precoUnitario)}</td>
                  <td className="px-2 py-1.5 text-center font-semibold">{formatMoney(r.precoVendaTotal)}</td>
                  <td className="px-2 py-1.5 text-center font-bold" style={{ color: cor }}>
                    {formatMoney(r.margem)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl p-4 text-center bg-slate-100 text-slate-600">
            <div className="text-xs font-semibold uppercase tracking-wide">Custo total</div>
            <div className="text-2xl font-extrabold mt-0.5">{formatMoney(orcamento.custo_total)}</div>
          </div>
          <div className="rounded-xl p-4 text-center bg-blue-50 text-azul">
            <div className="text-xs font-semibold uppercase tracking-wide">Preço total</div>
            <div className="text-2xl font-extrabold mt-0.5">{formatMoney(orcamento.preco_total)}</div>
          </div>
          <MargemBadge margem={orcamento.margem_total} margemPct={orcamento.margem_pct} />
        </div>
      </section>
    </div>
  );
}
