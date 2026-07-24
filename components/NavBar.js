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

  const emOrcamento = pathname === "/";
  const emHistorico = pathname?.startsWith("/historico");

  const tabClasse = (ativa) =>
    "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors " +
    (ativa ? "bg-white text-azul" : "bg-white/15 text-white hover:bg-white/25");

  return (
    <>
      <header
        className="sticky top-0 z-30 h-14 px-4 flex items-center justify-between text-white shadow-[0_1px_0_rgba(255,255,255,.08),0_6px_18px_rgba(15,32,64,.18)]"
        style={{ background: "linear-gradient(180deg, var(--color-azul-2), var(--color-azul))" }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 font-extrabold text-[15px]">
            <span className="w-[26px] h-[26px] rounded-lg bg-amarelo text-azul flex items-center justify-center font-black text-sm">
              GP
            </span>
            Calculadora
          </span>
          <nav className="hidden md:flex gap-1.5">
            <a href="/" className={tabClasse(emOrcamento)}>
              Orçamento
            </a>
            <a href="/historico" className={tabClasse(emHistorico)}>
              Histórico
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {nome && <span className="opacity-90 font-semibold hidden md:inline">{nome}</span>}
          <button
            onClick={sair}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 font-bold hover:bg-white/20"
          >
            Sair
          </button>
        </div>
      </header>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex shadow-[0_-4px_18px_rgba(15,32,64,.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <a
          href="/"
          className={
            "flex-1 flex flex-col items-center gap-0.5 py-2.5 font-extrabold text-[11px] " +
            (emOrcamento ? "text-azul" : "text-slate-400")
          }
        >
          <span className="text-lg leading-none">🧮</span>
          Orçamento
        </a>
        <a
          href="/historico"
          className={
            "flex-1 flex flex-col items-center gap-0.5 py-2.5 font-extrabold text-[11px] " +
            (emHistorico ? "text-azul" : "text-slate-400")
          }
        >
          <span className="text-lg leading-none">📁</span>
          Histórico
        </a>
      </nav>
    </>
  );
}
