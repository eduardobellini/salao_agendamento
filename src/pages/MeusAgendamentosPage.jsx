import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAgendamentosCliente, cancelarAgendamento, getServicosDoAgendamento } from '../hooks/useAgendamento'
import { DAYS, MONTHS, COR_MAP } from '../lib/constants'
import { Spinner, ErrorBox, PageTitle, SkeletonList } from '../components/shared/UI'

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function MeusAgendamentosPage() {
  const [phoneInput, setPhoneInput] = useState('')
  const [searchPhone, setSearchPhone] = useState(null)
  const [cancelingId, setCancelingId] = useState(null)
  const [loadingCancel, setLoadingCancel] = useState(false)
  const [cancelError, setCancelError] = useState(null)

  const digits = phoneInput.replace(/\D/g, '')
  const { agendamentos, loading, error: loadError, refetch } = useAgendamentosCliente(searchPhone)

  function handleSearch(e) {
    e.preventDefault()
    if (digits.length >= 10) setSearchPhone(digits)
  }

  async function handleCancel(id) {
    setLoadingCancel(true)
    setCancelError(null)
    try {
      // O telefone é reenviado ao servidor: só o dono cancela o agendamento.
      await cancelarAgendamento(id, searchPhone)
      setCancelingId(null)
      refetch()
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setLoadingCancel(false)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-57px)] pt-6 pb-12 sm:pt-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* Busca por telefone */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="bg-white/90 backdrop-blur-md rounded-[28px] ring-1 ring-gray-900/5 p-5 pt-6 sm:p-8 shadow-soft mb-6"
        >
          <PageTitle
            title="Meus horários"
            subtitle="Digite o WhatsApp usado no agendamento para ver ou cancelar seus horários."
          />

          <form onSubmit={handleSearch} className="flex gap-2">
            <label htmlFor="busca-phone" className="sr-only">WhatsApp</label>
            <div className="relative flex-1">
              <i
                className="ti ti-brand-whatsapp absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                id="busca-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(formatPhone(e.target.value))}
                placeholder="(21) 98436-1207"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-gray-900 bg-white tabular-nums
                  ring-1 ring-inset ring-gray-200 hover:ring-gray-300
                  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={digits.length < 10}
              className="bg-brand-500 hover:bg-brand-600 active:scale-[0.97] disabled:bg-gray-200 disabled:text-gray-400
                disabled:cursor-not-allowed text-white font-semibold px-5 rounded-xl transition-all whitespace-nowrap"
            >
              Buscar
            </button>
          </form>
        </motion.div>

        <ErrorBox className="mb-4" onRetry={refetch}>{loadError}</ErrorBox>

        <div aria-live="polite">
          {/* Loading */}
          {loading && <SkeletonList count={2} className="flex flex-col gap-3" itemClassName="h-[156px] rounded-[24px]" />}

          {/* Nenhum resultado */}
          {!loading && !loadError && searchPhone && agendamentos.length === 0 && (
            <div className="rounded-[24px] border-2 border-dashed border-gray-200 px-6 py-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="ti ti-calendar-off text-xl text-gray-500" aria-hidden="true" />
              </div>
              <p className="font-display text-lg font-medium text-gray-900 mb-1">Nenhum horário marcado</p>
              <p className="text-sm text-gray-500 max-w-[32ch] mx-auto">
                Não há agendamentos futuros para este número. Confira se o DDD está certo.
              </p>
            </div>
          )}

          {/* Lista de agendamentos */}
          {!loading && agendamentos.length > 0 && (
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.07 } },
                hidden: {},
              }}
              className="flex flex-col gap-3"
            >
              {agendamentos.map(ag => {
                const cor = COR_MAP[ag.funcionarias?.cor] ?? COR_MAP.teal
                const isConfirming = cancelingId === ag.id
                const servicosAg = getServicosDoAgendamento(ag)
                const dt = parseISO(ag.data)

                return (
                  <motion.li
                    key={ag.id}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className="bg-white rounded-[24px] ring-1 ring-gray-900/5 p-4 shadow-soft"
                  >
                    <div className="flex items-stretch gap-4">
                      {/* Bloco de data */}
                      <div className="w-16 shrink-0 rounded-2xl bg-brand-50 flex flex-col items-center justify-center py-2.5">
                        <span className="text-[11px] font-medium text-brand-700">{DAYS[dt.getDay()]}</span>
                        <span className="font-display text-2xl font-medium leading-none text-gray-900 tabular-nums my-0.5">
                          {dt.getDate()}
                        </span>
                        <span className="text-[11px] text-gray-500">{MONTHS[dt.getMonth()].slice(0, 3)}</span>
                      </div>

                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900 leading-snug">
                            {servicosAg.map(s => s.nome).join(', ')}
                          </p>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                            {ag.hora.slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-semibold
                              ${cor.bg} ${cor.text}`}
                            aria-hidden="true"
                          >
                            {ag.funcionarias?.initials}
                          </span>
                          <span className="text-sm text-gray-600 truncate">{ag.funcionarias?.nome}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 mt-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                          Confirmado
                        </span>
                      </div>
                    </div>

                    {cancelError && isConfirming && (
                      <p role="alert" className="text-sm text-red-600 mt-3 flex items-center gap-1.5">
                        <i className="ti ti-alert-circle" aria-hidden="true" />
                        {cancelError}
                      </p>
                    )}

                    {!isConfirming ? (
                      <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => { setCancelingId(ag.id); setCancelError(null) }}
                          className="text-sm font-medium text-gray-500 px-3 py-1.5 -mr-1 rounded-lg
                            hover:text-red-700 hover:bg-red-50 active:scale-95 transition-all
                            flex items-center gap-1.5"
                        >
                          <i className="ti ti-calendar-x" aria-hidden="true" />
                          Cancelar horário
                        </button>
                      </div>
                    ) : (
                      <div className="bg-red-50 rounded-2xl p-3.5 mt-3 animate-fadein">
                        <p className="text-sm font-medium text-red-900 mb-3">
                          Cancelar este horário? Ele ficará livre para outras clientes.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCancelingId(null)}
                            disabled={loadingCancel}
                            className="flex-1 bg-white ring-1 ring-inset ring-gray-200 text-gray-700 font-medium py-2.5
                              rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all text-sm"
                          >
                            Manter
                          </button>
                          <button
                            onClick={() => handleCancel(ag.id)}
                            disabled={loadingCancel}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 active:scale-[0.98]
                              text-white font-medium py-2.5 rounded-xl transition-all text-sm
                              flex items-center justify-center gap-1.5"
                          >
                            {loadingCancel ? <Spinner size="sm" color="white" /> : 'Sim, cancelar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.li>
                )
              })}
            </motion.ul>
          )}
        </div>
      </div>
    </div>
  )
}
