"use client";

import { useEventos } from "@/lib/grind/store";
import { XP_MISSAO } from "@/lib/grind/spec";
import type { Missao } from "@/lib/grind/consultas";

/**
 * Um cartão de missão, dos quatro tipos. O checklist é editável enquanto a missão
 * está aberta: marcar critério é o registro de que a entrega andou.
 *
 * `impedimento` é texto, não booleano: um botão desabilitado sem motivo visível é o
 * jeito mais rápido de fazer alguém achar que o sistema quebrou.
 */
export function CartaoMissao({
  missao,
  impedimento,
  destaque = false,
}: {
  missao: Missao;
  impedimento?: string | null;
  destaque?: boolean;
}) {
  const { concluirMissao, alternarCriterio, excluirMissao } = useEventos();
  const concluida = Boolean(missao.concluida_em);
  const xp = XP_MISSAO[missao.tipo];

  return (
    <article
      className={`quadro p-2 ${destaque && !concluida ? "border-destaque" : ""} ${
        concluida ? "border-sucesso" : ""
      }`}
    >
      <div className="flex items-baseline gap-2">
        <span aria-hidden className={concluida ? "text-sucesso" : "text-texto-apagado"}>
          {concluida ? "■" : "·"}
        </span>
        <h2 className={`flex-1 ${concluida ? "text-sucesso" : ""}`}>{missao.titulo}</h2>
        {xp > 0 && <span className="text-xs text-texto-apagado">+{xp} XP</span>}
      </div>

      {missao.criterios.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {missao.criterios.map((criterio, indice) => (
            <li key={criterio.texto}>
              <button
                onClick={() => alternarCriterio(missao.id, indice)}
                disabled={concluida}
                aria-pressed={criterio.feito}
                className="transicao flex w-full items-baseline gap-2 text-left text-xs disabled:opacity-60"
              >
                <span aria-hidden className={criterio.feito ? "text-sucesso" : "text-texto-apagado"}>
                  {criterio.feito ? "[x]" : "[ ]"}
                </span>
                <span className={criterio.feito ? "text-texto-secundario" : ""}>{criterio.texto}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {concluida ? (
          <span className="text-texto-apagado">concluída em {missao.concluida_em}</span>
        ) : (
          <>
            <button
              onClick={() => concluirMissao(missao.id)}
              disabled={Boolean(impedimento)}
              className="transicao border border-acento px-2 py-1 text-acento hover:bg-acento hover:text-fundo disabled:cursor-not-allowed disabled:opacity-30"
            >
              concluir
            </button>

            {impedimento ? (
              <span className="text-texto-apagado">{impedimento}</span>
            ) : (
              <span className="text-texto-apagado">aberta em {missao.aberta_em}</span>
            )}

            <button
              onClick={() => excluirMissao(missao.id)}
              className="transicao ml-auto text-texto-apagado hover:text-erro"
            >
              apagar
            </button>
          </>
        )}
      </div>
    </article>
  );
}
