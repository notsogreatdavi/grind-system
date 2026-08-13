"use client";

import { useState } from "react";
import { CamadaDisciplinas } from "@/components/CamadaDisciplinas";
import { GradeSemana } from "@/components/GradeSemana";
import { JornadaDoVazio } from "@/components/JornadaDoVazio";
import { RegistroSessao } from "@/components/RegistroSessao";
import { hoje, segundaDaSemana, somarDias } from "@/lib/grind/derive";
import { useEventos } from "@/lib/grind/store";

/**
 * GRID · "fui constante?" (§11.4).
 *
 * A semana é a unidade de tempo do sistema (§6), então a navegação é semanal.
 * Não existe visão de mês: o mês não decide nada aqui.
 */
export default function Grid() {
  const { eventos, erro } = useEventos();
  const [segunda, setSegunda] = useState(() => segundaDaSemana(hoje()));

  const atual = segundaDaSemana(hoje());
  const primeira = segundaDaSemana(eventos.inicio || hoje());
  const domingo = somarDias(segunda, 6);

  const rotulo = (dia: string) =>
    new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSegunda(somarDias(segunda, -7))}
          disabled={segunda <= primeira}
          aria-label="semana anterior"
          className="transicao border border-borda px-2 py-1 text-xs hover:border-acento hover:text-acento disabled:opacity-30 disabled:hover:border-borda disabled:hover:text-texto"
        >
          ◀
        </button>

        <p className="rotulo flex-1 text-center">
          {segunda === atual ? "ESTA SEMANA · " : ""}
          {rotulo(segunda)} – {rotulo(domingo)}
        </p>

        <button
          onClick={() => setSegunda(somarDias(segunda, 7))}
          disabled={segunda >= atual}
          aria-label="próxima semana"
          className="transicao border border-borda px-2 py-1 text-xs hover:border-acento hover:text-acento disabled:opacity-30 disabled:hover:border-borda disabled:hover:text-texto"
        >
          ▶
        </button>
      </div>

      <GradeSemana segunda={segunda} />
      {erro && <p className="text-xs text-erro">falha ao gravar: {erro}</p>}

      <JornadaDoVazio segunda={segunda} />
      <CamadaDisciplinas />
      <RegistroSessao segunda={segunda} />
    </>
  );
}
