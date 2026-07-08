"use client";

import { useMemo, useState } from "react";
import { margemCor } from "@/lib/calc";
import { formatMoney, formatPct } from "@/lib/format";

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
  const [busca, setBusca] = useState("");

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
            return (
              <a
                key={o.id}
                href={`/orcamento/${o.id}`}
                className="block border border-slate-200 rounded-xl p-3.5 hover:border-azul transition-colors"
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-azul">
                    #{o.numero} — {o.cliente || "(sem nome)"}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
