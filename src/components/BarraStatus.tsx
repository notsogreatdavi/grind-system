"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEventos } from "@/lib/grind/store";

/**
 * A barra é o mapa do sistema (§11.2). Rank, streak e Ω ficam nela para custo
 * zero de navegação: nunca preciso lembrar em que pé estou, está sempre na
 * tela. Em telas estreitas as abas rolam na horizontal — virar hambúrguer
 * esconderia justamente o que precisa estar visível.
 */

const ABAS = [
  { href: "/", nome: "FICHA" },
  { href: "/grid", nome: "GRID" },
  { href: "/arvore", nome: "ÁRVORE" },
  { href: "/missoes", nome: "MISSÕES" },
  { href: "/inventario", nome: "INVENTÁRIO" },
];

export function BarraStatus() {
  const { estado } = useEventos();
  const caminho = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-borda bg-fundo">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
        <span className="font-[family-name:var(--font-display)] tracking-tight">GRIND</span>

        <nav className="flex flex-1 gap-1 overflow-x-auto">
          {ABAS.map((aba) => {
            const ativa = caminho === aba.href;
            return (
              <Link
                key={aba.href}
                href={aba.href}
                className={`transicao border px-2 py-1 text-xs whitespace-nowrap ${
                  ativa
                    ? "border-acento text-acento"
                    : "border-transparent text-texto-secundario hover:border-borda hover:text-texto"
                }`}
              >
                {aba.nome}
              </Link>
            );
          })}
        </nav>

        <p className="text-xs text-texto-secundario">
          <span className="text-texto">RANK {estado.classe.rank}</span>
          {" · STREAK "}
          {estado.streak}
          <span className={estado.streak > 0 ? "text-sucesso" : ""}>
            {" ×"}
            {estado.multiplicadorStreak.toFixed(2).replace(".", ",")}
          </span>
          {" · "}
          <span className={estado.debuff.nome ? "text-vazio" : ""}>Ω {estado.omega}</span>
        </p>
      </div>
    </header>
  );
}
