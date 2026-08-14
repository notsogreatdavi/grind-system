# GRIND

Sistema pessoal de organização e progressão com gramática de RPG. Um lugar só para
hábitos, missões, habilidades e recompensas.

Este repositório carrega **o sistema**, nunca os registros. As metas, os números e o
histórico de quem o usa vivem no banco, que é privado. As referências `§` nos comentários
do código apontam para a spec conceitual, que fica fora daqui pelo mesmo motivo.

---

## O modelo

### XP em três escalas

| Escala | O que é | Ordem de grandeza |
|---|---|---|
| **Pulso** | Hábito diário. Seis, fixos. | 15 XP |
| **Sessão** | Bloco datado de trabalho focado. | 40–60 XP |
| **Marco** | Nó de árvore, missão, avanço de classe. | 200–2.000 XP |

Marcar todos os seis Pulsos num dia dá um bônus de combo. O check-in em si vale pouco e
vale **sempre**: o custo de abrir o sistema tem que ser menor que o retorno, ou o hábito
morre e o sistema junto.

### Duas contas ao mesmo tempo

Todo XP credita a **classe** e a **disciplina** de origem, em paralelo.

**Classe** é a escada única: 8 degraus, de `F` Diletante a `SS` Polímata. Cada uma tem um
teto. Ao bater o teto, o XP para de acumular — sair de lá exige uma **Missão de Avanço**,
uma entrega real, verificável e não-diária.

**Disciplinas** são seis eixos paralelos: `CMP` Computação · `MAT` Matemática · `COR`
Corpo · `ART` Arte · `MUS` Música · `MND` Linguagem & Mundo. Elas não têm teto: mesmo com a
classe travada, os hábitos continuam alimentando as disciplinas.

E é isso que destrava a classe. A **Prova de Amplitude** exige N disciplinas acima de um
nível antes de a Missão de Avanço poder ser concluída. É a regra que impede virar
mono-classe: dá para ser excelente numa coisa só, mas não para subir de rank assim.

### Streak e o contrapeso

Semana perfeita (todos os dias marcados, missão da semana concluída) soma +0,05 ao
multiplicador de XP, até ×1,50. Uma semana quebrada zera.

Do outro lado, **Ω** conta dias perdidos — dia sem check-in, sem hábito e sem sessão. Dia
fraco não é dia perdido; dia ausente é. O contador é vitalício e nunca zera. Em 30, 50 e
100 ele aplica um debuff multiplicativo (×0,90 · ×0,85 · ×0,80), removível por uma
**Missão de Resgate** — que perdoa a dívida sem reescrever o histórico: o Ω fica onde está.

O que a Jornada do Vazio **nunca** faz: tirar rank, zerar XP, ou retirar recompensa já
destravada. O custo de falhar é velocidade, nunca posição. Um sistema que faz perder
terreno é um sistema abandonado depois de duas semanas ruins.

### Árvores de habilidade

Uma por disciplina, todas com a mesma forma: 4 nós de fundamento → 3 de aplicação → 2 de
domínio. Um nó não é tarefa nem hábito: é **competência com critério binário**, verificável
numa sentada só. Tempo de serviço não é critério — o que importa é o que o tempo produziu.

Nó destravado é a prova auditável por trás do nível de disciplina, e é o que sustenta a
Prova de Amplitude.

### Inventário

Recompensas reais, escritas **antes** de a condição ser batida — senão o cérebro renegocia
o prêmio depois de saber que ganhou. Quatro tiers, com destrave derivado do histórico:
3 dias seguidos · 1 semana perfeita · 2 semanas perfeitas ou um nó de domínio · avanço de
classe.

Sem moeda secundária: o destrave é condicional, não comprável.

## As cinco abas

| Aba | Pergunta que responde |
|---|---|
| **FICHA** | Onde estou? |
| **GRID** | Fui constante? |
| **ÁRVORE** | O que eu sei fazer? |
| **MISSÕES** | O que eu faço agora? |
| **INVENTÁRIO** | O que eu ganho com isso? |

Rank, streak e Ω ficam na barra, visíveis em toda aba.

Duas coisas deliberadamente **não** são aba. A Jornada do Vazio mora dentro do GRID, porque
dias marcados e dias perdidos são a mesma pergunta pelo avesso — e porque uma aba dedicada
à falha vira santuário do fracasso e ninguém clica. As disciplinas moram na FICHA, porque
são um atributo, não um lugar.

A regra que manda em todas as outras: **o check-in não pode ficar atrás de um clique.**
Marcar um Pulso é um clique na primeira coisa da landing page; escolher a disciplina é um
segundo clique que abre inline, sem modal e sem trocar de tela.

## Arquitetura em uma decisão

**O banco guarda evento, nunca saldo.**

```
checkin_log · pulse_log · session_log · node_unlock · mission · reward
                              │
                              ▼
                         derive.ts  ← XP, streak, Ω, nível, classe
```

XP total, streak, Ω, nível de disciplina e classe são derivados dos eventos a cada carga,
numa varredura cronológica única. Nenhum contador é incrementado à mão, que é onde esse
tipo de sistema sempre dessincroniza.

O ganho concreto: os valores de XP são v0 e serão recalibrados depois de um mês de uso
real. Com saldo no banco isso seria impossível — o histórico já estaria congelado com os
números errados. Guardando evento, recalibrar é editar `src/lib/grind/spec.ts` e o
histórico inteiro se recalcula.

A ordem dos multiplicadores respeita o tempo: o XP de um dia usa o streak daquela semana e
o debuff vigente **naquele** dia. O passado não é reescrito quando a streak cresce.

A árvore de habilidades segue o mesmo princípio, um nível acima: a **estrutura** dos nós é
código (`spec.ts`), e o banco guarda só a data de destrave de cada id. Editar a árvore
nunca vira migração.

## Notificações

O sistema vem até você: um timer systemd chama `POST /api/notify`, a rota deriva o estado
com as **mesmas** funções da tela e publica em [ntfy.sh](https://ntfy.sh).

Todos os gatilhos são condicionais — check-in já feito, dia não vazio, teto não atingido ou
Ω fora de um marco resultam em silêncio. Notificação sem motivo ensina a ignorar.

Configuração em [`infra/README.md`](infra/README.md).

## Stack

| Camada | Escolha |
|---|---|
| Front | Next.js 16 (App Router) · React 19 · Tailwind v4 |
| Dados | Supabase (Postgres, RLS por usuário, auth por e-mail e senha) |
| Notificação | ntfy.sh, disparado por timer systemd de usuário |
| Testes | `node --test` sobre a derivação de XP, sem dependência extra |

Quatro dependências de runtime no total. Identidade visual: tema **Stratus**, com um desvio
documentado — canto reto em tudo e mono (Victor Mono) como fonte dominante, porque o GRIND
é a única superfície da identidade cujo conceito *é* o terminal.

## Mapa do repositório

```
src/lib/grind/
  spec.ts        constantes da spec — XP, classes, disciplinas, nós, tiers
  derive.ts      toda a matemática. Sem estado, sem I/O, sem React
  derive.test.ts 31 testes travando as decisões que viraram número
  consultas.ts   leitura do banco. Único lugar que conhece nome de tabela
  store.ts       estado do cliente e escrita otimista

src/app/(sistema)/   as cinco abas, sob um layout que carrega tudo no servidor
src/app/api/notify/  a rota chamada pelos timers
supabase/migrations/ schema, constraints e RLS
infra/               unidades systemd e o passo a passo da notificação
```

A separação que mais paga: `derive.ts` não importa React nem Supabase. É por isso que a
matemática do sistema é testável com `node --test` e sem mock nenhum.

## Rodar local

```bash
npm install
cp .env.example .env.local   # preencher com as chaves do Supabase
npm run dev
```

O schema está em `supabase/migrations/0001_grind.sql`, para aplicar pelo SQL Editor do
dashboard.

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes da derivação de XP |
| `npm run lint` | eslint |
| `npm run build` | build de produção |

## Estado da construção

| Etapa | Status |
|---|---|
| 0 · Fundação, tokens Stratus, fontes | ✅ |
| 1 · Supabase: schema, RLS, auth | ✅ |
| 2 · Núcleo de domínio + testes | ✅ |
| 3 · FICHA + check-in · **primeiro deploy** | ✅ |
| 4 · GRID + Jornada do Vazio | ✅ |
| 5 · ÁRVORE de habilidades | ✅ |
| 6 · MISSÕES | ✅ |
| 7 · INVENTÁRIO | ✅ |
| 8 · Notificações ntfy + systemd | ✅ |
| 9 · Fechamento | ✅ |

### O que está aberto de propósito

- **Os valores de XP são v0.** Serão recalibrados depois de um mês de uso real. É a razão
  de o banco guardar evento e não saldo.
- **Tiers 2 e 3 das árvores estão vazios.** Não dá para escrever critério honesto de
  domínio antes de ter fundamento; cada um é escrito quando a disciplina chega ao nível 3.
  A UI mostra os slots vazios em vez de escondê-los — esconder faria a árvore parecer
  pronta.
- **As ênfases das classes 5 e 7 não estão implementadas.** Elas mudam regra estrutural, e
  a primeira escolha só acontece na classe 3.
