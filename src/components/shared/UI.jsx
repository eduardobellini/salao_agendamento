import { useEffect, useId } from 'react'

export function StepIndicator({ current, total, labels = [] }) {
  return (
    <div
      className="mb-5"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`Etapa ${current} de ${total}${labels[current - 1] ? `: ${labels[current - 1]}` : ''}`}
    >
      <div className="flex items-baseline justify-between mb-2.5 px-1">
        <span className="text-xs font-medium text-gray-500 tabular-nums">
          Etapa {current} de {total}
        </span>
        {labels[current - 1] && (
          <span className="text-xs font-semibold text-brand-700">{labels[current - 1]}</span>
        )}
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="h-1 rounded-full bg-gray-200/80 overflow-hidden">
            <div
              className={`h-full rounded-full bg-brand-500 origin-left transition-transform duration-500 ease-out
                ${i + 1 <= current ? 'scale-x-100' : 'scale-x-0'}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PageTitle({ title, subtitle }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-[1.75rem] leading-[1.15] font-medium tracking-tight text-gray-900">
        {title}
      </h1>
      {subtitle && <p className="text-gray-500 text-[15px] mt-1.5 max-w-[42ch]">{subtitle}</p>}
    </header>
  )
}

export function EditBanner({ onCancel }) {
  return (
    <div className="flex items-center gap-3 bg-gray-100 rounded-xl pl-3 pr-2 py-2 mb-5">
      <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
        <i className="ti ti-pencil text-gray-600 text-sm" />
      </span>
      <span className="text-sm text-gray-700 font-medium flex-1">
        Editando sua reserva
      </span>
      <button
        onClick={onCancel}
        className="text-sm text-gray-600 font-medium px-3 py-1.5 rounded-lg
          hover:bg-white hover:text-gray-900 transition-colors"
      >
        Cancelar
      </button>
    </div>
  )
}

export function BtnPrimary({ children, onClick, disabled, loading, className = '', type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700
        disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed
        text-white font-semibold py-3.5 px-6 rounded-2xl transition-all duration-200
        shadow-brand hover:-translate-y-px active:translate-y-0 active:scale-[0.98]
        disabled:hover:translate-y-0
        flex items-center justify-center gap-2 ${className}`}
    >
      {loading ? <Spinner size="sm" color="white" /> : children}
    </button>
  )
}

// Ação secundária em estilo de link — reduz o peso visual ao lado do botão principal
export function BtnBack({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-gray-500 font-medium py-2.5 px-6 rounded-xl
        hover:text-gray-900 hover:bg-gray-100 active:scale-[0.98] transition-all duration-200
        flex items-center justify-center gap-1.5 text-sm"
    >
      <i className="ti ti-arrow-left text-sm" />
      {children || 'Voltar'}
    </button>
  )
}

export function SectionLabel({ children }) {
  return (
    <h2 className="text-sm font-semibold text-gray-700 mb-3">
      {children}
    </h2>
  )
}

export function ErrorBox({ children, onRetry, className = '' }) {
  if (!children) return null
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 bg-red-50 ring-1 ring-inset ring-red-200/70
        rounded-xl px-4 py-3 text-sm text-red-800 ${className}`}
    >
      <i className="ti ti-alert-circle shrink-0 mt-0.5" />
      <span className="flex-1">{children}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-semibold shrink-0 underline underline-offset-2 hover:text-red-950"
        >
          Tentar de novo
        </button>
      )}
    </div>
  )
}

export function Spinner({ size = 'md', color = 'brand' }) {
  const sizes = {
    sm: 'w-4 h-4 border-[2px]',
    md: 'w-8 h-8 border-[2px]',
    lg: 'w-12 h-12 border-[3px]',
  }
  const colors = {
    brand: 'border-brand-200 border-t-brand-500',
    white: 'border-white/30 border-t-white',
  }
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`}
    />
  )
}

// Bloco de carregamento no formato do conteúdo que vai aparecer
export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`bg-gray-200/70 rounded-lg animate-pulse ${className}`} />
}

export function SkeletonList({ count = 3, className = '', itemClassName = 'h-[76px] rounded-2xl' }) {
  return (
    <div role="status" aria-label="Carregando" className={className}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={itemClassName} />
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center
        bg-gray-900/40 backdrop-blur-[2px] sm:p-4 animate-fadein"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-t-[28px] sm:rounded-[28px] w-full max-w-lg max-h-[88dvh]
          overflow-y-auto p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-float
          animate-slideup sm:animate-pop"
        onClick={e => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-gray-200 mx-auto -mt-2 mb-4" aria-hidden="true" />
        <div className="flex items-center justify-between gap-4 mb-5">
          <h3 id={titleId} className="font-display font-medium text-gray-900 text-xl tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100
              active:scale-95 transition shrink-0"
            aria-label="Fechar"
          >
            <i className="ti ti-x text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
