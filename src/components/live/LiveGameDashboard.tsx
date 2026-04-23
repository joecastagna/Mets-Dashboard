import type { GameState } from '../../types/mlb'
import { BattingMode } from './BattingMode'
import { PitchingMode } from './PitchingMode'
import { BaseRunners } from '../shared/BaseRunners'

interface LiveGameDashboardProps {
  state: GameState
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-32 rounded-xl" style={{ background: '#0A1628' }} />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-48 rounded-xl" style={{ background: '#0A1628' }} />
        ))}
      </div>
      <div className="h-24 rounded-xl" style={{ background: '#0A1628' }} />
    </div>
  )
}

export function LiveGameDashboard({ state }: LiveGameDashboardProps) {
  const { game, isMetsBatting, currentBatterStats, currentPitcherStats, isLoading } = state

  if (isLoading || !game) return <LoadingSkeleton />

  const ls = game.liveData.linescore
  const onFirst = !!ls.offense?.onFirst
  const onSecond = !!ls.offense?.onSecond
  const onThird = !!ls.offense?.onThird
  const outs = ls.outs ?? 0

  const metsIsHome = game.gameData.teams.home.id === 121
  const metsTeam = metsIsHome ? game.gameData.teams.home : game.gameData.teams.away
  const oppTeam = metsIsHome ? game.gameData.teams.away : game.gameData.teams.home
  const metsScore = metsIsHome ? ls.teams.home.runs : ls.teams.away.runs
  const oppScore = metsIsHome ? ls.teams.away.runs : ls.teams.home.runs

  const modeLabel = isMetsBatting ? 'METS BATTING' : 'METS PITCHING'
  const modeColor = isMetsBatting ? '#22D3A5' : '#FF5910'
  const modeBg = isMetsBatting
    ? 'linear-gradient(90deg, rgba(34,211,165,0.15), transparent)'
    : 'linear-gradient(90deg, rgba(255,89,16,0.15), transparent)'

  const innings = game.liveData.linescore.innings ?? []

  return (
    <div className="flex flex-col h-full">

      {/* Game Scoreboard Strip */}
      <div className="px-2 py-1.5 flex items-center gap-2"
        style={{ background: '#070F1C', borderBottom: '1px solid #1A2E48' }}>

        {/* Mode Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full flex-shrink-0" style={{
          background: modeBg, border: `1px solid ${modeColor}40`,
        }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: modeColor }} />
          <span className="text-[10px] font-black tracking-widest hidden sm:inline" style={{ color: modeColor }}>
            {modeLabel}
          </span>
        </div>

        {/* Inning-by-inning linescore — scrolls on mobile */}
        <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
          <div className="text-[9px] font-bold w-10 flex-shrink-0" style={{ color: '#4A6A88' }}>TEAM</div>
          {innings.map(inn => (
            <div key={inn.num} className="text-center w-6 flex-shrink-0"
              style={{
                background: inn.num === ls.currentInning ? 'rgba(30,109,197,0.2)' : 'transparent',
                borderRadius: 3,
              }}>
              <div className="text-[8px]" style={{ color: '#4A6A88' }}>{inn.num}</div>
              <div className="text-[9px] font-mono font-bold" style={{ color: '#8BAFC8' }}>{inn.away.runs ?? '-'}</div>
              <div className="text-[9px] font-mono font-bold" style={{ color: '#8BAFC8' }}>{inn.home.runs ?? '-'}</div>
            </div>
          ))}
          <div className="text-center w-6 flex-shrink-0 ml-1">
            <div className="text-[8px] font-bold" style={{ color: '#8BAFC8' }}>R</div>
            <div className="text-[10px] font-mono font-black" style={{ color: '#E8F4FD' }}>{metsIsHome ? ls.teams.away.runs : ls.teams.home.runs}</div>
            <div className="text-[10px] font-mono font-black" style={{ color: '#FF5910' }}>{metsScore}</div>
          </div>
          <div className="text-center w-6 flex-shrink-0 hidden sm:block">
            <div className="text-[8px] font-bold" style={{ color: '#8BAFC8' }}>H</div>
            <div className="text-[10px] font-mono" style={{ color: '#8BAFC8' }}>{metsIsHome ? ls.teams.away.hits : ls.teams.home.hits}</div>
            <div className="text-[10px] font-mono" style={{ color: '#8BAFC8' }}>{metsIsHome ? ls.teams.home.hits : ls.teams.away.hits}</div>
          </div>
        </div>

        {/* Teams labels */}
        <div className="flex flex-col gap-0.5 w-10 flex-shrink-0">
          <div className="text-[9px] font-bold truncate" style={{ color: '#8BAFC8' }}>{oppTeam.abbreviation}</div>
          <div className="text-[9px] font-bold truncate" style={{ color: '#FF5910' }}>{metsTeam.abbreviation}</div>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <BaseRunners onFirst={onFirst} onSecond={onSecond} onThird={onThird} outs={outs} size="sm" />
          <div className="text-center">
            <div className="font-mono font-black text-base" style={{ color: '#E8F4FD' }}>
              <span style={{ color: '#FF5910' }}>{metsScore ?? 0}</span>
              <span style={{ color: '#4A6A88' }}>–</span>
              <span>{oppScore ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - toggles based on batting/pitching */}
      <div className="flex-1 overflow-auto">
        {isMetsBatting ? (
          <BattingMode
            feed={game}
            batterStats={currentBatterStats ?? {}}
            isMetsBatting={true}
          />
        ) : (
          <PitchingMode
            feed={game}
            pitcherStats={currentPitcherStats ?? {}}
            batterStats={currentBatterStats ?? {}}
            isMetsPitching={true}
          />
        )}
      </div>
    </div>
  )
}
