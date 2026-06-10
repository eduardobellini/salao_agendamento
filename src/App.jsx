import { useState } from 'react'
import AgendamentoPage from './pages/AgendamentoPage'
import AgendaPage from './pages/AgendaPage'
import MeusAgendamentosPage from './pages/MeusAgendamentosPage'

const TABS = [
  { id: 'agendamento',       label: 'Agendar',       icon: 'calendar-plus'  },
  { id: 'meus-agendamentos', label: 'Meus horários', icon: 'calendar-user'  },
  { id: 'agenda',            label: 'Agenda',        icon: 'calendar-event' },
]

export default function App() {
  const [view, setView] = useState('agendamento')

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <i className="ti ti-scissors text-white text-sm" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Salão de Beleza</span>
          </div>

          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${view === t.id ? 'bg-brand-50 text-brand-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <i className={`ti ti-${t.icon} text-sm`} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Páginas — mantidas montadas para preservar estado de auth ── */}
      <div style={{ display: view === 'agendamento' ? 'block' : 'none' }}>
        <AgendamentoPage />
      </div>
      <div style={{ display: view === 'meus-agendamentos' ? 'block' : 'none' }}>
        <MeusAgendamentosPage />
      </div>
      <div style={{ display: view === 'agenda' ? 'block' : 'none' }}>
        <AgendaPage />
      </div>
    </div>
  )
}
