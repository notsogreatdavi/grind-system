/**
 * Derivação do estado do GRIND a partir de eventos.
 *
 * Princípio central (§11.10): o armazenamento guarda EVENTOS, nunca saldos.
 * XP total, streak, Ω, nível de disciplina e classe são todos calculados aqui,
 * sempre do zero. Isso é o que torna a recalibragem da §12 possível: mudar um
 * número em spec.ts recalcula o histórico inteiro.
 *
 * Nenhuma função deste arquivo guarda estado, faz I/O ou conhece React.
 */

import {
  CLASSES,
  DISCIPLINAS,
  ENFASES,
  LIMIARES_NIVEL,
  MARCOS_VAZIO,
  NOS,
  PROVA_AMPLITUDE,
  PULSOS,
  SESSOES,
  STREAK,
  XP,
  XP_MISSAO,
  type Classe,
  type Disciplina,
  type EnfaseId,
  type PulsoId,
  type SessaoId,
  type TipoMissao,
} from "./spec";

/** Data no formato YYYY-MM-DD. É a chave de tudo que é diário. */
export type Dia = string;

export type EventoPulso = { dia: Dia; pulso: PulsoId; disciplina: Disciplina };
export type EventoCheckin = { dia: Dia };
export type EventoSessao = { dia: Dia; tipo: SessaoId; disciplina: Disciplina; minutos: number };
export type EventoNo = { no: string; dia: Dia };
export type EventoMissao = { id: string; tipo: TipoMissao; dia: Dia };

export type Eventos = {
  inicio: Dia;
  pulsos: EventoPulso[];
  checkins: EventoCheckin[];
  sessoes: EventoSessao[];
  /** Nós destravados, com a data do destrave. A árvore em si vive em spec.ts. */
  nos: EventoNo[];
  /** Só missões concluídas. As abertas não geram XP e não entram no cálculo. */
  missoes: EventoMissao[];
  enfases: EnfaseId[];
};

export const EVENTOS_VAZIOS: Eventos = {
  inicio: "",
  pulsos: [],
  checkins: [],
  sessoes: [],
  nos: [],
  missoes: [],
  enfases: [],
};

// ---------------------------------------------------------------- datas

export function hoje(): Dia {
  return paraDia(new Date());
}

export function paraDia(data: Date): Dia {
  return data.toLocaleDateString("sv-SE"); // sv-SE já é YYYY-MM-DD local
}

export function somarDias(dia: Dia, quantidade: number): Dia {
  const data = new Date(`${dia}T12:00:00`);
  data.setDate(data.getDate() + quantidade);
  return paraDia(data);
}

export function intervaloDeDias(de: Dia, ate: Dia): Dia[] {
  const dias: Dia[] = [];
  for (let d = de; d <= ate; d = somarDias(d, 1)) dias.push(d);
  return dias;
}

/** Segunda-feira da semana do dia. A semana é a unidade de tempo do sistema (§6). */
export function segundaDaSemana(dia: Dia): Dia {
  const data = new Date(`${dia}T12:00:00`);
  const diasDesdeSegunda = (data.getDay() + 6) % 7;
  return somarDias(dia, -diasDesdeSegunda);
}

export function diaDaSemana(dia: Dia): number {
  return (new Date(`${dia}T12:00:00`).getDay() + 6) % 7; // 0 = segunda
}

// ---------------------------------------------------------------- dia

export function pulsosDoDia(eventos: Eventos, dia: Dia): EventoPulso[] {
  return eventos.pulsos.filter((p) => p.dia === dia);
}

export function temCheckin(eventos: Eventos, dia: Dia): boolean {
  return eventos.checkins.some((c) => c.dia === dia);
}

/** Combo diário: todos os Pulsos marcados no mesmo dia dá +50 flat (§5.3). */
export function comboCompleto(eventos: Eventos, dia: Dia): boolean {
  const marcados = new Set(pulsosDoDia(eventos, dia).map((p) => p.pulso));
  return marcados.size === PULSOS.length;
}

/** Dia perdido é dia ausente, não dia fraco (§7). */
export function diaVazio(eventos: Eventos, dia: Dia): boolean {
  return (
    !temCheckin(eventos, dia) &&
    pulsosDoDia(eventos, dia).length === 0 &&
    !eventos.sessoes.some((s) => s.dia === dia)
  );
}

// ---------------------------------------------------------------- ganhos

/**
 * Uma linha de XP: de onde veio, quanto vale e a qual disciplina credita.
 *
 * `flat` marca o que fica fora dos multiplicadores — na fórmula da §5.3 o
 * combo diário é somado depois da multiplicação, não antes.
 */
export type Ganho = {
  dia: Dia;
  fonte: string;
  valor: number;
  disciplina: Disciplina | null;
  flat: boolean;
  tipo: "pulso" | "checkin" | "combo" | "sessao" | "no" | "missao" | "semana";
};

const TIER_DO_NO = new Map(NOS.map((no) => [no.id, no]));
const XP_SESSAO = new Map(SESSOES.map((s) => [s.id as SessaoId, s.xp]));

/**
 * Tudo que rende XP num dia, antes de qualquer multiplicador.
 * O bônus de semana perfeita não está aqui: depende da semana inteira e é
 * creditado pela varredura, no domingo.
 */
export function ganhosDoDia(eventos: Eventos, dia: Dia): Ganho[] {
  const ganhos: Ganho[] = [];

  if (temCheckin(eventos, dia)) {
    ganhos.push({ dia, fonte: "Check-in", valor: XP.checkin, disciplina: null, flat: false, tipo: "checkin" });
  }

  for (const pulso of pulsosDoDia(eventos, dia)) {
    ganhos.push({ dia, fonte: pulso.pulso, valor: XP.pulso, disciplina: pulso.disciplina, flat: false, tipo: "pulso" });
  }

  for (const sessao of eventos.sessoes.filter((s) => s.dia === dia)) {
    ganhos.push({
      dia,
      fonte: sessao.tipo,
      valor: XP_SESSAO.get(sessao.tipo) ?? 0,
      disciplina: sessao.disciplina,
      flat: false,
      tipo: "sessao",
    });
  }

  for (const destrave of eventos.nos.filter((n) => n.dia === dia)) {
    const no = TIER_DO_NO.get(destrave.no);
    if (!no) continue; // nó removido da spec: histórico sobrevive, XP não
    ganhos.push({ dia, fonte: no.nome, valor: XP.no[no.tier], disciplina: no.disciplina, flat: false, tipo: "no" });
  }

  for (const missao of eventos.missoes.filter((m) => m.dia === dia)) {
    const valor = XP_MISSAO[missao.tipo];
    if (valor === 0) continue;
    ganhos.push({ dia, fonte: missao.tipo, valor, disciplina: null, flat: false, tipo: "missao" });
  }

  if (comboCompleto(eventos, dia)) {
    ganhos.push({ dia, fonte: "Combo diário", valor: XP.comboDiario, disciplina: null, flat: true, tipo: "combo" });
  }

  return ganhos;
}

/** XP bruto do dia, sem multiplicador. Serve à faixa de check-in da FICHA. */
export function xpBaseDoDia(eventos: Eventos, dia: Dia): number {
  return ganhosDoDia(eventos, dia).reduce((total, g) => total + g.valor, 0);
}

// ---------------------------------------------------------------- multiplicadores

export function multiplicadorStreak(semanas: number): number {
  return Math.min(1 + semanas * STREAK.incremento, STREAK.teto);
}

/**
 * Debuff ativo. Cada Missão de Resgate concluída remove um marco, do mais
 * severo para o mais leve; o contador Ω continua onde estava (§7.1).
 */
export function debuffVazio(quantidadeOmega: number, resgates = 0) {
  const atingidos = MARCOS_VAZIO.filter((marco) => quantidadeOmega >= marco.dias);
  return atingidos[resgates] ?? { dias: 0, multiplicador: 1, nome: null };
}

/** Ênfase só multiplica a disciplina que ela afeta (§3.1). */
export function multiplicadorEnfase(enfases: readonly EnfaseId[], disciplina: Disciplina | null): number {
  if (!disciplina) return 1;
  return ENFASES.filter((e) => enfases.includes(e.id))
    .filter((e) => e.bonus?.disciplinas.some((d) => d === disciplina))
    .reduce((fator, e) => fator * (e.bonus?.fator ?? 1), 1);
}

// ---------------------------------------------------------------- semana

/**
 * Semana perfeita: nenhum dia vazio E a Missão Principal da semana concluída
 * (§5.2). Semana em curso nunca é perfeita — ainda dá pra estragar.
 *
 * Dias anteriores ao início do sistema não contam contra a primeira semana.
 */
export function semanaPerfeita(eventos: Eventos, segunda: Dia, ate: Dia): boolean {
  const domingo = somarDias(segunda, 6);
  if (domingo > ate) return false;

  const dias = intervaloDeDias(segunda < eventos.inicio ? eventos.inicio : segunda, domingo);
  if (dias.some((d) => diaVazio(eventos, d))) return false;

  return eventos.missoes.some((m) => m.tipo === "semanal" && m.dia >= segunda && m.dia <= domingo);
}

/** Segundas de todas as semanas tocadas pelo período, em ordem. */
function semanasDoPeriodo(inicio: Dia, ate: Dia): Dia[] {
  const semanas: Dia[] = [];
  for (let s = segundaDaSemana(inicio); s <= ate; s = somarDias(s, 7)) semanas.push(s);
  return semanas;
}

/**
 * Streak com que cada semana COMEÇA, ou seja, quantas semanas perfeitas
 * consecutivas vinham antes dela. Uma varredura só sobre as semanas: é o que
 * evita recalcular o histórico inteiro a cada dia.
 */
function streakPorSemana(eventos: Eventos, ate: Dia): Map<Dia, number> {
  const mapa = new Map<Dia, number>();
  let consecutivas = 0;

  for (const semana of semanasDoPeriodo(eventos.inicio, ate)) {
    mapa.set(semana, consecutivas);
    consecutivas = semanaPerfeita(eventos, semana, ate) ? consecutivas + 1 : 0;
  }

  return mapa;
}

/** Semanas perfeitas consecutivas até agora. É o número exibido na barra. */
export function streakSemanas(eventos: Eventos, ate: Dia = hoje()): number {
  let semana = somarDias(segundaDaSemana(ate), -7);
  let total = 0;
  while (semana >= segundaDaSemana(eventos.inicio) && semanaPerfeita(eventos, semana, ate)) {
    total += 1;
    semana = somarDias(semana, -7);
  }
  return total;
}

// ---------------------------------------------------------------- níveis

export function nivelDisciplina(xpDaDisciplina: number): number {
  const abaixoDoLimiar = LIMIARES_NIVEL.findIndex((limiar) => xpDaDisciplina < limiar);
  return abaixoDoLimiar === -1 ? LIMIARES_NIVEL.length : abaixoDoLimiar;
}

export type Prova = {
  disciplinas: number;
  nivel: number;
  atendidas: number;
  satisfeita: boolean;
};

/**
 * Prova de Amplitude (§4.3): quantas disciplinas já estão no nível exigido para
 * abrir a Missão de Avanço da classe atual.
 */
export function provaDeAmplitude(niveis: Record<Disciplina, number>, classe: number): Prova | null {
  const exigencia = PROVA_AMPLITUDE[classe];
  if (!exigencia) return null;

  const atendidas = DISCIPLINAS.filter((d) => niveis[d] >= exigencia.nivel).length;
  return {
    disciplinas: exigencia.disciplinas,
    nivel: exigencia.nivel,
    atendidas,
    satisfeita: atendidas >= exigencia.disciplinas,
  };
}

// ---------------------------------------------------------------- estado

export type Estado = {
  ate: Dia;
  classe: Classe;
  /** XP dentro da classe atual. Trava no teto até a Missão de Avanço (§2.3). */
  xpNaClasse: number;
  /** Soma dos tetos já vencidos + XP na classe. É o número histórico. */
  xpAcumulado: number;
  noTeto: boolean;
  avancos: number;
  xpPorDisciplina: Record<Disciplina, number>;
  niveis: Record<Disciplina, number>;
  prova: Prova | null;
  streak: number;
  multiplicadorStreak: number;
  omega: number;
  debuff: { dias: number; multiplicador: number; nome: string | null };
  resgates: number;
};

function disciplinasZeradas(): Record<Disciplina, number> {
  return Object.fromEntries(DISCIPLINAS.map((d) => [d, 0])) as Record<Disciplina, number>;
}

/**
 * A varredura. Um passe cronológico do início até `ate`, carregando Ω, streak,
 * debuff e classe como acumuladores.
 *
 * A ordem importa e é a da §5.3: o XP de um dia é multiplicado pelo streak
 * daquela semana e pelo debuff vigente naquele dia, não pelos de hoje. O
 * passado não é reescrito quando a streak cresce ou um debuff chega.
 */
export function derivarEstado(eventos: Eventos, ate: Dia = hoje()): Estado {
  const streaks = streakPorSemana(eventos, ate);
  const xpPorDisciplina = disciplinasZeradas();

  let omega = 0;
  let resgates = 0;
  let classeIdx = 0;
  let xpNaClasse = 0;
  let tetosVencidos = 0;

  const creditar = (valor: number, disciplina: Disciplina | null) => {
    // Disciplina não tem teto: no teto da classe os hábitos continuam
    // contando para as disciplinas, que é o que abre a Prova de Amplitude.
    if (disciplina) xpPorDisciplina[disciplina] += valor;
    xpNaClasse = Math.min(xpNaClasse + valor, CLASSES[classeIdx].teto);
  };

  const dias = eventos.inicio ? intervaloDeDias(eventos.inicio, ate) : [];

  for (const dia of dias) {
    const mStreak = multiplicadorStreak(streaks.get(segundaDaSemana(dia)) ?? 0);
    const mDebuff = debuffVazio(omega, resgates).multiplicador;

    const ganhos = ganhosDoDia(eventos, dia);
    if (diaDaSemana(dia) === 6 && semanaPerfeita(eventos, segundaDaSemana(dia), ate)) {
      ganhos.push({
        dia,
        fonte: "Semana perfeita",
        valor: XP.semanaPerfeita,
        disciplina: null,
        flat: false,
        tipo: "semana",
      });
    }

    for (const ganho of ganhos) {
      // Avanço de classe acontece ANTES do próprio bônus ser creditado, senão
      // os 2.000 cairiam num teto já cheio e evaporariam.
      if (ganho.tipo === "missao" && ganho.fonte === "avanco" && classeIdx < CLASSES.length - 1) {
        tetosVencidos += CLASSES[classeIdx].teto;
        classeIdx += 1;
        xpNaClasse = 0;
      }

      const valor = ganho.flat
        ? ganho.valor
        : Math.round(ganho.valor * mStreak * multiplicadorEnfase(eventos.enfases, ganho.disciplina) * mDebuff);

      creditar(valor, ganho.disciplina);
    }

    resgates += eventos.missoes.filter((m) => m.tipo === "resgate" && m.dia === dia).length;

    // O dia corrente nunca conta como perdido: ainda dá tempo de salvá-lo.
    if (dia < ate && diaVazio(eventos, dia)) omega += 1;
  }

  const niveis = Object.fromEntries(
    DISCIPLINAS.map((d) => [d, nivelDisciplina(xpPorDisciplina[d])]),
  ) as Record<Disciplina, number>;

  const classe = CLASSES[classeIdx];
  const streak = streakSemanas(eventos, ate);

  return {
    ate,
    classe,
    xpNaClasse,
    xpAcumulado: tetosVencidos + xpNaClasse,
    noTeto: xpNaClasse >= classe.teto,
    avancos: classeIdx,
    xpPorDisciplina,
    niveis,
    prova: provaDeAmplitude(niveis, classe.n),
    streak,
    multiplicadorStreak: multiplicadorStreak(streak),
    omega,
    debuff: debuffVazio(omega, resgates),
    resgates,
  };
}

// ---------------------------------------------------------------- atalhos

/** Ω isolado, para quem só precisa do contador (§7). */
export function omega(eventos: Eventos, ate: Dia = hoje()): number {
  return derivarEstado(eventos, ate).omega;
}

export function xpTotal(eventos: Eventos, ate: Dia = hoje()): number {
  return derivarEstado(eventos, ate).xpAcumulado;
}

export function xpPorDisciplina(eventos: Eventos, ate: Dia = hoje()): Record<Disciplina, number> {
  return derivarEstado(eventos, ate).xpPorDisciplina;
}

/** Um nó só destrava com todos os pais destravados (regra 4, §4.4). */
export function noDisponivel(eventos: Eventos, noId: string): boolean {
  const no = TIER_DO_NO.get(noId);
  if (!no) return false;
  const destravados = new Set(eventos.nos.map((n) => n.no));
  return !destravados.has(noId) && no.pais.every((pai) => destravados.has(pai));
}
