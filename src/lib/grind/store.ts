"use client";

/**
 * Estado compartilhado por toda a árvore.
 *
 * Duas decisões que valem o comentário:
 *
 * 1. O estado inicial vem do servidor, não de um efeito. Num app de check-in,
 *    tela vazia piscando é exatamente o atrito que a §11.1 proíbe.
 * 2. A escrita é otimista. O clique muda a tela na hora e o insert vai atrás;
 *    se falhar, reverte e avisa. Marcar um Pulso tem que parecer instantâneo
 *    mesmo em 4G ruim, senão o hábito morre e o sistema junto.
 *
 * Só evento é gravado. Nenhum saldo (§11.10).
 */

import { createContext, createElement, useCallback, useContext, useMemo, useState } from "react";
import { clienteNavegador } from "@/lib/supabase/cliente";
import { concluidas, type Dados } from "./consultas";
import { derivarEstado, hoje, type Dia, type Estado, type Eventos } from "./derive";
import type { Disciplina, PulsoId } from "./spec";

type Escrita = () => PromiseLike<{ error: { message: string } | null }>;

type Contexto = {
  dados: Dados;
  eventos: Eventos;
  estado: Estado;
  erro: string | null;
  /** Aplica a mudança local, grava, e reverte se a gravação falhar. */
  otimista: (proximos: Dados, escrever: Escrita) => Promise<void>;
  alternarPulso: (pulso: PulsoId, disciplina: Disciplina, dia?: Dia) => Promise<void>;
  registrarCheckin: (dia?: Dia) => Promise<void>;
};

const ContextoEventos = createContext<Contexto | null>(null);

/** Reconstrói o recorte que a derivação enxerga depois de mexer nas missões. */
export function comMissoes(dados: Dados, missoes: Dados["missoes"]): Dados {
  return { ...dados, missoes, eventos: { ...dados.eventos, missoes: concluidas(missoes) } };
}

function useEstadoInterno(iniciais: Dados): Contexto {
  const [dados, setDados] = useState(iniciais);
  const [erro, setErro] = useState<string | null>(null);
  const supabase = useMemo(() => clienteNavegador(), []);

  const estado = useMemo(() => derivarEstado(dados.eventos), [dados.eventos]);

  const otimista = useCallback(
    async (proximos: Dados, escrever: Escrita) => {
      const anteriores = dados;
      setDados(proximos);
      setErro(null);

      const { error } = await escrever();
      if (error) {
        setDados(anteriores);
        setErro(error.message);
      }
    },
    [dados],
  );

  /** Marcar é registrar; desmarcar é apagar o registro do dia. */
  const alternarPulso = useCallback(
    async (pulso: PulsoId, disciplina: Disciplina, dia: Dia = hoje()) => {
      const { eventos } = dados;
      const marcado = eventos.pulsos.some((p) => p.dia === dia && p.pulso === pulso);

      const pulsos = marcado
        ? eventos.pulsos.filter((p) => !(p.dia === dia && p.pulso === pulso))
        : [...eventos.pulsos, { dia, pulso, disciplina }];

      await otimista({ ...dados, eventos: { ...eventos, pulsos } }, () =>
        marcado
          ? supabase.from("pulse_log").delete().eq("dia", dia).eq("pulso", pulso)
          : supabase.from("pulse_log").insert({ dia, pulso, disciplina }),
      );
    },
    [dados, otimista, supabase],
  );

  const registrarCheckin = useCallback(
    async (dia: Dia = hoje()) => {
      const { eventos } = dados;
      if (eventos.checkins.some((c) => c.dia === dia)) return;

      await otimista(
        { ...dados, eventos: { ...eventos, checkins: [...eventos.checkins, { dia }] } },
        () => supabase.from("checkin_log").insert({ dia }),
      );
    },
    [dados, otimista, supabase],
  );

  return { dados, eventos: dados.eventos, estado, erro, otimista, alternarPulso, registrarCheckin };
}

export function ProvedorEventos({
  iniciais,
  children,
}: {
  iniciais: Dados;
  children: React.ReactNode;
}) {
  return createElement(ContextoEventos.Provider, { value: useEstadoInterno(iniciais) }, children);
}

export function useEventos() {
  const contexto = useContext(ContextoEventos);
  if (!contexto) throw new Error("useEventos exige ProvedorEventos acima na árvore");
  return contexto;
}
