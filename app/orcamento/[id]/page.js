import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrcamentoDetalhe from "@/components/OrcamentoDetalhe";

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

  return <OrcamentoDetalhe orcamento={orcamento} itensDb={itensDb || []} />;
}
