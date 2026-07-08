import { createClient } from "@/lib/supabase/server";
import HistoricoTable from "@/components/HistoricoTable";

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .order("criado_em", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4">
      <HistoricoTable orcamentos={data || []} erro={error?.message} />
    </div>
  );
}
