/**
 * Constantes do GRIND System, transcritas da spec conceitual.
 * Fonte: `grind.md` na raiz do repositório. Nenhum valor aqui é inventado.
 *
 * Os valores de XP são v0 (§12, pendência #1) e serão recalibrados após um mês
 * de uso real. Por isso ficam todos neste arquivo: recalibrar é editar aqui, e
 * como o banco só guarda evento (§11.10), o histórico inteiro se recalcula.
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

/** Sessões: bloco datado de trabalho focado (§5.2). */
export const SESSOES = [
  { id: "estudo", nome: "Sessão de estudo", duracao: "45–90 min", xp: 40, disciplinaFixa: null },
  { id: "profunda", nome: "Sessão profunda", duracao: "90+ min", xp: 60, disciplinaFixa: null },
  { id: "treino", nome: "Treino completo", duracao: "—", xp: 50, disciplinaFixa: "COR" },
  { id: "ensaio", nome: "Ensaio de bateria", duracao: "—", xp: 50, disciplinaFixa: "MUS" },
  { id: "lista", nome: "Lista de exercícios concluída", duracao: "—", xp: 50, disciplinaFixa: "MAT" },
] as const satisfies readonly {
  id: string;
  nome: string;
  duracao: string;
  xp: number;
  disciplinaFixa: Disciplina | null;
}[];

export type SessaoId = (typeof SESSOES)[number]["id"];

export const XP = {
  checkin: 5,
  pulso: 15,
  comboDiario: 50,
  missaoSemanal: 300,
  boss: 200,
  semanaPerfeita: 200,
  missaoAvanco: 2000,
  no: { 1: 200, 2: 400, 3: 800 } as Record<Tier, number>,
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

/** Marcos da Jornada do Vazio e seus debuffs (§7). Do mais severo ao mais leve. */
export const MARCOS_VAZIO = [
  { dias: 100, multiplicador: 0.8, nome: "Vazio" },
  { dias: 50, multiplicador: 0.85, nome: "Erosão" },
  { dias: 30, multiplicador: 0.9, nome: "Névoa" },
] as const;

/**
 * Prova de Amplitude (§4.3): o gate que impede virar mono-classe. Indexado pela
 * classe DE ONDE se sai. A classe 8 é endgame e não tem próxima.
 */
export const PROVA_AMPLITUDE: Record<number, { disciplinas: number; nivel: number } | null> = {
  1: { disciplinas: 2, nivel: 3 },
  2: { disciplinas: 2, nivel: 3 },
  3: { disciplinas: 3, nivel: 4 },
  4: { disciplinas: 3, nivel: 4 },
  5: { disciplinas: 4, nivel: 5 },
  6: { disciplinas: 4, nivel: 5 },
  7: { disciplinas: 5, nivel: 6 },
  8: null,
};

/**
 * Ênfases (§3). Escolha permanente nas classes 3, 5 e 7; acumulam.
 *
 * `bonus` só existe nas ênfases da primeira escolha, que são as expressáveis
 * como multiplicador de disciplina. As das classes 5 e 7 mudam regra estrutural
 * (teto de streak, valor de sessão longa, XP de marco) e serão implementadas
 * quando forem escolhíveis — a primeira só chega na classe 3.
 */
export const ENFASES = [
  { id: "analista", nome: "Analista", classe: 3, efeito: "+20% XP em Computação e Matemática", bonus: { disciplinas: ["CMP", "MAT"], fator: 1.2 } },
  { id: "artesao", nome: "Artesão", classe: 3, efeito: "+20% XP em Arte e Música", bonus: { disciplinas: ["ART", "MUS"], fator: 1.2 } },
  { id: "estoico", nome: "Estoico", classe: 3, efeito: "+25% XP em Corpo · +1 dia de tolerância por semana", bonus: { disciplinas: ["COR"], fator: 1.25 } },
  { id: "cronista", nome: "Cronista", classe: 3, efeito: "+20% XP em Linguagem & Mundo · leitura conta como sessão profunda", bonus: { disciplinas: ["MND"], fator: 1.2 } },
  { id: "profundidade", nome: "Profundidade", classe: 5, efeito: "Sessões acima de 90 min valem ×1,5", bonus: null },
  { id: "constancia", nome: "Constância", classe: 5, efeito: "Teto do multiplicador de streak sobe para ×1,75", bonus: null },
  { id: "amplitude", nome: "Amplitude", classe: 5, efeito: "+30% XP em disciplina abaixo do seu nível médio", bonus: null },
  { id: "construtor", nome: "Construtor", classe: 7, efeito: "Marcos e entregas dão +50% XP", bonus: null },
  { id: "mestre", nome: "Mestre", classe: 7, efeito: "Destravar nó de árvore dá +100% XP", bonus: null },
  { id: "andarilho", nome: "Andarilho", classe: 7, efeito: "Imune ao debuff do Vazio · teto da classe +20%", bonus: null },
] as const satisfies readonly {
  id: string;
  nome: string;
  classe: number;
  efeito: string;
  bonus: { disciplinas: readonly Disciplina[]; fator: number } | null;
}[];

export type EnfaseId = (typeof ENFASES)[number]["id"];

export type Tier = 1 | 2 | 3;

export type No = {
  id: string;
  disciplina: Disciplina;
  tier: Tier;
  nome: string;
  criterio: string;
  /** Ids dos nós pai. Nó só destrava com todos destravados (regra 4, §4.4). */
  pais: readonly string[];
};

/**
 * Árvores de habilidade (§4.4, §4.5). A ESTRUTURA é spec, não dado de usuário:
 * o banco guarda só a data de destrave de cada id. Editar a árvore é editar
 * aqui, e nenhuma migração é necessária.
 *
 * Tiers 2 e 3 estão vazios de propósito (§12, pendência #3): não dá pra
 * escrever critério honesto de domínio antes de ter fundamento. Cada um é
 * escrito quando a disciplina chega ao nível 3.
 */
export const NOS: readonly No[] = [
  { id: "cmp-git", disciplina: "CMP", tier: 1, nome: "Git além do commit", criterio: "Reescrevo 5 commits em rebase interativo e resolvo um conflito sem desfazer tudo", pais: [] },
  { id: "cmp-recursao", disciplina: "CMP", tier: 1, nome: "Recursão dominada", criterio: "Resolvo 10 problemas recursivos sem consultar", pais: [] },
  { id: "cmp-complexidade", disciplina: "CMP", tier: 1, nome: "Complexidade assintótica", criterio: "Analiso 10 algoritmos e justifico a cota por escrito", pais: [] },
  { id: "cmp-software", disciplina: "CMP", tier: 1, nome: "Software que alguém usa", criterio: "Publico um projeto com README que um estranho instala e roda sem me perguntar nada", pais: [] },

  { id: "mat-inducao", disciplina: "MAT", tier: 1, nome: "Indução forte", criterio: "Demonstro 5 proposições sozinho", pais: [] },
  { id: "mat-demonstracao", disciplina: "MAT", tier: 1, nome: "Demonstração legível", criterio: "Escrevo uma prova em LaTeX que outra pessoa lê inteira sem travar", pais: [] },
  { id: "mat-lista", disciplina: "MAT", tier: 1, nome: "Lista fechada", criterio: "Termino uma lista completa sem consultar solução", pais: [] },
  { id: "mat-geometria", disciplina: "MAT", tier: 1, nome: "Geometria do papel ao código", criterio: "Implemento do zero um resultado de geometria discreta", pais: [] },

  { id: "cor-barra", disciplina: "COR", tier: 1, nome: "Barra fixa · 8", criterio: "8 repetições limpas em série única", pais: [] },
  { id: "cor-deadhang", disciplina: "COR", tier: 1, nome: "Dead hang · 3 min", criterio: "3 minutos contínuos, sem soltar", pais: [] },
  { id: "cor-flexoes", disciplina: "COR", tier: 1, nome: "Flexões · 20", criterio: "20 repetições limpas em série única", pais: [] },
  { id: "cor-agachamento", disciplina: "COR", tier: 1, nome: "Agachamento · 30", criterio: "30 repetições em série única", pais: [] },

  { id: "art-lesson1", disciplina: "ART", tier: 1, nome: "Drawabox · Lesson 1", criterio: "Lição concluída e submetida à crítica", pais: [] },
  { id: "art-boxes", disciplina: "ART", tier: 1, nome: "250 Box Challenge", criterio: "Desafio concluído, as 250", pais: [] },
  { id: "art-lesson2", disciplina: "ART", tier: 1, nome: "Drawabox · Lesson 2", criterio: "Contorno e textura concluídos", pais: [] },
  { id: "art-cylinders", disciplina: "ART", tier: 1, nome: "250 Cylinder Challenge", criterio: "Desafio concluído", pais: [] },

  { id: "mus-equipamento", disciplina: "MUS", tier: 1, nome: "Ter com o que praticar", criterio: "Pad de estudo, par de baquetas e metrônomo em casa", pais: [] },
  { id: "mus-empunhadura", disciplina: "MUS", tier: 1, nome: "Empunhadura estável", criterio: "5 min de matched grip sem precisar corrigir a pegada", pais: [] },
  { id: "mus-single-stroke", disciplina: "MUS", tier: 1, nome: "Single stroke roll · 60bpm", criterio: "2 minutos limpos no metrônomo", pais: [] },
  { id: "mus-leitura", disciplina: "MUS", tier: 1, nome: "Ler ritmo", criterio: "Executo uma partitura rítmica simples em 4/4 lendo, não decorando", pais: [] },

  { id: "mnd-paper", disciplina: "MND", tier: 1, nome: "Paper sem dicionário", criterio: "Leio um paper técnico inteiro em inglês sem consultar tradução", pais: [] },
  { id: "mnd-escrita", disciplina: "MND", tier: 1, nome: "Inglês escrito longo", criterio: "1.000 palavras em inglês revisadas, sem reescrita estrutural", pais: [] },
  { id: "mnd-livro", disciplina: "MND", tier: 1, nome: "Livro fechado", criterio: "Termino um livro de não-ficção e escrevo uma nota de síntese", pais: [] },
  { id: "mnd-falado", disciplina: "MND", tier: 1, nome: "Inglês falado", criterio: "30 minutos de conversa sem travar", pais: [] },
];

/** Quantidade de nós por tier na forma canônica da árvore (§4.4). */
export const FORMA_ARVORE: Record<Tier, number> = { 1: 4, 2: 3, 3: 2 };

/** Tipos de missão (§6, §2.4, §7.1). */
export const TIPOS_MISSAO = ["semanal", "boss", "avanco", "resgate"] as const;
export type TipoMissao = (typeof TIPOS_MISSAO)[number];

export const XP_MISSAO: Record<TipoMissao, number> = {
  semanal: XP.missaoSemanal,
  boss: XP.boss,
  avanco: XP.missaoAvanco,
  resgate: 0,
};

/**
 * Missão de Avanço ativa da classe 1 (§2.5). Semeada no primeiro acesso, porque
 * um sistema que abre sem missão definida convida a acumular XP sem entregar
 * nada — que é exatamente o que o teto existe para impedir.
 */
export const MISSAO_AVANCO_CLASSE_1 = {
  titulo: "Construir e publicar um site de portfólio",
  criterios: [
    "site no ar, em domínio próprio, fora do localhost",
    "tokens Stratus aplicados (§10.2), responsivo",
    "3+ projetos, cada um com problema, decisão técnica e resultado",
    "link para GitHub e LinkedIn",
    "pt-BR e en completos, com troca de idioma no site",
    "enviado em pelo menos 1 candidatura real (uma em cada idioma)",
  ],
} as const;

/** Tiers de recompensa do Inventário e sua condição de destrave (§8). */
export const TIERS_RECOMPENSA = [
  { id: "micro", nome: "Micro", condicao: "3 dias seguidos" },
  { id: "pequena", nome: "Pequena", condicao: "1 semana perfeita" },
  { id: "media", nome: "Média", condicao: "2 semanas perfeitas ou nó de árvore nível 3" },
  { id: "grande", nome: "Grande", condicao: "Avanço de classe" },
] as const;

export type TierRecompensa = (typeof TIERS_RECOMPENSA)[number]["id"];
