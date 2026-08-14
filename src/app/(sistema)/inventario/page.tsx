"use client";

import { useState } from "react";
import { CartaoRecompensa } from "@/components/CartaoRecompensa";
import { creditosDeRecompensa } from "@/lib/grind/derive";
import { useEventos } from "@/lib/grind/store";
import { TIERS_RECOMPENSA, type TierRecompensa } from "@/lib/grind/spec";

/**
 * INVENTÁRIO · "o que eu ganho com isso?" (§11.7).
 *
 * Destravadas e bloqueadas na mesma tela, com a condição sempre visível. Sem moeda
 * secundária (§8): o destrave é condicional, não comprável — uma segunda economia
 * dobraria a complexidade sem adicionar significado.
 */
export default function Inventario() {
  const { dados, eventos, erro, criarRecompensa } = useEventos();
  const creditos = creditosDeRecompensa(eventos);

  const [tier, setTier] = useState<TierRecompensa>("micro");
  const [nome, setNome] = useState("");
  const [gravando, setGravando] = useState(false);

  async function gravar(evento: React.FormEvent) {
    evento.preventDefault();
    setGravando(true);
    await criarRecompensa({ tier, nome: nome.trim() });
    setNome("");
    setGravando(false);
  }

  return (
    <>
      <form onSubmit={gravar} className="quadro flex flex-wrap items-end gap-2 p-2">
        <label className="flex flex-col gap-1">
          <span className="rotulo">TIER</span>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as TierRecompensa)}
            className="campo"
          >
            {TIERS_RECOMPENSA.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} · {t.condicao}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1">
          <span className="rotulo">RECOMPENSA</span>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="o que você ganha"
            className="campo"
          />
        </label>

        <button
          type="submit"
          disabled={gravando || !nome.trim()}
          className="transicao border border-acento px-3 py-1 text-xs text-acento hover:bg-acento hover:text-fundo disabled:opacity-40"
        >
          {gravando ? "escrevendo…" : "escrever"}
        </button>
      </form>

      <p className="text-xs text-texto-apagado">
        Escreva a recompensa antes de bater a condição, senão o cérebro renegocia o prêmio
        depois de saber que ganhou. Destravada, não expira — e nenhuma falha posterior a
        retira.
      </p>

      {erro && <p className="text-xs text-erro">falha ao gravar: {erro}</p>}

      {TIERS_RECOMPENSA.map((t) => {
        const daTier = dados.recompensas.filter((r) => r.tier === t.id);
        const usados = daTier.filter((r) => r.destravada_em).length;
        const disponiveis = creditos[t.id] - usados;

        return (
          <section key={t.id} className="quadro p-2">
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
              <p className="rotulo">
                {t.nome.toUpperCase()} · {t.condicao}
              </p>
              <p className="rotulo">
                {disponiveis > 0 ? (
                  <span className="text-acento">{disponiveis} PARA DESTRAVAR</span>
                ) : (
                  <span>CONDIÇÃO NÃO ATINGIDA</span>
                )}
              </p>
            </div>

            {daTier.length === 0 ? (
              <p className="mt-2 text-xs text-texto-apagado">
                Nenhuma recompensa escrita neste tier.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1">
                {daTier.map((recompensa) => (
                  <CartaoRecompensa
                    key={recompensa.id}
                    recompensa={recompensa}
                    temCredito={disponiveis > 0}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
