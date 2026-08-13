/**
 * Derivação do estado do GRIND a partir de eventos.
 *
 * Princípio central (§11.10): o armazenamento guarda EVENTOS, nunca saldos.
 * XP total, streak, Ω e nível de disciplina são todos calculados aqui, sempre
 * a partir do zero. Isso é o que torna a recalibragem da §12 possível: mudar um
 * número em spec.ts recalcula o histórico inteiro.
 *
 * Nenhuma função deste arquivo guarda estado.
 */

import {
  CLASSES,
  LIMIARES_NIVEL,
  MARCOS_VAZIO,
  PULSOS,
  STREAK,
  XP,
  type Classe,
  type Disciplina,
  type PulsoId,
} from "./spec";

/** Data no formato YYYY-MM-DD. É a chave de tudo que é diário. */
export type Dia = string;

export type EventoPulso = {
  dia: Dia;
  pulso: PulsoId;
  disciplina: Disciplina;
};

export type EventoCheckin = { dia: Dia };

export type Eventos = {
  pulsos: EventoPulso[];
  checkins: EventoCheckin[];
  inicio: Dia;
};

// ---------------------------------------------------------------- datas

export function hoje(): Dia {
  return paraDia(new Date());
}

export function paraDia(data: Date): Dia {
  return data.toLocaleDateString("sv-SE"); // sv-SE já é YYYY-MM-DD local
}

function somarDias(dia: Dia, quantidade: number): Dia {
  const data = new Date(`${dia}T12:00:00`);
  data.setDate(data.getDate() + quantidade);
  return paraDia(data);
}

function intervaloDeDias(de: Dia, ate: Dia): Dia[] {
  const dias: Dia[] = [];
  for (let d = de; d <= ate; d = somarDias(d, 1)) dias.push(d);
  return dias;
}

/** Segunda-feira da semana do dia. A semana é a unidade de tempo do sistema (§6). */
function segundaDaSemana(dia: Dia): Dia {
  const data = new Date(`${dia}T12:00:00`);
  const diasDesdeSegunda = (data.getDay() + 6) % 7;
  return somarDias(dia, -diasDesdeSegunda);
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

/** XP bruto do dia, antes de qualquer multiplicador. */
export function xpBaseDoDia(eventos: Eventos, dia: Dia): number {
  const pulsos = pulsosDoDia(eventos, dia).length * XP.pulso;
  const checkin = temCheckin(eventos, dia) ? XP.checkin : 0;
  const combo = comboCompleto(eventos, dia) ? XP.comboDiario : 0;
  return pulsos + checkin + combo;
}

function diaVazio(eventos: Eventos, dia: Dia): boolean {
  return !temCheckin(eventos, dia) && pulsosDoDia(eventos, dia).length === 0;
}

// ---------------------------------------------------------------- vazio

/**
 * Ω: contador vitalício de dias perdidos (§7). Dia perdido é dia sem check-in
 * E sem nenhum Pulso. Dia fraco não conta; dia ausente conta.
 *
 * O dia corrente nunca conta: ainda dá tempo de salvá-lo.
 */
export function omega(eventos: Eventos, ate: Dia = hoje()): number {
  const ontem = somarDias(ate, -1);
  if (ontem < eventos.inicio) return 0;
  return intervaloDeDias(eventos.inicio, ontem).filter((d) => diaVazio(eventos, d)).length;
}

export function debuffVazio(quantidadeOmega: number) {
  return (
    MARCOS_VAZIO.find((marco) => quantidadeOmega >= marco.dias) ?? {
      dias: 0,
      multiplicador: 1,
      nome: null,
    }
  );
}

// ---------------------------------------------------------------- streak

/** Semana perfeita: nenhum dia vazio entre segunda e domingo (§5.3). */
function semanaPerfeita(eventos: Eventos, segunda: Dia): boolean {
  const dias = intervaloDeDias(segunda, somarDias(segunda, 6));
  return dias.every((d) => !diaVazio(eventos, d));
}

/** Semanas perfeitas consecutivas até a semana anterior à corrente. */
export function streakSemanas(eventos: Eventos, ate: Dia = hoje()): number {
  let semana = somarDias(segundaDaSemana(ate), -7);
  let total = 0;
  while (semana >= eventos.inicio && semanaPerfeita(eventos, semana)) {
    total += 1;
    semana = somarDias(semana, -7);
  }
  return total;
}

export function multiplicadorStreak(semanas: number): number {
  return Math.min(1 + semanas * STREAK.incremento, STREAK.teto);
}

// ---------------------------------------------------------------- xp

/**
 * XP total. Cada dia é multiplicado pelo streak vigente NAQUELA semana, não
 * pelo streak de hoje: o passado não é reescrito quando a streak cresce.
 */
export function xpTotal(eventos: Eventos, ate: Dia = hoje()): number {
  const debuff = debuffVazio(omega(eventos, ate)).multiplicador;

  return intervaloDeDias(eventos.inicio, ate).reduce((total, dia) => {
    const base = xpBaseDoDia(eventos, dia);
    if (base === 0) return total;
    return total + base * multiplicadorStreak(streakSemanas(eventos, dia)) * debuff;
  }, 0);
}

export function xpPorDisciplina(eventos: Eventos): Record<Disciplina, number> {
  const porDisciplina = {} as Record<Disciplina, number>;
  for (const evento of eventos.pulsos) {
    porDisciplina[evento.disciplina] = (porDisciplina[evento.disciplina] ?? 0) + XP.pulso;
  }
  return porDisciplina;
}

export function nivelDisciplina(xpDaDisciplina: number): number {
  const abaixoDoLimiar = LIMIARES_NIVEL.findIndex((limiar) => xpDaDisciplina < limiar);
  return abaixoDoLimiar === -1 ? LIMIARES_NIVEL.length : abaixoDoLimiar;
}

// ---------------------------------------------------------------- classe

export type ProgressoClasse = {
  classe: Classe;
  xpNaClasse: number;
  noTeto: boolean;
};

/**
 * Classe atual. O XP acumula até o teto e PARA (§2.3): sem Missão de Avanço
 * concluída, o excedente não vira progresso. Aqui a missão ainda não é
 * modelada, então a classe avança sozinha ao encher o teto.
 *
 * TODO: travar no teto quando a tabela `mission` existir.
 */
export function progressoClasse(xpAcumulado: number): ProgressoClasse {
  let restante = xpAcumulado;

  for (const classe of CLASSES) {
    if (restante < classe.teto) {
      return { classe, xpNaClasse: restante, noTeto: false };
    }
    restante -= classe.teto;
  }

  const ultima = CLASSES[CLASSES.length - 1];
  return { classe: ultima, xpNaClasse: ultima.teto, noTeto: true };
}
