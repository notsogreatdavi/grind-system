"use client";

import { useEventos } from "@/lib/grind/store";
import { Barra, numero } from "./Barra";
import { LIMIARES_NIVEL, DISCIPLINAS, NOME_DISCIPLINA } from "@/lib/grind/spec";

/** Classe, rank e barra de XP. É o §14 da spec, renderizado. */
export function PainelClasse() {
  const { estado } = useEventos();
  const { classe } = estado;

  return (
    <section className="quadro p-2">
      <p className="rotulo">CAMINHO: POLÍMATA</p>

      <h1 className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-tight">
        CLASSE {classe.n} · RANK {classe.rank} · {classe.nome.toUpperCase()}
      </h1>

      <p className="mt-2">
        <span className="rotulo mr-2">XP</span>
        <Barra valor={estado.xpNaClasse} total={classe.teto} blocos={20} className="text-acento" />
        <span className="ml-2">
          {numero(estado.xpNaClasse)} / {numero(classe.teto)}
        </span>
      </p>

      {estado.noTeto && (
        <p className="mt-2 text-alerta">
          Teto da classe. O XP para aqui: só a Missão de Avanço destrava.
        </p>
      )}

      {estado.debuff.nome && (
        <p className="mt-1 text-vazio">
          {estado.debuff.nome} · ×{estado.debuff.multiplicador.toFixed(2).replace(".", ",")} no XP ·
          uma Missão de Resgate remove
        </p>
      )}
    </section>
  );
}

/** As seis disciplinas com nível, barra e o ✔/✗ da Prova de Amplitude (§4.3). */
export function PainelDisciplinas() {
  const { estado } = useEventos();
  const { prova } = estado;

  return (
    <section className="quadro p-2">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="rotulo">DISCIPLINAS</p>
        {prova && (
          <p className="rotulo">
            PRÓXIMA PROVA: {prova.disciplinas} EM LV.{prova.nivel}
            <span className={prova.satisfeita ? "text-sucesso" : "text-texto-apagado"}>
              {" "}
              [{prova.atendidas}/{prova.disciplinas}]
            </span>
          </p>
        )}
      </div>

      <ul className="mt-2 flex flex-col gap-1">
        {DISCIPLINAS.map((d) => {
          const nivel = estado.niveis[d];
          const xp = estado.xpPorDisciplina[d];
          const base = LIMIARES_NIVEL[nivel - 1];
          const proximo = LIMIARES_NIVEL[nivel] ?? base;
          const atende = prova ? nivel >= prova.nivel : false;

          return (
            <li key={d} className="flex items-center gap-2">
              <span className="w-8 text-acento">{d}</span>
              <span className="hidden w-40 text-texto-secundario sm:inline">{NOME_DISCIPLINA[d]}</span>
              <span className="w-12">lv.{nivel}</span>
              <Barra valor={xp - base} total={Math.max(proximo - base, 1)} className="text-texto-secundario" />
              <span className="flex-1 text-right text-xs text-texto-apagado">{numero(xp)} XP</span>
              {prova && (
                <span className={atende ? "text-sucesso" : "text-texto-apagado"}>{atende ? "✔" : "✗"}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
