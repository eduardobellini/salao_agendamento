import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function toLocalISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function soDigitos(v) {
  return (v ?? '').replace(/\D/g, '')
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

export function somaDuracao(servicos) {
  return (servicos ?? []).reduce((acc, s) => acc + (s.duracao_min ?? 0), 0)
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

/**
 * Horários indisponíveis para um atendimento de `duracaoMin` minutos.
 * O servidor considera a duração dos agendamentos já existentes — um
 * serviço de 2h bloqueia os dois slots que ele ocupa, não só o primeiro.
 */
export function useHorariosOcupados(funcionariaId, data, duracaoMin = 60, reloadToken = 0) {
  const [ocupados, setOcupados] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
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
    setError(null)
    supabase
      .rpc('horarios_ocupados', {
        p_funcionaria_id: funcionariaId,
        p_data: data,
        p_duracao_min: duracaoMin || 60,
      })
      .then(({ data: rows, error: err }) => {
        if (cancelled) return
        if (err) setError('Não foi possível carregar os horários. Tente de novo.')
        else setOcupados((rows ?? []).map(h => String(h).slice(0, 5)))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [funcionariaId, data, duracaoMin, reloadToken, focusTick])

  return { ocupados, loading, error }
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

  // Uma única chamada: o servidor valida os dados, checa conflito de horário
  // considerando a duração e grava agendamento + serviços na mesma transação.
  const { data: novoId, error } = await supabase.rpc('criar_agendamento', {
    p_funcionaria_id: funcionariaId,
    p_servico_ids: lista.map(s => s.id),
    p_cliente_nome: clienteNome,
    p_cliente_phone: soDigitos(clientePhone),
    p_data: data,
    p_hora: hora,
  })

  if (error) throw new Error(limparErro(error.message))

  // Cria o evento no Google Calendar (não bloqueia o agendamento se falhar)
  if (funcionariaNome) {
    supabase.functions
      .invoke('google-calendar', {
        body: {
          agendamentoId: novoId,
          servicos: lista.map(s => ({ nome: s.nome, duracaoMin: s.duracao_min })),
          duracaoMin: somaDuracao(lista),
          precoTotal: lista.reduce((acc, s) => acc + Number(s.preco ?? 0), 0),
          funcionariaNome,
          clienteNome,
          clientePhone,
          data,
          hora,
        },
      })
      .catch(err => console.warn('Google Calendar sync falhou:', err))
  }

  return novoId
}

export function useAgendamentosCliente(phone) {
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!phone) { setAgendamentos([]); return }
    let cancelled = false
    setLoading(true)
    setError(null)
    supabase
      .rpc('meus_agendamentos', { p_phone: soDigitos(phone) })
      .then(({ data: rows, error: err }) => {
        if (cancelled) return
        if (err) setError('Não foi possível carregar seus agendamentos.')
        else setAgendamentos(rows ?? [])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [phone, tick])

  return { agendamentos, loading, error, refetch: () => setTick(t => t + 1) }
}

/** Cancela um agendamento. O telefone precisa bater com o do cadastro. */
export async function cancelarAgendamento(id, phone) {
  const { data: gcalEventId, error } = await supabase.rpc('cancelar_agendamento', {
    p_id: id,
    p_phone: soDigitos(phone),
  })
  if (error) throw new Error(limparErro(error.message))

  // Remove o evento do Google Calendar (fire-and-forget)
  if (gcalEventId) {
    supabase.functions
      .invoke('google-calendar', {
        body: { action: 'delete', gcalEventId },
      })
      .catch(err => console.warn('Google Calendar delete falhou:', err))
  }
}

// ─── Área do salão ──────────────────────────────────────────────────────────

/** Confere a senha da agenda no servidor. */
export async function validarSenhaAgenda(senha) {
  const { data, error } = await supabase.rpc('agenda_login', { p_senha: senha })
  if (error) throw new Error('Não foi possível validar a senha. Tente de novo.')
  return data === true
}

export function useAgendaDoDia(senha, funcionariaId, data) {
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!senha || !funcionariaId || !data) {
      setAgendamentos([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    supabase
      .rpc('agenda_do_dia', {
        p_senha: senha,
        p_funcionaria_id: funcionariaId,
        p_data: data,
      })
      .then(({ data: rows, error: err }) => {
        if (cancelled) return
        if (err) setError('Não foi possível carregar a agenda.')
        else setAgendamentos(rows ?? [])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [senha, funcionariaId, data, tick])

  const refetch = useCallback(() => setTick(t => t + 1), [])

  return { agendamentos, loading, error, refetch }
}

// Mensagens do Postgres chegam como "...: mensagem" — mostramos só a parte útil.
function limparErro(msg) {
  if (!msg) return 'Não foi possível concluir. Tente de novo.'
  return msg.replace(/^.*\bERROR:\s*/i, '').trim()
}

export { toLocalISODate }
