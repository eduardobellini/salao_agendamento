import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function toLocalISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Extrai a lista de serviços de um agendamento, lidando com o novo formato
// (tabela de junção) e com registros antigos de serviço único.
export function getServicosDoAgendamento(ag) {
  const lista = (ag?.agendamento_servicos ?? [])
    .map(j => j.servicos)
    .filter(Boolean)
  if (lista.length) return lista
  return ag?.servicos ? [ag.servicos] : []
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

export function useHorariosOcupados(funcionariaId, data, reloadToken = 0) {
  const [ocupados, setOcupados] = useState([])
  const [loading, setLoading] = useState(false)
  const [focusTick, setFocusTick] = useState(0)

  // Recarrega quando o usuário volta para a aba/app (ex.: cancelou em outro lugar)
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState !== 'hidden') setFocusTick(t => t + 1)
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  useEffect(() => {
    if (!funcionariaId || !data) {
      setOcupados([])
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('agendamentos')
      .select('hora')
      .eq('funcionaria_id', funcionariaId)
      .eq('data', data)
      .eq('status', 'confirmado')
      .then(({ data: rows }) => {
        if (cancelled) return
        setOcupados((rows ?? []).map(r => r.hora.slice(0, 5)))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [funcionariaId, data, reloadToken, focusTick])

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
      .select('*, servicos!agendamentos_servico_id_fkey(*), funcionarias(*), agendamento_servicos(servicos(*))')
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
  servicos,          // array de serviços: [{ id, nome, duracao_min, preco }]
  clienteNome,
  clientePhone,
  data,
  hora,
  // extra para o Google Calendar
  funcionariaNome,
}) {
  const lista = servicos ?? []
  if (lista.length === 0) throw new Error('Selecione ao menos um serviço.')

  const { data: result, error } = await supabase
    .from('agendamentos')
    .insert({
      funcionaria_id: funcionariaId,
      servico_id: lista[0].id, // 1º serviço como fallback
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

  // Vincula todos os serviços ao agendamento
  const { error: jErr } = await supabase
    .from('agendamento_servicos')
    .insert(lista.map(s => ({ agendamento_id: result.id, servico_id: s.id })))
  if (jErr) console.warn('Falha ao vincular serviços:', jErr.message)

  // Cria evento no Google Calendar e salva o ID no agendamento
  if (funcionariaNome) {
    const duracaoMin = lista.reduce((acc, s) => acc + (s.duracao_min ?? 0), 0)
    const precoTotal = lista.reduce((acc, s) => acc + Number(s.preco ?? 0), 0)
    supabase.functions
      .invoke('google-calendar', {
        body: {
          agendamentoId: result.id,
          servicos: lista.map(s => ({ nome: s.nome, duracaoMin: s.duracao_min })),
          duracaoMin,
          precoTotal,
          funcionariaNome,
          clienteNome,
          clientePhone,
          data,
          hora,
        },
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
      .select('*, servicos!agendamentos_servico_id_fkey(*), funcionarias(*), agendamento_servicos(servicos(*))')
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
