"use client";

import { FundoTopografico } from "@/components/FundoTopografico";
import { NoArvore } from "@/components/NoArvore";
import { FORMA_ARVORE, NOS, type Disciplina, type Tier } from "@/lib/grind/spec";

/**
 * A árvore de uma disciplina: três tiers empilhados, forma fixa e igual em todas
 * as seis (§4.4). Sem lib de grafo — a forma é conhecida em tempo de escrita.
 *
 * Arestas em SVG ficaram de fora por enquanto: os tiers 2 e 3 não têm nós, então
 * não existe nenhuma ligação real para desenhar. Quando forem escritos, as arestas
 * saem de `no.pais`.
 */

const NOME_TIER: Record<Tier, string> = {
  1: "FUNDAMENTO",
  2: "APLICAÇÃO",
  3: "DOMÍNIO",
};

export function ArvoreDisciplina({ disciplina }: { disciplina: Disciplina }) {
  return (
    <section className="quadro relative overflow-hidden p-3">
      <FundoTopografico />

      <div className="relative flex flex-col gap-2">
        {([1, 2, 3] as Tier[]).map((tier, indice) => (
          <div key={tier} className="flex flex-col gap-2">
            {indice > 0 && (
              <p className="text-center text-texto-apagado" aria-hidden>
                ▼
              </p>
            )}

            <p className="rotulo">
              TIER {tier} · {NOME_TIER[tier]}
            </p>

            <FaixaDeTier disciplina={disciplina} tier={tier} />
          </div>
        ))}
      </div>
    </section>
  );
}

function FaixaDeTier({ disciplina, tier }: { disciplina: Disciplina; tier: Tier }) {
  const nos = NOS.filter((no) => no.disciplina === disciplina && no.tier === tier);

  /**
   * Tier sem nós vira slot vazio, nunca some (§12, pendência #3): não dá pra escrever
   * critério honesto de domínio antes de ter fundamento, e esconder o vazio faria a
   * árvore parecer pronta.
   */
  if (nos.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: FORMA_ARVORE[tier] }, (_, i) => (
          <p
            key={i}
            className="border border-dashed border-borda p-2 text-xs text-texto-apagado"
          >
            — a definir quando a disciplina chegar ao nível 3 —
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {nos.map((no) => (
        <NoArvore key={no.id} no={no} />
      ))}
    </div>
  );
}
