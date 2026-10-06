import { useState } from 'react'
import AgendamentoPage from './pages/AgendamentoPage'
import MeusAgendamentosPage from './pages/MeusAgendamentosPage'

const TABS = [
  { id: 'agendamento',       label: 'Agendar',       icon: 'calendar-plus'  },
  { id: 'meus-agendamentos', label: 'Meus horários', icon: 'calendar-user'  },
]

export default function App() {
  const [view, setView] = useState('agendamento')

  return (
    <div className="min-h-dvh font-sans">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-modal
          focus:bg-white focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-float focus:text-sm focus:font-medium"
      >
        Pular para o conteúdo
      </a>

      {/* ── Navbar superior ── */}
      <nav
        aria-label="Principal"
        className="sticky top-0 z-nav bg-gray-50/75 backdrop-blur-xl border-b border-gray-200/60"
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-[10px] flex items-center justify-center shadow-brand">
              <i className="ti ti-scissors text-white text-[15px]" aria-hidden="true" />
            </div>
            <span className="font-display text-[17px] font-medium tracking-tight text-gray-900">
              Mediterrâneo <span className="italic text-brand-600">Cabelo</span>
            </span>
          </div>

          {/* Abas no topo apenas no desktop */}
          <div className="hidden sm:flex gap-1 p-1 bg-gray-100 rounded-xl">
            {TABS.map(t => {
              const active = view === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-all duration-200 active:scale-[0.97]
                    ${active
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <i className={`ti ti-${t.icon} text-sm ${active ? 'text-brand-600' : ''}`} aria-hidden="true" />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* ── Páginas — mantidas montadas para preservar estado de auth ── */}
      {/* padding inferior no mobile para não ficar escondido atrás da barra ── */}
      <main id="conteudo" className="pb-24 sm:pb-0">
        <div style={{ display: view === 'agendamento' ? 'block' : 'none' }}>
          <AgendamentoPage active={view === 'agendamento'} />
        </div>
        <div style={{ display: view === 'meus-agendamentos' ? 'block' : 'none' }}>
          <MeusAgendamentosPage />
        </div>
      </main>

      {/* ── Navegação inferior (somente mobile) ── */}
      <nav
        aria-label="Principal"
        className="sm:hidden fixed bottom-0 inset-x-0 z-nav bg-white/85 backdrop-blur-xl
          border-t border-gray-200/60 pb-safe"
      >
        <div className="grid grid-cols-2 max-w-lg mx-auto">
          {TABS.map(t => {
            const active = view === t.id
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 py-2.5
                  transition-colors active:bg-gray-50
                  ${active ? 'text-brand-700' : 'text-gray-400'}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0 h-0.5 w-10 rounded-full bg-brand-500 transition-transform duration-300
                    ${active ? 'scale-x-100' : 'scale-x-0'}`}
                />
                <i className={`ti ti-${t.icon} text-2xl leading-none`} aria-hidden="true" />
                <span className="text-[11px] font-medium leading-none">{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
