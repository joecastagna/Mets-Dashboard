import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import type { GameState, LineupPlayerWithStats, PitcherInfo } from '../../types/mlb'
import { SectionHeader } from '../shared/StatCard'
import { ProgressBar, WinProbBar } from '../shared/GaugeChart'
import {
  fmtAvg, fmtERA, fmtPct, fmtOPS, fmtWHIP, fmtK9, fmtPlus, fmtNum, fmtInt
} from '../../utils/formatters'

interface PreGameDashboardProps { state: GameState }

function PitcherCard({ info, label, accentColor }: { info?: PitcherInfo; label: string; accentColor: string }) {
  const s = info?.stats
  const name = info?.person.fullName ?? 'TBD'

  return (
    <div className="rounded-xl p-4 flex-1" style={{
      background: `${accentColor}10`,
      border: `1px solid ${accentColor}40`,
    }}>
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>{label}</div>
        <div className="text-base font-black" style={{ color: '#E8F4FD' }}>{name}</div>
        {s && (
          <div className="text-[10px] mt-0.5" style={{ color: '#8BAFC8' }}>
            {fmtInt(s.wins)}-{fmtInt(s.losses)} · {s.ip ?? '--'} IP
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          ['ERA', fmtERA(s?.era), s?.era, s?.era !== undefined && s.era < 3.5],
          ['FIP', fmtERA(s?.fip), s?.fip, s?.fip !== undefined && s.fip < 3.5],
          ['WHIP', fmtWHIP(s?.whip), s?.whip, s?.whip !== undefined && s.whip < 1.15],
        ].map(([lbl, val, raw, good]) => (
          <div key={String(lbl)} className="text-center rounded-lg py-2" style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>{String(lbl)}</div>
            <div className="font-mono text-lg font-black" style={{
              color: raw === undefined ? '#4A6A88' : (good ? '#22D3A5' : '#FFB347'),
            }}>{String(val)}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <ProgressBar value={s?.k9 ?? 0} max={14} label="K/9" valueDisplay={fmtK9(s?.k9)} color={accentColor} height={4} showValue={s?.k9 !== undefined} />
        <ProgressBar value={s?.bb9 !== undefined ? Math.max(0, 5 - s.bb9) : 0} max={5} label="BB/9 (lower=better)" valueDisplay={fmtK9(s?.bb9)} color={accentColor} height={4} showValue={s?.bb9 !== undefined} />
        {s?.kPct !== undefined && (
          <ProgressBar value={s.kPct} label="K%" valueDisplay={fmtPct(s.kPct)} color={accentColor} height={4} />
        )}
        {s?.fip !== undefined && s?.xera !== undefined && (
          <div className="flex justify-between text-[10px] mt-1">
            <span style={{ color: '#8BAFC8' }}>xERA</span>
            <span className="font-mono font-bold" style={{ color: s.xera < 3.5 ? '#22D3A5' : '#FFB347' }}>{fmtERA(s.xera)}</span>
          </div>
        )}
      </div>

      {s?.pitchMix && s.pitchMix.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#4A6A88' }}>Arsenal</div>
          {s.pitchMix.slice(0, 4).map(p => (
            <div key={p.code} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="text-[10px] flex-1 truncate" style={{ color: '#8BAFC8' }}>{p.name}</span>
              <span className="font-mono text-[10px] font-bold" style={{ color: '#E8F4FD' }}>{fmtPct(p.usage)}</span>
              <span className="font-mono text-[10px]" style={{ color: '#4A6A88' }}>
                {p.avgVelo !== undefined ? `${fmtNum(p.avgVelo, 1)} mph` : '--'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LineupTable({ lineup }: { lineup: LineupPlayerWithStats[] }) {
  if (!lineup.length) {
    return (
      <div className="flex items-center justify-center py-10" style={{ color: '#4A6A88' }}>
        <div className="text-center">
          <div className="text-2xl mb-2">⚾</div>
          <div className="text-sm">Lineup not yet announced</div>
          <div className="text-xs mt-1">Check back closer to first pitch</div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid #1A2E48' }}>
            {['#', 'Player', 'Pos', 'AVG', 'OBP', 'SLG', 'OPS', 'HR', 'RBI', 'wOBA', 'wRC+', 'K%', 'BB%'].map(h => (
              <th key={h} className="px-2 py-1.5 text-left font-bold text-[10px] uppercase tracking-wider"
                style={{ color: '#4A6A88' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lineup.map((p, i) => {
            const s = p.stats
            const wrcColor = s?.wrcPlus !== undefined
              ? (s.wrcPlus >= 130 ? '#FFD700' : s.wrcPlus >= 110 ? '#22D3A5' : s.wrcPlus >= 95 ? '#E8F4FD' : '#8BAFC8')
              : '#4A6A88'
            return (
              <tr key={p.person.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td className="px-2 py-1.5 font-mono font-bold" style={{ color: '#4A6A88' }}>
                  {p.battingOrder ?? i + 1}
                </td>
                <td className="px-2 py-1.5 font-semibold" style={{ color: '#E8F4FD' }}>{p.person.fullName}</td>
                <td className="px-2 py-1.5 font-bold text-[10px]" style={{ color: '#8BAFC8' }}>{p.position.abbreviation}</td>
                <td className="px-2 py-1.5 font-mono font-bold" style={{
                  color: s?.avg !== undefined ? (s.avg >= 0.280 ? '#22D3A5' : s.avg >= 0.250 ? '#E8F4FD' : '#8BAFC8') : '#4A6A88',
                }}>{fmtAvg(s?.avg)}</td>
                <td className="px-2 py-1.5 font-mono" style={{ color: s?.obp !== undefined ? '#E8F4FD' : '#4A6A88' }}>{fmtAvg(s?.obp)}</td>
                <td className="px-2 py-1.5 font-mono" style={{ color: s?.slg !== undefined ? '#E8F4FD' : '#4A6A88' }}>{fmtAvg(s?.slg)}</td>
                <td className="px-2 py-1.5 font-mono font-bold" style={{
                  color: s?.ops !== undefined ? (s.ops >= 0.850 ? '#22D3A5' : s.ops >= 0.750 ? '#E8F4FD' : '#8BAFC8') : '#4A6A88',
                }}>{fmtOPS(s?.ops)}</td>
                <td className="px-2 py-1.5 font-mono font-bold" style={{ color: (s?.hr ?? 0) >= 15 ? '#FF5910' : '#8BAFC8' }}>
                  {fmtInt(s?.hr)}
                </td>
                <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{fmtInt(s?.rbi)}</td>
                <td className="px-2 py-1.5 font-mono font-bold" style={{
                  color: s?.woba !== undefined ? (s.woba >= 0.360 ? '#22D3A5' : s.woba >= 0.320 ? '#E8F4FD' : '#8BAFC8') : '#4A6A88',
                }}>{fmtAvg(s?.woba)}</td>
                <td className="px-2 py-1.5 font-mono font-bold text-center" style={{ color: wrcColor }}>
                  {fmtPlus(s?.wrcPlus)}
                </td>
                <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{fmtPct(s?.kPct)}</td>
                <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{fmtPct(s?.bbPct)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function PreGameDashboard({ state }: PreGameDashboardProps) {
  const { nextGame, lastGame, preGameData } = state
  const METS_ID = 121

  const metsIsHome = nextGame?.teams.home.team.id === METS_ID
  const oppTeam    = metsIsHome ? nextGame?.teams.away.team : nextGame?.teams.home.team
  const metsRec    = metsIsHome ? nextGame?.teams.home.leagueRecord : nextGame?.teams.away.leagueRecord
  const oppRec     = metsIsHome ? nextGame?.teams.away.leagueRecord : nextGame?.teams.home.leagueRecord
  const gameTime   = nextGame ? new Date(nextGame.gameDate) : null

  const lineup = preGameData?.metsLineup ?? []

  // Team comparison from real season stats
  const metsOPS = lineup.length > 0
    ? lineup.filter(p => p.stats?.ops).reduce((sum, p) => sum + (p.stats?.ops ?? 0), 0) / lineup.filter(p => p.stats?.ops).length
    : undefined

  const radarData = [
    { metric: 'OPS',     nyMets: metsOPS !== undefined ? Math.round((metsOPS / 1.0) * 80) : 0, opp: 0 },
    { metric: 'K/9',     nyMets: preGameData?.metsStarter?.stats?.k9  !== undefined ? Math.round((preGameData.metsStarter.stats.k9  / 14) * 100) : 0, opp: 0 },
    { metric: 'BB/9',    nyMets: preGameData?.metsStarter?.stats?.bb9 !== undefined ? Math.round(((5 - preGameData.metsStarter.stats.bb9) / 5) * 100) : 0, opp: 0 },
    { metric: 'ERA',     nyMets: preGameData?.metsStarter?.stats?.era !== undefined ? Math.round(((7 - preGameData.metsStarter.stats.era) / 7) * 100) : 0, opp: 0 },
    { metric: 'wOBA',    nyMets: lineup.length > 0 ? Math.round((lineup.filter(p=>p.stats?.woba).reduce((s,p)=>s+(p.stats?.woba??0),0)/Math.max(1,lineup.filter(p=>p.stats?.woba).length))/0.450*100) : 0, opp: 0 },
  ].map(d => ({ ...d, nyMets: Math.min(100, Math.max(0, d.nyMets)) }))

  return (
    <div className="p-3 space-y-3 animate-fade-in">

      {/* Game Header Banner */}
      <div className="rounded-xl p-4" style={{
        background: 'linear-gradient(135deg, rgba(0,45,114,0.7) 0%, rgba(4,12,24,0.95) 100%)',
        border: '1px solid rgba(30,109,197,0.4)',
        boxShadow: '0 0 30px rgba(30,109,197,0.1)',
      }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: '#1E6DC5' }}>NYM</div>
              <div className="text-sm font-bold" style={{ color: '#8BAFC8' }}>
                {metsRec ? `${metsRec.wins}-${metsRec.losses}` : '--'}
              </div>
              <div className="text-[10px]" style={{ color: '#4A6A88' }}>{metsIsHome ? 'HOME' : 'AWAY'}</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-black" style={{ color: '#4A6A88' }}>VS</div>
              {gameTime && (
                <div className="text-base font-black" style={{ color: '#FFD700' }}>
                  {gameTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                </div>
              )}
              {gameTime && (
                <div className="text-xs" style={{ color: '#8BAFC8' }}>
                  {gameTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: '#8BAFC8' }}>{oppTeam?.abbreviation ?? '???'}</div>
              <div className="text-sm font-bold" style={{ color: '#8BAFC8' }}>
                {oppRec ? `${oppRec.wins}-${oppRec.losses}` : '--'}
              </div>
              <div className="text-[10px]" style={{ color: '#4A6A88' }}>{metsIsHome ? 'AWAY' : 'HOME'}</div>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>Venue · </span>
              <span className="text-sm font-bold" style={{ color: '#E8F4FD' }}>
                {metsIsHome ? 'Citi Field · Flushing, NY' : nextGame?.venue.name ?? '--'}
              </span>
            </div>
            {nextGame?.seriesGameNumber && (
              <div className="text-[10px]" style={{ color: '#4A6A88' }}>
                Game {nextGame.seriesGameNumber} of {nextGame.gamesInSeries} · {nextGame.seriesDescription}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">

        {/* LEFT: Pitcher Matchup */}
        <div className="col-span-4 flex flex-col gap-3">
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Starting Pitcher Matchup" accent="blue" />
            <div className="flex gap-3">
              <PitcherCard
                info={preGameData?.metsStarter}
                label="NYM Starter"
                accentColor="#1E6DC5"
              />
              <PitcherCard
                info={preGameData?.oppStarter}
                label={`${oppTeam?.abbreviation ?? 'OPP'} Starter`}
                accentColor="#FF5910"
              />
            </div>
          </div>

          {/* Team radar — only show if we have real data */}
          {radarData.some(d => d.nyMets > 0) && (
            <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
              <SectionHeader title="NYM Starter Profile" accent="blue" />
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1A2E48" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#8BAFC8', fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="NYM" dataKey="nyMets" stroke="#1E6DC5" fill="#1E6DC5" fillOpacity={0.25} dot={{ r: 2, fill: '#1E6DC5' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Last game summary */}
          {lastGame && (
            <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
              <SectionHeader title="Last Game" accent="orange" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold" style={{ color: '#8BAFC8' }}>
                    {lastGame.teams.away.team.abbreviation} @ {lastGame.teams.home.team.abbreviation}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#4A6A88' }}>
                    {new Date(lastGame.gameDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="font-mono text-xl font-black">
                  <span style={{
                    color: (lastGame.teams.home.team.id === 121
                      ? lastGame.teams.home.isWinner
                      : lastGame.teams.away.isWinner) ? '#22D3A5' : '#FF4D6D',
                  }}>
                    {lastGame.teams.away.score ?? '?'} – {lastGame.teams.home.score ?? '?'}
                  </span>
                </div>
                <div className="text-xs font-bold px-2 py-1 rounded" style={{
                  background: (lastGame.teams.home.team.id === 121
                    ? lastGame.teams.home.isWinner
                    : lastGame.teams.away.isWinner) ? 'rgba(34,211,165,0.15)' : 'rgba(255,77,109,0.15)',
                  color: (lastGame.teams.home.team.id === 121
                    ? lastGame.teams.home.isWinner
                    : lastGame.teams.away.isWinner) ? '#22D3A5' : '#FF4D6D',
                }}>
                  {(lastGame.teams.home.team.id === 121
                    ? lastGame.teams.home.isWinner
                    : lastGame.teams.away.isWinner) ? 'W' : 'L'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Lineup */}
        <div className="col-span-8">
          <div className="rounded-xl overflow-hidden h-full" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <div className="px-3 py-2 flex items-center justify-between" style={{ background: 'rgba(0,45,114,0.5)' }}>
              <div className="flex items-center gap-2">
                <div className="h-3 w-0.5 rounded-full" style={{ background: '#1E6DC5' }} />
                <h3 className="text-xs font-black tracking-widest uppercase" style={{ color: '#E8F4FD' }}>
                  {lineup.length > 0 ? 'Lineup · Real Season Stats' : 'NYM Roster · Season Stats'}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22D3A5' }} />
                <span className="text-[10px]" style={{ color: '#22D3A5' }}>Live MLB Stats API</span>
              </div>
            </div>
            <LineupTable lineup={lineup} />

            {lineup.length > 0 && (
              <div className="px-3 py-2 border-t" style={{ borderColor: '#1A2E48' }}>
                <div className="flex gap-6 text-[10px]">
                  {[
                    ['Team AVG', fmtAvg(lineup.filter(p=>p.stats?.avg).length ? lineup.reduce((s,p)=>s+(p.stats?.avg??0),0)/lineup.filter(p=>p.stats?.avg).length : undefined)],
                    ['Team OBP', fmtAvg(lineup.filter(p=>p.stats?.obp).length ? lineup.reduce((s,p)=>s+(p.stats?.obp??0),0)/lineup.filter(p=>p.stats?.obp).length : undefined)],
                    ['Team OPS', fmtOPS(metsOPS)],
                    ['Lineup HR', fmtInt(lineup.reduce((s,p)=>s+(p.stats?.hr??0),0) || undefined)],
                    ['Lineup RBI', fmtInt(lineup.reduce((s,p)=>s+(p.stats?.rbi??0),0) || undefined)],
                  ].map(([l,v]) => (
                    <div key={String(l)}>
                      <span style={{ color: '#4A6A88' }}>{String(l)}: </span>
                      <span className="font-mono font-bold" style={{ color: '#E8F4FD' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
