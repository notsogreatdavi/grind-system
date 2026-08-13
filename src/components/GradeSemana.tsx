"use client";

import { useState } from "react";
import { hoje, intervaloDeDias, somarDias, streakDoPulso } from "@/lib/grind/derive";
import { useEventos } from "@/lib/grind/store";
import { DISCIPLINAS, NOME_DISCIPLINA, PULSOS, type Disciplina, type PulsoId } from "@/lib/grind/spec";

/**
 * O grid de Pulsos × dias (§6.3). Mostra **o gesto**: marquei ou não marquei.
 * A disciplina é a camada de baixo e vive em outro painel.
 *
 * As células do passado são editáveis de propósito — fechar ontem à noite é o
 * uso real do sistema. As do futuro não: marcar amanhã seria mentir para o Ω.
 */

const DIAS_SEMANA = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

type Alvo = { pulso: PulsoId; dia: string };

export function GradeSemana({ segunda }: { segunda: string }) {
  const { eventos, alternarPulso } = useEventos();
  const [escolhendo, setEscolhendo] = useState<Alvo | null>(null);
  const dias = intervaloDeDias(segunda, somarDias(segunda, 6));
  const limite = hoje();

  const marcado = (pulso: PulsoId, dia: string) =>
    eventos.pulsos.find((p) => p.dia === dia && p.pulso === pulso);

  async function clicar(pulso: (typeof PULSOS)[number], dia: string) {
    if (marcado(pulso.id, dia)) {
      await alternarPulso(pulso.id, "CMP", dia); // desmarcar ignora a disciplina
      return;
    }
    if (pulso.disciplinaFixa) {
      await alternarPulso(pulso.id, pulso.disciplinaFixa, dia);
      return;
    }
    setEscolhendo({ pulso: pulso.id, dia });
  }

  async function escolher(disciplina: Disciplina) {
    if (!escolhendo) return;
    const alvo = escolhendo;
    setEscolhendo(null);
    await alternarPulso(alvo.pulso, disciplina, alvo.dia);
  }

  return (
    <section className="quadro overflow-x-auto p-2">
      <div className="min-w-[20rem]">
        <div className="grid grid-cols-[1fr_repeat(7,1.5rem)_2.5rem] items-center gap-y-1">
          <span />
          {dias.map((dia, i) => (
            <span
              key={dia}
              className={`rotulo text-center ${dia === limite ? "text-acento" : ""}`}
              title={dia}
            >
              {DIAS_SEMANA[i][0]}
            </span>
          ))}
          <span className="rotulo text-right">SEQ</span>

          {PULSOS.map((pulso) => (
            <Linha
              key={pulso.id}
              pulso={pulso}
              dias={dias}
              limite={limite}
              marcado={marcado}
              aoClicar={clicar}
              streak={streakDoPulso(eventos, pulso.id, limite)}
            />
          ))}
        </div>
      </div>

      {escolhendo && (
        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-borda pt-2">
          <span className="rotulo mr-1">
            {PULSOS.find((p) => p.id === escolhendo.pulso)?.nome} ·{" "}
            {DIAS_SEMANA[dias.indexOf(escolhendo.dia)]} →
          </span>
          {DISCIPLINAS.map((d) => (
            <button
              key={d}
              onClick={() => escolher(d)}
              title={NOME_DISCIPLINA[d]}
              className="transicao border border-borda px-2 py-1 text-xs text-texto-secundario hover:border-acento hover:text-acento"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setEscolhendo(null)}
            className="transicao ml-auto px-2 py-1 text-xs text-texto-apagado hover:text-texto"
          >
            cancelar
          </button>
        </div>
      )}
    </section>
  );
}

function Linha({
  pulso,
  dias,
  limite,
  marcado,
  aoClicar,
  streak,
}: {
  pulso: (typeof PULSOS)[number];
  dias: string[];
  limite: string;
  marcado: (pulso: PulsoId, dia: string) => { disciplina: Disciplina } | undefined;
  aoClicar: (pulso: (typeof PULSOS)[number], dia: string) => void;
  streak: number;
}) {
  return (
    <>
      <span className="truncate pr-2 text-xs text-texto-secundario">{pulso.nome}</span>

      {dias.map((dia) => {
        const registro = marcado(pulso.id, dia);
        const futuro = dia > limite;

        return (
          <button
            key={dia}
            disabled={futuro}
            onClick={() => aoClicar(pulso, dia)}
            aria-pressed={Boolean(registro)}
            aria-label={`${pulso.nome} em ${dia}`}
            title={registro ? `${dia} · ${registro.disciplina}` : dia}
            className={`transicao h-6 text-center ${
              registro
                ? "text-sucesso"
                : futuro
                  ? "text-texto-apagado opacity-30"
                  : "text-texto-apagado hover:text-acento"
            }`}
          >
            {registro ? "■" : "·"}
          </button>
        );
      })}

      <span className={`text-right text-xs ${streak > 0 ? "text-texto" : "text-texto-apagado"}`}>
        {streak}
      </span>
    </>
  );
}
