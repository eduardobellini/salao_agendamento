-- Troca a unique constraint por um partial unique index:
-- slots cancelados não bloqueiam mais o horário para novos agendamentos
ALTER TABLE agendamentos DROP CONSTRAINT agendamentos_slot_unico;

CREATE UNIQUE INDEX agendamentos_slot_unico
  ON agendamentos (funcionaria_id, data, hora)
  WHERE status = 'confirmado';

-- Coluna para guardar o ID do evento criado no Google Calendar
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS gcal_event_id text;
