import { useState } from 'react'
import { useMLBGame } from './hooks/useMLBGame'
import { Header } from './components/layout/Header'
import { LiveGameDashboard } from './components/live/LiveGameDashboard'
import { PreGameDashboard } from './components/pregame/PreGameDashboard'
import { PostGameDashboard } from './components/postgame/PostGameDashboard'

type ViewTab = 'auto' | 'pregame' | 'postgame'

export default function App() {
  const gameState = useMLBGame()
  const { refresh, mode, error } = gameState
  const [viewTab, setViewTab] = useState<ViewTab>('auto')

  const isLive = mode === 'live-batting' || mode === 'live-pitching'
  const effectiveMode = isLive ? 'live' : viewTab === 'auto' ? mode : viewTab

  return (
    <div className="flex flex-col h-screen" style={{ background: '#040C18' }}>

      {/* Header */}
      <Header state={gameState} onRefresh={refresh} />

      {/* Mode Tabs (only shown when not in live mode) */}
      {!isLive && (
        <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto"
          style={{ background: '#070F1C', borderBottom: '1px solid #1A2E48' }}>
          {([
            ['auto', mode === 'pregame' ? 'Pre-Game' : mode === 'postgame' ? 'Post-Game' : 'Off Day'],
            ['pregame', 'Pre-Game'],
            ['postgame', 'Recap'],
          ] as [ViewTab, string][]).map(([tab, label]) => {
            const isActive = viewTab === tab
            return (
              <button
                key={tab}
                onClick={() => setViewTab(tab)}
                className="px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all"
                style={{
                  background: isActive ? 'rgba(30,109,197,0.25)' : 'transparent',
                  color: isActive ? '#60B4FF' : '#4A6A88',
                  border: `1px solid ${isActive ? 'rgba(30,109,197,0.5)' : 'transparent'}`,
                }}
              >
                {label}
              </button>
            )
          })}

          <div className="ml-auto flex items-center gap-2 text-[10px]" style={{ color: '#4A6A88' }}>
            <span>MLB Stats API</span>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: error ? '#FF4D6D' : '#22D3A5' }} />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 text-xs font-semibold flex items-center gap-2"
          style={{ background: 'rgba(255,77,109,0.1)', borderBottom: '1px solid rgba(255,77,109,0.2)', color: '#FF4D6D' }}>
          <span>⚠</span>
          <span>API Error: {error} — Showing demo data</span>
          <button onClick={refresh} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Loading State */}
        {gameState.isLoading && !gameState.game && !gameState.lastGame && !gameState.nextGame && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(30,109,197,0.3)', borderTopColor: '#1E6DC5' }} />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">⚾</div>
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: '#E8F4FD' }}>Loading Mets Command Center</div>
                <div className="text-xs mt-1" style={{ color: '#4A6A88' }}>Connecting to MLB Stats API...</div>
              </div>
            </div>
          </div>
        )}

        {/* Live Game */}
        {isLive && (
          <div className="h-full overflow-auto">
            <LiveGameDashboard state={gameState} />
          </div>
        )}

        {/* Pre-Game */}
        {!isLive && effectiveMode === 'pregame' && (
          <div className="h-full overflow-auto">
            <PreGameDashboard state={gameState} />
          </div>
        )}

        {/* Post-Game / Off-Day */}
        {!isLive && (effectiveMode === 'postgame' || effectiveMode === 'off-day') && (
          <div className="h-full overflow-auto">
            <PostGameDashboard state={gameState} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center px-3 py-1"
        style={{ background: '#070F1C', borderTop: '1px solid #1A2E48' }}>
        <div className="text-[10px]" style={{ color: '#2A4A6A' }}>
          MLB Stats API · Auto-refresh {isLive ? '15s' : '2min'} · © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
