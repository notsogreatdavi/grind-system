"use client";

import Link from "next/link";
import { useEventos } from "@/lib/grind/store";
import { hoje, segundaDaSemana } from "@/lib/grind/derive";
import type { Missao } from "@/lib/grind/consultas";

/**
 * Missão Principal e Boss da semana, em resumo (§11.3). Só leitura: escrever
 * missão é trabalho da aba MISSÕES, e duplicar o formulário aqui seria duas
 * telas para manter e uma decisão a mais na página que precisa ser a mais
 * rápida do sistema.
 */
export function ResumoSemana() {
  const { dados } = useEventos();
  const semana = segundaDaSemana(hoje());

  const da = (tipo: Missao["tipo"]) => dados.missoes.find((m) => m.tipo === tipo && m.semana === semana);
  const missao = da("semanal");
  const boss = da("boss");

  return (
    <section className="quadro p-2">
      <div className="flex justify-between">
        <p className="rotulo">SEMANA</p>
        <Link href="/missoes" className="rotulo text-acento hover:underline">
          MISSÕES →
        </Link>
      </div>

      <dl className="mt-2 flex flex-col gap-1">
        <Linha rotulo="MISSÃO" missao={missao} cor="text-texto" />
        <Linha rotulo="BOSS" missao={boss} cor="text-destaque" />
      </dl>
    </section>
  );
}

function Linha({ rotulo, missao, cor }: { rotulo: string; missao?: Missao; cor: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 text-texto-secundario">{rotulo}</dt>
      <dd className={missao ? cor : "text-texto-apagado"}>
        {missao ? (
          <>
            {missao.concluida_em && <span className="text-sucesso">✔ </span>}
            {missao.titulo}
          </>
        ) : (
          "— não definida para esta semana"
        )}
      </dd>
    </div>
  );
}
