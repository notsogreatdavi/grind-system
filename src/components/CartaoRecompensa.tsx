"use client";

import { useEventos } from "@/lib/grind/store";
import type { Recompensa } from "@/lib/grind/consultas";

/**
 * Uma recompensa em um dos três estados: bloqueada, destravada e resgatada.
 *
 * Bloqueada nunca some da tela (§11.7): recompensa invisível não puxa ninguém, e é
 * justamente a que ainda não deu que precisa ser vista.
 */
export function CartaoRecompensa({
  recompensa,
  temCredito,
}: {
  recompensa: Recompensa;
  temCredito: boolean;
}) {
  const { destravarRecompensa, resgatarRecompensa, excluirRecompensa } = useEventos();

  const resgatada = Boolean(recompensa.resgatada_em);
  const destravada = Boolean(recompensa.destravada_em);

  const cor = resgatada
    ? "text-texto-apagado"
    : destravada
      ? "border-sucesso text-sucesso"
      : temCredito
        ? "border-acento"
        : "text-texto-apagado";

  return (
    <li className={`transicao flex flex-wrap items-baseline gap-2 border p-2 text-xs ${cor}`}>
      <span aria-hidden>{resgatada ? "✔" : destravada ? "■" : "·"}</span>
      <span className={`flex-1 ${resgatada ? "line-through" : ""}`}>{recompensa.nome}</span>

      {resgatada ? (
        <span className="text-texto-apagado">resgatada em {recompensa.resgatada_em}</span>
      ) : destravada ? (
        <button
          onClick={() => resgatarRecompensa(recompensa.id)}
          className="transicao border border-sucesso px-2 py-1 hover:bg-sucesso hover:text-fundo"
        >
          resgatar
        </button>
      ) : (
        <>
          <button
            onClick={() => destravarRecompensa(recompensa.id)}
            disabled={!temCredito}
            className="transicao border border-acento px-2 py-1 text-acento hover:bg-acento hover:text-fundo disabled:cursor-not-allowed disabled:border-borda disabled:text-texto-apagado"
          >
            destravar
          </button>
          <button
            onClick={() => excluirRecompensa(recompensa.id)}
            aria-label="apagar recompensa"
            className="transicao text-texto-apagado hover:text-erro"
          >
            ×
          </button>
        </>
      )}
    </li>
  );
}
