import { useState } from 'react'
import { DAYS, MONTHS, COR_MAP, PRIVACY_TEXT, TERMS_TEXT } from '../../lib/constants'
import { BtnPrimary, Modal } from '../shared/UI'

// ─── Utilitários ────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${DAYS[date.getDay()]}, ${d} de ${MONTHS[m - 1]}`
}

function formatPrice(val) {
  return `R$ ${Number(val).toFixed(2).replace('.', ',')}`
}

function MarkdownBlock({ text }) {
  return (
    <div className="text-sm text-gray-700 space-y-2 leading-relaxed">
      {text
        .split('\n')
        .filter(Boolean)
        .map((line, i) => {
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <p key={i}>
              {parts.map((s, j) =>
                j % 2 === 1 ? <strong key={j}>{s}</strong> : s,
              )}
            </p>
          )
        })}
    </div>
  )
}

// ─── Item de detalhe ────────────────────────────────────────────────────────

function DetalheItem({ icon, iconBg, iconColor, label, children, onEdit }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
        <i className={`ti ti-${icon} ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        {children}
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition shrink-0"
          aria-label="Editar"
        >
          <i className="ti ti-pencil text-gray-400 text-sm" />
        </button>
      )}
    </div>
  )
}

// ─── Componente principal ───────────────────────────────────────────────────

export function Resumo({
  servico,
  funcionaria,
  data,
  hora,
  nome,
  phone,
  onConfirm,
  onEdit,
  loading,
  error,
}) {
  const [privOk, setPrivOk] = useState(false)
  const [termOk, setTermOk] = useState(false)
  const [aviso, setAviso] = useState(false)
  const [modalPriv, setModalPriv] = useState(false)
  const [modalTerm, setModalTerm] = useState(false)

  const cor = COR_MAP[funcionaria?.cor] ?? COR_MAP.teal

  function handleConfirm() {
    if (!privOk || !termOk) {
      setAviso(true)
      return
    }
    onConfirm()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Confirmar reserva</h1>
      <p className="text-gray-500 text-sm mb-6">Revise os detalhes antes de confirmar</p>

      {/* ── Detalhes da reserva ── */}
      <div className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Detalhes da reserva
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          <DetalheItem
            icon={servico?.icone ?? 'scissors'}
            iconBg="bg-brand-50"
            iconColor="text-brand-500"
            label="Serviço"
            onEdit={() => onEdit(1)}
          >
            <p className="text-sm font-semibold text-gray-900">{servico?.nome}</p>
          </DetalheItem>

          <div className="flex items-start gap-3 px-4 py-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5
                ${cor.bg} ${cor.text}`}
            >
              {funcionaria?.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Profissional</p>
              <p className="text-sm font-semibold text-gray-900">{funcionaria?.nome}</p>
              <p className="text-xs text-gray-400">{funcionaria?.especialidade}</p>
            </div>
            <button
              onClick={() => onEdit(2)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition shrink-0"
              aria-label="Editar profissional"
            >
              <i className="ti ti-pencil text-gray-400 text-sm" />
            </button>
          </div>

          <DetalheItem
            icon="calendar"
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            label="Data e horário"
            onEdit={() => onEdit(3)}
          >
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(data)} às {hora}
            </p>
            <p className="text-xs text-gray-400">{servico?.duracao_min} minutos</p>
          </DetalheItem>

          <div className="flex items-center gap-3 px-4 py-3 bg-brand-50">
            <div className="w-9 h-9 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
              <i className="ti ti-receipt text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total estimado</p>
              <p className="text-xl font-bold text-brand-600">{formatPrice(servico?.preco)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dados pessoais ── */}
      <div className="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Dados pessoais
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          <DetalheItem
            icon="user"
            iconBg="bg-gray-100"
            iconColor="text-gray-500"
            label="Nome"
            onEdit={() => onEdit(4)}
          >
            <p className="text-sm font-semibold text-gray-900">{nome}</p>
          </DetalheItem>

          <DetalheItem
            icon="brand-whatsapp"
            iconBg="bg-green-50"
            iconColor="text-green-500"
            label="WhatsApp"
            onEdit={() => onEdit(4)}
          >
            <p className="text-sm font-semibold text-gray-900">{phone}</p>
          </DetalheItem>
        </div>
      </div>

      {/* ── Termos ── */}
      <div className="flex flex-col gap-3 mb-6">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={privOk}
            onChange={e => { setPrivOk(e.target.checked); setAviso(false) }}
            className="mt-0.5 w-4 h-4 accent-brand-500 rounded shrink-0"
          />
          <span className="text-sm text-gray-600">
            Li e aceito a{' '}
            <button
              type="button"
              onClick={() => setModalPriv(true)}
              className="text-brand-500 underline font-medium"
            >
              Política de Privacidade
            </button>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={termOk}
            onChange={e => { setTermOk(e.target.checked); setAviso(false) }}
            className="mt-0.5 w-4 h-4 accent-brand-500 rounded shrink-0"
          />
          <span className="text-sm text-gray-600">
            Li e aceito os{' '}
            <button
              type="button"
              onClick={() => setModalTerm(true)}
              className="text-brand-500 underline font-medium"
            >
              Termos de Uso
            </button>
          </span>
        </label>

        {aviso && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <i className="ti ti-alert-circle" />
            Aceite os dois termos para confirmar
          </p>
        )}
      </div>

      {/* ── Erro de conflito ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-2 text-sm text-red-700">
          <i className="ti ti-alert-triangle shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <BtnPrimary onClick={handleConfirm} loading={loading}>
        <i className="ti ti-circle-check" />
        Confirmar agendamento
      </BtnPrimary>

      {/* ── Modais ── */}
      <Modal open={modalPriv} onClose={() => setModalPriv(false)} title="Política de Privacidade">
        <MarkdownBlock text={PRIVACY_TEXT} />
      </Modal>

      <Modal open={modalTerm} onClose={() => setModalTerm(false)} title="Termos de Uso">
        <MarkdownBlock text={TERMS_TEXT} />
      </Modal>
    </div>
  )
}
