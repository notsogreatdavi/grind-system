/**
 * Leitura do banco. Uma função traz TODOS os eventos do usuário e devolve o
 * formato que `derive.ts` consome — nada além daqui sabe nomes de tabela.
 *
 * O volume justifica a simplicidade: dois anos de uso diário dão poucos
 * milhares de linhas, e derivar tudo do zero é mais barato que sincronizar
 * saldos. Se um dia pesar, o lugar de paginar é aqui, sozinho.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { hoje, type Eventos } from "./derive";
import { MISSAO_AVANCO_CLASSE_1, type EnfaseId } from "./spec";

export type Missao = {
  id: string;
  tipo: "semanal" | "boss" | "avanco" | "resgate";
  titulo: string;
  criterios: { texto: string; feito: boolean }[];
  semana: string | null;
  aberta_em: string;
  concluida_em: string | null;
};

export type Recompensa = {
  id: string;
  tier: "micro" | "pequena" | "media" | "grande";
  nome: string;
  destravada_em: string | null;
  resgatada_em: string | null;
};

/**
 * Primeiro acesso: cria o perfil e a Missão de Avanço da classe 1 (§2.5).
 * Idempotente — roda a cada carga e não duplica nada.
 */
export async function garantirPerfil(supabase: SupabaseClient, userId: string) {
  const { data: perfil } = await supabase
    .from("profile")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (perfil) return;

  await supabase.from("profile").insert({ user_id: userId, inicio: hoje() });
  await supabase.from("mission").insert({
    user_id: userId,
    tipo: "avanco",
    titulo: MISSAO_AVANCO_CLASSE_1.titulo,
    criterios: MISSAO_AVANCO_CLASSE_1.criterios.map((texto) => ({ texto, feito: false })),
  });
}

export type Dados = {
  eventos: Eventos;
  /** Abertas e concluídas. As concluídas também entram em `eventos.missoes`. */
  missoes: Missao[];
  recompensas: Recompensa[];
};

/**
 * Tudo do usuário em um conjunto de queries. É o suficiente para as cinco abas:
 * o app inteiro cabe em memória e nenhuma aba precisa buscar nada ao abrir.
 */
export async function carregarTudo(supabase: SupabaseClient, userId: string): Promise<Dados> {
  const [perfil, checkins, pulsos, sessoes, nos, missoes, recompensas] = await Promise.all([
    supabase.from("profile").select("inicio, enfases").eq("user_id", userId).maybeSingle(),
    supabase.from("checkin_log").select("dia"),
    supabase.from("pulse_log").select("dia, pulso, disciplina"),
    supabase.from("session_log").select("dia, tipo, disciplina, minutos"),
    supabase.from("node_unlock").select("no_id, destravado_em"),
    supabase
      .from("mission")
      .select("id, tipo, titulo, criterios, semana, aberta_em, concluida_em")
      .order("aberta_em", { ascending: false }),
    supabase.from("reward").select("id, tier, nome, destravada_em, resgatada_em").order("criado_em"),
  ]);

  const listaMissoes: Missao[] = missoes.data ?? [];

  return {
    eventos: {
      inicio: perfil.data?.inicio ?? hoje(),
      enfases: (perfil.data?.enfases ?? []) as EnfaseId[],
      checkins: checkins.data ?? [],
      pulsos: pulsos.data ?? [],
      sessoes: sessoes.data ?? [],
      nos: (nos.data ?? []).map((n) => ({ no: n.no_id, dia: n.destravado_em })),
      missoes: concluidas(listaMissoes),
    },
    missoes: listaMissoes,
    recompensas: recompensas.data ?? [],
  };
}

/** A ponte entre a tabela `mission` e o que a derivação de XP enxerga. */
export function concluidas(missoes: Missao[]): Eventos["missoes"] {
  return missoes
    .filter((m) => m.concluida_em)
    .map((m) => ({ id: m.id, tipo: m.tipo, dia: m.concluida_em! }));
}
