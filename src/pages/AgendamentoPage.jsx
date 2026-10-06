import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StepServico, StepFuncionaria, StepDataHora, StepDados } from '../components/cliente/Steps'
import { Resumo } from '../components/cliente/Resumo'
import { StepIndicator, BtnPrimary } from '../components/shared/UI'
import { criarAgendamento, somaDuracao } from '../hooks/useAgendamento'
import { DAYS, MONTHS } from '../lib/constants'

const TOTAL = 5
const STEP_LABELS = ['Serviços', 'Profissional', 'Data e horário', 'Seus dados', 'Confirmação']

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
      <div className="min-h-[calc(100dvh-57px)] flex items-center justify-center px-4 pt-8 pb-12">
        <motion.div
          role="status"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="bg-white rounded-[28px] ring-1 ring-gray-900/5 p-8 max-w-sm w-full text-center shadow-float"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.12 }}
            className="w-16 h-16 bg-brand-500 rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-brand"
          >
            <i className="ti ti-check text-3xl text-white" aria-hidden="true" />
          </motion.div>
          <h2 className="font-display text-[1.75rem] leading-tight font-medium tracking-tight text-gray-900 mb-2">
            Horário reservado
          </h2>
          <p className="text-gray-500 text-[15px] mb-6">Te esperamos no salão.</p>

          <div className="bg-gray-50 rounded-2xl p-4 text-left text-sm space-y-2.5 mb-7">
            <div className="flex items-start gap-2.5">
              <i className="ti ti-calendar-event text-gray-400 mt-0.5" aria-hidden="true" />
              <p className="text-gray-900 font-semibold tabular-nums">
                {formatDateBR(data)} às {hora}
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <i className="ti ti-scissors text-gray-400 mt-0.5" aria-hidden="true" />
              <p className="text-gray-600">
                {servicos.map(s => s.nome).join(', ')} com{' '}
                <span className="font-medium text-gray-900">{funcionaria?.nome}</span>
              </p>
            </div>
          </div>

          <BtnPrimary onClick={reset}>Fazer outro agendamento</BtnPrimary>
          <p className="text-xs text-gray-500 mt-4">
            Para ver ou cancelar, use a aba “Meus horários”.
          </p>
        </motion.div>
      </div>
    )
  }

  // ── Fluxo principal ──────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100dvh-57px)] pt-6 pb-12 sm:pt-10 px-4">
      <div className="max-w-lg mx-auto">
        <StepIndicator current={step} total={TOTAL} labels={STEP_LABELS} />

        <div className="bg-white/90 backdrop-blur-md rounded-[28px] ring-1 ring-gray-900/5 p-5 pt-6 pb-5 sm:p-8 shadow-soft">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
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
