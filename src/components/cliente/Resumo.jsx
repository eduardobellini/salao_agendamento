import { useState } from 'react'
import { DAYS, MONTHS, COR_MAP, PRIVACY_TEXT, TERMS_TEXT } from '../../lib/constants'
import { BtnPrimary, Modal, PageTitle, ErrorBox } from '../shared/UI'

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
    <div className="text-sm text-gray-700 space-y-2 leading-relaxed max-w-[65ch]">
      {text
        .split('\n')
        .filter(Boolean)
        .map((line, i) => {
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <p key={i}>
              {parts.map((s, j) =>
                j % 2 === 1 ? <strong key={j} className="font-semibold text-gray-900">{s}</strong> : s,
              )}
            </p>
          )
        })}
    </div>
  )
}

// ─── Item de detalhe ────────────────────────────────────────────────────────

function EditButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-medium text-brand-600 px-2.5 py-1 -mr-1 rounded-lg
        hover:bg-brand-50 hover:text-brand-700 active:scale-95 transition shrink-0"
      aria-label={label}
    >
      Alterar
    </button>
  )
}

function DetalheItem({ icon, avatar, label, children, onEdit, editLabel }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      {avatar ?? (
        <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
          <i className={`ti ti-${icon} text-gray-600`} aria-hidden="true" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
        {children}
      </div>
      {onEdit && <EditButton onClick={onEdit} label={editLabel ?? `Alterar ${label.toLowerCase()}`} />}
    </div>
  )
}

function Grupo({ titulo, children, className = '' }) {
  return (
    <section className={className}>
      <h2 className="text-sm font-semibold text-gray-700 mb-2 px-1">{titulo}</h2>
      <div className="bg-white ring-1 ring-inset ring-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
        {children}
      </div>
    </section>
  )
}

function Aceite({ checked, onChange, children }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-[18px] h-[18px] accent-brand-500 rounded shrink-0 cursor-pointer"
      />
      <span className="text-sm text-gray-600">{children}</span>
    </label>
  )
}

// ─── Componente principal ───────────────────────────────────────────────────

export function Resumo({
  servicos,
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
  const lista = servicos ?? []
  const total = lista.reduce((acc, s) => acc + Number(s.preco), 0)
  const duracaoTotal = lista.reduce((acc, s) => acc + (s.duracao_min ?? 0), 0)

  function handleConfirm() {
    if (!privOk || !termOk) {
      setAviso(true)
      return
    }
    onConfirm()
  }

  const linkCls = 'text-brand-600 underline underline-offset-2 decoration-brand-300 font-medium hover:text-brand-700'

  return (
    <div>
      <PageTitle title="Confira sua reserva" subtitle="Toque em “Alterar” para ajustar qualquer item." />

      {/* ── Destaque: quando ── */}
      <div className="flex items-start justify-between gap-3 bg-brand-50 rounded-2xl px-4 py-4 mb-5">
        <div>
          <p className="text-xs font-medium text-brand-700 mb-1">Data e horário</p>
          <p className="font-display text-xl font-medium tracking-tight text-gray-900 leading-tight">
            {formatDate(data)}
          </p>
          <p className="text-sm text-gray-600 mt-0.5 tabular-nums">
            às <span className="font-semibold text-gray-900">{hora}</span> · {duracaoTotal} min no total
          </p>
        </div>
        <EditButton onClick={() => onEdit(3)} label="Alterar data e horário" />
      </div>

      {/* ── Detalhes da reserva ── */}
      <Grupo titulo="Atendimento" className="mb-5">
        <DetalheItem
          icon={lista[0]?.icone ?? 'scissors'}
          label={lista.length > 1 ? 'Serviços' : 'Serviço'}
          onEdit={() => onEdit(1)}
        >
          <div className="space-y-1">
            {lista.map(s => (
              <div key={s.id} className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{s.nome}</p>
                <p className="text-xs text-gray-500 whitespace-nowrap tabular-nums">
                  {s.duracao_min} min · {formatPrice(s.preco)}
                </p>
              </div>
            ))}
          </div>
        </DetalheItem>

        <DetalheItem
          label="Profissional"
          onEdit={() => onEdit(2)}
          avatar={
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm font-medium shrink-0
                ${cor.bg} ${cor.text}`}
            >
              {funcionaria?.initials}
            </div>
          }
        >
          <p className="text-sm font-semibold text-gray-900">{funcionaria?.nome}</p>
          <p className="text-xs text-gray-500">{funcionaria?.especialidade}</p>
        </DetalheItem>

        <div className="flex items-baseline justify-between px-4 py-3.5 bg-gray-50">
          <p className="text-sm text-gray-600 font-medium">Total estimado</p>
          <p className="font-display text-2xl font-medium tracking-tight text-gray-900 tabular-nums">
            {formatPrice(total)}
          </p>
        </div>
      </Grupo>

      {/* ── Dados pessoais ── */}
      <Grupo titulo="Seus dados" className="mb-6">
        <DetalheItem icon="user" label="Nome" onEdit={() => onEdit(4)}>
          <p className="text-sm font-semibold text-gray-900">{nome}</p>
        </DetalheItem>
        <DetalheItem icon="brand-whatsapp" label="WhatsApp" onEdit={() => onEdit(4)}>
          <p className="text-sm font-semibold text-gray-900 tabular-nums">{phone}</p>
        </DetalheItem>
      </Grupo>

      {/* ── Termos ── */}
      <div className="flex flex-col gap-3 mb-6">
        <Aceite checked={privOk} onChange={v => { setPrivOk(v); setAviso(false) }}>
          Li e aceito a{' '}
          <button type="button" onClick={() => setModalPriv(true)} className={linkCls}>
            política de privacidade
          </button>
        </Aceite>

        <Aceite checked={termOk} onChange={v => { setTermOk(v); setAviso(false) }}>
          Li e aceito os{' '}
          <button type="button" onClick={() => setModalTerm(true)} className={linkCls}>
            termos de uso
          </button>
        </Aceite>

        {aviso && (
          <p role="alert" className="text-sm text-red-600 flex items-center gap-1.5">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            Marque as duas opções acima para confirmar.
          </p>
        )}
      </div>

      {/* ── Erro de conflito ── */}
      <ErrorBox className="mb-4">{error}</ErrorBox>

      <BtnPrimary onClick={handleConfirm} loading={loading}>
        Confirmar agendamento
      </BtnPrimary>

      {/* ── Modais ── */}
      <Modal open={modalPriv} onClose={() => setModalPriv(false)} title="Política de privacidade">
        <MarkdownBlock text={PRIVACY_TEXT} />
      </Modal>

      <Modal open={modalTerm} onClose={() => setModalTerm(false)} title="Termos de uso">
        <MarkdownBlock text={TERMS_TEXT} />
      </Modal>
    </div>
  )
}
