/**
 * Testes da derivação de XP.
 *
 * É o único lugar do sistema com teste automatizado, e é onde ele paga: esta
 * é a matemática que decide classe, streak, Ω e Prova de Amplitude. Toda
 * decisão da spec que virou número está travada aqui.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  derivarEstado,
  distribuicaoDoPulso,
  ganhosDoDia,
  intervaloDeDias,
  multiplicadorStreak,
  nivelDisciplina,
  noDisponivel,
  provaDeAmplitude,
  semanaPerfeita,
  somarDias,
  streakDoPulso,
  xpBaseDoDia,
  type Eventos,
} from "./derive";
import { DISCIPLINAS, PULSOS, type Disciplina } from "./spec";

// 2026-08-03 é uma segunda-feira. Toda semana dos testes começa nela.
const SEGUNDA = "2026-08-03";

function eventos(parcial: Partial<Eventos> = {}): Eventos {
  return {
    inicio: SEGUNDA,
    pulsos: [],
    checkins: [],
    sessoes: [],
    nos: [],
    missoes: [],
    enfases: [],
    ...parcial,
  };
}

/** Marca os 6 Pulsos e o check-in num dia. É o dia cheio da §5.4. */
function diaCheio(dia: string, disciplina: Disciplina = "CMP") {
  return {
    checkins: [{ dia }],
    pulsos: PULSOS.map((p) => ({
      dia,
      pulso: p.id,
      disciplina: p.disciplinaFixa ?? disciplina,
    })),
  };
}

function semanaCheia(segunda: string, disciplina: Disciplina = "CMP") {
  const dias = intervaloDeDias(segunda, "2100-01-01").slice(0, 7);
  return {
    checkins: dias.map((dia) => ({ dia })),
    pulsos: dias.flatMap((dia) => diaCheio(dia, disciplina).pulsos),
    missoes: [{ id: `sem-${segunda}`, tipo: "semanal" as const, dia: dias[3] }],
  };
}

// ---------------------------------------------------------------- pulso a pulso

test("streak do Pulso conta dias seguidos e para no primeiro buraco", () => {
  const e = eventos({
    pulsos: [SEGUNDA, somarDias(SEGUNDA, 2), somarDias(SEGUNDA, 3)].map((dia) => ({
      dia,
      pulso: "leitura" as const,
      disciplina: "CMP" as const,
    })),
  });

  assert.equal(streakDoPulso(e, "leitura", somarDias(SEGUNDA, 3)), 2);
  assert.equal(streakDoPulso(e, "escrita", somarDias(SEGUNDA, 3)), 0);
});

test("dia corrente ainda não marcado não quebra a streak do Pulso", () => {
  const e = eventos({
    pulsos: [SEGUNDA, somarDias(SEGUNDA, 1)].map((dia) => ({
      dia,
      pulso: "leitura" as const,
      disciplina: "CMP" as const,
    })),
  });

  assert.equal(streakDoPulso(e, "leitura", somarDias(SEGUNDA, 2)), 2);
});

test("distribuição do Pulso vem da mais frequente para a menos", () => {
  const e = eventos({
    pulsos: [
      { dia: SEGUNDA, pulso: "estudo", disciplina: "CMP" },
      { dia: somarDias(SEGUNDA, 1), pulso: "estudo", disciplina: "CMP" },
      { dia: somarDias(SEGUNDA, 2), pulso: "estudo", disciplina: "MAT" },
      { dia: SEGUNDA, pulso: "leitura", disciplina: "MND" },
    ],
  });

  assert.deepEqual(distribuicaoDoPulso(e, "estudo"), [
    { disciplina: "CMP", total: 2 },
    { disciplina: "MAT", total: 1 },
  ]);
  assert.deepEqual(distribuicaoDoPulso(e, "desenho"), []);
});

// ---------------------------------------------------------------- dia

test("dia com 6 pulsos e check-in vale 145 XP bruto", () => {
  const e = eventos(diaCheio(SEGUNDA));
  // 6 × 15 + 5 de check-in + 50 de combo
  assert.equal(xpBaseDoDia(e, SEGUNDA), 145);
});

test("combo diário não conta com 5 dos 6 pulsos", () => {
  const cheio = diaCheio(SEGUNDA);
  const e = eventos({ ...cheio, pulsos: cheio.pulsos.slice(0, 5) });
  assert.equal(xpBaseDoDia(e, SEGUNDA), 5 * 15 + 5);
});

test("combo diário é flat: não passa pelos multiplicadores", () => {
  const combo = ganhosDoDia(eventos(diaCheio(SEGUNDA)), SEGUNDA).find((g) => g.tipo === "combo");
  assert.equal(combo?.flat, true);
});

// ---------------------------------------------------------------- streak

test("multiplicador de streak sobe 0,05 por semana e trava em 1,50", () => {
  assert.equal(multiplicadorStreak(0), 1);
  assert.equal(multiplicadorStreak(6), 1.3);
  assert.equal(multiplicadorStreak(10), 1.5);
  assert.equal(multiplicadorStreak(40), 1.5);
});

test("semana só é perfeita com todos os dias marcados E a missão concluída", () => {
  const semMissao = eventos({ ...semanaCheia(SEGUNDA), missoes: [] });
  assert.equal(semanaPerfeita(semMissao, SEGUNDA, "2026-08-10"), false);

  const completa = eventos(semanaCheia(SEGUNDA));
  assert.equal(semanaPerfeita(completa, SEGUNDA, "2026-08-10"), true);
});

test("semana em curso nunca é perfeita", () => {
  const e = eventos(semanaCheia(SEGUNDA));
  assert.equal(semanaPerfeita(e, SEGUNDA, "2026-08-06"), false);
});

test("três semanas perfeitas dão streak 3 e multiplicador 1,15", () => {
  const s1 = semanaCheia("2026-08-03");
  const s2 = semanaCheia("2026-08-10");
  const s3 = semanaCheia("2026-08-17");
  const e = eventos({
    checkins: [...s1.checkins, ...s2.checkins, ...s3.checkins],
    pulsos: [...s1.pulsos, ...s2.pulsos, ...s3.pulsos],
    missoes: [...s1.missoes, ...s2.missoes, ...s3.missoes],
  });

  const estado = derivarEstado(e, "2026-08-25");
  assert.equal(estado.streak, 3);
  assert.equal(estado.multiplicadorStreak, 1.15);
});

test("uma semana quebrada zera a streak", () => {
  const s1 = semanaCheia("2026-08-03");
  const s3 = semanaCheia("2026-08-17");
  const e = eventos({
    checkins: [...s1.checkins, ...s3.checkins],
    pulsos: [...s1.pulsos, ...s3.pulsos],
    missoes: [...s1.missoes, ...s3.missoes],
  });

  assert.equal(derivarEstado(e, "2026-08-25").streak, 1);
});

// ---------------------------------------------------------------- vazio

test("Ω conta dia ausente e ignora o dia corrente", () => {
  const e = eventos({ ...diaCheio(SEGUNDA), inicio: SEGUNDA });
  // Seg marcada, ter/qua/qui vazias, sex é o dia corrente.
  assert.equal(derivarEstado(e, "2026-08-07").omega, 3);
});

test("dia fraco não é dia perdido", () => {
  // Terça tem só o check-in, sem nenhum Pulso: fraca, mas presente.
  const cheio = diaCheio(SEGUNDA);
  const e = eventos({ ...cheio, checkins: [...cheio.checkins, { dia: "2026-08-04" }] });
  assert.equal(derivarEstado(e, "2026-08-05").omega, 0);
});

test("debuff só chega no marco exato", () => {
  const vazias = eventos(diaCheio(SEGUNDA));
  // Ω conta os dias vazios ANTES do dia corrente, então o marco de N dias
  // perdidos é atingido no dia N+1 depois da segunda cheia.
  const noDiaVazio = (n: number) =>
    derivarEstado(vazias, intervaloDeDias(SEGUNDA, "2100-01-01")[n + 1]);

  assert.equal(noDiaVazio(29).debuff.nome, null);
  assert.equal(noDiaVazio(30).debuff.nome, "Névoa");
  assert.equal(noDiaVazio(30).debuff.multiplicador, 0.9);
  assert.equal(noDiaVazio(50).debuff.nome, "Erosão");
  assert.equal(noDiaVazio(100).debuff.nome, "Vazio");
});

test("Missão de Resgate remove um marco de debuff sem mexer no Ω", () => {
  const e = eventos({
    ...diaCheio(SEGUNDA),
    missoes: [{ id: "r1", tipo: "resgate", dia: "2026-09-05" }],
  });

  const estado = derivarEstado(e, "2026-09-30");
  assert.ok(estado.omega >= 50, "Ω continua acumulando");
  assert.equal(estado.debuff.nome, "Névoa"); // era Erosão, o resgate removeu um marco
});

// ---------------------------------------------------------------- disciplina

test("nível de disciplina vira exatamente no limiar", () => {
  assert.equal(nivelDisciplina(0), 1);
  assert.equal(nivelDisciplina(799), 1);
  assert.equal(nivelDisciplina(800), 2);
  assert.equal(nivelDisciplina(1_899), 2);
  assert.equal(nivelDisciplina(1_900), 3);
  assert.equal(nivelDisciplina(26_400), 10);
  assert.equal(nivelDisciplina(999_999), 10);
});

test("nó destravado credita o XP do tier na disciplina dele", () => {
  const e = eventos({ nos: [{ no: "mus-equipamento", dia: SEGUNDA }] });
  const estado = derivarEstado(e, SEGUNDA);
  assert.equal(estado.xpPorDisciplina.MUS, 200);
  assert.equal(estado.xpPorDisciplina.CMP, 0);
});

/**
 * A regra 4 da §4.4 — nó só destrava com todos os pais destravados — fica sem teste
 * enquanto `NOS` só tiver tier 1. Não há nó com pai para exercitar, e um fixture
 * inventado testaria o fixture, não a spec.
 */
test("nó de tier 1 está disponível desde o primeiro dia", () => {
  assert.equal(noDisponivel(eventos(), "cor-barra"), true);
});

test("nó já destravado deixa de estar disponível", () => {
  const e = eventos({ nos: [{ no: "cor-barra", dia: SEGUNDA }] });
  assert.equal(noDisponivel(e, "cor-barra"), false);
});

test("id que não existe na spec não está disponível", () => {
  assert.equal(noDisponivel(eventos(), "nao-existe"), false);
});

test("toda disciplina existe no estado, mesmo sem nenhum evento", () => {
  const estado = derivarEstado(eventos(), SEGUNDA);
  for (const d of DISCIPLINAS) assert.equal(estado.niveis[d], 1);
});

test("ênfase multiplica só a disciplina que ela afeta", () => {
  const base = { pulsos: [{ dia: SEGUNDA, pulso: "estudo" as const, disciplina: "CMP" as const }] };
  const sem = derivarEstado(eventos(base), SEGUNDA);
  const com = derivarEstado(eventos({ ...base, enfases: ["analista"] }), SEGUNDA);

  assert.equal(sem.xpPorDisciplina.CMP, 15);
  assert.equal(com.xpPorDisciplina.CMP, 18); // +20%
});

// ---------------------------------------------------------------- classe

test("XP trava no teto da classe 1", () => {
  // 90 dias cheios passam de 12.000 com folga.
  const dias = intervaloDeDias(SEGUNDA, "2100-01-01").slice(0, 90);
  const e = eventos({
    checkins: dias.map((dia) => ({ dia })),
    pulsos: dias.flatMap((dia) => diaCheio(dia).pulsos),
  });

  const estado = derivarEstado(e, dias[89]);
  assert.equal(estado.xpNaClasse, 12_000);
  assert.equal(estado.noTeto, true);
  assert.equal(estado.classe.n, 1);
});

test("Missão de Avanço concluída sobe de classe e credita os 2.000 na nova", () => {
  const e = eventos({ missoes: [{ id: "av1", tipo: "avanco", dia: SEGUNDA }] });
  const estado = derivarEstado(e, SEGUNDA);

  assert.equal(estado.classe.n, 2);
  assert.equal(estado.classe.rank, "E");
  assert.equal(estado.xpNaClasse, 2_000);
  assert.equal(estado.xpAcumulado, 14_000); // teto da classe 1 vencido + 2.000
});

test("progresso nunca regride: dia vazio depois do avanço não derruba a classe", () => {
  const e = eventos({ missoes: [{ id: "av1", tipo: "avanco", dia: SEGUNDA }] });
  assert.equal(derivarEstado(e, "2026-12-31").classe.n, 2);
});

// ---------------------------------------------------------------- prova

test("Prova de Amplitude da classe 1 exige 2 disciplinas em nível 3", () => {
  const niveis = { CMP: 6, MAT: 1, COR: 1, ART: 1, MUS: 1, MND: 1 };
  const parcial = provaDeAmplitude(niveis, 1);
  assert.deepEqual(parcial, { disciplinas: 2, nivel: 3, atendidas: 1, satisfeita: false });

  const completa = provaDeAmplitude({ ...niveis, MND: 3 }, 1);
  assert.equal(completa?.satisfeita, true);
});

test("a classe 8 é endgame e não tem prova", () => {
  assert.equal(provaDeAmplitude({ CMP: 10, MAT: 10, COR: 10, ART: 10, MUS: 10, MND: 10 }, 8), null);
});
