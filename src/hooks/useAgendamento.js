import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function toLocalISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function useServicos() {
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('servicos')
      .select('*')
      .eq('ativo', true)
      .order('nome')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setServicos(data ?? [])
        setLoading(false)
      })
  }, [])

  return { servicos, loading, error }
}

export function useFuncionarias() {
  const [funcionarias, setFuncionarias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('funcionarias')
      .select('*')
      .eq('ativa', true)
      .order('nome')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setFuncionarias(data ?? [])
        setLoading(false)
      })
  }, [])

  return { funcionarias, loading, error }
}

export function useHorariosOcupados(funcionariaId, data) {
  const [ocupados, setOcupados] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!funcionariaId || !data) {
      setOcupados([])
      return
    }
    setLoading(true)
    supabase
      .from('agendamentos')
      .select('hora')
      .eq('funcionaria_id', funcionariaId)
      .eq('data', data)
      .eq('status', 'confirmado')
      .then(({ data: rows }) => {
        setOcupados((rows ?? []).map(r => r.hora.slice(0, 5)))
        setLoading(false)
      })
  }, [funcionariaId, data])

  return { ocupados, loading }
}

export function useAgendamentoDia(funcionariaId, data) {
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!funcionariaId || !data) {
      setAgendamentos([])
      return
    }
    setLoading(true)
    supabase
      .from('agendamentos')
      .select('*, servicos(*), funcionarias(*)')
      .eq('funcionaria_id', funcionariaId)
      .eq('data', data)
      .eq('status', 'confirmado')
      .order('hora')
      .then(({ data: rows }) => {
        setAgendamentos(rows ?? [])
        setLoading(false)
      })
  }, [funcionariaId, data])

  return { agendamentos, loading }
}

export async function criarAgendamento({
  funcionariaId,
  servicoId,
  clienteNome,
  clientePhone,
  data,
  hora,
  // extras para o Google Calendar
  servicoNome,
  duracaoMin,
  funcionariaNome,
}) {
  const { data: result, error } = await supabase
    .from('agendamentos')
    .insert({
      funcionaria_id: funcionariaId,
      servico_id: servicoId,
      cliente_nome: clienteNome,
      cliente_phone: clientePhone.replace(/\D/g, ''),
      data,
      hora,
      status: 'confirmado',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este horário acabou de ser reservado. Escolha outro.')
    }
    throw new Error(error.message)
  }

  // Cria evento no Google Calendar e salva o ID no agendamento
  if (servicoNome && funcionariaNome && duracaoMin) {
    supabase.functions
      .invoke('google-calendar', {
        body: { servicoNome, duracaoMin, funcionariaNome, clienteNome, clientePhone, data, hora },
      })
      .then(({ data: gcal }) => {
        if (gcal?.eventId) {
          supabase
            .from('agendamentos')
            .update({ gcal_event_id: gcal.eventId })
            .eq('id', result.id)
            .then(() => {})
        }
      })
      .catch(err => console.warn('Google Calendar sync falhou:', err))
  }

  return result
}

export function useAgendamentosCliente(phone) {
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!phone) { setAgendamentos([]); return }
    setLoading(true)
    const today = toLocalISODate(new Date())
    supabase
      .from('agendamentos')
      .select('*, servicos(*), funcionarias(*)')
      .eq('cliente_phone', phone)
      .eq('status', 'confirmado')
      .gte('data', today)
      .order('data')
      .order('hora')
      .then(({ data: rows, error: err }) => {
        if (err) setError(err.message)
        else setAgendamentos(rows ?? [])
        setLoading(false)
      })
  }, [phone, tick])

  return { agendamentos, loading, error, refetch: () => setTick(t => t + 1) }
}

export async function cancelarAgendamento(id) {
  // Busca o gcal_event_id antes de cancelar
  const { data: ag } = await supabase
    .from('agendamentos')
    .select('gcal_event_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('agendamentos')
    .update({ status: 'cancelado' })
    .eq('id', id)
  if (error) throw new Error(error.message)

  // Remove o evento do Google Calendar (fire-and-forget)
  if (ag?.gcal_event_id) {
    supabase.functions
      .invoke('google-calendar', {
        body: { action: 'delete', gcalEventId: ag.gcal_event_id },
      })
      .catch(err => console.warn('Google Calendar delete falhou:', err))
  }
}
