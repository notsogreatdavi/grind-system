/**
 * Constantes do GRIND System, transcritas da spec conceitual.
 * Fonte: "GRIND System.md" no vault. Nenhum valor aqui é inventado.
 *
 * Os valores de XP são v0 (§12, pendência #1) e serão recalibrados após um mês
 * de uso real. Por isso ficam todos neste arquivo: recalibrar é editar aqui.
 */

export const DISCIPLINAS = ["CMP", "MAT", "COR", "ART", "MUS", "MND"] as const;
export type Disciplina = (typeof DISCIPLINAS)[number];

export const NOME_DISCIPLINA: Record<Disciplina, string> = {
  CMP: "Computação",
  MAT: "Matemática",
  COR: "Corpo",
  ART: "Arte & Expressão",
  MUS: "Música / Bateria",
  MND: "Linguagem & Mundo",
};

/**
 * Pulsos são verbos, não domínios (§5.2). A disciplina é escolhida ao marcar,
 * exceto nos dois que não têm versão em outra disciplina.
 */
export const PULSOS = [
  { id: "leitura", nome: "Leitura", custoMinimo: "20 min", disciplinaFixa: null },
  { id: "escrita", nome: "Escrita", custoMinimo: "algo terminado", disciplinaFixa: null },
  { id: "desenho", nome: "Desenho", custoMinimo: "algo terminado", disciplinaFixa: null },
  { id: "estudo", nome: "Estudo", custoMinimo: "20 min de foco", disciplinaFixa: null },
  { id: "exercicio", nome: "Exercício Físico", custoMinimo: "uma série que custa", disciplinaFixa: "COR" },
  { id: "musica", nome: "Prática Musical", custoMinimo: "15 min", disciplinaFixa: "MUS" },
] as const satisfies readonly {
  id: string;
  nome: string;
  custoMinimo: string;
  disciplinaFixa: Disciplina | null;
}[];

export type PulsoId = (typeof PULSOS)[number]["id"];

export const XP = {
  checkin: 5,
  pulso: 15,
  comboDiario: 50,
  missaoSemanal: 300,
  boss: 200,
  semanaPerfeita: 200,
  missaoAvanco: 2000,
  no: { 1: 200, 2: 400, 3: 800 } as Record<1 | 2 | 3, number>,
} as const;

export const CLASSES = [
  { n: 1, rank: "F", nome: "Diletante", teto: 12_000 },
  { n: 2, rank: "E", nome: "Aprendiz", teto: 14_000 },
  { n: 3, rank: "D", nome: "Artífice", teto: 16_000 },
  { n: 4, rank: "C", nome: "Erudito", teto: 18_000 },
  { n: 5, rank: "B", nome: "Humanista", teto: 20_000 },
  { n: 6, rank: "A", nome: "Enciclopedista", teto: 22_000 },
  { n: 7, rank: "S", nome: "Uomo Universale", teto: 24_000 },
  { n: 8, rank: "SS", nome: "Polímata", teto: 26_000 },
] as const;

export type Classe = (typeof CLASSES)[number];

/** XP acumulado na disciplina necessário para cada nível (§4.2). Índice = nível - 1. */
export const LIMIARES_NIVEL = [
  0, 800, 1_900, 3_400, 5_400, 8_000, 11_300, 15_400, 20_400, 26_400,
] as const;

/** Streak semanal: +0,05 por semana perfeita, teto ×1,50 (§5.3). */
export const STREAK = { incremento: 0.05, teto: 1.5 } as const;

/** Marcos da Jornada do Vazio e seus debuffs (§7). */
export const MARCOS_VAZIO = [
  { dias: 100, multiplicador: 0.8, nome: "Vazio" },
  { dias: 50, multiplicador: 0.85, nome: "Erosão" },
  { dias: 30, multiplicador: 0.9, nome: "Névoa" },
] as const;
