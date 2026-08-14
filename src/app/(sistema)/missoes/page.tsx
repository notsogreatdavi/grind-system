"use client";

import { CartaoMissao } from "@/components/CartaoMissao";
import { FechamentoDomingo } from "@/components/FechamentoDomingo";
import { FormularioMissao } from "@/components/FormularioMissao";
import { HistoricoMissoes } from "@/components/HistoricoMissoes";
import { hoje, segundaDaSemana } from "@/lib/grind/derive";
import { useEventos } from "@/lib/grind/store";
import type { Missao } from "@/lib/grind/consultas";

/**
 * MISSÕES · "o que eu faço agora?" (§11.6).
 *
 * A aba mostra a semana corrente e mais nada de passado além do histórico: missão de
 * semana vencida não é acionável, e deixá-la na tela transforma pendência velha em
 * ruído permanente.
 */
export default function Missoes() {
  const { dados, estado, erro } = useEventos();
  const semana = segundaDaSemana(hoje());
  const dia = hoje();

  const aberta = (tipo: Missao["tipo"]) =>
    dados.missoes.find((m) => m.tipo === tipo && !m.concluida_em && (m.semana ?? semana) === semana);

  const semanal = aberta("semanal");
  const boss = aberta("boss");
  const avanco = dados.missoes.find((m) => m.tipo === "avanco" && !m.concluida_em);
  const resgate = dados.missoes.find((m) => m.tipo === "resgate" && !m.concluida_em);

  /** §6.1 e §2.4: entrega que cabe num dia não é missão. O banco recusa; a UI explica. */
  const cabeNumDia = (missao: Missao) =>
    dia <= missao.aberta_em ? "escrita hoje — concluível só a partir de amanhã" : null;

  const impedimentoAvanco = (missao: Missao) => {
    const faltam = missao.criterios.filter((c) => !c.feito).length;
    if (faltam > 0) return `faltam ${faltam} critério(s)`;
    if (estado.prova && !estado.prova.satisfeita) {
      return `Prova de Amplitude: ${estado.prova.atendidas}/${estado.prova.disciplinas} disciplinas em lv.${estado.prova.nivel}`;
    }
    return cabeNumDia(missao);
  };

  return (
    <>
      <FechamentoDomingo semana={semana} missoes={dados.missoes} />

      <p className="rotulo">SEMANA DE {semana}</p>

      {semanal ? (
        <CartaoMissao missao={semanal} impedimento={cabeNumDia(semanal)} />
      ) : (
        <FormularioMissao
          tipo="semanal"
          semana={semana}
          rotulo="MISSÃO PRINCIPAL"
          dica="O fio que dá direção aos sete dias. Não pode caber num único dia."
        />
      )}

      {boss ? (
        <CartaoMissao missao={boss} destaque />
      ) : (
        <FormularioMissao
          tipo="boss"
          semana={semana}
          rotulo="BOSS"
          dica="O critério não é dificuldade, é desconforto: algo que você evitaria naturalmente. Puro upside — falhar não custa nada."
        />
      )}

      {avanco ? (
        <>
          <p className="rotulo">MISSÃO DE AVANÇO · CLASSE {estado.classe.n} → {estado.classe.n + 1}</p>
          <CartaoMissao missao={avanco} impedimento={impedimentoAvanco(avanco)} />
        </>
      ) : (
        <FormularioMissao
          tipo="avanco"
          semana={null}
          rotulo={`MISSÃO DE AVANÇO · CLASSE ${estado.classe.n} → ${estado.classe.n + 1}`}
          dica="Entrega verificável, não-diária, envolvendo pelo menos duas disciplinas. Escreva o critério de conclusão antes de começar — é o que a torna uma missão."
          comCriterios
        />
      )}

      {estado.debuff.nome &&
        (resgate ? (
          <>
            <p className="rotulo">MISSÃO DE RESGATE</p>
            <CartaoMissao missao={resgate} impedimento={cabeNumDia(resgate)} />
          </>
        ) : (
          <FormularioMissao
            tipo="resgate"
            semana={null}
            rotulo="MISSÃO DE RESGATE"
            dica={`${estado.debuff.nome} ativa (×${estado.debuff.multiplicador
              .toFixed(2)
              .replace(".", ",")} no XP). Uma entrega definida remove um marco. O Ω continua onde está: a dívida é perdoável, o histórico não é reescrito.`}
            comCriterios
          />
        ))}

      {erro && <p className="text-xs text-erro">falha ao gravar: {erro}</p>}

      <HistoricoMissoes missoes={dados.missoes} />
    </>
  );
}
