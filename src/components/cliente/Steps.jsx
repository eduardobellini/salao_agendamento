import { useState } from 'react'
import { useServicos, useFuncionarias, useHorariosOcupados } from '../../hooks/useAgendamento'
import { HOURS, DAYS, MONTHS, COR_MAP } from '../../lib/constants'
import { BtnPrimary, BtnBack, SectionLabel, Spinner, EditBanner } from '../shared/UI'

// ─── Utilitários ────────────────────────────────────────────────────────────

function toLocalISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMonthCalendar(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay() // 0 = Dom
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

function isSlotPast(iso, hora) {
  const [Y, M, D] = iso.split('-').map(Number)
  const [h, m] = hora.split(':').map(Number)
  return new Date(Y, M - 1, D, h, m) <= new Date()
}

// ─── Step 1: Serviço ────────────────────────────────────────────────────────

export function StepServico({ selected, onToggle, onNext, editMode, onCancelEdit }) {
  const { servicos, loading } = useServicos()

  const selecionados = selected ?? []
  const isSel = id => selecionados.some(s => s.id === id)
  const total = selecionados.reduce((acc, s) => acc + Number(s.preco), 0)
  const duracaoTotal = selecionados.reduce((acc, s) => acc + (s.duracao_min ?? 0), 0)

  return (
    <div>
      {editMode && <EditBanner onCancel={onCancelEdit} />}

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Quais serviços?</h1>
      <p className="text-gray-500 text-sm mb-6">
        Selecione um ou mais serviços que deseja realizar
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {servicos.map(s => {
            const sel = isSel(s.id)
            return (
              <button
                key={s.id}
                onClick={() => onToggle(s)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                  active:scale-[0.98]
                  ${sel
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0
                    ${sel ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  <i className={`ti ti-${s.icone}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{s.nome}</p>
                  <p className="text-sm text-gray-400">{s.duracao_min} min</p>
                </div>
                <p className="font-bold text-gray-900 text-sm whitespace-nowrap shrink-0">
                  R$ {Number(s.preco).toFixed(2).replace('.', ',')}
                </p>
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0
                    transition-colors
                    ${sel
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'border-gray-300 bg-white'
                    }`}
                >
                  {sel && <i className="ti ti-check text-sm" />}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Resumo da seleção */}
      {selecionados.length > 0 && (
        <div className="flex items-center justify-between bg-brand-50 border border-brand-100
          rounded-xl px-4 py-3 mb-4 text-sm">
          <span className="text-gray-600">
            {selecionados.length} {selecionados.length === 1 ? 'serviço' : 'serviços'}
            {duracaoTotal > 0 && <span className="text-gray-400"> · {duracaoTotal} min</span>}
          </span>
          <span className="font-bold text-brand-600">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>
      )}

      <BtnPrimary onClick={onNext} disabled={selecionados.length === 0}>
        {editMode ? 'Salvar e voltar ao resumo' : 'Continuar'}
        {!editMode && <i className="ti ti-arrow-right text-sm" />}
      </BtnPrimary>
    </div>
  )
}

// ─── Step 2: Profissional ───────────────────────────────────────────────────

export function StepFuncionaria({
  selected,
  onSelect,
  onNext,
  onBack,
  editMode,
  onCancelEdit,
}) {
  const { funcionarias, loading } = useFuncionarias()

  return (
    <div>
      {editMode && <EditBanner onCancel={onCancelEdit} />}

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Qual profissional?</h1>
      <p className="text-gray-500 text-sm mb-6">Escolha com quem quer ser atendida</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {funcionarias.map(f => {
            const cor = COR_MAP[f.cor] ?? COR_MAP.teal
            const sel = selected?.id === f.id
            return (
              <button
                key={f.id}
                onClick={() => onSelect(f)}
                className={`p-4 rounded-xl border-2 transition-all text-center relative
                  active:scale-[0.98]
                  ${sel
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
              >
                {sel && (
                  <i className="ti ti-circle-check-filled text-brand-500 absolute top-2 right-2 text-base" />
                )}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center
                    text-xl font-bold mx-auto mb-3 transition-all
                    ${sel ? 'bg-brand-500 text-white' : `${cor.bg} ${cor.text}`}`}
                >
                  {f.initials}
                </div>
                <p className="font-semibold text-gray-900 text-sm leading-tight">{f.nome}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{f.especialidade}</p>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <BtnPrimary onClick={onNext} disabled={!selected}>
          {editMode ? 'Salvar e voltar ao resumo' : 'Continuar'}
          {!editMode && <i className="ti ti-arrow-right text-sm" />}
        </BtnPrimary>
        <BtnBack onClick={onBack}>
          {editMode ? 'Cancelar edição' : 'Voltar'}
        </BtnBack>
      </div>
    </div>
  )
}

// ─── Step 3: Data e Horário ─────────────────────────────────────────────────

export function StepDataHora({
  funcionariaId,
  reloadToken,
  selectedData,
  selectedHora,
  onSelectData,
  onSelectHora,
  onNext,
  onBack,
  editMode,
  onCancelEdit,
}) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [calYear, setCalYear] = useState(hoje.getFullYear())
  const [calMonth, setCalMonth] = useState(hoje.getMonth())

  const { ocupados, loading: loadingSlots } = useHorariosOcupados(funcionariaId, selectedData, reloadToken)
  const cells = getMonthCalendar(calYear, calMonth)
  const isCurrentMonth = calYear === hoje.getFullYear() && calMonth === hoje.getMonth()

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  function handleSelectData(iso) {
    onSelectData(iso)
    onSelectHora(null)
  }

  return (
    <div>
      {editMode && <EditBanner onCancel={onCancelEdit} />}

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Quando?</h1>
      <p className="text-gray-500 text-sm mb-6">Escolha data e horário disponíveis</p>

      <SectionLabel>Data</SectionLabel>

      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          disabled={isCurrentMonth}
          aria-label="Mês anterior"
          className="w-10 h-10 rounded-lg flex items-center justify-center active:scale-95
            hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <i className="ti ti-chevron-left text-lg text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-700 capitalize">
          {MONTHS[calMonth]} {calYear}
        </span>
        <button
          onClick={nextMonth}
          aria-label="Próximo mês"
          className="w-10 h-10 rounded-lg flex items-center justify-center active:scale-95 hover:bg-gray-100 transition"
        >
          <i className="ti ti-chevron-right text-lg text-gray-600" />
        </button>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />
          const disabled = d.getDay() === 0 || d < hoje
          const iso = toLocalISODate(d)
          const sel = selectedData === iso
          return (
            <button
              key={iso}
              disabled={disabled}
              onClick={() => handleSelectData(iso)}
              className={`min-h-[44px] rounded-xl border transition-all text-sm font-medium
                active:scale-95
                ${disabled
                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  : sel
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300'
                }`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      {selectedData && (
        <>
          <SectionLabel>Horário</SectionLabel>
          {loadingSlots ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {HOURS.map(h => {
                const disabled = ocupados.includes(h) || isSlotPast(selectedData, h)
                const sel = selectedHora === h
                return (
                  <button
                    key={h}
                    disabled={disabled}
                    onClick={() => onSelectHora(h)}
                    className={`min-h-[48px] rounded-xl border text-sm font-medium transition-all
                      active:scale-95
                      ${disabled
                        ? 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed'
                        : sel
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300'
                      }`}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      <div className="flex flex-col gap-3">
        <BtnPrimary onClick={onNext} disabled={!selectedData || !selectedHora}>
          {editMode ? 'Salvar e voltar ao resumo' : 'Continuar'}
          {!editMode && <i className="ti ti-arrow-right text-sm" />}
        </BtnPrimary>
        <BtnBack onClick={onBack}>
          {editMode ? 'Cancelar edição' : 'Voltar'}
        </BtnBack>
      </div>
    </div>
  )
}

// ─── Step 4: Dados pessoais ─────────────────────────────────────────────────

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function StepDados({
  nome,
  setNome,
  phone,
  setPhone,
  onNext,
  onBack,
  editMode,
  onCancelEdit,
}) {
  const valid = nome.trim().length > 2 && phone.replace(/\D/g, '').length >= 10

  return (
    <div>
      {editMode && <EditBanner onCancel={onCancelEdit} />}

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Seus dados</h1>
      <p className="text-gray-500 text-sm mb-6">
        Para confirmarmos seu agendamento
      </p>

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Nome completo
          </label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Maria Silva"
            autoComplete="name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900
              placeholder:text-gray-300 focus:outline-none focus:border-brand-500
              focus:ring-2 focus:ring-brand-100 transition"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            WhatsApp
          </label>
          <div className="relative">
            <i className="ti ti-brand-whatsapp absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900
                placeholder:text-gray-300 focus:outline-none focus:border-brand-500
                focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <BtnPrimary onClick={onNext} disabled={!valid}>
          {editMode ? 'Salvar e voltar ao resumo' : 'Continuar'}
          {!editMode && <i className="ti ti-arrow-right text-sm" />}
        </BtnPrimary>
        <BtnBack onClick={onBack}>
          {editMode ? 'Cancelar edição' : 'Voltar'}
        </BtnBack>
      </div>
    </div>
  )
}
