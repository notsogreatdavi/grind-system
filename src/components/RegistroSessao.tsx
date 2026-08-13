"use client";

import { useState } from "react";
import { hoje, intervaloDeDias, somarDias } from "@/lib/grind/derive";
import { useEventos } from "@/lib/grind/store";
import { DISCIPLINAS, NOME_DISCIPLINA, SESSOES, type Disciplina, type SessaoId } from "@/lib/grind/spec";

/**
 * Sessões (§5.2): bloco datado de trabalho focado. Ficam no rodapé do GRID
 * porque são o registro mais pesado do sistema — tipo, disciplina e minutos —
 * e nada que exija digitar pode disputar espaço com o check-in.
 *
 * Sessão não tem trava de uma por dia: duas sessões profundas no mesmo dia são
 * duas sessões profundas.
 */

const DIAS_SEMANA = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

export function RegistroSessao({ segunda }: { segunda: string }) {
  const { eventos, registrarSessao, removerSessao } = useEventos();
  const dias = intervaloDeDias(segunda, somarDias(segunda, 6));
  const limite = hoje();

  const [dia, setDia] = useState(() => (dias.includes(limite) ? limite : segunda));
  const [tipo, setTipo] = useState<SessaoId>("estudo");
  const [disciplina, setDisciplina] = useState<Disciplina>("CMP");
  const [minutos, setMinutos] = useState("45");
  const [gravando, setGravando] = useState(false);

  const escolhida = SESSOES.find((s) => s.id === tipo)!;
  const naSemana = eventos.sessoes
    .filter((s) => s.dia >= segunda && s.dia <= somarDias(segunda, 6))
    .sort((a, b) => a.dia.localeCompare(b.dia));

  async function gravar(evento: React.FormEvent) {
    evento.preventDefault();
    setGravando(true);
    await registrarSessao({
      dia,
      tipo,
      disciplina: escolhida.disciplinaFixa ?? disciplina,
      minutos: Number(minutos),
    });
    setGravando(false);
  }

  return (
    <section className="quadro p-2">
      <p className="rotulo">SESSÕES DA SEMANA</p>

      {naSemana.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {naSemana.map((sessao) => (
            <li key={sessao.id ?? `${sessao.dia}-${sessao.tipo}`} className="flex items-baseline gap-2 text-xs">
              <span className="text-texto-apagado">{DIAS_SEMANA[dias.indexOf(sessao.dia)]}</span>
              <span className="flex-1 truncate">
                {SESSOES.find((s) => s.id === sessao.tipo)?.nome}
                <span className="text-texto-apagado"> · {sessao.disciplina} · {sessao.minutos} min</span>
              </span>
              <span className="text-sucesso">
                +{SESSOES.find((s) => s.id === sessao.tipo)?.xp}
              </span>
              {sessao.id !== undefined && (
                <button
                  onClick={() => removerSessao(sessao.id!)}
                  aria-label="remover sessão"
                  className="transicao text-texto-apagado hover:text-erro"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={gravar} className="mt-3 flex flex-wrap items-end gap-2 border-t border-borda pt-3">
        <Campo rotulo="DIA">
          <select value={dia} onChange={(e) => setDia(e.target.value)} className="campo">
            {dias
              .filter((d) => d <= limite)
              .map((d, i) => (
                <option key={d} value={d}>
                  {DIAS_SEMANA[i]}
                </option>
              ))}
          </select>
        </Campo>

        <Campo rotulo="TIPO">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as SessaoId)}
            className="campo"
          >
            {SESSOES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} · +{s.xp}
              </option>
            ))}
          </select>
        </Campo>

        <Campo rotulo="DISCIPLINA">
          {escolhida.disciplinaFixa ? (
            <span className="campo inline-block text-texto-secundario">
              {escolhida.disciplinaFixa}
            </span>
          ) : (
            <select
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value as Disciplina)}
              className="campo"
            >
              {DISCIPLINAS.map((d) => (
                <option key={d} value={d}>
                  {d} · {NOME_DISCIPLINA[d]}
                </option>
              ))}
            </select>
          )}
        </Campo>

        <Campo rotulo="MINUTOS">
          <input
            type="number"
            min={1}
            required
            value={minutos}
            onChange={(e) => setMinutos(e.target.value)}
            className="campo w-20"
          />
        </Campo>

        <button
          type="submit"
          disabled={gravando}
          className="transicao border border-acento px-3 py-1 text-xs text-acento hover:bg-acento hover:text-fundo disabled:opacity-40"
        >
          {gravando ? "gravando…" : "registrar"}
        </button>
      </form>
    </section>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="rotulo">{rotulo}</span>
      {children}
    </label>
  );
}
