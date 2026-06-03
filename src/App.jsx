import { useState } from 'react'
import AgendamentoPage from './pages/AgendamentoPage'
import AgendaPage from './pages/AgendaPage'

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
            <button
              onClick={() => setView('agendamento')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${view === 'agendamento'
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              <i className="ti ti-calendar-plus text-sm" />
              Agendar
            </button>
            <button
              onClick={() => setView('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${view === 'agenda'
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              <i className="ti ti-calendar-event text-sm" />
              Agenda
            </button>
          </div>
        </div>
      </nav>

      {/* ── Páginas — mantidas montadas para preservar estado de auth ── */}
      <div style={{ display: view === 'agendamento' ? 'block' : 'none' }}>
        <AgendamentoPage />
      </div>
      <div style={{ display: view === 'agenda' ? 'block' : 'none' }}>
        <AgendaPage />
      </div>
    </div>
  )
}
