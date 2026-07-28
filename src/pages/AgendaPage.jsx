import { useState, useEffect, useRef } from 'react'
import { DAYS, MONTHS, HOURS, COR_MAP } from '../lib/constants'
import {
  useFuncionarias,
  useAgendaDoDia,
  validarSenhaAgenda,
  getServicosDoAgendamento,
  somaDuracao,
} from '../hooks/useAgendamento'
import { Spinner, Modal, ErrorBox } from '../components/shared/UI'

// ─── Utilitários ─────────────────────────────────────────────────────────────

function toLocalISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateLong(date) {
  return `${DAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`
}

function formatPhoneDisplay(digits) {
  const d = (digits ?? '').replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}

// ─── Tela de senha ────────────────────────────────────────────────────────────

function PasswordScreen({ onAuth }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  // A senha é conferida no servidor: ela nunca fica no código do site.
  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    try {
      if (await validarSenhaAgenda(val)) {
        onAuth(val)
      } else {
        setErr('Senha incorreta')
        setVal('')
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full shadow-sm">
        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <i className="ti ti-lock text-brand-500 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Área restrita</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Digite a senha para acessar a agenda
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="password"
            value={val}
            onChange={e => { setVal(e.target.value); setErr(null) }}
            placeholder="Senha"
            autoFocus
            className={`w-full border rounded-xl px-4 py-3 text-gray-900
              focus:outline-none transition
              ${err
                ? 'border-red-300 focus:ring-2 focus:ring-red-100'
                : 'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
              }`}
          />
          {err && (
            <p className="text-sm text-red-500 flex items-center gap-1.5 -mt-1">
              <i className="ti ti-alert-circle" />
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !val}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200
              disabled:text-gray-400 text-white font-semibold py-3 rounded-xl
              transition-colors flex items-center justify-center"
          >
            {loading ? <Spinner size="sm" color="white" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Modal de detalhes do agendamento ─────────────────────────────────────────

function AgendamentoModal({ ag, onClose }) {
  if (!ag) return null

  const rawPhone = ag.cliente_phone ?? ''
  const waPhone = '55' + rawPhone.replace(/\D/g, '')
  const servicosAg = getServicosDoAgendamento(ag)
  const duracaoTotal = somaDuracao(servicosAg)
  const nomesServicos = servicosAg.map(s => s.nome).join(', ')
  const msgText =
    `Olá ${ag.cliente_nome}! Confirmando seu agendamento:\n` +
    `${servicosAg.length > 1 ? 'Serviços' : 'Serviço'}: ${nomesServicos}\n` +
    `Profissional: ${ag.funcionarias?.nome}\n` +
    `Data: ${ag.data} às ${ag.hora?.slice(0, 5)}\n` +
    `Duração: ${duracaoTotal} min\n\n` +
    `Estamos te aguardando! 💚`
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msgText)}`

  return (
    <Modal open title={ag.cliente_nome} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Row
          icon="scissors"
          bg="bg-brand-50"
          color="text-brand-500"
          label={servicosAg.length > 1 ? 'Serviços' : 'Serviço'}
        >
          <p className="font-semibold text-gray-900 text-sm">{nomesServicos}</p>
          <p className="text-xs text-gray-400">{duracaoTotal} minutos no total</p>
        </Row>

        <Row icon="clock" bg="bg-blue-50" color="text-blue-500" label="Horário">
          <p className="font-semibold text-gray-900 text-sm">{ag.hora?.slice(0, 5)}</p>
          <p className="text-xs text-gray-400">{ag.data}</p>
        </Row>

        <Row icon="user-circle" bg="bg-gray-100" color="text-gray-500" label="Profissional">
          <p className="font-semibold text-gray-900 text-sm">{ag.funcionarias?.nome}</p>
        </Row>

        <Row icon="brand-whatsapp" bg="bg-green-50" color="text-green-500" label="WhatsApp">
          <p className="font-semibold text-gray-900 text-sm">
            {formatPhoneDisplay(rawPhone)}
          </p>
        </Row>

        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-500
            hover:bg-green-600 text-white font-semibold py-3 rounded-xl
            transition-colors mt-2"
        >
          <i className="ti ti-brand-whatsapp" />
          Abrir conversa no WhatsApp
        </a>
      </div>
    </Modal>
  )
}

function Row({ icon, bg, color, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
        <i className={`ti ti-${icon} ${color}`} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

const emMinutos = hhmm => {
  const [h, m] = (hhmm ?? '00:00').split(':').map(Number)
  return h * 60 + m
}

function Timeline({ agendamentos, loading }) {
  const [selected, setSelected] = useState(null)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  // Um atendimento longo ocupa vários slots da timeline, não só o primeiro.
  const ocupacao = {}
  agendamentos.forEach(ag => {
    const inicioStr = ag.hora?.slice(0, 5)
    const inicio = emMinutos(inicioStr)
    const duracao = somaDuracao(getServicosDoAgendamento(ag)) || 60
    HOURS.forEach(h => {
      const t = emMinutos(h)
      if (t >= inicio && t < inicio + duracao) {
        ocupacao[h] = { ag, inicioStr, duracao, isStart: h === inicioStr }
      }
    })
  })

  return (
    <>
      <div className="divide-y divide-gray-100">
        {HOURS.map(h => {
          const slot = ocupacao[h]
          return (
            <div key={h} className="flex items-center gap-3 py-2.5">
              <span className="text-xs font-mono text-gray-300 w-11 shrink-0 text-right">
                {h}
              </span>
              <div className="w-px h-4 bg-gray-200 shrink-0" />
              {slot ? (
                slot.isStart ? (
                  <button
                    onClick={() => setSelected(slot.ag)}
                    className="flex-1 bg-brand-50 border border-brand-200 rounded-xl
                      px-3 py-2 text-left hover:bg-brand-100 transition-colors"
                  >
                    <p className="text-sm font-semibold text-brand-700 leading-tight">
                      {slot.ag.cliente_nome}
                    </p>
                    <p className="text-xs text-brand-500 mt-0.5">
                      {getServicosDoAgendamento(slot.ag).map(s => s.nome).join(', ')}
                      {' · '}{slot.duracao} min
                    </p>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelected(slot.ag)}
                    className="flex-1 border border-dashed border-brand-200 rounded-xl
                      px-3 py-2 text-left text-xs text-brand-400 hover:bg-brand-50 transition-colors"
                  >
                    em atendimento — {slot.ag.cliente_nome}
                  </button>
                )
              ) : (
                <div className="flex-1 h-8" />
              )}
            </div>
          )
        })}
      </div>

      <AgendamentoModal ag={selected} onClose={() => setSelected(null)} />
    </>
  )
}

// ─── Página principal da agenda ───────────────────────────────────────────────

export default function AgendaPage({ active = true }) {
  // A senha fica só em memória (nunca em localStorage) e é reenviada a cada
  // consulta — é ela que autoriza a leitura dos dados no servidor.
  const [senha, setSenha] = useState(null)
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [tabIdx, setTabIdx] = useState(0)

  const { funcionarias, loading: loadingF, error: errF } = useFuncionarias()
  const funcionaria = funcionarias[tabIdx]
  const isoDate = toLocalISODate(date)
  const {
    agendamentos,
    loading: loadingA,
    error: errA,
    refetch,
  } = useAgendaDoDia(senha, funcionaria?.id, isoDate)

  // Recarrega ao VOLTAR para esta aba (ex.: cliente cancelou enquanto isso).
  // O useRef evita uma busca duplicada logo depois do login.
  const estavaAtiva = useRef(active)
  useEffect(() => {
    if (active && !estavaAtiva.current && senha) refetch()
    estavaAtiva.current = active
  }, [active, senha, refetch])

  if (!senha) return <PasswordScreen onAuth={setSenha} />

  function shiftDay(delta) {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    setDate(d)
  }

  const isToday = toLocalISODate(date) === toLocalISODate(new Date())

  // Próximo agendamento: primeiro com horário >= agora (apenas para hoje)
  const nextAg = isToday
    ? agendamentos.find(ag => {
        const [hh, mm] = (ag.hora ?? '').split(':').map(Number)
        const t = new Date()
        return hh * 60 + mm >= t.getHours() * 60 + t.getMinutes()
      })
    : agendamentos[0]

  return (
    <div className="min-h-[calc(100vh-57px)] py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* ── Cabeçalho com navegação de data ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
            <button
              onClick={() => setSenha(null)}
              className="text-gray-400 text-sm hover:text-gray-600 transition-colors
                flex items-center gap-1"
            >
              <i className="ti ti-logout text-xs" />
              Sair
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftDay(-1)}
              aria-label="Dia anterior"
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200
                bg-white hover:bg-gray-50 active:scale-95 transition"
            >
              <i className="ti ti-chevron-left text-lg text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[120px] text-center">
              {isToday ? 'Hoje' : formatDateLong(date)}
            </span>
            <button
              onClick={() => shiftDay(1)}
              aria-label="Próximo dia"
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200
                bg-white hover:bg-gray-50 active:scale-95 transition"
            >
              <i className="ti ti-chevron-right text-lg text-gray-600" />
            </button>
          </div>
        </div>

        <ErrorBox className="mb-4" onRetry={refetch}>{errF || errA}</ErrorBox>

        {loadingF ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            {/* ── Tabs de funcionárias ── */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {funcionarias.map((f, i) => {
                const cor = COR_MAP[f.cor] ?? COR_MAP.teal
                const active = i === tabIdx
                return (
                  <button
                    key={f.id}
                    onClick={() => setTabIdx(i)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm
                      font-medium whitespace-nowrap transition-all shrink-0
                      ${active
                        ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0
                        ${active ? 'bg-white/70' : cor.dot}`}
                    />
                    {f.nome.split(' ')[0]}
                  </button>
                )
              })}
            </div>

            {/* ── Cards de resumo ── */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-400 font-medium mb-1">Total do dia</p>
                <p className="text-3xl font-bold text-gray-900">{agendamentos.length}</p>
                <p className="text-xs text-gray-400">agendamentos</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-400 font-medium mb-1">
                  {isToday ? 'Próxima cliente' : 'Primeira cliente'}
                </p>
                {nextAg ? (
                  <>
                    <p className="text-sm font-bold text-gray-900 truncate leading-tight">
                      {nextAg.cliente_nome}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      às {nextAg.hora?.slice(0, 5)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Nenhuma</p>
                )}
              </div>
            </div>

            {/* ── Timeline ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {funcionaria?.nome?.split(' ')[0]}
              </p>
              <Timeline
                key={`${funcionaria?.id}-${isoDate}`}
                agendamentos={agendamentos}
                loading={loadingA}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
