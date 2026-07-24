"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    setCarregando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="min-h-full flex items-center justify-center px-6 py-12"
      style={{ background: "radial-gradient(120% 100% at 50% 0%, #24508f 0%, #1b3a6b 55%, #152e54 100%)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[380px] bg-white rounded-[20px] p-[26px] flex flex-col gap-4 shadow-[0_20px_50px_rgba(10,24,48,.35)]"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-[11px] bg-amarelo text-azul flex items-center justify-center font-black text-lg shrink-0">
            GP
          </span>
          <div>
            <h1 className="text-[19px] font-black text-azul leading-tight">Calculadora GP</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Entre para montar ou consultar orçamentos.</p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5 text-[13px] font-extrabold text-slate-700">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-[1.5px] border-slate-300 rounded-[11px] px-3.5 py-3 text-[15px] font-semibold text-[#1b2a41] focus:outline-none focus:border-azul"
            placeholder="voce@gpossibilidades.com.br"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-extrabold text-slate-700">
          Senha
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="border-[1.5px] border-slate-300 rounded-[11px] px-3.5 py-3 text-[15px] font-semibold text-[#1b2a41] focus:outline-none focus:border-azul"
          />
        </label>

        {erro && <p className="text-sm font-semibold text-vermelho">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="mt-1 bg-azul text-white font-extrabold text-[15px] rounded-xl py-3.5 hover:opacity-90 disabled:opacity-60"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
