import React from 'react'

export function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <React.Fragment key={step}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${done
                  ? 'bg-brand-500 text-white'
                  : active
                  ? 'bg-brand-500 text-white ring-4 ring-brand-100'
                  : 'bg-gray-100 text-gray-400'
                }`}
            >
              {done ? <i className="ti ti-check text-xs" /> : step}
            </div>
            {step < total && (
              <div className={`h-0.5 w-6 transition-all ${done ? 'bg-brand-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export function EditBanner({ onCancel }) {
  return (
    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5">
      <i className="ti ti-pencil text-orange-500 shrink-0" />
      <span className="text-sm text-orange-700 font-medium flex-1">
        Modo de edição — ajuste sua seleção
      </span>
      <button
        onClick={onCancel}
        className="text-xs text-orange-600 underline font-semibold whitespace-nowrap"
      >
        Cancelar
      </button>
    </div>
  )
}

export function BtnPrimary({ children, onClick, disabled, loading, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700
        disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
        text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300
        hover:shadow-lg hover:shadow-brand-500/30 active:scale-[0.98]
        flex items-center justify-center gap-2 ${className}`}
    >
      {loading ? <Spinner size="sm" color="white" /> : children}
    </button>
  )
}

export function BtnBack({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full border border-gray-200 text-gray-600 font-medium py-3 px-6
        rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-300
        active:scale-[0.98] flex items-center justify-center gap-2"
    >
      <i className="ti ti-arrow-left text-sm" />
      {children || 'Voltar'}
    </button>
  )
}

export function SectionLabel({ children }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </h2>
  )
}

export function ErrorBox({ children, onRetry, className = '' }) {
  if (!children) return null
  return (
    <div
      className={`flex items-center gap-2 bg-red-50 border border-red-200
        rounded-xl px-4 py-3 text-sm text-red-700 ${className}`}
    >
      <i className="ti ti-alert-circle shrink-0" />
      <span className="flex-1">{children}</span>
      {onRetry && (
        <button onClick={onRetry} className="underline font-semibold shrink-0">
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
    <div className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`} />
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[88vh]
          overflow-y-auto p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl
          animate-[slideup_.2s_ease-out] sm:animate-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
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
