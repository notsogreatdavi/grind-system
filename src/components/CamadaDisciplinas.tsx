"use client";

import { distribuicaoDoPulso } from "@/lib/grind/derive";
import { useEventos } from "@/lib/grind/store";
import { PULSOS } from "@/lib/grind/spec";

/**
 * A segunda camada do §6.3: em que disciplinas cada Pulso caiu, na história
 * inteira.
 *
 * O grid acima responde "fui constante?"; isto responde "marquei sempre no
 * mesmo lugar?". Seis semanas de Estudo sempre em CMP ficam invisíveis no
 * grid e gritantes aqui — que é exatamente o motivo de separar as camadas.
 */
export function CamadaDisciplinas() {
  const { eventos } = useEventos();

  return (
    <section className="quadro p-2">
      <p className="rotulo">AMPLITUDE POR PULSO · HISTÓRICO</p>

      <ul className="mt-2 flex flex-col gap-1">
        {PULSOS.map((pulso) => {
          const distribuicao = distribuicaoDoPulso(eventos, pulso.id);
          const total = distribuicao.reduce((soma, d) => soma + d.total, 0);

          return (
            <li key={pulso.id} className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="w-32 shrink-0 truncate text-texto-secundario">{pulso.nome}</span>

              {total === 0 ? (
                <span className="text-texto-apagado">sem registro</span>
              ) : (
                distribuicao.map((d) => (
                  <span key={d.disciplina}>
                    <span className={pulso.disciplinaFixa ? "text-texto-secundario" : "text-texto"}>
                      {d.disciplina}
                    </span>
                    <span className="text-texto-apagado"> {d.total}</span>
                  </span>
                ))
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
