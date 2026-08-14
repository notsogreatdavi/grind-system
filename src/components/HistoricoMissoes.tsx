"use client";

import { XP_MISSAO } from "@/lib/grind/spec";
import type { Missao } from "@/lib/grind/consultas";

/**
 * O histórico não é enfeite (§11.6): é a prova de que o sistema já funcionou antes,
 * que é exatamente o argumento de que se precisa nas semanas ruins. Por isso lista
 * só as concluídas — a memória aqui é deliberadamente parcial.
 */

const NOME_TIPO: Record<Missao["tipo"], string> = {
  semanal: "PRINCIPAL",
  boss: "BOSS",
  avanco: "AVANÇO",
  resgate: "RESGATE",
};

export function HistoricoMissoes({ missoes }: { missoes: Missao[] }) {
  const concluidas = missoes
    .filter((m) => m.concluida_em)
    .sort((a, b) => b.concluida_em!.localeCompare(a.concluida_em!));

  return (
    <section className="quadro p-2">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="rotulo">HISTÓRICO</p>
        <p className="rotulo">{concluidas.length} CONCLUÍDA(S)</p>
      </div>

      {concluidas.length === 0 ? (
        <p className="mt-2 text-xs text-texto-apagado">
          Nada concluído ainda. A primeira linha aqui é a que muda o argumento.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {concluidas.map((missao) => (
            <li key={missao.id} className="flex items-baseline gap-2 text-xs">
              <span className="text-texto-apagado">{missao.concluida_em}</span>
              <span className="w-20 text-texto-secundario">{NOME_TIPO[missao.tipo]}</span>
              <span className="flex-1 truncate">{missao.titulo}</span>
              {XP_MISSAO[missao.tipo] > 0 && (
                <span className="text-sucesso">+{XP_MISSAO[missao.tipo]}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
