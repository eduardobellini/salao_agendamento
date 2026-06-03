import { useState } from 'react'
import { StepServico, StepFuncionaria, StepDataHora, StepDados } from '../components/cliente/Steps'
import { Resumo } from '../components/cliente/Resumo'
import { StepIndicator } from '../components/shared/UI'
import { criarAgendamento } from '../hooks/useAgendamento'
import { DAYS, MONTHS } from '../lib/constants'

const TOTAL = 5

function formatDateBR(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${DAYS[date.getDay()]}, ${d} de ${MONTHS[m - 1]}`
}

export default function AgendamentoPage() {
  const [step, setStep] = useState(1)
  const [editingStep, setEditingStep] = useState(null)

  const [servico, setServico] = useState(null)
  const [funcionaria, setFuncionaria] = useState(null)
  const [data, setData] = useState(null)
  const [hora, setHora] = useState(null)
  const [nome, setNome] = useState('')
  const [phone, setPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const isEditing = editingStep !== null

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

  function handleSelectFuncionaria(f) {
    // ao trocar de profissional, limpa data e horário (slots diferentes)
    if (f.id !== funcionaria?.id) {
      setData(null)
      setHora(null)
    }
    setFuncionaria(f)
  }

  // ── Handlers de avanço ───────────────────────────────────────────────────

  function next1() { isEditing ? saveAndReturn() : setStep(2) }
  function next2() { isEditing ? saveAndReturn() : setStep(3) }
  function next3() { isEditing ? saveAndReturn() : setStep(4) }
  function next4() { isEditing ? saveAndReturn() : setStep(5) }

  // ── Confirmação final ────────────────────────────────────────────────────

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await criarAgendamento({
        funcionariaId: funcionaria.id,
        servicoId: servico.id,
        clienteNome: nome,
        clientePhone: phone,
        data,
        hora,
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
    setServico(null)
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
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <i className="ti ti-circle-check text-5xl text-brand-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Agendado com sucesso!</h2>
          <div className="text-gray-500 text-sm space-y-1 mb-8">
            <p>
              <span className="font-semibold text-gray-700">{servico?.nome}</span> com{' '}
              <span className="font-semibold text-gray-700">{funcionaria?.nome}</span>
            </p>
            <p>
              {formatDateBR(data)} às{' '}
              <span className="font-semibold text-gray-700">{hora}</span>
            </p>
          </div>
          <button
            onClick={reset}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold
              py-3.5 rounded-xl transition-colors"
          >
            Fazer novo agendamento
          </button>
        </div>
      </div>
    )
  }

  // ── Fluxo principal ──────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-57px)] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <StepIndicator current={step} total={TOTAL} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {step === 1 && (
            <StepServico
              selected={servico}
              onSelect={setServico}
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
              servico={servico}
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
        </div>
      </div>
    </div>
  )
}
