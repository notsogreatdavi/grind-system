"use client";

/**
 * Fonte de eventos do GRIND.
 *
 * A spec (§11.9) define Supabase como banco. Enquanto as credenciais não
 * existem, esta implementação guarda os mesmos eventos no navegador. A troca é
 * local a este arquivo: nada fora daqui sabe de onde os eventos vêm, e o
 * formato gravado é exatamente o das tabelas `pulse_log` e `checkin_log`.
 *
 * Só eventos são gravados. Nenhum saldo (§11.10).
 */

import { createContext, createElement, useCallback, useContext, useEffect, useState } from "react";
import type { Disciplina, PulsoId } from "./spec";
import { hoje, type Dia, type Eventos } from "./derive";

const CHAVE = "grind:eventos:v1";

const VAZIO: Eventos = { pulsos: [], checkins: [], inicio: hoje() };

function ler(): Eventos {
  if (typeof window === "undefined") return VAZIO;
  const bruto = window.localStorage.getItem(CHAVE);
  if (!bruto) return VAZIO;
  try {
    return JSON.parse(bruto) as Eventos;
  } catch {
    return VAZIO;
  }
}

function gravar(eventos: Eventos) {
  window.localStorage.setItem(CHAVE, JSON.stringify(eventos));
}

function useEventosInterno() {
  const [eventos, setEventos] = useState<Eventos>(VAZIO);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    setEventos(ler());
    setCarregado(true);
  }, []);

  const atualizar = useCallback((proximo: Eventos) => {
    gravar(proximo);
    setEventos(proximo);
  }, []);

  /** Marcar é registrar; desmarcar é apagar o registro do dia. */
  const alternarPulso = useCallback(
    (pulso: PulsoId, disciplina: Disciplina, dia: Dia = hoje()) => {
      const jaMarcado = eventos.pulsos.some((p) => p.dia === dia && p.pulso === pulso);
      atualizar({
        ...eventos,
        pulsos: jaMarcado
          ? eventos.pulsos.filter((p) => !(p.dia === dia && p.pulso === pulso))
          : [...eventos.pulsos, { dia, pulso, disciplina }],
      });
    },
    [eventos, atualizar],
  );

  const registrarCheckin = useCallback(
    (dia: Dia = hoje()) => {
      if (eventos.checkins.some((c) => c.dia === dia)) return;
      atualizar({ ...eventos, checkins: [...eventos.checkins, { dia }] });
    },
    [eventos, atualizar],
  );

  return { eventos, carregado, alternarPulso, registrarCheckin };
}

/**
 * Um único estado compartilhado por toda a árvore. Sem isso, a barra de status
 * e a faixa de check-in leriam o mesmo storage separadamente e divergiriam a
 * cada clique.
 */
const Contexto = createContext<ReturnType<typeof useEventosInterno> | null>(null);

export function ProvedorEventos({ children }: { children: React.ReactNode }) {
  return createElement(Contexto.Provider, { value: useEventosInterno() }, children);
}

export function useEventos() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useEventos exige ProvedorEventos acima na árvore");
  return contexto;
}
