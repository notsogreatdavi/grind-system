"use client";

import { useState } from "react";
import { useEventos } from "@/lib/grind/store";
import type { TipoMissao } from "@/lib/grind/spec";

/**
 * Escrever a missão é parte da missão (§2.4 regra 1): ela é datada antes de começar,
 * e é por isso que o banco recusa concluir no mesmo dia em que foi aberta.
 *
 * Os critérios são um por linha, em texto puro. Um construtor de checklist com botão
 * de "adicionar item" seria mais bonito e mais lento de usar — e velocidade aqui é o
 * que decide se a missão é escrita ou adiada (§11.1).
 */
export function FormularioMissao({
  tipo,
  semana,
  rotulo,
  dica,
  comCriterios = false,
}: {
  tipo: TipoMissao;
  semana: string | null;
  rotulo: string;
  dica: string;
  comCriterios?: boolean;
}) {
  const { criarMissao } = useEventos();
  const [titulo, setTitulo] = useState("");
  const [criterios, setCriterios] = useState("");
  const [gravando, setGravando] = useState(false);

  async function gravar(evento: React.FormEvent) {
    evento.preventDefault();
    setGravando(true);

    await criarMissao({
      tipo,
      titulo: titulo.trim(),
      semana,
      criterios: criterios
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean)
        .map((texto) => ({ texto, feito: false })),
    });

    setTitulo("");
    setCriterios("");
    setGravando(false);
  }

  return (
    <form onSubmit={gravar} className="quadro flex flex-col gap-2 p-2">
      <p className="rotulo">{rotulo}</p>
      <p className="text-xs text-texto-apagado">{dica}</p>

      <input
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="o que precisa estar entregue"
        className="campo"
      />

      {comCriterios && (
        <textarea
          rows={4}
          value={criterios}
          onChange={(e) => setCriterios(e.target.value)}
          placeholder="um critério por linha"
          className="campo resize-y"
        />
      )}

      <button
        type="submit"
        disabled={gravando || !titulo.trim()}
        className="transicao self-start border border-acento px-3 py-1 text-xs text-acento hover:bg-acento hover:text-fundo disabled:opacity-40"
      >
        {gravando ? "escrevendo…" : "escrever"}
      </button>
    </form>
  );
}
