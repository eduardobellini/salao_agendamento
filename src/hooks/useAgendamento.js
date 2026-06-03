import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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

  return result
}
