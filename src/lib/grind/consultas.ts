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

export async function carregarEventos(supabase: SupabaseClient, userId: string): Promise<Eventos> {
  const [perfil, checkins, pulsos, sessoes, nos, missoes] = await Promise.all([
    supabase.from("profile").select("inicio, enfases").eq("user_id", userId).maybeSingle(),
    supabase.from("checkin_log").select("dia"),
    supabase.from("pulse_log").select("dia, pulso, disciplina"),
    supabase.from("session_log").select("dia, tipo, disciplina, minutos"),
    supabase.from("node_unlock").select("no_id, destravado_em"),
    supabase.from("mission").select("id, tipo, concluida_em").not("concluida_em", "is", null),
  ]);

  return {
    inicio: perfil.data?.inicio ?? hoje(),
    enfases: (perfil.data?.enfases ?? []) as EnfaseId[],
    checkins: checkins.data ?? [],
    pulsos: pulsos.data ?? [],
    sessoes: sessoes.data ?? [],
    nos: (nos.data ?? []).map((n) => ({ no: n.no_id, dia: n.destravado_em })),
    missoes: (missoes.data ?? []).map((m) => ({ id: m.id, tipo: m.tipo, dia: m.concluida_em })),
  };
}

/** Missões abertas e concluídas, para a aba MISSÕES. */
export async function carregarMissoes(supabase: SupabaseClient): Promise<Missao[]> {
  const { data } = await supabase
    .from("mission")
    .select("id, tipo, titulo, criterios, semana, aberta_em, concluida_em")
    .order("aberta_em", { ascending: false });
  return data ?? [];
}

export async function carregarRecompensas(supabase: SupabaseClient): Promise<Recompensa[]> {
  const { data } = await supabase
    .from("reward")
    .select("id, tier, nome, destravada_em, resgatada_em")
    .order("criado_em");
  return data ?? [];
}
