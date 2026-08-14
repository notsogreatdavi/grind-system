# GRIND

Sistema pessoal de organização e progressão com gramática de RPG. Um lugar só para
hábitos, missões, habilidades e pendências.

As referências `§` espalhadas pelos comentários do código apontam para a spec conceitual do
sistema, que fica fora deste repositório junto com as anotações pessoais que a originaram.

---

## Como funciona, em um parágrafo

Seis **Pulsos** (hábitos diários) e **Sessões** de trabalho geram XP. Todo XP credita duas
contas ao mesmo tempo: o total, que move a **classe** (8 degraus, de `F` Diletante a `SS`
Polímata), e a **disciplina** de origem (`CMP` `MAT` `COR` `ART` `MUS` `MND`). Ao bater o
teto da classe o XP para de acumular: sair de lá exige uma **Missão de Avanço**, uma
entrega real, e só depois de satisfeita a **Prova de Amplitude** — N disciplinas acima de
um nível. É a regra que impede virar mono-classe.

## Arquitetura em uma decisão

**O banco guarda evento, nunca saldo.**

```
pulse_log · checkin_log · session_log · node · mission · reward
                        │
                        ▼
                   derive.ts  ← XP, streak, Ω, nível, classe
```

XP total, streak, contador `Ω` e nível de disciplina são todos derivados dos eventos a cada
carga. Nenhum contador é incrementado à mão, que é onde esse tipo de sistema sempre
dessincroniza. E como os valores de XP são v0 (§12), recalibrar é editar
`src/lib/grind/spec.ts`: o histórico inteiro recalcula sozinho.

## Stack

| Camada | Escolha |
|---|---|
| Front | Next.js 16 (App Router) · React 19 · Tailwind v4 |
| Dados | Supabase (Postgres + Auth magic link, RLS por usuário) |
| Notificação | ntfy.sh, disparado por timer systemd |
| Testes | `node --test` sobre a derivação de XP (sem dependência extra) |

Identidade visual: tema **Stratus**, com o desvio documentado na §10.1 da spec — canto reto
em tudo e mono (Victor Mono) como fonte dominante.

## Rodar local

```bash
npm install
cp .env.example .env.local   # preencher com as chaves do Supabase
npm run dev
```

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
| 7 · INVENTÁRIO | ⬜ |
| 8 · Notificações ntfy + systemd | ⬜ |
| 9 · Fechamento | ⬜ |
