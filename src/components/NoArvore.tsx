"use client";

import { useState } from "react";
import { hoje, noDisponivel, somarDias } from "@/lib/grind/derive";
import { useEventos } from "@/lib/grind/store";
import { NOS, XP, type No } from "@/lib/grind/spec";

/**
 * Um nó é competência concreta com critério binário (§4.4), nunca tarefa nem hábito.
 * Por isso o card mostra sempre o critério: sem ele o nó vira uma caixa com um nome
 * bonito e o "consigo ou não consigo" se perde.
 *
 * O destrave abre inline em vez de modal — mesma escolha da GradeSemana. Modal não
 * combina com a estética de terminal e custa um clique a mais só para fechar.
 */

const NOME_DO_NO = new Map(NOS.map((no) => [no.id, no.nome]));

/** Sete dias de destaque: tempo de ver o que acabou de mudar, não medalha permanente. */
function recente(dia: string) {
  return dia >= somarDias(hoje(), -6);
}

export function NoArvore({ no }: { no: No }) {
  const { eventos, destravarNo } = useEventos();
  const [aberto, setAberto] = useState(false);

  const destrave = eventos.nos.find((n) => n.no === no.id);
  const disponivel = noDisponivel(eventos, no.id);

  const { marca, cor } = destrave
    ? { marca: "■", cor: recente(destrave.dia) ? "text-destaque border-destaque" : "text-sucesso border-borda" }
    : disponivel
      ? { marca: "□", cor: "border-acento" }
      : { marca: "×", cor: "text-texto-apagado border-borda" };

  const faltam = no.pais
    .filter((pai) => !eventos.nos.some((n) => n.no === pai))
    .map((pai) => NOME_DO_NO.get(pai) ?? pai);

  return (
    <div className={`transicao border bg-superficie/80 p-2 text-xs ${cor}`}>
      <button
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        className="flex w-full items-baseline gap-2 text-left"
      >
        <span aria-hidden>{marca}</span>
        <span className="flex-1">{no.nome}</span>
      </button>

      {aberto && (
        <div className="mt-2 border-t border-borda pt-2 text-texto-secundario">
          <p>{no.criterio}</p>

          {destrave && <p className="mt-2 text-texto-apagado">destravado em {destrave.dia}</p>}

          {disponivel && (
            <button
              onClick={() => destravarNo(no.id)}
              className="transicao mt-2 border border-acento px-2 py-1 text-acento hover:bg-acento hover:text-fundo"
            >
              destravar · +{XP.no[no.tier]} XP
            </button>
          )}

          {faltam.length > 0 && <p className="mt-2 text-vazio">falta destravar: {faltam.join(" · ")}</p>}
        </div>
      )}
    </div>
  );
}
