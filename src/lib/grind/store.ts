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
import { concluidas, type Dados, type Missao } from "./consultas";
import {
  derivarEstado,
  hoje,
  noDisponivel,
  type Dia,
  type Estado,
  type EventoSessao,
  type Eventos,
} from "./derive";
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
  registrarSessao: (sessao: Omit<EventoSessao, "id">) => Promise<void>;
  removerSessao: (id: number) => Promise<void>;
  destravarNo: (noId: string) => Promise<void>;
  criarMissao: (missao: Omit<Missao, "id" | "aberta_em" | "concluida_em">) => Promise<void>;
  concluirMissao: (id: string) => Promise<void>;
  alternarCriterio: (id: string, indice: number) => Promise<void>;
  excluirMissao: (id: string) => Promise<void>;
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
          : supabase
              .from("pulse_log")
              .upsert({ dia, pulso, disciplina }, { onConflict: "user_id,dia,pulso", ignoreDuplicates: true }),
      );
    },
    [dados, otimista, supabase],
  );

  /**
   * A guarda local é só atalho de rede: ela enxerga o snapshot carregado quando a
   * página abriu, e o celular pode ter gravado o check-in de hoje depois disso. Quem
   * decide de verdade é a constraint do banco, e conflito aqui significa "já tem
   * check-in hoje" — que é o resultado desejado, não uma falha.
   */
  const registrarCheckin = useCallback(
    async (dia: Dia = hoje()) => {
      const { eventos } = dados;
      if (eventos.checkins.some((c) => c.dia === dia)) return;

      await otimista(
        { ...dados, eventos: { ...eventos, checkins: [...eventos.checkins, { dia }] } },
        () =>
          supabase
            .from("checkin_log")
            .upsert({ dia }, { onConflict: "user_id,dia", ignoreDuplicates: true }),
      );
    },
    [dados, otimista, supabase],
  );

  /**
   * Sessão não é otimista: o id vem do banco e é o que permite apagá-la
   * depois. Digitar minutos num formulário já custa segundos, então esperar a
   * resposta não muda a sensação de uso — ao contrário de marcar um Pulso.
   */
  const registrarSessao = useCallback(
    async (sessao: Omit<EventoSessao, "id">) => {
      setErro(null);
      const { data, error } = await supabase.from("session_log").insert(sessao).select("id").single();

      if (error) {
        setErro(error.message);
        return;
      }

      setDados((atuais) => ({
        ...atuais,
        eventos: { ...atuais.eventos, sessoes: [...atuais.eventos.sessoes, { ...sessao, id: data.id }] },
      }));
    },
    [supabase],
  );

  const removerSessao = useCallback(
    async (id: number) => {
      const anteriores = dados;
      setDados({
        ...dados,
        eventos: { ...dados.eventos, sessoes: dados.eventos.sessoes.filter((s) => s.id !== id) },
      });

      const { error } = await supabase.from("session_log").delete().eq("id", id);
      if (error) {
        setDados(anteriores);
        setErro(error.message);
      }
    },
    [dados, supabase],
  );

  /**
   * Destravar é irreversível de propósito (§7.2): nada no código apaga progresso.
   * A guarda é a mesma função que pinta o botão, então a regra dos pais (§4.4) vive
   * num lugar só.
   */
  const destravarNo = useCallback(
    async (noId: string) => {
      if (!noDisponivel(dados.eventos, noId)) return;
      const dia = hoje();

      await otimista(
        { ...dados, eventos: { ...dados.eventos, nos: [...dados.eventos.nos, { no: noId, dia }] } },
        () =>
          supabase
            .from("node_unlock")
            .upsert({ no_id: noId, destravado_em: dia }, { onConflict: "user_id,no_id", ignoreDuplicates: true }),
      );
    },
    [dados, otimista, supabase],
  );

  /**
   * Missão nova não é otimista, pelo mesmo motivo da sessão: o id vem do banco.
   * As travas da §6.1 e da §2.4 — uma por semana, não concluível no dia em que foi
   * escrita — são `check` e índice único na migração 0001. A UI reflete; o banco decide.
   */
  const criarMissao = useCallback(
    async (missao: Omit<Missao, "id" | "aberta_em" | "concluida_em">) => {
      setErro(null);
      const { data, error } = await supabase
        .from("mission")
        .insert(missao)
        .select("id, tipo, titulo, criterios, semana, aberta_em, concluida_em")
        .single();

      if (error) {
        setErro(error.message);
        return;
      }

      setDados((atuais) => comMissoes(atuais, [data, ...atuais.missoes]));
    },
    [supabase],
  );

  /** Atualiza uma missão no lugar, local e no banco, revertendo se a escrita falhar. */
  const alterarMissao = useCallback(
    async (id: string, mudanca: Partial<Missao>) => {
      const missoes = dados.missoes.map((m) => (m.id === id ? { ...m, ...mudanca } : m));

      await otimista(comMissoes(dados, missoes), () =>
        supabase.from("mission").update(mudanca).eq("id", id),
      );
    },
    [dados, otimista, supabase],
  );

  const concluirMissao = useCallback(
    (id: string) => alterarMissao(id, { concluida_em: hoje() }),
    [alterarMissao],
  );

  const alternarCriterio = useCallback(
    (id: string, indice: number) => {
      const missao = dados.missoes.find((m) => m.id === id);
      if (!missao) return Promise.resolve();

      const criterios = missao.criterios.map((c, i) =>
        i === indice ? { ...c, feito: !c.feito } : c,
      );
      return alterarMissao(id, { criterios });
    },
    [alterarMissao, dados.missoes],
  );

  /**
   * Só missão aberta se apaga. Concluída é progresso, e progresso não se apaga (§7.2);
   * já um título escrito errado precisa sair, senão a trava de uma missão por semana
   * deixa a semana inteira sem missão.
   */
  const excluirMissao = useCallback(
    async (id: string) => {
      if (dados.missoes.find((m) => m.id === id)?.concluida_em) return;

      await otimista(
        comMissoes(dados, dados.missoes.filter((m) => m.id !== id)),
        () => supabase.from("mission").delete().eq("id", id),
      );
    },
    [dados, otimista, supabase],
  );

  return {
    dados,
    eventos: dados.eventos,
    estado,
    erro,
    otimista,
    alternarPulso,
    registrarCheckin,
    registrarSessao,
    removerSessao,
    destravarNo,
    criarMissao,
    concluirMissao,
    alternarCriterio,
    excluirMissao,
  };
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
