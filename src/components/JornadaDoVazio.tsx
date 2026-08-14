"use client";

import Link from "next/link";
import { diaVazio, intervaloDeDias, somarDias } from "@/lib/grind/derive";
import { useEventos } from "@/lib/grind/store";
import { MARCOS_VAZIO } from "@/lib/grind/spec";

/**
 * A Jornada do Vazio (§7) mora dentro do GRID, nunca em aba própria (§11.4).
 * Dias marcados e dias perdidos são a mesma pergunta pelo avesso, e uma aba
 * dedicada à falha vira santuário do fracasso — contra o que a §7.2 previne.
 */
export function JornadaDoVazio({ segunda }: { segunda: string }) {
  const { eventos, estado } = useEventos();

  // Dia anterior ao início do sistema não é dia perdido: ele não existe para o GRIND.
  // Mesma regra que `derivarEstado` e `semanaPerfeita` já aplicam ao Ω e à semana.
  const perdidosNaSemana = intervaloDeDias(segunda, somarDias(segunda, 6)).filter(
    (dia) => dia >= eventos.inicio && dia < estado.ate && diaVazio(eventos, dia),
  ).length;

  const proximo = [...MARCOS_VAZIO].reverse().find((marco) => marco.dias > estado.omega);

  return (
    <section className="quadro p-2">
      <p className="rotulo">JORNADA DO VAZIO</p>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="text-xl text-vazio">
          Ω {estado.omega}
          <span className="ml-2 text-xs text-texto-secundario">dias perdidos, vitalício</span>
        </p>

        <p className="text-xs text-texto-secundario">
          esta semana: <span className="text-texto">{perdidosNaSemana}</span>
        </p>
      </div>

      <p className="mt-2 text-xs">
        {estado.debuff.nome ? (
          <span className="text-vazio">
            {estado.debuff.nome.toUpperCase()} ativa · ×
            {estado.debuff.multiplicador.toFixed(2).replace(".", ",")} no XP
          </span>
        ) : (
          <span className="text-sucesso">nenhum debuff ativo</span>
        )}
        {proximo && (
          <span className="text-texto-secundario">
            {" · "}
            {proximo.nome} em Ω {proximo.dias} (faltam {proximo.dias - estado.omega})
          </span>
        )}
        {estado.resgates > 0 && (
          <span className="text-texto-secundario"> · {estado.resgates} resgatado(s)</span>
        )}
      </p>

      <p className="mt-2 text-xs text-texto-apagado">
        Dia perdido é dia ausente, não dia fraco. O custo de falhar é velocidade, nunca
        posição: nada aqui tira rank, XP ou recompensa já destravada.
      </p>

      {estado.debuff.nome && (
        <Link
          href="/missoes"
          className="transicao mt-2 inline-block border border-vazio px-2 py-1 text-xs text-vazio hover:bg-vazio hover:text-fundo"
        >
          escrever Missão de Resgate
        </Link>
      )}
    </section>
  );
}
