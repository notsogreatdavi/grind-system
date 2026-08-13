-- GRIND · schema inicial
--
-- O banco guarda EVENTO, nunca saldo (§11.10). Não existe coluna de XP total,
-- de streak ou de Ω: tudo isso é derivado em src/lib/grind/derive.ts. A regra
-- de negócio mora no TypeScript; aqui só integridade (unique, check, RLS).
--
-- A árvore de habilidades também não está aqui: a estrutura dos nós é spec
-- (src/lib/grind/spec.ts) e o banco guarda apenas a data de destrave por id.
-- Assim, mexer na árvore nunca vira migração.
--
-- Aplicar pelo SQL Editor do dashboard do Supabase.

-- ---------------------------------------------------------------- domínios

create domain grind_disciplina as text
  check (value in ('CMP', 'MAT', 'COR', 'ART', 'MUS', 'MND'));

create domain grind_pulso as text
  check (value in ('leitura', 'escrita', 'desenho', 'estudo', 'exercicio', 'musica'));

create domain grind_sessao as text
  check (value in ('estudo', 'profunda', 'treino', 'ensaio', 'lista'));

-- ---------------------------------------------------------------- perfil

create table profile (
  user_id    uuid primary key default auth.uid() references auth.users on delete cascade,
  -- Origem do contador Ω: dias anteriores a esta data não existem para o sistema.
  inicio     date not null default current_date,
  -- Ênfases escolhidas nas classes 3, 5 e 7. Permanentes e acumulativas (§3).
  enfases    text[] not null default '{}',
  criado_em  timestamptz not null default now()
);

-- ---------------------------------------------------------------- eventos diários

create table checkin_log (
  id        bigint generated always as identity primary key,
  user_id   uuid not null default auth.uid() references auth.users on delete cascade,
  dia       date not null,
  criado_em timestamptz not null default now(),
  unique (user_id, dia)
);

create table pulse_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  dia         date not null,
  pulso       grind_pulso not null,
  disciplina  grind_disciplina not null,
  criado_em   timestamptz not null default now(),
  -- A trava que impede marcar o mesmo Pulso duas vezes e dobrar o XP do dia.
  unique (user_id, dia, pulso)
);

create table session_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  dia         date not null,
  tipo        grind_sessao not null,
  disciplina  grind_disciplina not null,
  minutos     integer not null check (minutos > 0),
  criado_em   timestamptz not null default now()
);

-- ---------------------------------------------------------------- marcos

create table node_unlock (
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  -- Id do nó em spec.ts. Sem FK: a árvore é código, não tabela.
  no_id         text not null,
  destravado_em date not null default current_date,
  primary key (user_id, no_id)
);

create table mission (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  tipo         text not null check (tipo in ('semanal', 'boss', 'avanco', 'resgate')),
  titulo       text not null,
  -- Lista de {texto, feito} — o checklist da Missão de Avanço (§2.5).
  criterios    jsonb not null default '[]'::jsonb,
  -- Segunda-feira da semana, para missão semanal e boss.
  semana       date,
  aberta_em    date not null default current_date,
  concluida_em date,
  check (concluida_em is null or concluida_em >= aberta_em),
  -- §6.1 e §2.4: missão semanal e de avanço não podem ser concluídas no mesmo
  -- dia em que foram escritas. É a regra que as define, e ela vale no banco.
  check (
    tipo not in ('semanal', 'avanco')
    or concluida_em is null
    or concluida_em > aberta_em
  )
);

-- Uma missão semanal e um boss por semana (§6).
create unique index mission_semanal_unica
  on mission (user_id, tipo, semana)
  where tipo in ('semanal', 'boss');

create table reward (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  tier          text not null check (tier in ('micro', 'pequena', 'media', 'grande')),
  nome          text not null,
  -- A condição não é coluna: é fixa por tier na §8, e vive em spec.ts.
  destravada_em date,
  resgatada_em  date,
  criado_em     timestamptz not null default now(),
  check (resgatada_em is null or destravada_em is not null)
);

-- ---------------------------------------------------------------- índices

create index pulse_log_dia on pulse_log (user_id, dia);
create index checkin_log_dia on checkin_log (user_id, dia);
create index session_log_dia on session_log (user_id, dia);
create index mission_semana on mission (user_id, semana);

-- ---------------------------------------------------------------- RLS
-- Sistema de um usuário só, mas a URL é pública: sem RLS, qualquer anon key
-- vazada lê tudo. Uma policy por tabela, sempre a mesma.

alter table profile      enable row level security;
alter table checkin_log  enable row level security;
alter table pulse_log    enable row level security;
alter table session_log  enable row level security;
alter table node_unlock  enable row level security;
alter table mission      enable row level security;
alter table reward       enable row level security;

create policy "dono" on profile     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on checkin_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on pulse_log   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on session_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on node_unlock for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on mission     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on reward      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
