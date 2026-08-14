"use client";

import { diaDaSemana, hoje, intervaloDeDias, diaVazio, semanaPerfeita, somarDias } from "@/lib/grind/derive";
import { useEventos } from "@/lib/grind/store";
import { XP } from "@/lib/grind/spec";
import type { Missao } from "@/lib/grind/consultas";

/**
 * O fechamento da semana (§6) só existe no domingo. Painel permanente viraria
 * paisagem, e o ponto dele é ser um momento: a semana acabou, isto é o que ela foi.
 *
 * Aparece antes de tudo na aba porque é o que muda de estado hoje.
 */
export function FechamentoDomingo({ semana, missoes }: { semana: string; missoes: Missao[] }) {
  const { eventos } = useEventos();
  const dia = hoje();

  if (diaDaSemana(dia) !== 6) return null;

  const daSemana = (tipo: Missao["tipo"]) => missoes.find((m) => m.tipo === tipo && m.semana === semana);
  const perfeita = semanaPerfeita(eventos, semana, dia);

  const vazios = intervaloDeDias(semana, somarDias(semana, 6)).filter(
    (d) => d < dia && diaVazio(eventos, d),
  ).length;

  return (
    <section className="quadro border-destaque p-2">
      <p className="rotulo">FECHAMENTO DA SEMANA</p>

      <ul className="mt-2 flex flex-col gap-1 text-xs">
        <Linha feito={Boolean(daSemana("semanal")?.concluida_em)} rotulo="Missão Principal" />
        <Linha feito={Boolean(daSemana("boss")?.concluida_em)} rotulo="Boss" />
        <Linha feito={vazios === 0} rotulo={`Dias perdidos: ${vazios}`} />
        <Linha feito={perfeita} rotulo={`Semana perfeita (+${XP.semanaPerfeita})`} />
      </ul>

      <p className="mt-2 text-xs text-texto-apagado">
        {perfeita
          ? "Semana fechada. Escreva a missão da próxima antes de segunda."
          : "Ainda dá pra fechar hoje. Depois, escreva a missão da próxima semana."}
      </p>
    </section>
  );
}

function Linha({ feito, rotulo }: { feito: boolean; rotulo: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <span aria-hidden className={feito ? "text-sucesso" : "text-texto-apagado"}>
        {feito ? "■" : "·"}
      </span>
      <span className={feito ? "" : "text-texto-secundario"}>{rotulo}</span>
    </li>
  );
}
