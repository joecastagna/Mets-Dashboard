import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import type { GameState } from '../../types/mlb'
import { StatCard, SectionHeader } from '../shared/StatCard'
import { ProgressBar, WinProbBar, GaugeChart } from '../shared/GaugeChart'
import { fmtAvg, fmtERA, fmtPct, fmtNum, fmtWHIP, fmtK9, fmtOPS } from '../../utils/formatters'

interface PreGameDashboardProps {
  state: GameState
}

const LINEUP = [
  { num: 1, name: 'S. Marte', pos: 'CF', bat: 'R', avg: '.288', obp: '.355', slg: '.448', ops: '.803', hr: 8, rbi: 32, wrcPlus: 118 },
  { num: 2, name: 'F. Lindor', pos: 'SS', bat: 'S', avg: '.271', obp: '.342', slg: '.468', ops: '.810', hr: 18, rbi: 68, wrcPlus: 122 },
  { num: 3, name: 'J.D. Martinez', pos: 'DH', bat: 'R', avg: '.265', obp: '.338', slg: '.485', ops: '.823', hr: 15, rbi: 55, wrcPlus: 126 },
  { num: 4, name: 'P. Alonso', pos: '1B', bat: 'R', avg: '.248', obp: '.336', slg: '.512', ops: '.848', hr: 22, rbi: 72, wrcPlus: 132 },
  { num: 5, name: 'M. Vientos', pos: '3B', bat: 'R', avg: '.272', obp: '.340', slg: '.506', ops: '.846', hr: 16, rbi: 58, wrcPlus: 129 },
  { num: 6, name: 'B. Nimmo', pos: 'LF', bat: 'L', avg: '.255', obp: '.355', slg: '.410', ops: '.765', hr: 10, rbi: 42, wrcPlus: 111 },
  { num: 7, name: 'T. Nido', pos: 'C', bat: 'R', avg: '.228', obp: '.292', slg: '.368', ops: '.660', hr: 5, rbi: 28, wrcPlus: 82 },
  { num: 8, name: 'J. McNeil', pos: '2B', bat: 'L', avg: '.260', obp: '.330', slg: '.375', ops: '.705', hr: 4, rbi: 32, wrcPlus: 95 },
  { num: 9, name: 'H. Tyrone', pos: 'RF', bat: 'R', avg: '.241', obp: '.308', slg: '.420', ops: '.728', hr: 9, rbi: 38, wrcPlus: 101 },
]

const HEAD_TO_HEAD = [
  { year: '2024', metsW: 12, oppW: 7 },
  { year: '2025', metsW: 10, oppW: 9 },
  { year: '2026', metsW: 4, oppW: 3 },
]

const PREDICTION_FACTORS = [
  { factor: 'Starting Pitcher', mets: 72, opp: 65, description: 'Mets SP has better recent form' },
  { factor: 'Lineup OPS', mets: 68, opp: 62, description: 'NYM team OPS .782 vs .748' },
  { factor: 'Bullpen ERA', mets: 58, opp: 70, description: 'Opp bullpen 3.12 ERA in last 7' },
  { factor: 'Home/Away', mets: 64, opp: 55, description: 'Slight home advantage NYM' },
  { factor: 'Park Factor', mets: 60, opp: 60, description: 'Neutral park conditions' },
  { factor: 'Recent Form', mets: 70, opp: 55, description: 'NYM 7-3 in last 10' },
]

const KEY_MATCHUPS = [
  { batter: 'P. Alonso', pitcher: 'G. Cole', battingAVG: '.312', atBats: 16, hr: 3, k: 4, edge: 'batter' },
  { batter: 'F. Lindor', pitcher: 'G. Cole', battingAVG: '.278', atBats: 18, hr: 2, k: 5, edge: 'neutral' },
  { batter: 'S. Marte', pitcher: 'G. Cole', battingAVG: '.189', atBats: 22, hr: 1, k: 8, edge: 'pitcher' },
]

const TEAM_RADAR = [
  { metric: 'Offense', nyMets: 72, opp: 65 },
  { metric: 'Pitching', nyMets: 68, opp: 70 },
  { metric: 'Bullpen', nyMets: 58, opp: 75 },
  { metric: 'Defense', nyMets: 65, opp: 62 },
  { metric: 'Speed', nyMets: 71, opp: 60 },
  { metric: 'Clutch', nyMets: 69, opp: 63 },
]

export function PreGameDashboard({ state }: PreGameDashboardProps) {
  const { nextGame, lastGame } = state
  const gameTime = nextGame ? new Date(nextGame.gameDate) : null

  const metsIsHome = nextGame?.teams.home.team.id === 121
  const oppTeam = metsIsHome ? nextGame?.teams.away.team : nextGame?.teams.home.team
  const metsRecord = metsIsHome ? nextGame?.teams.home.leagueRecord : nextGame?.teams.away.leagueRecord
  const oppRecord = metsIsHome ? nextGame?.teams.away.leagueRecord : nextGame?.teams.home.leagueRecord

  const predictedWinPct = 0.62
  const predictedScore = { mets: 4.2, opp: 3.1 }

  return (
    <div className="p-3 space-y-3 animate-fade-in">

      {/* Game Info Banner */}
      <div className="rounded-xl p-4" style={{
        background: 'linear-gradient(135deg, rgba(0,45,114,0.6) 0%, rgba(4,12,24,0.9) 100%)',
        border: '1px solid rgba(30,109,197,0.4)',
        boxShadow: '0 0 30px rgba(30,109,197,0.1)',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: '#1E6DC5' }}>NYM</div>
              <div className="text-xs" style={{ color: '#8BAFC8' }}>
                {metsRecord ? `${metsRecord.wins}-${metsRecord.losses}` : '—'}
              </div>
              <div className="text-[10px]" style={{ color: '#4A6A88' }}>
                {metsIsHome ? 'HOME' : 'AWAY'}
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-black" style={{ color: '#E8F4FD' }}>VS</div>
              {gameTime && (
                <div className="text-sm font-bold" style={{ color: '#FFD700' }}>
                  {gameTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {gameTime && (
                <div className="text-xs" style={{ color: '#8BAFC8' }}>
                  {gameTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: '#8BAFC8' }}>
                {oppTeam?.abbreviation ?? '???'}
              </div>
              <div className="text-xs" style={{ color: '#8BAFC8' }}>
                {oppRecord ? `${oppRecord.wins}-${oppRecord.losses}` : '—'}
              </div>
              <div className="text-[10px]" style={{ color: '#4A6A88' }}>
                {metsIsHome ? 'AWAY' : 'HOME'}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>VENUE</div>
              <div className="text-sm font-bold" style={{ color: '#E8F4FD' }}>
                {nextGame ? (metsIsHome ? 'Citi Field' : `Away`) : '—'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>SERIES</div>
              <div className="text-sm font-bold" style={{ color: '#8BAFC8' }}>
                Game {nextGame?.seriesGameNumber ?? '?'} of {nextGame?.gamesInSeries ?? '?'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">

        {/* WIN PREDICTION */}
        <div className="col-span-3 flex flex-col gap-3">
          <div className="rounded-xl p-4" style={{
            background: 'linear-gradient(135deg, rgba(34,211,165,0.08) 0%, rgba(10,22,40,0.9) 100%)',
            border: '1px solid rgba(34,211,165,0.3)',
          }}>
            <SectionHeader title="Win Probability" accent="green" />
            <div className="text-center my-3">
              <div className="text-5xl font-black font-mono" style={{
                color: '#22D3A5', textShadow: '0 0 20px rgba(34,211,165,0.5)',
              }}>
                {Math.round(predictedWinPct * 100)}%
              </div>
              <div className="text-xs mt-1" style={{ color: '#8BAFC8' }}>NYM WIN PROBABILITY</div>
            </div>
            <WinProbBar metsProb={predictedWinPct} metsName="NYM" oppName={oppTeam?.abbreviation ?? 'OPP'} />
          </div>

          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Run Prediction" accent="blue" />
            <div className="flex justify-around items-center mt-2">
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>NYM xR</div>
                <div className="font-mono text-3xl font-black" style={{ color: '#FF5910' }}>
                  {predictedScore.mets.toFixed(1)}
                </div>
              </div>
              <div className="text-2xl font-black" style={{ color: '#4A6A88' }}>–</div>
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>OPP xR</div>
                <div className="font-mono text-3xl font-black" style={{ color: '#8BAFC8' }}>
                  {predictedScore.opp.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Prediction Factors" accent="blue" />
            <div className="space-y-2">
              {PREDICTION_FACTORS.map(f => (
                <div key={f.factor}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span style={{ color: '#8BAFC8' }}>{f.factor}</span>
                    <span className="font-mono font-bold" style={{ color: f.mets > f.opp ? '#22D3A5' : '#FF4D6D' }}>
                      {f.mets > f.opp ? '▲ NYM' : '▼ OPP'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden flex" style={{ background: '#1A2E48' }}>
                    <div style={{ width: `${f.mets}%`, background: '#1E6DC5', borderRadius: '99px 0 0 99px' }} />
                    <div style={{ flex: 1, background: '#8B2A0A' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Head to Head */}
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Head-to-Head" accent="orange" />
            <div style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HEAD_TO_HEAD} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="year" tick={{ fill: '#8BAFC8', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#4A6A88', fontSize: 8 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid #1A2E48', borderRadius: 8 }}
                    labelStyle={{ color: '#8BAFC8' }} />
                  <Bar dataKey="metsW" name="NYM" fill="#002D72" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="oppW" name="OPP" fill="#6B1A0A" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CENTER - Pitcher Matchup + Lineup */}
        <div className="col-span-5 flex flex-col gap-3">

          {/* Pitcher Matchup */}
          <div className="rounded-xl p-4" style={{ background: '#0A1628', border: '1px solid rgba(30,109,197,0.3)' }}>
            <SectionHeader title="Starting Pitcher Matchup" accent="blue" />
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: 'Kodai Senga', team: 'NYM', hand: 'R', era: 3.12, fip: 2.98, whip: 0.98,
                  k9: 11.2, bb9: 2.1, ip: '98.2', wins: 9, losses: 4, recent: '3.12 ERA L5',
                  color: '#1E6DC5', record: '9-4',
                },
                {
                  name: 'Gerrit Cole', team: oppTeam?.abbreviation ?? 'OPP', hand: 'R', era: 2.88, fip: 3.05,
                  whip: 1.05, k9: 10.8, bb9: 1.9, ip: '108.1', wins: 10, losses: 5,
                  recent: '2.88 ERA L5', color: '#8B0000', record: '10-5',
                },
              ].map((sp, i) => (
                <div key={i} className="rounded-xl p-3" style={{
                  background: `${sp.color}15`, border: `1px solid ${sp.color}40`,
                }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-black" style={{ color: '#E8F4FD' }}>{sp.name}</div>
                      <div className="text-[10px] font-bold" style={{ color: sp.color }}>
                        {sp.team} · RHP · {sp.record}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <div className="text-center">
                      <div className="text-[9px] uppercase" style={{ color: '#4A6A88' }}>ERA</div>
                      <div className="font-mono text-lg font-black" style={{ color: sp.era < 3.5 ? '#22D3A5' : '#FFB347' }}>
                        {fmtERA(sp.era)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] uppercase" style={{ color: '#4A6A88' }}>FIP</div>
                      <div className="font-mono text-lg font-black" style={{ color: sp.fip < 3.5 ? '#22D3A5' : '#FFB347' }}>
                        {fmtERA(sp.fip)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] uppercase" style={{ color: '#4A6A88' }}>WHIP</div>
                      <div className="font-mono text-lg font-black" style={{ color: sp.whip < 1.15 ? '#22D3A5' : '#FFB347' }}>
                        {fmtWHIP(sp.whip)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <ProgressBar value={sp.k9} max={15} label="K/9" valueDisplay={fmtK9(sp.k9)} color={sp.color} height={4} />
                    <ProgressBar value={5 - sp.bb9} max={5} label="BB/9 (inv)" valueDisplay={fmtK9(sp.bb9)} color={sp.color} height={4} />
                  </div>
                  <div className="mt-2 text-center text-[10px] rounded-lg py-1" style={{
                    background: `${sp.color}20`, color: sp.color,
                  }}>
                    {sp.recent} · {sp.ip} IP
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projected Lineup */}
          <div className="rounded-xl overflow-hidden" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <div className="px-3 py-2" style={{ background: 'rgba(0,45,114,0.5)' }}>
              <div className="flex items-center gap-2">
                <div className="h-3 w-0.5 rounded-full" style={{ background: '#1E6DC5' }} />
                <h3 className="text-xs font-black tracking-widest uppercase" style={{ color: '#E8F4FD' }}>
                  Projected Lineup (vs RHP)
                </h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1A2E48' }}>
                    {['#', 'Player', 'Pos', 'B', 'AVG', 'OBP', 'SLG', 'OPS', 'HR', 'RBI', 'wRC+'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-bold tracking-wider text-[10px] uppercase"
                        style={{ color: '#4A6A88' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LINEUP.map((p, i) => {
                    const isHighlight = p.wrcPlus >= 125
                    return (
                      <tr key={i} className="border-b border-white/5 last:border-0 transition-colors hover:bg-white/5"
                        style={{ background: isHighlight ? 'rgba(34,211,165,0.05)' : 'transparent' }}>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{ color: '#4A6A88' }}>{p.num}</td>
                        <td className="px-2 py-1.5 font-semibold" style={{ color: '#E8F4FD' }}>{p.name}</td>
                        <td className="px-2 py-1.5 font-bold text-[10px]" style={{ color: '#8BAFC8' }}>{p.pos}</td>
                        <td className="px-2 py-1.5 font-bold text-[10px]" style={{ color: '#4A6A88' }}>{p.bat}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{
                          color: parseFloat(p.avg) >= 0.280 ? '#22D3A5' : parseFloat(p.avg) >= 0.260 ? '#E8F4FD' : '#8BAFC8'
                        }}>{p.avg}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{p.obp}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{p.slg}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{
                          color: parseFloat(p.ops) >= 0.820 ? '#22D3A5' : parseFloat(p.ops) >= 0.760 ? '#E8F4FD' : '#8BAFC8'
                        }}>{p.ops}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{ color: '#FF5910' }}>{p.hr}</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{p.rbi}</td>
                        <td className="px-2 py-1.5 font-mono font-bold text-center" style={{
                          color: p.wrcPlus >= 125 ? '#FFD700' : p.wrcPlus >= 110 ? '#22D3A5' : p.wrcPlus >= 95 ? '#E8F4FD' : '#8BAFC8'
                        }}>{p.wrcPlus}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Team comparison + Key Matchups */}
        <div className="col-span-4 flex flex-col gap-3">

          {/* Team Comparison Radar */}
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Team Comparison" accent="blue" />
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={TEAM_RADAR}>
                  <PolarGrid stroke="#1A2E48" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#8BAFC8', fontSize: 9 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="NYM" dataKey="nyMets" stroke="#1E6DC5" fill="#1E6DC5" fillOpacity={0.25} dot={{ r: 2, fill: '#1E6DC5' }} />
                  <Radar name="OPP" dataKey="opp" stroke="#FF5910" fill="#FF5910" fillOpacity={0.15} dot={{ r: 2, fill: '#FF5910' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: '#1E6DC5' }} />
                <span style={{ color: '#8BAFC8' }}>NYM</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: '#FF5910' }} />
                <span style={{ color: '#8BAFC8' }}>{oppTeam?.abbreviation ?? 'OPP'}</span>
              </div>
            </div>
          </div>

          {/* Key Matchups */}
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Key Batter vs. Pitcher" accent="orange" />
            <div className="space-y-2">
              {KEY_MATCHUPS.map((m, i) => (
                <div key={i} className="rounded-lg p-2.5" style={{
                  background: m.edge === 'batter' ? 'rgba(34,211,165,0.08)' :
                    m.edge === 'pitcher' ? 'rgba(255,77,109,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${m.edge === 'batter' ? 'rgba(34,211,165,0.3)' : m.edge === 'pitcher' ? 'rgba(255,77,109,0.2)' : '#1A2E48'}`,
                }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold" style={{ color: '#E8F4FD' }}>{m.batter}</span>
                    <span className="text-[10px]" style={{ color: '#4A6A88' }}>vs</span>
                    <span className="text-xs font-bold" style={{ color: '#8BAFC8' }}>{m.pitcher}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                      background: m.edge === 'batter' ? 'rgba(34,211,165,0.2)' : m.edge === 'pitcher' ? 'rgba(255,77,109,0.2)' : 'rgba(255,255,255,0.05)',
                      color: m.edge === 'batter' ? '#22D3A5' : m.edge === 'pitcher' ? '#FF4D6D' : '#8BAFC8',
                    }}>
                      {m.edge === 'batter' ? '▲ BAT' : m.edge === 'pitcher' ? '▼ PIT' : '≈'}
                    </span>
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    <span style={{ color: '#8BAFC8' }}>Career: <strong style={{ color: '#E8F4FD' }}>{m.battingAVG}</strong></span>
                    <span style={{ color: '#8BAFC8' }}>AB: <strong style={{ color: '#E8F4FD' }}>{m.atBats}</strong></span>
                    <span style={{ color: '#FF5910' }}>HR: <strong>{m.hr}</strong></span>
                    <span style={{ color: '#8BAFC8' }}>K: <strong>{m.k}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Stats Comparison */}
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Season Stats Comparison" accent="blue" />
            <div className="space-y-2">
              {[
                { label: 'Team OPS', nymVal: 0.782, nymDisp: '.782', oppVal: 0.748, oppDisp: '.748' },
                { label: 'Team ERA', nymVal: 3.42, nymDisp: '3.42', oppVal: 3.88, oppDisp: '3.88', lower: true },
                { label: 'Team WHIP', nymVal: 1.18, nymDisp: '1.18', oppVal: 1.28, oppDisp: '1.28', lower: true },
                { label: 'Bullpen ERA', nymVal: 3.68, nymDisp: '3.68', oppVal: 3.12, oppDisp: '3.12', lower: true },
                { label: 'Run Diff', nymVal: 45, nymDisp: '+45', oppVal: 22, oppDisp: '+22' },
              ].map(row => {
                const nymBetter = row.lower ? row.nymVal < row.oppVal : row.nymVal > row.oppVal
                return (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold w-20 flex-shrink-0 uppercase tracking-wider" style={{ color: '#4A6A88' }}>{row.label}</span>
                    <span className="font-mono text-xs font-bold w-10 text-right" style={{ color: nymBetter ? '#22D3A5' : '#FF4D6D' }}>
                      {row.nymDisp}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden flex" style={{ background: '#1A2E48' }}>
                      <div style={{
                        width: `${(row.nymVal / (row.nymVal + row.oppVal)) * 100}%`,
                        background: nymBetter ? '#1E6DC5' : '#6B1A0A',
                      }} />
                    </div>
                    <span className="font-mono text-xs w-10 text-left" style={{ color: '#8BAFC8' }}>
                      {row.oppDisp}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weather + Park */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: '#FFD700' }}>⛅ WEATHER</div>
              <div className="font-mono text-xl font-black" style={{ color: '#E8F4FD' }}>72°F</div>
              <div className="text-[10px]" style={{ color: '#8BAFC8' }}>Partly Cloudy</div>
              <div className="text-[10px]" style={{ color: '#4A6A88' }}>8mph Out to CF</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(180,122,255,0.05)', border: '1px solid rgba(180,122,255,0.2)' }}>
              <div className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{ color: '#B47AFF' }}>🏟️ PARK</div>
              <div className="font-mono text-lg font-black" style={{ color: '#E8F4FD' }}>
                {metsIsHome ? 'Citi Field' : 'Away'}
              </div>
              <div className="text-[10px]" style={{ color: '#8BAFC8' }}>HR Factor: 0.94</div>
              <div className="text-[10px]" style={{ color: '#4A6A88' }}>Run Factor: 0.98</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
