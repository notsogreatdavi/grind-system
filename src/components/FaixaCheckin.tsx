"use client";

import { useEffect, useState } from "react";
import { useEventos } from "@/lib/grind/store";
import { hoje, xpBaseDoDia } from "@/lib/grind/derive";
import { DISCIPLINAS, NOME_DISCIPLINA, PULSOS, XP, type Disciplina, type PulsoId } from "@/lib/grind/spec";

/**
 * A primeira coisa da página (§11.3), e a razão de o sistema existir.
 *
 * Marcar é um clique. Nos quatro Pulsos livres, escolher a disciplina é um
 * segundo clique que abre aqui mesmo — sem modal e sem trocar de tela, porque
 * cada passo a mais é uma chance de o hábito morrer (§11.1).
 */

const DIAS_SEMANA = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

export function FaixaCheckin() {
  const { eventos, registrarCheckin, alternarPulso, erro } = useEventos();
  const [dia] = useState(hoje);
  const [abrindo, setAbrindo] = useState<PulsoId | null>(null);

  // Abrir o sistema já vale XP: o retorno tem que ser maior que o custo (§9).
  useEffect(() => {
    void registrarCheckin(dia);
    // registrarCheckin muda a cada evento novo; o check-in é uma vez por dia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dia]);

  const marcados = new Set(eventos.pulsos.filter((p) => p.dia === dia).map((p) => p.pulso));
  const faltam = PULSOS.length - marcados.size;
  const data = new Date(`${dia}T12:00:00`);

  async function clicar(pulso: (typeof PULSOS)[number]) {
    if (marcados.has(pulso.id)) {
      await alternarPulso(pulso.id, "CMP", dia); // desmarcar ignora a disciplina
      return;
    }
    if (pulso.disciplinaFixa) {
      await alternarPulso(pulso.id, pulso.disciplinaFixa, dia);
      return;
    }
    setAbrindo(abrindo === pulso.id ? null : pulso.id);
  }

  async function escolher(pulso: PulsoId, disciplina: Disciplina) {
    setAbrindo(null);
    await alternarPulso(pulso, disciplina, dia);
  }

  return (
    <section className="quadro p-2">
      <p className="rotulo">
        HOJE · {DIAS_SEMANA[(data.getDay() + 6) % 7]}{" "}
        {data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
      </p>

      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
        {PULSOS.map((pulso) => {
          const marcado = marcados.has(pulso.id);
          const disciplina = eventos.pulsos.find((p) => p.dia === dia && p.pulso === pulso.id)?.disciplina;

          return (
            <div key={pulso.id}>
              <button
                onClick={() => clicar(pulso)}
                aria-pressed={marcado}
                className={`transicao flex w-full items-center gap-2 border p-2 text-left ${
                  marcado
                    ? "border-sucesso text-sucesso"
                    : "border-borda text-texto-secundario hover:border-acento hover:text-texto"
                }`}
              >
                <span aria-hidden>{marcado ? "■" : "·"}</span>
                <span className="flex-1">{pulso.nome}</span>
                {disciplina && <span className="text-xs text-texto-apagado">{disciplina}</span>}
              </button>

              {abrindo === pulso.id && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {DISCIPLINAS.map((d) => (
                    <button
                      key={d}
                      onClick={() => escolher(pulso.id, d)}
                      title={NOME_DISCIPLINA[d]}
                      className="transicao border border-borda px-2 py-1 text-xs text-texto-secundario hover:border-acento hover:text-acento"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-texto-secundario">
        <span className="text-texto">+{xpBaseDoDia(eventos, dia)} XP</span>
        {faltam > 0
          ? ` · falta${faltam > 1 ? "m" : ""} ${faltam} pro combo diário (+${XP.comboDiario})`
          : ` · combo diário fechado`}
      </p>

      {erro && <p className="mt-2 text-xs text-erro">falha ao gravar: {erro}</p>}
    </section>
  );
}
