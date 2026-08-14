import { createClient } from "@supabase/supabase-js";
import { carregarTudo } from "@/lib/grind/consultas";
import {
  derivarEstado,
  diaVazio,
  hoje,
  segundaDaSemana,
  semanaPerfeita,
  temCheckin,
  type Eventos,
} from "@/lib/grind/derive";
import { MARCOS_VAZIO, PULSOS, XP } from "@/lib/grind/spec";

/**
 * O sistema vindo até mim (§9). Ficar esperando que eu lembre de abrir é o modo de
 * falha mais provável de todos.
 *
 * Chamada por um timer systemd, não pelo navegador: por isso a autenticação é um
 * segredo compartilhado no header, e não a sessão do Supabase. Fora do matcher do
 * `proxy.ts`, senão a guarda de rota redirecionaria o POST para `/entrar`.
 *
 * A derivação usa exatamente as mesmas funções da tela. Duas implementações do mesmo
 * cálculo divergem, e a que diverge em silêncio é sempre a que ninguém olha.
 */

export const dynamic = "force-dynamic";

type Gatilho = "checkin" | "risco" | "teto" | "fechamento" | "marco-vazio";

type Aviso = { titulo: string; corpo: string; prioridade?: string };

export async function POST(requisicao: Request) {
  const segredo = process.env.GRIND_NOTIFY_SECRET;
  const topico = process.env.NTFY_TOPIC;

  if (!segredo || !topico) {
    return Response.json({ erro: "notificação não configurada no servidor" }, { status: 503 });
  }

  if (requisicao.headers.get("x-grind-secret") !== segredo) {
    return Response.json({ erro: "segredo inválido" }, { status: 401 });
  }

  const { gatilho } = (await requisicao.json()) as { gatilho: Gatilho };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // Sistema de um usuário só (§11.9): o perfil que existe é o dono.
  const { data: perfil } = await supabase.from("profile").select("user_id").limit(1).maybeSingle();
  if (!perfil) return Response.json({ erro: "nenhum perfil" }, { status: 404 });

  const dados = await carregarTudo(supabase, perfil.user_id);
  const aviso = montarAviso(gatilho, dados.eventos);

  // Notificação sem motivo ensina a ignorar: quando a condição não vale, não sai nada.
  if (!aviso) return Response.json({ enviado: false, gatilho });

  const resposta = await fetch(`https://ntfy.sh/${topico}`, {
    method: "POST",
    headers: {
      Title: aviso.titulo,
      Tags: "grind",
      ...(aviso.prioridade ? { Priority: aviso.prioridade } : {}),
    },
    body: aviso.corpo,
  });

  if (!resposta.ok) {
    return Response.json({ erro: `ntfy respondeu ${resposta.status}` }, { status: 502 });
  }

  return Response.json({ enviado: true, gatilho, titulo: aviso.titulo });
}

function montarAviso(gatilho: Gatilho, eventos: Eventos): Aviso | null {
  const dia = hoje();
  const estado = derivarEstado(eventos, dia);

  switch (gatilho) {
    case "checkin": {
      if (temCheckin(eventos, dia)) return null;
      return {
        titulo: "Grid do dia",
        corpo: `${PULSOS.length} hábitos · +${XP.checkin} XP só por abrir`,
      };
    }

    case "risco": {
      if (!diaVazio(eventos, dia)) return null;
      return {
        titulo: "Dia ainda vazio",
        corpo: `Streak de ${estado.streak} semana(s) em risco. 1 hábito salva o dia.`,
        prioridade: "high",
      };
    }

    case "teto": {
      if (!estado.noTeto) return null;
      const prova = estado.prova;
      return {
        titulo: "Teto da classe",
        corpo: prova
          ? `Prova de Amplitude: ${prova.atendidas} de ${prova.disciplinas} disciplinas em lv.${prova.nivel}. Só a Missão de Avanço destrava.`
          : "Só a Missão de Avanço destrava.",
      };
    }

    case "marco-vazio": {
      // "Ao chegar em": o marco exato, não qualquer Ω acima dele. Senão o mesmo
      // aviso sairia todo dia até o resgate.
      if (!MARCOS_VAZIO.some((marco) => marco.dias === estado.omega)) return null;
      return {
        titulo: `${estado.debuff.nome} · Ω ${estado.omega}`,
        corpo: `×${estado.debuff.multiplicador.toFixed(2).replace(".", ",")} no XP. Uma Missão de Resgate remove o marco — o Ω continua onde está.`,
        prioridade: "high",
      };
    }

    case "fechamento": {
      const semana = segundaDaSemana(dia);
      const feita = (tipo: string) =>
        eventos.missoes.some((m) => m.tipo === tipo && m.dia >= semana && m.dia <= dia);

      return {
        titulo: "Fechamento da semana",
        corpo: [
          `Missão: ${feita("semanal") ? "✔" : "✗"} · Boss: ${feita("boss") ? "✔" : "✗"}`,
          `Semana perfeita: ${semanaPerfeita(eventos, semana, dia) ? "sim" : "não"}`,
          "Escreva a missão da próxima antes de segunda.",
        ].join("\n"),
      };
    }

    default:
      return null;
  }
}
