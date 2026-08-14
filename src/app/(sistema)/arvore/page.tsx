"use client";

import { useState } from "react";
import { ArvoreDisciplina } from "@/components/ArvoreDisciplina";
import { Barra, numero } from "@/components/Barra";
import { useEventos } from "@/lib/grind/store";
import {
  DISCIPLINAS,
  FORMA_ARVORE,
  LIMIARES_NIVEL,
  NOME_DISCIPLINA,
  NOS,
  type Disciplina,
} from "@/lib/grind/spec";

/**
 * ÁRVORE · "o que eu sei fazer?" (§11.5).
 *
 * Uma disciplina por vez, em abas internas. Mostrar as seis lado a lado exporia o
 * desequilíbrio de amplitude num olhar, mas 9 nós × 6 disciplinas fica ilegível — e
 * o desequilíbrio já está na FICHA, na lista de níveis.
 */

const TOTAL_DE_NOS = FORMA_ARVORE[1] + FORMA_ARVORE[2] + FORMA_ARVORE[3];

export default function Arvore() {
  const { eventos, estado, erro } = useEventos();
  const [disciplina, setDisciplina] = useState<Disciplina>("CMP");

  const nivel = estado.niveis[disciplina];
  const xp = estado.xpPorDisciplina[disciplina];
  const base = LIMIARES_NIVEL[nivel - 1];
  const proximo = LIMIARES_NIVEL[nivel] ?? base;

  const destravados = NOS.filter(
    (no) => no.disciplina === disciplina && eventos.nos.some((n) => n.no === no.id),
  ).length;

  return (
    <>
      <nav className="flex gap-1 overflow-x-auto">
        {DISCIPLINAS.map((d) => {
          const ativa = d === disciplina;
          return (
            <button
              key={d}
              onClick={() => setDisciplina(d)}
              aria-current={ativa}
              className={`transicao border px-2 py-1 text-xs whitespace-nowrap ${
                ativa
                  ? "border-acento text-acento"
                  : "border-transparent text-texto-secundario hover:border-borda hover:text-texto"
              }`}
            >
              {d} · {estado.niveis[d]}
            </button>
          );
        })}
      </nav>

      <section className="quadro p-2">
        <div className="flex flex-wrap justify-between gap-2">
          <p className="rotulo">{NOME_DISCIPLINA[disciplina].toUpperCase()}</p>
          <p className="rotulo">
            NÓS{" "}
            <span className={destravados > 0 ? "text-sucesso" : ""}>
              {destravados}/{TOTAL_DE_NOS}
            </span>
          </p>
        </div>

        <p className="mt-2">
          <span className="rotulo mr-2">LV.{nivel}</span>
          <Barra valor={xp - base} total={Math.max(proximo - base, 1)} className="text-acento" />
          <span className="ml-2 text-xs text-texto-secundario">
            {numero(xp)} / {numero(proximo)} XP
          </span>
        </p>
      </section>

      <ArvoreDisciplina disciplina={disciplina} />
      {erro && <p className="text-xs text-erro">falha ao gravar: {erro}</p>}

      <p className="text-xs text-texto-apagado">
        Nó é competência verificável numa sentada só, nunca tempo de serviço. Destravar dá XP
        bônus por tier (200 · 400 · 800) e é a prova auditável da Prova de Amplitude.
      </p>
    </>
  );
}
