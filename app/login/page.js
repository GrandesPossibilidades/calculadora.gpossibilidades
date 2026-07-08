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
    <div className="min-h-full flex items-center justify-center bg-background px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4"
      >
        <div>
          <h1 className="text-lg font-bold text-azul">Calculadora GP</h1>
          <p className="text-sm text-slate-500 mt-1">Entre para montar ou consultar orçamentos.</p>
        </div>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 font-normal focus:outline-none focus:border-azul"
            placeholder="voce@gpossibilidades.com.br"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Senha
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 font-normal focus:outline-none focus:border-azul"
          />
        </label>

        {erro && <p className="text-sm text-vermelho">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="bg-azul text-white font-bold rounded-lg py-2.5 mt-2 disabled:opacity-60"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
