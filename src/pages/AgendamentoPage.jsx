import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StepServico, StepFuncionaria, StepDataHora, StepDados } from '../components/cliente/Steps'
import { Resumo } from '../components/cliente/Resumo'
import { StepIndicator } from '../components/shared/UI'
import { criarAgendamento, somaDuracao } from '../hooks/useAgendamento'
import { DAYS, MONTHS } from '../lib/constants'

const TOTAL = 5

function formatDateBR(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${DAYS[date.getDay()]}, ${d} de ${MONTHS[m - 1]}`
}

export default function AgendamentoPage({ active = true }) {
  const [step, setStep] = useState(1)
  const [editingStep, setEditingStep] = useState(null)

  // Recarrega a disponibilidade sempre que esta tela volta a ficar ativa
  const [availToken, setAvailToken] = useState(0)
  useEffect(() => {
    if (active) setAvailToken(t => t + 1)
  }, [active])

  const [servicos, setServicos] = useState([])
  const [funcionaria, setFuncionaria] = useState(null)
  const [data, setData] = useState(null)
  const [hora, setHora] = useState(null)
  const [nome, setNome] = useState('')
  const [phone, setPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const isEditing = editingStep !== null
  const duracaoTotal = somaDuracao(servicos)

  // ── Navegação de edição ──────────────────────────────────────────────────

  function goToEdit(targetStep) {
    setEditingStep(targetStep)
    setStep(targetStep)
    setError(null)
  }

  function cancelEdit() {
    setEditingStep(null)
    setStep(5)
  }

  function saveAndReturn() {
    setEditingStep(null)
    setStep(5)
  }

  // ── Seleções ─────────────────────────────────────────────────────────────

  function toggleServico(s) {
    const novo = servicos.some(x => x.id === s.id)
      ? servicos.filter(x => x.id !== s.id)
      : [...servicos, s]
    setServicos(novo)
    // Mudar os serviços muda a duração — o horário escolhido pode não caber mais.
    if (somaDuracao(novo) !== duracaoTotal) setHora(null)
  }

  function handleSelectFuncionaria(f) {
    // ao trocar de profissional, limpa data e horário (slots diferentes)
    if (f.id !== funcionaria?.id) {
      setData(null)
      setHora(null)
    }
    setFuncionaria(f)
  }

  // ── Handlers de avanço ───────────────────────────────────────────────────

  // Se a edição invalidou o horário (troca de profissional ou de duração),
  // força reescolher antes de voltar ao resumo.
  function next1() {
    if (isEditing && (!data || !hora)) { setEditingStep(3); setStep(3) }
    else if (isEditing) saveAndReturn()
    else setStep(2)
  }
  function next2() {
    if (isEditing && (!data || !hora)) { setEditingStep(3); setStep(3) }
    else if (isEditing) saveAndReturn()
    else setStep(3)
  }
  function next3() { isEditing ? saveAndReturn() : setStep(4) }
  function next4() { isEditing ? saveAndReturn() : setStep(5) }

  // ── Confirmação final ────────────────────────────────────────────────────

  async function handleConfirm() {
    // Proteção: garante que tudo está preenchido antes de enviar
    if (servicos.length === 0) { setError('Selecione ao menos um serviço.'); setStep(1); return }
    if (!funcionaria)          { setError('Escolha uma profissional.');      setStep(2); return }
    if (!data || !hora)        { setError('Escolha a data e o horário.');    setStep(3); return }

    setLoading(true)
    setError(null)
    try {
      await criarAgendamento({
        funcionariaId: funcionaria.id,
        servicos,
        clienteNome: nome,
        clientePhone: phone,
        data,
        hora,
        funcionariaNome: funcionaria.nome,
      })
      setSuccess(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep(1)
    setEditingStep(null)
    setServicos([])
    setFuncionaria(null)
    setData(null)
    setHora(null)
    setNome('')
    setPhone('')
    setError(null)
    setSuccess(false)
  }

  // ── Tela de sucesso ──────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-md rounded-3xl border border-gray-100 p-8 max-w-sm w-full text-center shadow-float"
        >
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <i className="ti ti-circle-check text-5xl text-brand-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Agendado com sucesso!</h2>
          <div className="text-gray-500 text-sm space-y-1 mb-8">
            <p>
              <span className="font-semibold text-gray-700">
                {servicos.map(s => s.nome).join(', ')}
              </span>{' '}
              com <span className="font-semibold text-gray-700">{funcionaria?.nome}</span>
            </p>
            <p>
              {formatDateBR(data)} às{' '}
              <span className="font-semibold text-gray-700">{hora}</span>
            </p>
          </div>
          <button
            onClick={reset}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold
              py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/30 active:scale-[0.98]"
          >
            Fazer novo agendamento
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Fluxo principal ──────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-57px)] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <StepIndicator current={step} total={TOTAL} />

        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100/50 p-6 shadow-soft">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {step === 1 && (
                <StepServico
                  selected={servicos}
                  onToggle={toggleServico}
                  onNext={next1}
                  editMode={isEditing}
                  onCancelEdit={cancelEdit}
                />
              )}

              {step === 2 && (
                <StepFuncionaria
                  selected={funcionaria}
                  onSelect={handleSelectFuncionaria}
                  onNext={next2}
                  onBack={isEditing ? cancelEdit : () => setStep(1)}
                  editMode={isEditing}
                  onCancelEdit={cancelEdit}
                />
              )}

              {step === 3 && (
                <StepDataHora
                  funcionariaId={funcionaria?.id}
                  duracaoMin={duracaoTotal}
                  reloadToken={availToken}
                  selectedData={data}
                  selectedHora={hora}
                  onSelectData={setData}
                  onSelectHora={setHora}
                  onNext={next3}
                  onBack={isEditing ? cancelEdit : () => setStep(2)}
                  editMode={isEditing}
                  onCancelEdit={cancelEdit}
                />
              )}

              {step === 4 && (
                <StepDados
                  nome={nome}
                  setNome={setNome}
                  phone={phone}
                  setPhone={setPhone}
                  onNext={next4}
                  onBack={isEditing ? cancelEdit : () => setStep(3)}
                  editMode={isEditing}
                  onCancelEdit={cancelEdit}
                />
              )}

              {step === 5 && (
                <Resumo
                  servicos={servicos}
                  funcionaria={funcionaria}
                  data={data}
                  hora={hora}
                  nome={nome}
                  phone={phone}
                  onConfirm={handleConfirm}
                  onEdit={goToEdit}
                  loading={loading}
                  error={error}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
