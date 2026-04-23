import type { GameState, GamePlayerWithStats, PostGameData } from '../../types/mlb'
import type { RealBattingStats, RealPitchingStats } from '../../utils/mlbApi'
import { METS_ID } from '../../utils/mlbApi'
import { SectionHeader } from '../shared/StatCard'
import { fmtAvg, fmtERA, fmtOPS, fmtInt, fmtWHIP } from '../../utils/formatters'

interface PostGameDashboardProps {
  state: GameState
}

function bStats(p: GamePlayerWithStats) { return p.gameStats.batting ?? {} }
function pStats(p: GamePlayerWithStats) { return p.gameStats.pitching ?? {} }
function seasonBat(p: GamePlayerWithStats) { return p.seasonStats as RealBattingStats | undefined }
function seasonPit(p: GamePlayerWithStats) { return p.seasonStats as RealPitchingStats | undefined }

export function PostGameDashboard({ state }: PostGameDashboardProps) {
  const { postGameData, nextGame } = state

  if (!postGameData) {
    return (
      <div className="p-6 text-center" style={{ color: '#8BAFC8' }}>
        <div className="text-lg font-bold mb-2">Loading game data…</div>
        <div className="text-sm">Fetching box score from MLB Stats API</div>
      </div>
    )
  }

  const { game, metsIsHome, metsScore, oppScore, metsWon, metsBatters, metsPitchers, scoringPlays } = postGameData

  const oppTeam = metsIsHome ? game.teams.away.team : game.teams.home.team
  const metsRecord = metsIsHome ? game.teams.home.leagueRecord : game.teams.away.leagueRecord
  const gameDate = new Date(game.gameDate).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  // Team totals computed from real box score
  const teamH   = metsBatters.reduce((s, p) => s + (bStats(p).h   ?? 0), 0)
  const teamR   = metsBatters.reduce((s, p) => s + (bStats(p).r   ?? 0), 0)
  const teamHR  = metsBatters.reduce((s, p) => s + (bStats(p).hr  ?? 0), 0)
  const teamBB  = metsBatters.reduce((s, p) => s + (bStats(p).bb  ?? 0), 0)
  const teamK   = metsBatters.reduce((s, p) => s + (bStats(p).k   ?? 0), 0)
  const teamRBI = metsBatters.reduce((s, p) => s + (bStats(p).rbi ?? 0), 0)
  const pitchK  = metsPitchers.reduce((s, p) => s + (pStats(p).k  ?? 0), 0)
  const pitchPC = metsPitchers.reduce((s, p) => s + (pStats(p).numberOfPitches ?? 0), 0)

  // Best performers from real data
  const topBatter  = [...metsBatters].sort((a, b) => (bStats(b).h ?? 0) - (bStats(a).h ?? 0))[0]
  const topPitcher = metsPitchers[0]

  // Next game info
  const nextOpp     = nextGame ? (nextGame.teams.away.team.id === METS_ID ? nextGame.teams.home.team : nextGame.teams.away.team) : null
  const nextIsHome  = nextGame?.teams.home.team.id === METS_ID
  const metsProbable = nextGame?.probablePitchers ? (nextIsHome ? nextGame.probablePitchers.home : nextGame.probablePitchers.away) : null
  const oppProbable  = nextGame?.probablePitchers ? (nextIsHome ? nextGame.probablePitchers.away : nextGame.probablePitchers.home) : null
  const nextDateTime = nextGame ? new Date(nextGame.gameDate).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }) : null

  return (
    <div className="p-3 space-y-3 animate-fade-in">

      {/* Final Score Banner */}
      <div className="rounded-xl p-4" style={{
        background: metsWon
          ? 'linear-gradient(135deg, rgba(0,45,114,0.7) 0%, rgba(34,211,165,0.1) 100%)'
          : 'linear-gradient(135deg, rgba(139,0,0,0.3) 0%, rgba(4,12,24,0.9) 100%)',
        border: `1px solid ${metsWon ? 'rgba(34,211,165,0.4)' : 'rgba(255,77,109,0.3)'}`,
        boxShadow: `0 0 30px ${metsWon ? 'rgba(34,211,165,0.1)' : 'rgba(255,77,109,0.05)'}`,
      }}>
        <div className="flex items-center justify-between flex-wrap gap-4">

          {/* Score */}
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#4A6A88' }}>
              {gameDate} · FINAL
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xl font-black" style={{ color: '#FF5910' }}>NYM</div>
                <div className="font-mono text-5xl font-black" style={{
                  color: metsWon ? '#22D3A5' : '#E8F4FD',
                  textShadow: metsWon ? '0 0 20px rgba(34,211,165,0.5)' : 'none',
                }}>
                  {metsScore}
                </div>
                {metsRecord && (
                  <div className="text-[10px] font-mono" style={{ color: '#4A6A88' }}>
                    {metsRecord.wins}-{metsRecord.losses}
                  </div>
                )}
              </div>
              <div className="text-3xl font-black" style={{ color: '#4A6A88' }}>–</div>
              <div className="text-center">
                <div className="text-xl font-black" style={{ color: '#8BAFC8' }}>{oppTeam.abbreviation}</div>
                <div className="font-mono text-5xl font-black" style={{ color: '#E8F4FD' }}>{oppScore}</div>
              </div>
            </div>
          </div>

          {/* Result badge */}
          <div className="flex flex-col items-center gap-2">
            <div className={`px-4 py-2 rounded-xl text-lg font-black tracking-wider ${
              metsWon ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {metsWon ? '✓ WIN' : '✗ LOSS'}
            </div>
            {topPitcher && (
              <div className="text-[10px] text-center" style={{ color: '#8BAFC8' }}>
                {metsWon ? 'W: ' : 'L: '}{topPitcher.person.fullName}
              </div>
            )}
          </div>

          {/* Quick game totals */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'HITS', value: String(teamH), color: '#22D3A5' },
              { label: 'HR', value: String(teamHR), color: '#FFD700' },
              { label: 'PITCH K', value: String(pitchK), color: '#60B4FF' },
              { label: 'RBI', value: String(teamRBI), color: '#FF5910' },
              { label: 'BB', value: String(teamBB), color: '#B47AFF' },
              { label: 'PITCHES', value: String(pitchPC || '--'), color: '#8BAFC8' },
            ].map(s => (
              <div key={s.label} className="text-center rounded-lg p-2" style={{
                background: `${s.color}10`, border: `1px solid ${s.color}30`,
              }}>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: s.color }}>{s.label}</div>
                <div className="font-mono text-sm font-black" style={{ color: '#E8F4FD' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">

        {/* LEFT: Scoring Plays */}
        <div className="col-span-4 flex flex-col gap-3">

          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Scoring Plays" accent="orange" />
            {scoringPlays.length === 0 ? (
              <div className="text-xs text-center py-4" style={{ color: '#4A6A88' }}>No scoring plays available</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {scoringPlays.map((play, i) => {
                  const metsScored = metsIsHome ? !play.isTopInning : play.isTopInning
                  const metsRunsNow = metsIsHome ? play.homeScore : play.awayScore
                  const oppRunsNow  = metsIsHome ? play.awayScore : play.homeScore
                  return (
                    <div key={i} className="flex gap-2 items-start rounded-lg p-2" style={{
                      background: metsScored ? 'rgba(34,211,165,0.06)' : 'rgba(255,77,109,0.06)',
                      border: `1px solid ${metsScored ? 'rgba(34,211,165,0.2)' : 'rgba(255,77,109,0.15)'}`,
                    }}>
                      <div className="text-[10px] font-black flex-shrink-0 mt-0.5 rounded px-1.5 py-0.5"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#8BAFC8' }}>
                        {play.isTopInning ? '▲' : '▼'}{play.inning}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold leading-tight" style={{ color: '#E8F4FD' }}>
                          {play.description || 'Scoring play'}
                        </div>
                        <div className="text-[10px] font-bold mt-0.5" style={{
                          color: metsScored ? '#22D3A5' : '#FF4D6D',
                        }}>
                          NYM {metsRunsNow} · {oppTeam.abbreviation} {oppRunsNow}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Next Game Preview */}
          {nextGame && (
            <div className="rounded-xl p-3" style={{
              background: 'linear-gradient(135deg, rgba(0,45,114,0.6) 0%, rgba(4,12,24,0.9) 100%)',
              border: '1px solid rgba(30,109,197,0.4)',
            }}>
              <SectionHeader title="Next Game" accent="blue" />
              <div className="space-y-2">
                <div className="text-sm font-black" style={{ color: '#E8F4FD' }}>
                  {nextIsHome ? 'vs' : 'at'} {nextOpp?.name ?? nextOpp?.abbreviation ?? '—'}
                </div>
                {nextDateTime && (
                  <div className="text-xs font-semibold" style={{ color: '#FFD700' }}>{nextDateTime}</div>
                )}
                {(metsProbable || oppProbable) && (
                  <div className="text-[11px] space-y-0.5" style={{ color: '#8BAFC8' }}>
                    {metsProbable && <div>NYM: {metsProbable.fullName}</div>}
                    {oppProbable  && <div>{nextOpp?.abbreviation}: {oppProbable.fullName}</div>}
                  </div>
                )}
                <div className="text-[10px]" style={{ color: '#4A6A88' }}>
                  {nextGame.venue?.name ?? ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Box Scores */}
        <div className="col-span-5 flex flex-col gap-3">

          {/* Batting Box Score */}
          <div className="rounded-xl overflow-hidden" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <div className="px-3 py-2" style={{ background: 'rgba(0,45,114,0.5)' }}>
              <div className="flex items-center gap-2">
                <div className="h-3 w-0.5 rounded-full" style={{ background: '#1E6DC5' }} />
                <h3 className="text-xs font-black tracking-widest uppercase" style={{ color: '#E8F4FD' }}>NYM Batting</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1A2E48' }}>
                    {['Player', 'AB', 'R', 'H', 'RBI', 'BB', 'K', 'HR', 'AVG', 'OPS'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-bold text-[10px] uppercase tracking-wider"
                        style={{ color: '#4A6A88' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metsBatters.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-2 py-4 text-center text-[11px]" style={{ color: '#4A6A88' }}>
                        Box score not available
                      </td>
                    </tr>
                  ) : metsBatters.map((p, i) => {
                    const g  = bStats(p)
                    const ss = seasonBat(p)
                    return (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-2 py-1.5">
                          <div className="font-semibold" style={{ color: '#E8F4FD' }}>{p.person.fullName}</div>
                          <div className="text-[9px]" style={{ color: '#4A6A88' }}>{p.position?.abbreviation ?? ''}</div>
                        </td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{g.ab ?? 0}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{ color: (g.r ?? 0) > 0 ? '#22D3A5' : '#8BAFC8' }}>{g.r ?? 0}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{ color: (g.h ?? 0) >= 2 ? '#22D3A5' : '#E8F4FD' }}>{g.h ?? 0}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{ color: (g.rbi ?? 0) > 0 ? '#FF5910' : '#8BAFC8' }}>{g.rbi ?? 0}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{g.bb ?? 0}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: (g.k ?? 0) >= 3 ? '#FF4D6D' : '#8BAFC8' }}>{g.k ?? 0}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{ color: (g.hr ?? 0) > 0 ? '#FFD700' : '#8BAFC8' }}>{g.hr ?? 0}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{fmtAvg(ss?.avg)}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{fmtOPS(ss?.ops)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                {metsBatters.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: '1px solid #1A2E48' }}>
                      <td className="px-2 py-1.5 font-bold text-[10px] uppercase" style={{ color: '#4A6A88' }}>TOTALS</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: '#E8F4FD' }}>
                        {metsBatters.reduce((s, p) => s + (bStats(p).ab ?? 0), 0)}
                      </td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: '#22D3A5' }}>{teamR}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: '#22D3A5' }}>{teamH}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: '#FF5910' }}>{teamRBI}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{teamBB}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{teamK}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: '#FFD700' }}>{teamHR}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Pitching Box Score */}
          <div className="rounded-xl overflow-hidden" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <div className="px-3 py-2" style={{ background: 'rgba(255,89,16,0.15)' }}>
              <div className="flex items-center gap-2">
                <div className="h-3 w-0.5 rounded-full" style={{ background: '#FF5910' }} />
                <h3 className="text-xs font-black tracking-widest uppercase" style={{ color: '#E8F4FD' }}>NYM Pitching</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1A2E48' }}>
                    {['Pitcher', 'IP', 'H', 'R', 'ER', 'BB', 'K', 'HR', 'PC', 'ERA'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-bold text-[10px] uppercase tracking-wider"
                        style={{ color: '#4A6A88' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metsPitchers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-2 py-4 text-center text-[11px]" style={{ color: '#4A6A88' }}>
                        Pitching data not available
                      </td>
                    </tr>
                  ) : metsPitchers.map((p, i) => {
                    const g  = pStats(p)
                    const ss = seasonPit(p)
                    return (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-2 py-1.5 font-semibold" style={{ color: '#E8F4FD' }}>{p.person.fullName}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{ color: '#E8F4FD' }}>{g.ip ?? '--'}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{g.h ?? '--'}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: (g.r ?? 0) > 2 ? '#FF4D6D' : '#8BAFC8' }}>{g.r ?? '--'}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: (g.er ?? 0) > 2 ? '#FF4D6D' : '#8BAFC8' }}>{g.er ?? '--'}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{g.bb ?? '--'}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{ color: (g.k ?? 0) >= 6 ? '#22D3A5' : '#E8F4FD' }}>{g.k ?? '--'}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: (g.hr ?? 0) > 1 ? '#FF4D6D' : '#8BAFC8' }}>{g.hr ?? '--'}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: (g.numberOfPitches ?? 0) > 100 ? '#FFB347' : '#8BAFC8' }}>
                          {g.numberOfPitches ?? '--'}
                        </td>
                        <td className="px-2 py-1.5 font-mono" style={{
                          color: ss?.era !== undefined ? (ss.era < 3.5 ? '#22D3A5' : ss.era > 5 ? '#FF4D6D' : '#FFB347') : '#8BAFC8',
                        }}>
                          {fmtERA(ss?.era)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Highlights + Next Game */}
        <div className="col-span-3 flex flex-col gap-3">

          {/* Game Highlights — derived from real box score */}
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Game Highlights" accent="orange" />
            <div className="space-y-2">

              {topBatter && (bStats(topBatter).h ?? 0) > 0 && (
                <div className="rounded-lg p-2" style={{ background: 'rgba(34,211,165,0.06)', border: '1px solid rgba(34,211,165,0.2)' }}>
                  <div className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{ color: '#22D3A5' }}>TOP BATTER</div>
                  <div className="text-xs font-bold" style={{ color: '#E8F4FD' }}>{topBatter.person.fullName}</div>
                  <div className="text-[11px] font-mono" style={{ color: '#8BAFC8' }}>
                    {bStats(topBatter).h ?? 0}-for-{bStats(topBatter).ab ?? 0}
                    {(bStats(topBatter).hr ?? 0) > 0 ? `, ${bStats(topBatter).hr} HR` : ''}
                    {(bStats(topBatter).rbi ?? 0) > 0 ? `, ${bStats(topBatter).rbi} RBI` : ''}
                  </div>
                </div>
              )}

              {topPitcher && pStats(topPitcher).ip && (
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,89,16,0.06)', border: '1px solid rgba(255,89,16,0.2)' }}>
                  <div className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{ color: '#FF5910' }}>STARTING PITCHER</div>
                  <div className="text-xs font-bold" style={{ color: '#E8F4FD' }}>{topPitcher.person.fullName}</div>
                  <div className="text-[11px] font-mono" style={{ color: '#8BAFC8' }}>
                    {pStats(topPitcher).ip} IP · {pStats(topPitcher).k ?? 0} K · {pStats(topPitcher).er ?? 0} ER
                    {pStats(topPitcher).numberOfPitches ? ` · ${pStats(topPitcher).numberOfPitches} P` : ''}
                  </div>
                </div>
              )}

              {teamHR > 0 && (
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}>
                  <div className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{ color: '#FFD700' }}>HOME RUNS</div>
                  <div className="space-y-0.5">
                    {metsBatters.filter(p => (bStats(p).hr ?? 0) > 0).map((p, i) => (
                      <div key={i} className="text-[11px] font-mono" style={{ color: '#E8F4FD' }}>
                        {p.person.fullName.split(' ').pop()} ({bStats(p).hr})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  ['Team K', String(teamK)],
                  ['Pitch K', String(pitchK)],
                  ['Team BB', String(teamBB)],
                  ['Pitches', pitchPC > 0 ? String(pitchPC) : '--'],
                ].map(([l, v]) => (
                  <div key={l} className="text-center rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1A2E48' }}>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: '#4A6A88' }}>{l}</div>
                    <div className="font-mono text-sm font-black" style={{ color: '#E8F4FD' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Season stats for top pitcher */}
          {topPitcher && seasonPit(topPitcher)?.era !== undefined && (
            <div className="rounded-xl p-3" style={{
              background: 'rgba(255,89,16,0.05)', border: '1px solid rgba(255,89,16,0.25)',
            }}>
              <SectionHeader title={`${topPitcher.person.fullName.split(' ').pop()} Season`} accent="orange" />
              <div className="space-y-1.5">
                {[
                  ['ERA',  fmtERA(seasonPit(topPitcher)?.era)],
                  ['FIP',  fmtERA(seasonPit(topPitcher)?.fip)],
                  ['WHIP', fmtWHIP(seasonPit(topPitcher)?.whip)],
                  ['IP',   seasonPit(topPitcher)?.ip ?? '--'],
                  ['K',    fmtInt(seasonPit(topPitcher)?.k)],
                ].map(([l, v]) => (
                  <div key={String(l)} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8BAFC8' }}>{String(l)}</span>
                    <span className="font-mono text-xs font-bold" style={{ color: '#E8F4FD' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
