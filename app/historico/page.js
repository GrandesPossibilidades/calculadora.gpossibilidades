import { createClient } from "@/lib/supabase/server";
import HistoricoTable from "@/components/HistoricoTable";

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .order("criado_em", { ascending: false });

  return (
    <div className="max-w-[1600px] mx-auto px-3 py-3.5 pb-24 md:px-6 md:py-[22px] md:pb-10">
      <HistoricoTable orcamentos={data || []} erro={error?.message} />
    </div>
  );
}
