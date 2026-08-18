# GRIND

**Sistema pessoal de progressão com gramática de RPG.** Hábitos, missões, árvores de
habilidade e recompensas num lugar só, com a matemática toda derivada de eventos, nunca
armazenada como saldo.

[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-6BA3E8?style=flat-square)](LICENSE)

`Next.js 16` · `React 19` · `Tailwind v4` · `Supabase` · `ntfy` · 31 testes · 5 dependências

![A aba FICHA: faixa de check-in dos seis Pulsos, classe e rank com barra de XP, e as seis
disciplinas com nível e progresso](docs/ficha.png)

---

## O problema

Rastreador de hábito responde "marquei hoje?" e para aí. Nada nele diz se o esforço está
indo para algum lugar, e nada cobra amplitude: seis semanas marcando *Estudo* sempre na
mesma disciplina parecem constância perfeita num grid comum.

O GRIND separa as duas perguntas e amarra as duas a uma progressão que trava quando fica
desequilibrada. Não dá para subir de rank sendo bom em uma coisa só.

## Rodar

```bash
npm install
cp .env.example .env.local      # chaves do Supabase
npm run dev
```

Schema em `supabase/migrations/0001_grind.sql`, para aplicar pelo SQL Editor do dashboard.
Notificações são opcionais e têm passo a passo em [`infra/README.md`](infra/README.md).

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes da derivação de XP |
| `npm run lint` | eslint |
| `npm run build` | build de produção |

---

## O modelo

### XP em três escalas

| Escala | O que é | Ordem de grandeza |
|---|---|---|
| **Pulso** | Hábito diário. Seis, fixos. | 15 XP |
| **Sessão** | Bloco datado de trabalho focado. | 40–60 XP |
| **Marco** | Nó de árvore, missão, avanço de classe. | 200–2.000 XP |

Marcar todos os seis Pulsos no mesmo dia dá bônus de combo. O check-in em si vale pouco e
vale sempre: o custo de abrir o sistema tem que ser menor que o retorno, ou o hábito morre
e o sistema junto.

### Duas contas ao mesmo tempo

Todo XP credita a **classe** e a **disciplina** de origem, em paralelo.

**Classe** é a escada única: 8 degraus, de `F` Diletante a `SS` Polímata, cada um com um
teto. Ao bater o teto o XP para de acumular. Sair de lá exige uma **Missão de Avanço**, uma
entrega real, verificável e não-diária.

**Disciplinas** são seis eixos paralelos: `CMP` Computação, `MAT` Matemática, `COR` Corpo,
`ART` Arte, `MUS` Música e `MND` Linguagem & Mundo. Elas não têm teto, então mesmo com a
classe travada os hábitos continuam alimentando as disciplinas.

E é isso que destrava a classe. A **Prova de Amplitude** exige N disciplinas acima de um
nível antes de a Missão de Avanço poder ser concluída. É a regra que impede virar
mono-classe.

### Streak e o contrapeso

Semana perfeita, com todos os dias marcados e a missão da semana concluída, soma +0,05 ao
multiplicador de XP, até ×1,50. Uma semana quebrada zera.

Do outro lado, **Ω** conta dias perdidos: dia sem check-in, sem hábito e sem sessão. Dia
fraco não é dia perdido; dia ausente é. O contador é vitalício e nunca zera. Em 30, 50 e
100 aplica um debuff multiplicativo (×0,90 · ×0,85 · ×0,80), removível por uma **Missão de
Resgate**. Ela perdoa a dívida sem reescrever o histórico: o Ω fica onde está.

O que a Jornada do Vazio nunca faz: tirar rank, zerar XP ou retirar recompensa já
destravada. O custo de falhar é velocidade, nunca posição, porque sistema que faz perder
terreno é abandonado depois de duas semanas ruins.

### Árvores de habilidade

Uma por disciplina, todas com a mesma forma: 4 nós de fundamento → 3 de aplicação → 2 de
domínio. Um nó não é tarefa nem hábito: é **competência com critério binário**, verificável
numa sentada só. Tempo de serviço não é critério. O que importa é o que o tempo produziu.

Nó destravado é a prova auditável por trás do nível da disciplina, e é o que sustenta a
Prova de Amplitude.

### Inventário

Recompensas reais, escritas **antes** de a condição ser batida, senão o cérebro renegocia o
prêmio depois de saber que ganhou. Quatro tiers, com destrave derivado do histórico:
3 dias seguidos · 1 semana perfeita · 2 semanas perfeitas ou um nó de domínio · avanço de
classe. Sem moeda secundária: o destrave é condicional, não comprável.

---

## As cinco abas

| Aba | Pergunta que responde |
|---|---|
| **FICHA** | Onde estou? |
| **GRID** | Fui constante? |
| **ÁRVORE** | O que eu sei fazer? |
| **MISSÕES** | O que eu faço agora? |
| **INVENTÁRIO** | O que eu ganho com isso? |

Rank, streak e Ω ficam na barra, visíveis em toda aba.

![A aba GRID: grade de seis Pulsos por sete dias com streak individual de cada um, e
abaixo o painel da Jornada do Vazio com o contador Ω](docs/grid.png)

O GRID pergunta "fui constante?" na grade e "marquei sempre no mesmo lugar?" na camada de
disciplinas logo abaixo. São duas perguntas diferentes, e num rastreador comum elas ficam
colapsadas numa linha só.

![A aba ÁRVORE: os quatro nós de fundamento de Computação, e os tiers de aplicação e
domínio como slots vazios rotulados](docs/arvore.png)

Os tiers 2 e 3 estão vazios de verdade. A UI mostra os slots em vez de escondê-los, porque
esconder faria a árvore parecer pronta.

Duas coisas deliberadamente não são aba. A Jornada do Vazio mora dentro do GRID, porque
dias marcados e dias perdidos são a mesma pergunta pelo avesso, e porque uma aba dedicada à
falha vira santuário do fracasso e ninguém clica. As disciplinas moram na FICHA, porque são
um atributo, não um lugar.

A regra que manda em todas as outras: **o check-in não pode ficar atrás de um clique.**
Marcar um Pulso é um clique na primeira coisa da landing page; escolher a disciplina é um
segundo clique que abre inline, sem modal e sem trocar de tela.

---

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
real. Com saldo no banco isso seria impossível, porque o histórico já estaria congelado com
os números errados. Guardando evento, recalibrar é editar `src/lib/grind/spec.ts` e o
histórico inteiro se recalcula.

A ordem dos multiplicadores respeita o tempo: o XP de um dia usa o streak daquela semana e
o debuff vigente naquele dia. O passado não é reescrito quando a streak cresce.

A árvore segue o mesmo princípio um nível acima: a **estrutura** dos nós é código
(`spec.ts`) e o banco guarda só a data de destrave de cada id. Editar a árvore nunca vira
migração.

### Outras decisões que valem a linha

- **Escrita otimista.** O clique muda a tela na hora e o insert vai atrás; se falhar,
  reverte e avisa. Marcar um Pulso precisa parecer instantâneo mesmo em 4G ruim.
- **Conflito de escrita não é erro.** Com celular e desktop abertos, um cliente insere o
  que o outro já gravou. As escritas usam `on conflict do nothing`: "já existe" é o
  resultado desejado, não uma falha.
- **RLS por usuário em toda tabela.** A URL é pública; sem RLS, uma chave anônima vazada
  leria tudo.
- **Notificação condicional.** Check-in já feito, dia não vazio, teto não atingido ou Ω
  fora de um marco resultam em silêncio. Notificação sem motivo ensina a ignorar.

---

## Mapa do repositório

```
src/lib/grind/
  spec.ts         constantes da spec: XP, classes, disciplinas, nós, tiers
  derive.ts       toda a matemática. Sem estado, sem I/O, sem React
  derive.test.ts  31 testes travando as decisões que viraram número
  consultas.ts    leitura do banco. Único lugar que conhece nome de tabela
  store.ts        estado do cliente e escrita otimista

src/app/(sistema)/    as cinco abas, sob um layout que carrega tudo no servidor
src/app/api/notify/   a rota chamada pelos timers systemd
supabase/migrations/  schema, constraints e RLS
infra/                unidades systemd e o passo a passo da notificação
```

A separação que mais paga: `derive.ts` não importa React nem Supabase. É por isso que a
matemática do sistema é testável com `node --test` e sem mock nenhum.

## Identidade visual

Tema **Stratus**, com um desvio documentado: canto reto em tudo e mono (Victor Mono) como
fonte dominante, já que o GRIND é a única superfície da identidade cujo conceito *é* o
terminal. Layout rígido, movimento fluido: a estrutura não se mexe, o estado transiciona.

---

## O que está aberto de propósito

- **Os valores de XP são v0.** Serão recalibrados depois de um mês de uso real. É a razão
  de o banco guardar evento e não saldo.
- **Tiers 2 e 3 das árvores estão vazios.** Não dá para escrever critério honesto de
  domínio antes de ter fundamento; cada um é escrito quando a disciplina chega ao nível 3.
- **As ênfases das classes 5 e 7 não estão implementadas.** Elas mudam regra estrutural, e
  a primeira escolha só acontece na classe 3.
