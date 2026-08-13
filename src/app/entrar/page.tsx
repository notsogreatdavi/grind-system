"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase/cliente";

/**
 * Login por e-mail e senha.
 *
 * Era magic link, mas o SMTP embutido do Supabase entrega 2 e-mails por hora e
 * o sistema é de um usuário só: logar no celular esbarrava no limite. Senha tira
 * a entrega de e-mail do caminho crítico. Recuperação é pelo dashboard.
 */
export default function Entrar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [estado, setEstado] = useState<"parado" | "entrando" | "erro">("parado");
  const [erro, setErro] = useState("");

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setEstado("entrando");

    const { error } = await clienteNavegador().auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro(error.message);
      setEstado("erro");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="quadro w-full max-w-sm p-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">GRIND</h1>
        <p className="rotulo mt-1">CAMINHO: POLÍMATA</p>

        <form onSubmit={entrar} className="mt-8 flex flex-col gap-2">
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

          <label htmlFor="senha" className="rotulo mt-2">
            SENHA
          </label>
          <input
            id="senha"
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="transicao border border-borda bg-fundo p-2 outline-none focus:border-acento"
          />

          <button
            type="submit"
            disabled={estado === "entrando"}
            className="transicao mt-4 border border-acento p-2 text-acento hover:bg-acento hover:text-fundo disabled:opacity-40"
          >
            {estado === "entrando" ? "entrando…" : "entrar"}
          </button>
          {estado === "erro" && <p className="mt-2 text-erro">{erro}</p>}
        </form>
      </div>
    </main>
  );
}
