import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAgendamentosCliente, cancelarAgendamento, getServicosDoAgendamento } from '../hooks/useAgendamento'
import { DAYS, MONTHS, COR_MAP } from '../lib/constants'
import { Spinner, ErrorBox } from '../components/shared/UI'

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${DAYS[date.getDay()]}, ${d} de ${MONTHS[m - 1]}`
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
    <div className="min-h-[calc(100vh-57px)] py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Busca por telefone */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100/50 p-6 shadow-soft mb-4"
        >
          <h1 className="text-xl font-bold text-gray-900 mb-1">Meus agendamentos</h1>
          <p className="text-gray-500 text-sm mb-5">
            Informe seu WhatsApp para ver e cancelar seus agendamentos
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <i className="ti ti-brand-whatsapp absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900
                  placeholder:text-gray-300 focus:outline-none focus:border-brand-500
                  focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>
            <button
              type="submit"
              disabled={digits.length < 10}
              className="bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400
                text-white font-semibold px-5 rounded-xl transition-colors whitespace-nowrap"
            >
              Buscar
            </button>
          </form>
        </motion.div>

        <ErrorBox className="mb-4" onRetry={refetch}>{loadError}</ErrorBox>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {/* Nenhum resultado */}
        {!loading && !loadError && searchPhone && agendamentos.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ti ti-calendar-off text-2xl text-gray-400" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">Nenhum agendamento encontrado</p>
            <p className="text-sm text-gray-400">
              Não há agendamentos futuros para este número.
            </p>
          </div>
        )}

        {/* Lista de agendamentos */}
        {!loading && agendamentos.length > 0 && (
          <motion.div 
            initial="hidden" 
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
            className="flex flex-col gap-3"
          >
            {agendamentos.map(ag => {
              const cor = COR_MAP[ag.funcionarias?.cor] ?? COR_MAP.teal
              const isConfirming = cancelingId === ag.id
              const servicosAg = getServicosDoAgendamento(ag)

              return (
                <motion.div 
                  key={ag.id} 
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100/50 p-5 shadow-soft transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center
                        text-sm font-bold shrink-0 ${cor.bg} ${cor.text}`}
                    >
                      {ag.funcionarias?.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {servicosAg.map(s => s.nome).join(', ')}
                      </p>
                      <p className="text-sm text-gray-500">{ag.funcionarias?.nome}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-sm text-brand-600 font-medium">
                        <i className="ti ti-calendar text-sm" />
                        {formatDate(ag.data)} às {ag.hora.slice(0, 5)}
                      </div>
                    </div>
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200
                      px-2 py-1 rounded-lg font-medium shrink-0">
                      Confirmado
                    </span>
                  </div>

                  {cancelError && isConfirming && (
                    <p className="text-sm text-red-500 mb-3 flex items-center gap-1.5">
                      <i className="ti ti-alert-circle" />
                      {cancelError}
                    </p>
                  )}

                  {!isConfirming ? (
                    <button
                      onClick={() => { setCancelingId(ag.id); setCancelError(null) }}
                      className="w-full border border-red-200 text-red-600 font-medium py-2.5 rounded-xl
                        hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <i className="ti ti-calendar-x" />
                      Cancelar agendamento
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-red-800 mb-3 text-center">
                        Tem certeza que deseja cancelar?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCancelingId(null)}
                          disabled={loadingCancel}
                          className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5
                            rounded-xl hover:bg-gray-50 transition-colors text-sm"
                        >
                          Não, manter
                        </button>
                        <button
                          onClick={() => handleCancel(ag.id)}
                          disabled={loadingCancel}
                          className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60
                            text-white font-medium py-2.5 rounded-xl transition-colors text-sm
                            flex items-center justify-center gap-1.5"
                        >
                          {loadingCancel
                            ? <Spinner size="sm" color="white" />
                            : <><i className="ti ti-check" /> Sim, cancelar</>
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
