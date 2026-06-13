-- Permite vários serviços por agendamento (tabela de junção)
create table if not exists agendamento_servicos (
  agendamento_id uuid not null references agendamentos (id) on delete cascade,
  servico_id     uuid not null references servicos (id),
  primary key (agendamento_id, servico_id)
);

alter table agendamento_servicos enable row level security;

-- Leitura pública (para exibir os serviços do agendamento)
create policy "agendamento_servicos_select"
  on agendamento_servicos for select using (true);

-- Inserção pública (cliente agendando)
create policy "agendamento_servicos_insert"
  on agendamento_servicos for insert with check (true);

-- servico_id no agendamento passa a ser opcional: a verdade fica na junção.
-- (mantemos a coluna preenchida com o 1º serviço por compatibilidade/fallback)
alter table agendamentos alter column servico_id drop not null;
