-- ============================================================================
--  Segurança: fecha o acesso direto à tabela `agendamentos` e move todo o
--  acesso para funções RPC que expõem apenas o mínimo necessário.
--
--  ANTES:  qualquer pessoa com a anon key (que está no bundle JS público)
--          podia ler nome + telefone de todos os clientes e cancelar
--          agendamentos alheios.
--  DEPOIS: dados pessoais só saem do banco para quem informa o telefone
--          correto (cliente) ou a senha da agenda (salão).
-- ============================================================================

-- No Supabase o pgcrypto já vem instalado no schema `extensions`; este comando
-- é só uma garantia para instalações novas. As funções abaixo declaram
-- `search_path = public, extensions` para achar crypt()/gen_salt() em qualquer caso.
create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────────────────────
--  1. Configuração privada (senha da agenda)
-- ─────────────────────────────────────────────────────────────

create table if not exists app_config (
  chave text primary key,
  valor text not null
);

-- RLS ligado e NENHUMA policy => a tabela é invisível pela API pública.
-- Só as funções `security definer` abaixo (e o SQL Editor) conseguem ler.
alter table app_config enable row level security;
revoke all on app_config from anon, authenticated;

create or replace function definir_senha_agenda(p_nova text)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  insert into app_config (chave, valor)
  values ('agenda_senha', crypt(p_nova, gen_salt('bf')))
  on conflict (chave) do update set valor = excluded.valor
  returning 'Senha da agenda atualizada.'::text;
$$;

-- Só o dono do banco (SQL Editor) pode trocar a senha.
revoke all on function definir_senha_agenda(text) from public, anon, authenticated;

-- Senha inicial "agenda123" — TROQUE rodando no SQL Editor:
--     select definir_senha_agenda('sua-nova-senha');
do $$
begin
  if not exists (select 1 from app_config where chave = 'agenda_senha') then
    perform definir_senha_agenda('agenda123');
  end if;
end $$;

create or replace function senha_agenda_ok(p_senha text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_hash text;
begin
  select valor into v_hash from app_config where chave = 'agenda_senha';
  if v_hash is null then return false; end if;
  if crypt(coalesce(p_senha, ''), v_hash) = v_hash then
    return true;
  end if;
  perform pg_sleep(0.4);   -- freia tentativa de força bruta
  return false;
end;
$$;

-- ─────────────────────────────────────────────────────────────
--  2. Fecha o acesso direto às tabelas sensíveis
-- ─────────────────────────────────────────────────────────────

drop policy if exists "agendamentos_select"           on agendamentos;
drop policy if exists "agendamentos_insert"           on agendamentos;
drop policy if exists "agendamentos_cancel"           on agendamentos;
drop policy if exists "agendamento_servicos_select"   on agendamento_servicos;
drop policy if exists "agendamento_servicos_insert"   on agendamento_servicos;

alter table agendamentos         enable row level security;
alter table agendamento_servicos enable row level security;

-- `funcionarias` e `servicos` continuam com leitura pública: são o catálogo
-- do salão, não têm dado pessoal.

-- Garante o índice parcial (slot cancelado libera o horário)
alter table agendamentos drop constraint if exists agendamentos_slot_unico;
create unique index if not exists agendamentos_slot_unico
  on agendamentos (funcionaria_id, data, hora)
  where status = 'confirmado';

-- ─────────────────────────────────────────────────────────────
--  3. Duração real de um agendamento (soma dos serviços)
-- ─────────────────────────────────────────────────────────────

create or replace function duracao_agendamento(p_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select sum(s.duracao_min)::int
       from agendamento_servicos js
       join servicos s on s.id = js.servico_id
      where js.agendamento_id = p_id),
    (select s.duracao_min
       from agendamentos a join servicos s on s.id = a.servico_id
      where a.id = p_id),
    60
  );
$$;

-- ─────────────────────────────────────────────────────────────
--  4. Disponibilidade — não devolve nenhum dado pessoal
--     Considera a DURAÇÃO: um serviço de 2h bloqueia 2 slots.
-- ─────────────────────────────────────────────────────────────

create or replace function horarios_ocupados(
  p_funcionaria_id uuid,
  p_data           date,
  p_duracao_min    integer default 60
)
returns setof time
language sql
stable
security definer
set search_path = public
as $$
  with novo as (
    select make_interval(mins => greatest(coalesce(p_duracao_min, 60), 15)) as dur
  ),
  ocupados as (
    select a.hora::interval as inicio,
           make_interval(mins => duracao_agendamento(a.id)) as dur
      from agendamentos a
     where a.funcionaria_id = p_funcionaria_id
       and a.data           = p_data
       and a.status         = 'confirmado'
  ),
  candidatos as (
    select (time '00:00' + make_interval(hours => n)) as hora,
           make_interval(hours => n)                  as slot
      from generate_series(0, 23) n
  )
  select c.hora
    from candidatos c, novo
   where exists (
     select 1 from ocupados o
      where c.slot < o.inicio + o.dur      -- o novo começa antes do outro acabar
        and o.inicio < c.slot + novo.dur   -- e o outro começa antes do novo acabar
   )
   order by 1;
$$;

-- ─────────────────────────────────────────────────────────────
--  5. Criar agendamento (validado e atômico)
-- ─────────────────────────────────────────────────────────────

create or replace function criar_agendamento(
  p_funcionaria_id uuid,
  p_servico_ids    uuid[],
  p_cliente_nome   text,
  p_cliente_phone  text,
  p_data           date,
  p_hora           time
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_cliente_phone, ''), '\D', '', 'g');
  v_nome  text := btrim(coalesce(p_cliente_nome, ''));
  v_hoje  date := (now() at time zone 'America/Sao_Paulo')::date;
  v_agora time := (now() at time zone 'America/Sao_Paulo')::time;
  v_dur     integer;
  v_qtd     integer;
  v_pedidos integer;
  v_id      uuid;
begin
  if p_servico_ids is null or array_length(p_servico_ids, 1) is null then
    raise exception 'Selecione ao menos um serviço.';
  end if;
  if length(v_nome) < 3 then
    raise exception 'Informe seu nome completo.';
  end if;
  if length(v_phone) not in (10, 11) then
    raise exception 'Informe um WhatsApp válido com DDD.';
  end if;
  if p_hora < time '06:00' or p_hora > time '22:00' then
    raise exception 'Horário fora do funcionamento do salão.';
  end if;
  if p_data < v_hoje or (p_data = v_hoje and p_hora <= v_agora) then
    raise exception 'Este horário já passou. Escolha outro.';
  end if;
  if p_data > v_hoje + 180 then
    raise exception 'Só é possível agendar com até 6 meses de antecedência.';
  end if;

  if not exists (select 1 from funcionarias where id = p_funcionaria_id and ativa) then
    raise exception 'Profissional indisponível.';
  end if;

  -- Quantos serviços distintos foram pedidos...
  select count(distinct t.sid)::int
    into v_pedidos
    from unnest(p_servico_ids) as t(sid);

  -- ...e quantos deles realmente existem e estão ativos.
  select count(*)::int, coalesce(sum(duracao_min), 0)::int
    into v_qtd, v_dur
    from servicos
   where id = any (p_servico_ids) and ativo = true;

  if v_qtd <> v_pedidos then
    raise exception 'Um dos serviços escolhidos não está mais disponível.';
  end if;

  -- Serializa as reservas desta profissional neste dia: sem isso, dois
  -- pedidos simultâneos poderiam passar pela checagem de conflito ao
  -- mesmo tempo e gerar atendimentos sobrepostos.
  perform pg_advisory_xact_lock(hashtext(p_funcionaria_id::text || p_data::text));

  if exists (
    select 1 from horarios_ocupados(p_funcionaria_id, p_data, v_dur) h where h = p_hora
  ) then
    raise exception 'Este horário acabou de ser reservado. Escolha outro.';
  end if;

  insert into agendamentos
    (funcionaria_id, servico_id, cliente_nome, cliente_phone, data, hora, status)
  values
    (p_funcionaria_id, p_servico_ids[1], v_nome, v_phone, p_data, p_hora, 'confirmado')
  returning id into v_id;

  insert into agendamento_servicos (agendamento_id, servico_id)
  select distinct v_id, t.sid from unnest(p_servico_ids) as t(sid)
  on conflict do nothing;

  return v_id;
exception
  when unique_violation then
    raise exception 'Este horário acabou de ser reservado. Escolha outro.';
end;
$$;

-- ─────────────────────────────────────────────────────────────
--  6. Área do cliente — exige o telefone
-- ─────────────────────────────────────────────────────────────

create or replace function meus_agendamentos(p_phone text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(x order by x ->> 'data', x ->> 'hora'), '[]'::jsonb)
    from (
      select jsonb_build_object(
               'id',           a.id,
               'data',         a.data,
               'hora',         a.hora,
               'status',       a.status,
               'cliente_nome', a.cliente_nome,
               'funcionarias', to_jsonb(f),
               'agendamento_servicos', coalesce((
                 select jsonb_agg(jsonb_build_object('servicos', to_jsonb(s)))
                   from agendamento_servicos js
                   join servicos s on s.id = js.servico_id
                  where js.agendamento_id = a.id
               ), '[]'::jsonb),
               'servicos', (select to_jsonb(s) from servicos s where s.id = a.servico_id)
             ) as x
        from agendamentos a
        join funcionarias f on f.id = a.funcionaria_id
       where a.cliente_phone = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
         and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 10
         and a.status = 'confirmado'
         and a.data >= (now() at time zone 'America/Sao_Paulo')::date
    ) t;
$$;

-- Cancelar: só funciona se o telefone bater com o do agendamento.
-- Devolve o gcal_event_id para o app remover o evento do Google Agenda.
create or replace function cancelar_agendamento(p_id uuid, p_phone text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_gcal text;
begin
  update agendamentos
     set status = 'cancelado'
   where id     = p_id
     and status = 'confirmado'
     and cliente_phone = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
  returning gcal_event_id into v_gcal;

  if not found then
    raise exception 'Agendamento não encontrado para este número.';
  end if;
  return v_gcal;
end;
$$;

-- ─────────────────────────────────────────────────────────────
--  7. Agenda do salão — exige a senha (validada no servidor)
-- ─────────────────────────────────────────────────────────────

create or replace function agenda_do_dia(
  p_senha          text,
  p_funcionaria_id uuid,
  p_data           date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not senha_agenda_ok(p_senha) then
    raise exception 'Senha incorreta.';
  end if;

  return (
    select coalesce(jsonb_agg(x order by x ->> 'hora'), '[]'::jsonb)
      from (
        select jsonb_build_object(
                 'id',            a.id,
                 'data',          a.data,
                 'hora',          a.hora,
                 'cliente_nome',  a.cliente_nome,
                 'cliente_phone', a.cliente_phone,
                 'funcionarias',  to_jsonb(f),
                 'agendamento_servicos', coalesce((
                   select jsonb_agg(jsonb_build_object('servicos', to_jsonb(s)))
                     from agendamento_servicos js
                     join servicos s on s.id = js.servico_id
                    where js.agendamento_id = a.id
                 ), '[]'::jsonb),
                 'servicos', (select to_jsonb(s) from servicos s where s.id = a.servico_id)
               ) as x
          from agendamentos a
          join funcionarias f on f.id = a.funcionaria_id
         where a.funcionaria_id = p_funcionaria_id
           and a.data           = p_data
           and a.status         = 'confirmado'
      ) t
  );
end;
$$;

-- Confere a senha sem trazer dados (usado na tela de login da agenda)
create or replace function agenda_login(p_senha text)
returns boolean
language sql
security definer
set search_path = public
as $$ select senha_agenda_ok(p_senha); $$;

-- ─────────────────────────────────────────────────────────────
--  8. Permissões das RPCs públicas
-- ─────────────────────────────────────────────────────────────

grant execute on function horarios_ocupados(uuid, date, integer)             to anon, authenticated;
grant execute on function criar_agendamento(uuid, uuid[], text, text, date, time) to anon, authenticated;
grant execute on function meus_agendamentos(text)                            to anon, authenticated;
grant execute on function cancelar_agendamento(uuid, text)                   to anon, authenticated;
grant execute on function agenda_do_dia(text, uuid, date)                    to anon, authenticated;
grant execute on function agenda_login(text)                                 to anon, authenticated;

-- Auxiliares: não precisam ser chamadas de fora
revoke all on function senha_agenda_ok(text)     from public, anon, authenticated;
revoke all on function duracao_agendamento(uuid) from public, anon, authenticated;

-- Faz a API do Supabase enxergar as funções novas na hora
notify pgrst, 'reload schema';
