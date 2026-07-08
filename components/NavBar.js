"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const [nome, setNome] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setNome(data.user?.user_metadata?.name || data.user?.email || null);
    });
  }, [supabase]);

  if (pathname === "/login") return null;

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-azul text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="font-bold text-sm sm:text-base">Calculadora GP</span>
        <nav className="flex gap-3 text-sm">
          <a
            href="/"
            className={pathname === "/" ? "underline font-semibold" : "opacity-85 hover:opacity-100"}
          >
            Orçamento
          </a>
          <a
            href="/historico"
            className={
              pathname?.startsWith("/historico") ? "underline font-semibold" : "opacity-85 hover:opacity-100"
            }
          >
            Histórico
          </a>
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {nome && <span className="opacity-90 hidden sm:inline">{nome}</span>}
        <button onClick={sair} className="opacity-85 hover:opacity-100 underline">
          Sair
        </button>
      </div>
    </header>
  );
}
