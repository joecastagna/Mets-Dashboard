import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts'
import type { GameState } from '../../types/mlb'
import { StatCard, SectionHeader } from '../shared/StatCard'
import { fmtAvg, fmtERA, fmtPct, fmtOPS, fmtNum, fmtWHIP } from '../../utils/formatters'

interface PostGameDashboardProps {
  state: GameState
}

const GAME_BATTING = [
  { name: 'F. Lindor',   pos: 'SS', ab: 4, r: 2, h: 2, rbi: 3, bb: 1, k: 0, hr: 1, avg: '.271', ops: '.810', wpa: 0.22, color: '#22D3A5' },
  { name: 'P. Alonso',   pos: '1B', ab: 4, r: 1, h: 2, rbi: 2, bb: 0, k: 1, hr: 1, avg: '.248', ops: '.848', wpa: 0.15, color: '#22D3A5' },
  { name: 'M. Vientos',  pos: '3B', ab: 4, r: 1, h: 1, rbi: 1, bb: 1, k: 2, hr: 0, avg: '.272', ops: '.846', wpa: 0.08, color: '#60B4FF' },
  { name: 'J.D. Martinez',pos:'DH', ab: 3, r: 0, h: 1, rbi: 0, bb: 1, k: 1, hr: 0, avg: '.265', ops: '.823', wpa: 0.02, color: '#60B4FF' },
  { name: 'S. Marte',    pos: 'CF', ab: 4, r: 1, h: 1, rbi: 0, bb: 0, k: 1, hr: 0, avg: '.288', ops: '.803', wpa: -0.05, color: '#FFB347' },
  { name: 'B. Nimmo',    pos: 'LF', ab: 3, r: 0, h: 0, rbi: 0, bb: 1, k: 2, hr: 0, avg: '.255', ops: '.765', wpa: -0.08, color: '#FF4D6D' },
  { name: 'J. McNeil',   pos: '2B', ab: 4, r: 0, h: 0, rbi: 0, bb: 0, k: 2, hr: 0, avg: '.260', ops: '.705', wpa: -0.12, color: '#FF4D6D' },
  { name: 'T. Nido',     pos: 'C',  ab: 3, r: 0, h: 1, rbi: 0, bb: 0, k: 1, hr: 0, avg: '.228', ops: '.660', wpa: 0.01, color: '#8BAFC8' },
  { name: 'H. Tyrone',   pos: 'RF', ab: 3, r: 0, h: 0, rbi: 0, bb: 1, k: 1, hr: 0, avg: '.241', ops: '.728', wpa: -0.03, color: '#8BAFC8' },
]

const GAME_PITCHING = [
  { name: 'K. Senga',   ip: '6.2', h: 5, r: 2, er: 2, bb: 1, k: 9, hr: 1, pc: 102, era: 3.12, fip: 2.94, wpa: 0.28 },
  { name: 'C. Ottavino',ip: '0.2', h: 0, r: 0, er: 0, bb: 1, k: 1, hr: 0, pc: 14,  era: 3.45, fip: 3.10, wpa: 0.05 },
  { name: 'E. Díaz',    ip: '1.0', h: 0, r: 0, er: 0, bb: 0, k: 2, hr: 0, pc: 12,  era: 2.18, fip: 1.95, wpa: 0.12 },
  { name: 'D. Robertson',ip:'0.2', h: 1, r: 0, er: 0, bb: 0, k: 1, hr: 0, pc: 10,  era: 3.80, fip: 3.50, wpa: 0.02 },
]

const WIN_PROB_HISTORY = [
  { label: '1T', prob: 0.50, event: 'First pitch' },
  { label: '1B', prob: 0.54, event: 'NYM R 1-0' },
  { label: '2T', prob: 0.56, event: 'Quick 1-2-3' },
  { label: '2B', prob: 0.58 },
  { label: '3T', prob: 0.48, event: 'Opp HR 1-1' },
  { label: '3B', prob: 0.52 },
  { label: '4T', prob: 0.45, event: 'Opp 2R 1-3' },
  { label: '4B', prob: 0.62, event: 'Alonso 2R HR 3-3' },
  { label: '5T', prob: 0.65 },
  { label: '5B', prob: 0.72, event: 'Lindor HR 4-3' },
  { label: '6T', prob: 0.75 },
  { label: '6B', prob: 0.78 },
  { label: '7T', prob: 0.82, event: 'Senga K side' },
  { label: '7B', prob: 0.84 },
  { label: '8T', prob: 0.88, event: 'Ottavino K 2' },
  { label: '8B', prob: 0.90 },
  { label: '9T', prob: 0.94, event: 'Díaz saves it' },
  { label: 'F', prob: 1.0, event: 'FINAL: NYM 6–5' },
]

const KEY_PLAYS = [
  { inning: '4B', desc: 'Alonso 2-run HR (22) to left · 407 ft · 109 mph EV', impact: '+0.24 WPA', positive: true },
  { inning: '5B', desc: 'Lindor solo HR (18) to center · 412 ft · 107.8 mph EV', impact: '+0.14 WPA', positive: true },
  { inning: '4T', desc: 'Opp 2-run homer — NYM trailed 1-3', impact: '-0.18 WPA', positive: false },
  { inning: '9T', desc: 'Díaz: 2-K save, reached 100 mph on final pitch', impact: '+0.06 WPA', positive: true },
]

const STAT_HIGHLIGHTS = [
  { label: 'Senga K Count', value: '9', sub: '102 pitches · 6.2 IP', color: '#22D3A5' },
  { label: 'Team H', value: '8', sub: '.242 team AVG', color: '#60B4FF' },
  { label: 'HR', value: '2', sub: 'Lindor + Alonso', color: '#FF5910' },
  { label: 'Max EV', value: '109 mph', sub: 'Alonso HR', color: '#FFD700' },
  { label: 'Max Velo', value: '100.4 mph', sub: 'Díaz fastball', color: '#B47AFF' },
  { label: 'WPA Leader', value: 'Senga +0.28', sub: 'Best of game', color: '#22D3A5' },
]

const NEXT_PREVIEW = {
  opponent: 'PHI Phillies',
  time: 'Tomorrow 7:10 PM ET',
  pitcher: 'David Peterson vs. Zack Wheeler',
  weatherForecast: '68°F, Clear',
  winProb: 0.44,
}

export function PostGameDashboard({ state }: PostGameDashboardProps) {
  const { lastGame } = state
  const metsIsHome = lastGame?.teams.home.team.id === 121
  const metsScore = metsIsHome ? lastGame?.teams.home.score : lastGame?.teams.away.score
  const oppScore = metsIsHome ? lastGame?.teams.away.score : lastGame?.teams.home.score
  const oppTeam = metsIsHome ? lastGame?.teams.away.team : lastGame?.teams.home.team
  const metsWon = (metsScore ?? 0) > (oppScore ?? 0)
  const gameDate = lastGame ? new Date(lastGame.gameDate).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }) : 'Recent Game'

  const wpaData = GAME_BATTING.map(p => ({ name: p.name.split(' ')[1], wpa: p.wpa, fill: p.wpa >= 0 ? '#22D3A5' : '#FF4D6D' }))

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
        <div className="flex items-center justify-between">
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
                  {metsScore ?? '?'}
                </div>
              </div>
              <div className="text-3xl font-black" style={{ color: '#4A6A88' }}>–</div>
              <div className="text-center">
                <div className="text-xl font-black" style={{ color: '#8BAFC8' }}>
                  {oppTeam?.abbreviation ?? '???'}
                </div>
                <div className="font-mono text-5xl font-black" style={{ color: '#E8F4FD' }}>
                  {oppScore ?? '?'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className={`px-4 py-2 rounded-xl text-lg font-black tracking-wider ${
              metsWon ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {metsWon ? '✓ WIN' : '✗ LOSS'}
            </div>
            <div className="text-[10px] text-right" style={{ color: '#8BAFC8' }}>
              W: {GAME_PITCHING[0].name}<br />
              S: {GAME_PITCHING[GAME_PITCHING.length - 1].name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STAT_HIGHLIGHTS.slice(0, 4).map(s => (
              <div key={s.label} className="text-center rounded-lg p-2" style={{
                background: `${s.color}10`, border: `1px solid ${s.color}30`,
              }}>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: s.color }}>{s.label}</div>
                <div className="font-mono text-sm font-black" style={{ color: '#E8F4FD' }}>{s.value}</div>
                <div className="text-[9px]" style={{ color: '#4A6A88' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">

        {/* LEFT: Win Probability + Key Plays */}
        <div className="col-span-4 flex flex-col gap-3">
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Win Probability Timeline" accent="blue" />
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={WIN_PROB_HISTORY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wpPostGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metsWon ? '#22D3A5' : '#FF4D6D'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={metsWon ? '#22D3A5' : '#FF4D6D'} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: '#4A6A88', fontSize: 8 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`}
                    tick={{ fill: '#4A6A88', fontSize: 7 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v: number) => [`${Math.round(v * 100)}%`, 'NYM WP']}
                    contentStyle={{ background: '#0A1628', border: '1px solid #1A2E48', borderRadius: 8 }}
                    labelStyle={{ color: '#8BAFC8' }}
                    itemStyle={{ color: metsWon ? '#22D3A5' : '#FF4D6D' }}
                  />
                  <Area type="monotone" dataKey="prob"
                    stroke={metsWon ? '#22D3A5' : '#FF4D6D'}
                    strokeWidth={2} fill="url(#wpPostGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Plays */}
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Key Moments" accent="orange" />
            <div className="space-y-2">
              {KEY_PLAYS.map((p, i) => (
                <div key={i} className="flex gap-2 items-start rounded-lg p-2" style={{
                  background: p.positive ? 'rgba(34,211,165,0.06)' : 'rgba(255,77,109,0.06)',
                  border: `1px solid ${p.positive ? 'rgba(34,211,165,0.2)' : 'rgba(255,77,109,0.15)'}`,
                }}>
                  <div className="text-[10px] font-black flex-shrink-0 mt-0.5 rounded px-1.5"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#8BAFC8' }}>
                    {p.inning}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold leading-tight" style={{ color: '#E8F4FD' }}>{p.desc}</div>
                    <div className="text-[10px] font-bold mt-0.5" style={{ color: p.positive ? '#22D3A5' : '#FF4D6D' }}>
                      {p.impact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WPA Leaders */}
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="WPA by Batter" accent="green" />
            <div style={{ height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wpaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#4A6A88', fontSize: 8 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8BAFC8', fontSize: 9 }} tickLine={false} axisLine={false} width={50} />
                  <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid #1A2E48', borderRadius: 8 }}
                    formatter={(v: number) => [v.toFixed(3), 'WPA']} labelStyle={{ color: '#8BAFC8' }} />
                  <Bar dataKey="wpa" radius={[0, 4, 4, 0]}>
                    {wpaData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CENTER: Box Score */}
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
                    {['Player', 'AB', 'R', 'H', 'RBI', 'BB', 'K', 'HR', 'AVG', 'OPS', 'WPA'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-bold text-[10px] uppercase tracking-wider"
                        style={{ color: '#4A6A88' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GAME_BATTING.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-2 py-1.5">
                        <div className="font-semibold" style={{ color: '#E8F4FD' }}>{p.name}</div>
                        <div className="text-[9px]" style={{ color: '#4A6A88' }}>{p.pos}</div>
                      </td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{p.ab}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: p.r > 0 ? '#22D3A5' : '#8BAFC8' }}>{p.r}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: p.h >= 2 ? '#22D3A5' : '#E8F4FD' }}>{p.h}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: p.rbi > 0 ? '#FF5910' : '#8BAFC8' }}>{p.rbi}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{p.bb}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: p.k >= 2 ? '#FF4D6D' : '#8BAFC8' }}>{p.k}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: p.hr > 0 ? '#FFD700' : '#8BAFC8' }}>{p.hr}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{p.avg}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{p.ops}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: p.wpa >= 0 ? '#22D3A5' : '#FF4D6D' }}>
                        {p.wpa >= 0 ? '+' : ''}{p.wpa.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
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
                    {['Pitcher', 'IP', 'H', 'R', 'ER', 'BB', 'K', 'HR', 'PC', 'ERA', 'FIP', 'WPA'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-bold text-[10px] uppercase tracking-wider"
                        style={{ color: '#4A6A88' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GAME_PITCHING.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-2 py-1.5 font-semibold" style={{ color: '#E8F4FD' }}>{p.name}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: '#E8F4FD' }}>{p.ip}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{p.h}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: p.r > 2 ? '#FF4D6D' : '#8BAFC8' }}>{p.r}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: p.er > 2 ? '#FF4D6D' : '#8BAFC8' }}>{p.er}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: '#8BAFC8' }}>{p.bb}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: p.k >= 7 ? '#22D3A5' : '#E8F4FD' }}>{p.k}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: p.hr > 1 ? '#FF4D6D' : '#8BAFC8' }}>{p.hr}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: p.pc > 100 ? '#FFB347' : '#8BAFC8' }}>{p.pc}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: p.era < 3.5 ? '#22D3A5' : '#FFB347' }}>{fmtERA(p.era)}</td>
                      <td className="px-2 py-1.5 font-mono" style={{ color: p.fip < 3.5 ? '#22D3A5' : '#FFB347' }}>{fmtERA(p.fip)}</td>
                      <td className="px-2 py-1.5 font-mono font-bold" style={{ color: p.wpa >= 0 ? '#22D3A5' : '#FF4D6D' }}>
                        {p.wpa >= 0 ? '+' : ''}{p.wpa.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Stat Highlights + Next Game */}
        <div className="col-span-3 flex flex-col gap-3">

          {/* Stat Highlights */}
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Game Highlights" accent="orange" />
            <div className="grid grid-cols-2 gap-2">
              {STAT_HIGHLIGHTS.map(s => (
                <div key={s.label} className="text-center rounded-xl p-2.5" style={{
                  background: `${s.color}10`, border: `1px solid ${s.color}30`,
                }}>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: s.color }}>{s.label}</div>
                  <div className="font-mono text-sm font-black mt-0.5" style={{ color: '#E8F4FD' }}>{s.value}</div>
                  <div className="text-[9px]" style={{ color: '#4A6A88' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Senga Deep Dive */}
          <div className="rounded-xl p-3" style={{
            background: 'rgba(255,89,16,0.05)', border: '1px solid rgba(255,89,16,0.25)',
          }}>
            <SectionHeader title="Senga Line" accent="orange" />
            <div className="space-y-1.5">
              {[
                ['IP', '6.2'], ['Pitches', '102'], ['K', '9'], ['Whiff%', '38%'],
                ['CSW%', '34%'], ['Avg Velo', '94.8 mph'], ['Max Velo', '97.2 mph'],
                ['FIP', '2.94'], ['Game Score', '71'],
              ].map(([l, v]) => (
                <div key={String(l)} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8BAFC8' }}>{String(l)}</span>
                  <span className="font-mono text-xs font-bold" style={{ color: '#E8F4FD' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Last 10 Games */}
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="NYM Last 10 Games" accent="green" />
            <div className="flex gap-1 mb-2 flex-wrap">
              {['W','W','L','W','W','W','L','W','L','W'].map((r, i) => (
                <div key={i} className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black"
                  style={{
                    background: r === 'W' ? 'rgba(34,211,165,0.2)' : 'rgba(255,77,109,0.2)',
                    color: r === 'W' ? '#22D3A5' : '#FF4D6D',
                    border: `1px solid ${r === 'W' ? 'rgba(34,211,165,0.4)' : 'rgba(255,77,109,0.3)'}`,
                  }}>
                  {r}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#8BAFC8' }}>Record:</span>
              <span className="font-mono font-bold" style={{ color: '#22D3A5' }}>7-3</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span style={{ color: '#8BAFC8' }}>Run Diff:</span>
              <span className="font-mono font-bold" style={{ color: '#22D3A5' }}>+18</span>
            </div>
          </div>

          {/* Next Game Preview */}
          <div className="rounded-xl p-3" style={{
            background: 'linear-gradient(135deg, rgba(0,45,114,0.6) 0%, rgba(4,12,24,0.9) 100%)',
            border: '1px solid rgba(30,109,197,0.4)',
          }}>
            <SectionHeader title="Next Game" accent="blue" />
            <div className="space-y-2">
              <div className="text-sm font-black" style={{ color: '#E8F4FD' }}>
                {NEXT_PREVIEW.opponent}
              </div>
              <div className="text-xs font-semibold" style={{ color: '#FFD700' }}>
                {NEXT_PREVIEW.time}
              </div>
              <div className="text-[11px]" style={{ color: '#8BAFC8' }}>
                {NEXT_PREVIEW.pitcher}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-[10px]" style={{ color: '#4A6A88' }}>Win Prob:</div>
                <div className="font-mono font-bold text-sm" style={{
                  color: NEXT_PREVIEW.winProb >= 0.5 ? '#22D3A5' : '#FFB347',
                }}>
                  {Math.round(NEXT_PREVIEW.winProb * 100)}%
                </div>
              </div>
              <div className="text-[10px]" style={{ color: '#4A6A88' }}>
                ⛅ {NEXT_PREVIEW.weatherForecast}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
