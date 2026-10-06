import { useState } from 'react'
import { useServicos, useFuncionarias, useHorariosOcupados } from '../../hooks/useAgendamento'
import { HOURS, DAYS, MONTHS, COR_MAP } from '../../lib/constants'
import {
  BtnPrimary,
  BtnBack,
  SectionLabel,
  EditBanner,
  ErrorBox,
  PageTitle,
  Skeleton,
  SkeletonList,
} from '../shared/UI'

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

function formatPrice(val) {
  return `R$ ${Number(val).toFixed(2).replace('.', ',')}`
}

// Rodapé de ações comum a todas as etapas
function StepActions({ onNext, onBack, disabled, editMode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <BtnPrimary onClick={onNext} disabled={disabled}>
        {editMode ? 'Salvar e voltar ao resumo' : 'Continuar'}
        {!editMode && <i className="ti ti-arrow-right text-sm" aria-hidden="true" />}
      </BtnPrimary>
      {onBack && (
        <BtnBack onClick={onBack}>
          {editMode ? 'Cancelar edição' : 'Voltar'}
        </BtnBack>
      )}
    </div>
  )
}

// ─── Step 1: Serviço ────────────────────────────────────────────────────────

export function StepServico({ selected, onToggle, onNext, editMode, onCancelEdit }) {
  const { servicos, loading, error } = useServicos()

  const selecionados = selected ?? []
  const isSel = id => selecionados.some(s => s.id === id)
  const total = selecionados.reduce((acc, s) => acc + Number(s.preco), 0)
  const duracaoTotal = selecionados.reduce((acc, s) => acc + (s.duracao_min ?? 0), 0)

  return (
    <div>
      {editMode && <EditBanner onCancel={onCancelEdit} />}

      <PageTitle
        title="Quais serviços?"
        subtitle="Escolha um ou mais. Você pode combinar, por exemplo, corte e escova."
      />

      <ErrorBox className="mb-4" onRetry={() => window.location.reload()}>
        {error && 'Não foi possível carregar os serviços.'}
      </ErrorBox>

      {loading ? (
        <SkeletonList count={4} className="flex flex-col gap-2.5 mb-6" />
      ) : (
        <div className="flex flex-col gap-2.5 mb-6">
          {servicos.map(s => {
            const sel = isSel(s.id)
            return (
              <button
                key={s.id}
                onClick={() => onToggle(s)}
                aria-pressed={sel}
                className={`group flex items-center gap-4 p-3.5 pr-4 rounded-2xl text-left
                  transition-all duration-200 active:scale-[0.985]
                  ${sel
                    ? 'bg-brand-50 ring-2 ring-inset ring-brand-500'
                    : 'bg-white ring-1 ring-inset ring-gray-200 hover:ring-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0
                    transition-colors duration-200
                    ${sel ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-white'}`}
                >
                  <i className={`ti ti-${s.icone}`} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 leading-tight">{s.nome}</p>
                  <p className="text-sm text-gray-500 mt-0.5 tabular-nums">{s.duracao_min} min</p>
                </div>
                <p className="font-semibold text-gray-900 text-sm whitespace-nowrap shrink-0 tabular-nums">
                  {formatPrice(s.preco)}
                </p>
                <div
                  aria-hidden="true"
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0
                    transition-all duration-200
                    ${sel
                      ? 'bg-brand-500 text-white scale-100'
                      : 'ring-1 ring-inset ring-gray-300 bg-white'
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
        <div
          aria-live="polite"
          className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3 mb-4 text-sm"
        >
          <span className="text-gray-600 tabular-nums">
            {selecionados.length} {selecionados.length === 1 ? 'serviço' : 'serviços'}
            {duracaoTotal > 0 && <span className="text-gray-500"> · {duracaoTotal} min</span>}
          </span>
          <span className="font-semibold text-gray-900 tabular-nums">{formatPrice(total)}</span>
        </div>
      )}

      <StepActions
        onNext={onNext}
        disabled={selecionados.length === 0}
        editMode={editMode}
      />
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
  const { funcionarias, loading, error } = useFuncionarias()

  return (
    <div>
      {editMode && <EditBanner onCancel={onCancelEdit} />}

      <PageTitle title="Com quem?" subtitle="Escolha a profissional que vai te atender." />

      <ErrorBox className="mb-4" onRetry={() => window.location.reload()}>
        {error && 'Não foi possível carregar as profissionais.'}
      </ErrorBox>

      {loading ? (
        <SkeletonList count={4} className="grid grid-cols-2 gap-2.5 mb-6" itemClassName="h-[136px] rounded-2xl" />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {funcionarias.map(f => {
            const cor = COR_MAP[f.cor] ?? COR_MAP.teal
            const sel = selected?.id === f.id
            return (
              <button
                key={f.id}
                onClick={() => onSelect(f)}
                aria-pressed={sel}
                className={`p-4 pt-5 rounded-2xl text-center relative transition-all duration-200
                  active:scale-[0.98]
                  ${sel
                    ? 'bg-brand-50 ring-2 ring-inset ring-brand-500'
                    : 'bg-white ring-1 ring-inset ring-gray-200 hover:ring-gray-300 hover:bg-gray-50'
                  }`}
              >
                {sel && (
                  <i
                    className="ti ti-circle-check-filled text-brand-500 absolute top-2.5 right-2.5 text-lg"
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`w-14 h-14 rounded-[18px] flex items-center justify-center
                    font-display text-xl font-medium mx-auto mb-3 transition-colors duration-200
                    ${sel ? 'bg-brand-500 text-white' : `${cor.bg} ${cor.text}`}`}
                >
                  {f.initials}
                </div>
                <p className="font-semibold text-gray-900 text-sm leading-tight">{f.nome}</p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{f.especialidade}</p>
              </button>
            )
          })}
        </div>
      )}

      <StepActions onNext={onNext} onBack={onBack} disabled={!selected} editMode={editMode} />
    </div>
  )
}

// ─── Step 3: Data e Horário ─────────────────────────────────────────────────

export function StepDataHora({
  funcionariaId,
  duracaoMin,
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
  const hojeIso = toLocalISODate(hoje)

  const [calYear, setCalYear] = useState(hoje.getFullYear())
  const [calMonth, setCalMonth] = useState(hoje.getMonth())

  // A duração total entra na consulta: um atendimento de 2h só cabe onde
  // houver 2 horas livres seguidas.
  const { ocupados, loading: loadingSlots, error: errSlots } =
    useHorariosOcupados(funcionariaId, selectedData, duracaoMin, reloadToken)
  const cells = getMonthCalendar(calYear, calMonth)
  const isCurrentMonth = calYear === hoje.getFullYear() && calMonth === hoje.getMonth()

  const slots = selectedData
    ? HOURS.map(h => ({ h, disabled: ocupados.includes(h) || isSlotPast(selectedData, h) }))
    : []
  const semHorarios = !loadingSlots && !errSlots && slots.length > 0 && slots.every(s => s.disabled)

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

      <PageTitle title="Quando fica bom?" subtitle="Escolha o dia e depois um horário livre." />

      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-medium tracking-tight text-gray-900" aria-live="polite">
          {MONTHS[calMonth]} <span className="text-gray-400 tabular-nums">{calYear}</span>
        </h2>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            disabled={isCurrentMonth}
            aria-label="Mês anterior"
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95
              hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition"
          >
            <i className="ti ti-chevron-left text-lg text-gray-600" />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Próximo mês"
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 hover:bg-gray-100 transition"
          >
            <i className="ti ti-chevron-right text-lg text-gray-600" />
          </button>
        </div>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-1 mb-7">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />
          const disabled = d.getDay() === 0 || d < hoje
          const iso = toLocalISODate(d)
          const sel = selectedData === iso
          const isHoje = iso === hojeIso
          return (
            <button
              key={iso}
              disabled={disabled}
              onClick={() => handleSelectData(iso)}
              aria-pressed={sel}
              aria-label={`${DAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`}
              className={`relative min-h-[44px] rounded-xl transition-all duration-200 text-sm font-medium
                tabular-nums active:scale-95
                ${disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : sel
                  ? 'bg-brand-500 text-white shadow-brand'
                  : 'bg-white text-gray-800 ring-1 ring-inset ring-gray-200 hover:ring-brand-300 hover:bg-brand-50'
                }`}
            >
              {d.getDate()}
              {isHoje && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full
                    ${sel ? 'bg-white' : 'bg-brand-500'}`}
                />
              )}
            </button>
          )
        })}
      </div>

      {selectedData ? (
        <div className="mb-6">
          <SectionLabel>Horários livres</SectionLabel>
          {duracaoMin > 60 && (
            <p className="text-sm text-gray-500 -mt-1.5 mb-3">
              Seu atendimento leva cerca de {Math.floor(duracaoMin / 60)}h
              {duracaoMin % 60 ? `${duracaoMin % 60}` : ''}, então só mostramos
              horários com tempo livre suficiente.
            </p>
          )}
          <ErrorBox className="mb-4">{errSlots}</ErrorBox>
          {loadingSlots ? (
            <div role="status" aria-label="Carregando horários" className="grid grid-cols-3 gap-2">
              {HOURS.map(h => <Skeleton key={h} className="h-12 rounded-xl" />)}
            </div>
          ) : semHorarios ? (
            <div className="bg-gray-100 rounded-xl px-4 py-5 text-center">
              <p className="text-sm font-medium text-gray-800">Nenhum horário livre neste dia</p>
              <p className="text-sm text-gray-500 mt-0.5">Tente outro dia ou outra profissional.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map(({ h, disabled }) => {
                const sel = selectedHora === h
                return (
                  <button
                    key={h}
                    disabled={disabled}
                    onClick={() => onSelectHora(h)}
                    aria-pressed={sel}
                    className={`min-h-[48px] rounded-xl text-sm font-medium transition-all duration-200
                      tabular-nums active:scale-95
                      ${disabled
                        ? 'text-gray-300 line-through decoration-gray-300 cursor-not-allowed bg-gray-100/60'
                        : sel
                        ? 'bg-brand-500 text-white shadow-brand'
                        : 'bg-white text-gray-800 ring-1 ring-inset ring-gray-200 hover:ring-brand-300 hover:bg-brand-50'
                      }`}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <i className="ti ti-hand-finger text-base text-gray-400" aria-hidden="true" />
          Toque em um dia para ver os horários.
        </p>
      )}

      <StepActions
        onNext={onNext}
        onBack={onBack}
        disabled={!selectedData || !selectedHora}
        editMode={editMode}
      />
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

const inputBase = `w-full rounded-xl py-3 text-gray-900 bg-white ring-1 ring-inset
  placeholder:text-gray-400 focus:outline-none focus:ring-2 transition`

function inputState(invalid) {
  return invalid
    ? 'ring-red-300 focus:ring-red-400'
    : 'ring-gray-200 hover:ring-gray-300 focus:ring-brand-500'
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
  const [touched, setTouched] = useState({ nome: false, phone: false })

  const nomeOk = nome.trim().length > 2
  const phoneOk = phone.replace(/\D/g, '').length >= 10
  const valid = nomeOk && phoneOk

  const nomeErr = touched.nome && !nomeOk
  const phoneErr = touched.phone && !phoneOk

  return (
    <div>
      {editMode && <EditBanner onCancel={onCancelEdit} />}

      <PageTitle
        title="Quase lá"
        subtitle="Usamos seu WhatsApp só para falar sobre este horário."
      />

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label htmlFor="cliente-nome" className="text-sm font-medium text-gray-700 block mb-1.5">
            Nome completo
          </label>
          <input
            id="cliente-nome"
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, nome: true }))}
            placeholder="Ana Beatriz Lopes"
            autoComplete="name"
            aria-invalid={nomeErr || undefined}
            aria-describedby={nomeErr ? 'cliente-nome-erro' : undefined}
            className={`${inputBase} px-4 ${inputState(nomeErr)}`}
          />
          {nomeErr && (
            <p id="cliente-nome-erro" className="text-sm text-red-600 mt-1.5">
              Digite seu nome com pelo menos 3 letras.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cliente-phone" className="text-sm font-medium text-gray-700 block mb-1.5">
            WhatsApp
          </label>
          <div className="relative">
            <i
              className="ti ti-brand-whatsapp absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="cliente-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              onBlur={() => setTouched(t => ({ ...t, phone: true }))}
              placeholder="(21) 98436-1207"
              autoComplete="tel"
              aria-invalid={phoneErr || undefined}
              aria-describedby={phoneErr ? 'cliente-phone-erro' : undefined}
              className={`${inputBase} pl-10 pr-4 tabular-nums ${inputState(phoneErr)}`}
            />
          </div>
          {phoneErr && (
            <p id="cliente-phone-erro" className="text-sm text-red-600 mt-1.5">
              Informe o número com DDD, por exemplo (21) 98436-1207.
            </p>
          )}
        </div>
      </div>

      <StepActions onNext={onNext} onBack={onBack} disabled={!valid} editMode={editMode} />
    </div>
  )
}
