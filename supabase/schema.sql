-- ============================================================
--  Mediterrâneo Cabelo — Schema base
--
--  Instalação nova: execute ESTE arquivo no SQL Editor do Supabase
--  e, em seguida, os arquivos de `supabase/migrations/` em ordem
--  de data (eles criam as funções de segurança que o app usa).
-- ============================================================

-- Extensão para UUIDs
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
--  Tabelas
-- ─────────────────────────────────────────────────────────────

create table if not exists funcionarias (
  id            uuid primary key default uuid_generate_v4(),
  nome          text not null,
  especialidade text not null,
  initials      text not null,
  cor           text not null check (cor in ('teal', 'pink', 'amber', 'purple')),
  ativa         boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists servicos (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  duracao_min integer not null,
  preco       numeric(10, 2) not null,
  icone       text not null,
  cor         text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists agendamentos (
  id              uuid primary key default uuid_generate_v4(),
  funcionaria_id  uuid not null references funcionarias (id),
  servico_id      uuid references servicos (id),  -- 1º serviço (fallback); a lista fica em agendamento_servicos
  cliente_nome    text not null,
  cliente_phone   text not null,
  data            date not null,
  hora            time not null,
  status          text not null default 'confirmado'
                    check (status in ('confirmado', 'cancelado')),
  created_at      timestamptz not null default now(),

  gcal_event_id   text
);

-- Cada profissional só pode ter um agendamento por slot.
-- Índice PARCIAL: um horário cancelado volta a ficar disponível.
create unique index if not exists agendamentos_slot_unico
  on agendamentos (funcionaria_id, data, hora)
  where status = 'confirmado';

-- Serviços de cada agendamento (vários por agendamento)
create table if not exists agendamento_servicos (
  agendamento_id uuid not null references agendamentos (id) on delete cascade,
  servico_id     uuid not null references servicos (id),
  primary key (agendamento_id, servico_id)
);

-- ─────────────────────────────────────────────────────────────
--  Row Level Security
--
--  `funcionarias` e `servicos` são o catálogo público do salão.
--  `agendamentos` e `agendamento_servicos` ficam SEM policy: contêm
--  dados pessoais e só podem ser acessados pelas funções RPC criadas
--  em supabase/migrations/ (que validam telefone ou senha).
-- ─────────────────────────────────────────────────────────────

alter table funcionarias         enable row level security;
alter table servicos             enable row level security;
alter table agendamentos         enable row level security;
alter table agendamento_servicos enable row level security;

drop policy if exists "funcionarias_select" on funcionarias;
create policy "funcionarias_select"
  on funcionarias for select using (true);

drop policy if exists "servicos_select" on servicos;
create policy "servicos_select"
  on servicos for select using (true);

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
