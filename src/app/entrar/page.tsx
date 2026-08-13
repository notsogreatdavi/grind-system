"use client";

import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase/cliente";

/**
 * Login por magic link. Uma tela, um campo: o sistema é de um usuário só e
 * senha aqui seria mais uma coisa pra lembrar sem ganho nenhum.
 */
export default function Entrar() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"parado" | "enviando" | "enviado" | "erro">("parado");
  const [erro, setErro] = useState("");

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setEstado("enviando");

    const { error } = await clienteNavegador().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirmar` },
    });

    if (error) {
      setErro(error.message);
      setEstado("erro");
      return;
    }
    setEstado("enviado");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="quadro w-full max-w-sm p-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">GRIND</h1>
        <p className="rotulo mt-1">CAMINHO: POLÍMATA</p>

        {estado === "enviado" ? (
          <p className="mt-8 text-sucesso">
            Link enviado para {email}. Abra pelo celular e o sistema já entra logado lá.
          </p>
        ) : (
          <form onSubmit={enviar} className="mt-8 flex flex-col gap-2">
            <label htmlFor="email" className="rotulo">
              E-MAIL
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="transicao border border-borda bg-fundo p-2 outline-none focus:border-acento"
            />
            <button
              type="submit"
              disabled={estado === "enviando"}
              className="transicao mt-2 border border-acento p-2 text-acento hover:bg-acento hover:text-fundo disabled:opacity-40"
            >
              {estado === "enviando" ? "enviando…" : "receber link"}
            </button>
            {estado === "erro" && <p className="mt-2 text-erro">{erro}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
