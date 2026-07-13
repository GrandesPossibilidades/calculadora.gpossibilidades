import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrcamentoForm from "@/components/OrcamentoForm";

function mapItem(row) {
  return {
    nome: row.nome,
    fornecedor: row.fornecedor || "",
    referencias: row.referencias || [],
    custoUnit: Number(row.custo_unit),
    quantidade: Number(row.quantidade),
    frete: Number(row.frete),
    comissaoPct: Number(row.comissao_pct),
    impostoPct: Number(row.imposto_pct),
  };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("orcamentos_preview")
    .select("numero, cliente, observacao")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: "Calculadora GP" };
  }

  const titulo = `Orçamento nº ${data.numero}${data.cliente ? ` — ${data.cliente}` : ""}`;
  const descricao = data.observacao || "Ver orçamento na Calculadora GP";

  return {
    title: titulo,
    description: descricao,
    openGraph: { title: titulo, description: descricao },
  };
}

export default async function OrcamentoPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: orcamento } = await supabase.from("orcamentos").select("*").eq("id", id).single();

  if (!orcamento) {
    // RLS bloqueou (sem login) ou o id nao existe de verdade. Confere na view
    // publica pra saber qual dos dois casos e mostrar a mensagem certa —
    // sem isso, o notFound() puro descartaria os meta tags da preva de link.
    const { data: preview } = await supabase
      .from("orcamentos_preview")
      .select("id")
      .eq("id", id)
      .single();

    if (!preview) notFound();

    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-2xl shadow-sm p-6 max-w-sm">
          <p className="text-slate-600 mb-3">Você precisa estar logado para ver este orçamento.</p>
          <a href="/login" className="inline-block bg-azul text-white font-bold rounded-lg px-4 py-2">
            Fazer login
          </a>
        </div>
      </div>
    );
  }

  const { data: itensDb } = await supabase
    .from("orcamento_itens")
    .select("*")
    .eq("orcamento_id", id)
    .order("ordem", { ascending: true });

  const inicial = {
    id: orcamento.id,
    numero: orcamento.numero,
    cliente: orcamento.cliente,
    observacao: orcamento.observacao,
    prazoEntrega: orcamento.prazo_entrega,
    condicoesPagamento: orcamento.condicoes_pagamento,
    empresa: orcamento.empresa,
    itens: (itensDb || []).map(mapItem),
  };

  return <OrcamentoForm inicial={inicial} />;
}
