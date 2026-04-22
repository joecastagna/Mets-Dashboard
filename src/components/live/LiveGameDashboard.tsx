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
      <div className="px-3 py-2 flex items-center gap-4"
        style={{ background: '#070F1C', borderBottom: '1px solid #1A2E48' }}>

        {/* Mode Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{
          background: modeBg, border: `1px solid ${modeColor}40`,
        }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: modeColor }} />
          <span className="text-[10px] font-black tracking-widest" style={{ color: modeColor }}>
            {modeLabel}
          </span>
        </div>

        {/* Inning Scoreboard */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          <div className="text-[10px] font-bold w-16 flex-shrink-0" style={{ color: '#4A6A88' }}>TEAM</div>
          {innings.map(inn => (
            <div key={inn.num} className="text-center w-7 flex-shrink-0"
              style={{
                background: inn.num === ls.currentInning ? 'rgba(30,109,197,0.2)' : 'transparent',
                borderRadius: 4,
              }}>
              <div className="text-[9px]" style={{ color: '#4A6A88' }}>{inn.num}</div>
              <div className="text-[10px] font-mono font-bold" style={{ color: '#8BAFC8' }}>
                {inn.away.runs ?? '-'}
              </div>
              <div className="text-[10px] font-mono font-bold" style={{ color: '#8BAFC8' }}>
                {inn.home.runs ?? '-'}
              </div>
            </div>
          ))}
          <div className="text-center w-7 flex-shrink-0 ml-1">
            <div className="text-[9px] font-bold" style={{ color: '#8BAFC8' }}>R</div>
            <div className="text-[11px] font-mono font-black" style={{ color: '#E8F4FD' }}>{metsIsHome ? ls.teams.away.runs : ls.teams.home.runs}</div>
            <div className="text-[11px] font-mono font-black" style={{ color: '#FF5910' }}>{metsScore}</div>
          </div>
          <div className="text-center w-7 flex-shrink-0">
            <div className="text-[9px] font-bold" style={{ color: '#8BAFC8' }}>H</div>
            <div className="text-[11px] font-mono" style={{ color: '#8BAFC8' }}>{metsIsHome ? ls.teams.away.hits : ls.teams.home.hits}</div>
            <div className="text-[11px] font-mono" style={{ color: '#8BAFC8' }}>{metsIsHome ? ls.teams.home.hits : ls.teams.away.hits}</div>
          </div>
          <div className="text-center w-7 flex-shrink-0">
            <div className="text-[9px] font-bold" style={{ color: '#8BAFC8' }}>E</div>
            <div className="text-[11px] font-mono" style={{ color: '#8BAFC8' }}>{metsIsHome ? ls.teams.away.errors : ls.teams.home.errors}</div>
            <div className="text-[11px] font-mono" style={{ color: '#8BAFC8' }}>{metsIsHome ? ls.teams.home.errors : ls.teams.away.errors}</div>
          </div>
        </div>

        {/* Teams row labels */}
        <div className="flex flex-col gap-0.5 w-16 flex-shrink-0">
          <div className="text-[9px] font-bold truncate" style={{ color: '#8BAFC8' }}>{oppTeam.abbreviation}</div>
          <div className="text-[9px] font-bold truncate" style={{ color: '#FF5910' }}>{metsTeam.abbreviation}</div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <BaseRunners onFirst={onFirst} onSecond={onSecond} onThird={onThird} outs={outs} size="sm" />
          <div className="text-center">
            <div className="text-[9px]" style={{ color: '#4A6A88' }}>SCORE</div>
            <div className="font-mono font-black text-lg" style={{ color: '#E8F4FD' }}>
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
            batterStats={currentBatterStats ?? createEmptyStats()}
            isMetsBatting={true}
          />
        ) : (
          <PitchingMode
            feed={game}
            pitcherStats={currentPitcherStats ?? createEmptyStats()}
            batterStats={currentBatterStats ?? createEmptyStats()}
            isMetsPitching={true}
          />
        )}
      </div>
    </div>
  )
}

function createEmptyStats() {
  return {
    batting: {
      avg: 0.250, obp: 0.330, slg: 0.420, ops: 0.750, woba: 0.320,
      iso: 0.170, babip: 0.295, bbPct: 0.090, kPct: 0.220, bbk: 0.41,
      hardHitPct: 0.41, avgExitVelo: 89.0, avgLaunchAngle: 14.0, barrelPct: 0.085,
      xba: 0.248, xslg: 0.415, xwoba: 0.318, sprintSpeed: 27.0,
      pullPct: 0.38, centPct: 0.36, oppoPct: 0.26, gbPct: 0.42, fbPct: 0.38, ldPct: 0.20,
      softPct: 0.15, medPct: 0.45, hrTotal: 15, rbi: 55, runs: 50, sb: 8, cs: 2, sbPct: 0.80,
      wrcPlus: 110, war: 2.1, opsPlus: 110, risp: 0.310, clutch: 0.1,
      vsLHP: 0.760, vsRHP: 0.740, homeOps: 0.760, awayOps: 0.740,
      last30Ops: [0.72, 0.74, 0.78, 0.75, 0.75],
    },
    pitching: {
      era: 3.85, fip: 3.60, xfip: 3.70, siera: 3.55, whip: 1.20,
      k9: 9.2, bb9: 2.8, h9: 8.5, hr9: 1.1, kPct: 0.24, bbPct: 0.07, kbb: 3.29,
      kbbPct: 0.17, hrfb: 0.095, gbPct: 0.44, fbPct: 0.37, ldPct: 0.19,
      lobPct: 0.72, swStrPct: 0.118, cswPct: 0.285, zonePct: 0.455,
      chasePct: 0.295, contactPct: 0.775, fStrikePct: 0.625,
      avgFBVelo: 94.2, avgSpinRate: 2310, stuffPlus: 105, locationPlus: 108, pitchingPlus: 112,
      war: 2.5, ip: '120.1', wins: 8, losses: 6, saves: 0, holds: 0, qs: 10,
      last5ERA: [3.5, 4.1, 2.8, 3.9, 3.2],
      pitchMix: [
        { type: 'Four-Seam FB', code: 'FF', usage: 0.45, avgVelo: 94.2, avgSpin: 2310, whiffPct: 0.22, putawayPct: 0.28, runValue: -2.1, color: '#FF5910' },
        { type: 'Slider', code: 'SL', usage: 0.22, avgVelo: 87.1, avgSpin: 2450, whiffPct: 0.38, putawayPct: 0.42, runValue: -1.8, color: '#1E6DC5' },
        { type: 'Changeup', code: 'CH', usage: 0.18, avgVelo: 85.3, avgSpin: 1820, whiffPct: 0.29, putawayPct: 0.31, runValue: -0.9, color: '#22D3A5' },
        { type: 'Curveball', code: 'CU', usage: 0.12, avgVelo: 79.4, avgSpin: 2680, whiffPct: 0.35, putawayPct: 0.38, runValue: -1.2, color: '#B47AFF' },
        { type: 'Cutter', code: 'FC', usage: 0.03, avgVelo: 91.1, avgSpin: 2180, whiffPct: 0.18, putawayPct: 0.22, runValue: 0.3, color: '#FFD700' },
      ],
    },
  }
}
