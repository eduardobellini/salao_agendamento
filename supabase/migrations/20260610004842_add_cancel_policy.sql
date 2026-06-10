-- Permite que clientes cancelem seus próprios agendamentos (confirmado → cancelado)
create policy "agendamentos_cancel"
  on agendamentos for update
  using (status = 'confirmado')
  with check (status = 'cancelado');
