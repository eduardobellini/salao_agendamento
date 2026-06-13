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
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Navbar superior ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <i className="ti ti-scissors text-white text-sm" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Salão de Beleza</span>
          </div>

          {/* Abas no topo apenas no desktop */}
          <div className="hidden sm:flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${view === t.id ? 'bg-brand-50 text-brand-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <i className={`ti ti-${t.icon} text-sm`} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Páginas — mantidas montadas para preservar estado de auth ── */}
      {/* padding inferior no mobile para não ficar escondido atrás da barra ── */}
      <main className="pb-24 sm:pb-0">
        <div style={{ display: view === 'agendamento' ? 'block' : 'none' }}>
          <AgendamentoPage active={view === 'agendamento'} />
        </div>
        <div style={{ display: view === 'meus-agendamentos' ? 'block' : 'none' }}>
          <MeusAgendamentosPage />
        </div>
      </main>

      {/* ── Navegação inferior (somente mobile) ── */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100
          shadow-[0_-1px_8px_rgba(0,0,0,0.04)] pb-safe"
      >
        <div className="grid grid-cols-2">
          {TABS.map(t => {
            const active = view === t.id
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-2.5
                  transition-colors active:bg-gray-50
                  ${active ? 'text-brand-600' : 'text-gray-400'}`}
              >
                <i className={`ti ti-${t.icon} text-2xl leading-none`} />
                <span className="text-[11px] font-medium leading-none">{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
