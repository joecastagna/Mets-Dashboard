import { RefreshCw, Activity, Clock, Wifi, WifiOff } from 'lucide-react'
import type { GameState } from '../../types/mlb'

interface HeaderProps {
  state: GameState
  onRefresh: () => void
}

const MODE_CONFIG = {
  'live-batting': { label: 'LIVE · BATTING', color: '#22D3A5', pulse: true },
  'live-pitching': { label: 'LIVE · PITCHING', color: '#FF5910', pulse: true },
  'pregame': { label: 'PRE-GAME', color: '#FFD700', pulse: false },
  'postgame': { label: 'FINAL', color: '#8BAFC8', pulse: false },
  'off-day': { label: 'OFF DAY', color: '#4A6A88', pulse: false },
}

export function Header({ state, onRefresh }: HeaderProps) {
  const cfg = MODE_CONFIG[state.mode]
  const now = state.lastUpdated

  const homeTeam = state.game?.gameData.teams.home
  const awayTeam = state.game?.gameData.teams.away
  const ls = state.game?.liveData.linescore

  const isLive = state.mode === 'live-batting' || state.mode === 'live-pitching'

  return (
    <header className="relative z-20 flex items-center justify-between px-4 py-2"
      style={{
        background: 'linear-gradient(180deg, rgba(0,45,114,0.95) 0%, rgba(4,12,24,0.98) 100%)',
        borderBottom: '1px solid rgba(30,109,197,0.3)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <MetsLogo size={28} />
          <div>
            <div className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: '#E8F4FD' }}>
              METS
            </div>
            <div className="text-[9px] tracking-widest uppercase" style={{ color: '#8BAFC8' }}>
              Command Center
            </div>
          </div>
        </div>

        <div className="h-6 w-px mx-1" style={{ background: 'rgba(30,109,197,0.3)' }} />

        <div className="flex items-center gap-2">
          {cfg.pulse && (
            <div className="relative">
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                style={{ background: cfg.color, opacity: 0.5 }} />
            </div>
          )}
          <span className="text-[11px] font-black tracking-widest" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {isLive && ls && homeTeam && awayTeam && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#8BAFC8' }}>
                {awayTeam.abbreviation}
              </div>
              <div className="font-mono text-xl font-black" style={{ color: '#E8F4FD' }}>
                {ls.teams.away.runs ?? 0}
              </div>
            </div>

            <div className="text-center px-3">
              <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#8BAFC8' }}>
                {ls.currentInningOrdinal}
              </div>
              <div className="text-[11px] font-bold" style={{ color: '#4A6A88' }}>
                {ls.inningHalf === 'Top' ? '▲' : '▼'}
              </div>
              <div className="font-mono text-[11px] font-bold" style={{ color: '#8BAFC8' }}>
                {ls.balls ?? 0}-{ls.strikes ?? 0} · {ls.outs ?? 0} OUT{ls.outs !== 1 ? 'S' : ''}
              </div>
            </div>

            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1" style={{ color: '#1E6DC5' }}>
                {homeTeam.abbreviation}
                {homeTeam.id === 121 && <span style={{ color: '#FF5910' }}>◆</span>}
              </div>
              <div className="font-mono text-xl font-black" style={{ color: '#E8F4FD' }}>
                {ls.teams.home.runs ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLive && (state.nextGame || state.lastGame) && (
        <div className="flex items-center gap-2 text-xs" style={{ color: '#8BAFC8' }}>
          {state.mode === 'pregame' && state.nextGame && (
            <span>
              {state.nextGame.teams.away.team.abbreviation} @ {state.nextGame.teams.home.team.abbreviation}
              {' · '}
              {new Date(state.nextGame.gameDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {state.mode === 'postgame' && state.lastGame && (
            <span>
              Final: {state.lastGame.teams.away.team.abbreviation} {state.lastGame.teams.away.score ?? '?'} –{' '}
              {state.lastGame.teams.home.team.abbreviation} {state.lastGame.teams.home.score ?? '?'}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {state.error ? (
          <div className="flex items-center gap-1" style={{ color: '#FF4D6D' }}>
            <WifiOff size={12} />
            <span className="text-[10px]">Error</span>
          </div>
        ) : (
          <div className="flex items-center gap-1" style={{ color: '#22D3A5' }}>
            <Wifi size={12} />
            <span className="text-[10px]">Live</span>
          </div>
        )}

        {now && (
          <div className="flex items-center gap-1" style={{ color: '#4A6A88' }}>
            <Clock size={10} />
            <span className="text-[10px] font-mono">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        )}

        <button
          onClick={onRefresh}
          className="flex items-center gap-1 px-2 py-1 rounded-md transition-all hover:bg-white/5"
          style={{ color: '#8BAFC8', border: '1px solid rgba(26,46,72,0.8)' }}
          disabled={state.isLoading}
        >
          <RefreshCw size={12} className={state.isLoading ? 'animate-spin' : ''} />
          <span className="text-[10px]">Refresh</span>
        </button>

        {isLive && (
          <div className="flex items-center gap-1" style={{ color: '#22D3A5' }}>
            <Activity size={12} />
            <span className="text-[10px]">Auto 15s</span>
          </div>
        )}
      </div>
    </header>
  )
}

function MetsLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="#002D72" stroke="#FF5910" strokeWidth="2" />
      <text x="16" y="20" textAnchor="middle" fill="white"
        fontSize="11" fontFamily="Inter, sans-serif" fontWeight="900" letterSpacing="0.5">
        METS
      </text>
    </svg>
  )
}
