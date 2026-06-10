-- ============================================================
--  Salão de Beleza — Schema Supabase
--  Execute este arquivo no SQL Editor do seu projeto Supabase
-- ============================================================

-- Extensão para UUIDs
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
--  Tabelas
-- ─────────────────────────────────────────────────────────────

create table funcionarias (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  especialidade text not null,
  initials    text not null,
  cor         text not null check (cor in ('teal', 'pink', 'amber', 'purple')),
  ativa       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table servicos (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  duracao_min integer not null,
  preco       numeric(10, 2) not null,
  icone       text not null,
  cor         text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table agendamentos (
  id              uuid primary key default uuid_generate_v4(),
  funcionaria_id  uuid not null references funcionarias (id),
  servico_id      uuid not null references servicos (id),
  cliente_nome    text not null,
  cliente_phone   text not null,
  data            date not null,
  hora            time not null,
  status          text not null default 'confirmado'
                    check (status in ('confirmado', 'cancelado')),
  created_at      timestamptz not null default now(),

  -- garante que cada profissional só tem um agendamento por slot
  constraint agendamentos_slot_unico unique (funcionaria_id, data, hora)
);

-- ─────────────────────────────────────────────────────────────
--  Row Level Security
-- ─────────────────────────────────────────────────────────────

alter table funcionarias  enable row level security;
alter table servicos       enable row level security;
alter table agendamentos   enable row level security;

-- Funcionárias: leitura pública (somente)
create policy "funcionarias_select"
  on funcionarias for select using (true);

-- Serviços: leitura pública (somente)
create policy "servicos_select"
  on servicos for select using (true);

-- Agendamentos: leitura pública (para checar disponibilidade)
create policy "agendamentos_select"
  on agendamentos for select using (true);

-- Agendamentos: inserção pública (clientes agendando)
create policy "agendamentos_insert"
  on agendamentos for insert with check (true);

-- Agendamentos: cliente pode cancelar (confirmado → cancelado)
create policy "agendamentos_cancel"
  on agendamentos for update
  using (status = 'confirmado')
  with check (status = 'cancelado');

-- ─────────────────────────────────────────────────────────────
--  Dados de exemplo — Funcionárias
-- ─────────────────────────────────────────────────────────────

insert into funcionarias (nome, especialidade, initials, cor) values
  ('Ana Lima',      'Cabelo & Coloração',   'AL', 'teal'),
  ('Carla Santos',  'Escova & Manicure',    'CS', 'pink'),
  ('Juliana Melo',  'Maquiagem & Estética', 'JM', 'purple'),
  ('Patrícia Vaz',  'Unhas & Sobrancelha',  'PV', 'amber');

-- ─────────────────────────────────────────────────────────────
--  Dados de exemplo — Serviços
-- ─────────────────────────────────────────────────────────────

insert into servicos (nome, duracao_min, preco, icone) values
  ('Corte',                  45,  60.00, 'scissors'),
  ('Escova',                 60,  80.00, 'wind'),
  ('Coloração',             120, 180.00, 'palette'),
  ('Hidratação',             60,  90.00, 'droplet'),
  ('Manicure',               50,  50.00, 'hand-finger'),
  ('Pedicure',               60,  60.00, 'shoe'),
  ('Design de sobrancelha',  30,  40.00, 'eyeglass'),
  ('Maquiagem',              60, 120.00, 'sparkles');
