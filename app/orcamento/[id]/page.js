import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrcamentoForm from "@/components/OrcamentoForm";

function mapItem(row) {
  return {
    nome: row.nome,
    fornecedor: row.fornecedor || "",
    referencia: row.referencia || "",
    custoUnit: Number(row.custo_unit),
    quantidade: Number(row.quantidade),
    frete: Number(row.frete),
    comissaoPct: Number(row.comissao_pct),
    impostoPct: Number(row.imposto_pct),
  };
}

export default async function OrcamentoPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: orcamento } = await supabase.from("orcamentos").select("*").eq("id", id).single();

  if (!orcamento) notFound();

  const { data: itensDb } = await supabase
    .from("orcamento_itens")
    .select("*")
    .eq("orcamento_id", id)
    .order("id", { ascending: true });

  const inicial = {
    id: orcamento.id,
    numero: orcamento.numero,
    cliente: orcamento.cliente,
    observacao: orcamento.observacao,
    empresa: orcamento.empresa,
    itens: (itensDb || []).map(mapItem),
  };

  return <OrcamentoForm inicial={inicial} />;
}
