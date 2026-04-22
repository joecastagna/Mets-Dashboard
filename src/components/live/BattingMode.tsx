import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import type { LiveGameFeed, PlayerDetailStats } from '../../types/mlb'
import { StatCard, StatRow, SectionHeader } from '../shared/StatCard'
import { BaseRunners } from '../shared/BaseRunners'
import { GaugeChart, ProgressBar, WinProbBar } from '../shared/GaugeChart'
import { StrikeZone } from '../shared/StrikeZone'
import { WinProbChart, Sparkline } from '../shared/WinProbChart'
import {
  fmtAvg, fmtPct, fmtNum, fmtOPS, fmtWAR, fmtPlus,
  getStatQuality, qualityColor, inningDisplay
} from '../../utils/formatters'
import { getRunExpectancy, calcWinProbability } from '../../utils/mlbApi'

interface BattingModeProps {
  feed: LiveGameFeed
  batterStats: PlayerDetailStats
  isMetsBatting: boolean
}

export function BattingMode({ feed, batterStats, isMetsBatting }: BattingModeProps) {
  const ls = feed.liveData.linescore
  const cp = feed.liveData.plays.currentPlay
  const bs = batterStats.batting
  const metsIsHome = feed.gameData.teams.home.id === 121
  const metsScore = metsIsHome ? ls.teams.home.runs : ls.teams.away.runs
  const oppScore = metsIsHome ? ls.teams.away.runs : ls.teams.home.runs
  const weather = feed.gameData.weather

  const onFirst = !!ls.offense?.onFirst
  const onSecond = !!ls.offense?.onSecond
  const onThird = !!ls.offense?.onThird
  const outs = cp?.count.outs ?? ls.outs ?? 0
  const balls = cp?.count.balls ?? ls.balls ?? 0
  const strikes = cp?.count.strikes ?? ls.strikes ?? 0

  const runExpect = getRunExpectancy(onFirst, onSecond, onThird, outs)
  const winProb = calcWinProbability(metsScore ?? 0, oppScore ?? 0, ls.currentInning, ls.isTopInning, isMetsBatting)

  const currentBatter = cp?.matchup.batter
  const currentPitcher = cp?.matchup.pitcher
  const pitchEvents = cp?.playEvents?.filter(e => e.isPitch) ?? []
  const lastPitch = pitchEvents[pitchEvents.length - 1]

  const li = outs < 2 ? (onFirst || onSecond || onThird ? 1.5 : 0.8) : 1.2

  const allPlays = feed.liveData.plays.allPlays ?? []
  const wpHistory = allPlays.slice(-20).map((play, i) => ({
    label: `${play.about.inning}${play.about.isTopInning ? 'T' : 'B'}`,
    prob: calcWinProbability(
      play.result.homeScore ?? metsScore ?? 0,
      play.result.awayScore ?? oppScore ?? 0,
      play.about.inning,
      play.about.isTopInning,
      metsIsHome ? !play.about.isTopInning : play.about.isTopInning
    ),
    event: play.result.event,
  }))
  if (!wpHistory.length) wpHistory.push({ label: '1T', prob: 0.5, event: undefined })
  wpHistory.push({ label: 'Now', prob: winProb, event: undefined })

  const radarData = [
    { metric: 'Contact', value: Math.min(100, (1 - bs.kPct) * 100) },
    { metric: 'Power', value: Math.min(100, bs.iso * 400) },
    { metric: 'Eye', value: Math.min(100, bs.bbPct * 500) },
    { metric: 'Speed', value: Math.min(100, (bs.sprintSpeed - 23) / 7 * 100) },
    { metric: 'Hard Hit', value: Math.min(100, bs.hardHitPct * 180) },
    { metric: 'xStats', value: Math.min(100, bs.xwoba * 250) },
  ]

  const splitData = [
    { name: 'vs LHP', ops: bs.vsLHP, fill: '#1E6DC5' },
    { name: 'vs RHP', ops: bs.vsRHP, fill: '#FF5910' },
    { name: 'Home', ops: bs.homeOps, fill: '#22D3A5' },
    { name: 'Away', ops: bs.awayOps, fill: '#B47AFF' },
    { name: 'RISP', ops: bs.risp, fill: '#FFD700' },
  ]

  const inningLabel = inningDisplay(ls.currentInning, ls.isTopInning)

  return (
    <div className="grid grid-cols-12 gap-3 p-3 animate-fade-in">

      {/* LEFT COLUMN - Batter Info + Core Stats */}
      <div className="col-span-3 flex flex-col gap-3">

        {/* Batter Card */}
        <div className="rounded-xl p-4" style={{
          background: 'linear-gradient(135deg, #0E1E38 0%, #0A1628 100%)',
          border: '1px solid rgba(30,109,197,0.4)',
          boxShadow: '0 0 20px rgba(30,109,197,0.15)',
        }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black"
              style={{ background: 'linear-gradient(135deg, #002D72, #1E6DC5)', color: '#E8F4FD', border: '2px solid #FF5910' }}>
              {isMetsBatting ? '🔵' : '⚔️'}
            </div>
            <div>
              <div className="text-sm font-black" style={{ color: '#E8F4FD' }}>
                {currentBatter?.fullName ?? '—'}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8BAFC8' }}>
                {isMetsBatting ? 'NYM · BATTING' : `OPP · BATTING`}
              </div>
            </div>
          </div>

          <div className="text-center mb-3">
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#4A6A88' }}>
              FACING
            </div>
            <div className="text-xs font-bold" style={{ color: '#8BAFC8' }}>
              {currentPitcher?.fullName ?? '—'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <StatCard label="AVG" value={fmtAvg(bs.avg)} statKey="avg" rawValue={bs.avg} size="sm" />
            <StatCard label="OBP" value={fmtAvg(bs.obp)} statKey="obp" rawValue={bs.obp} size="sm" />
            <StatCard label="SLG" value={fmtAvg(bs.slg)} statKey="slg" rawValue={bs.slg} size="sm" />
          </div>

          <div className="rounded-lg p-2 text-center" style={{
            background: 'rgba(30,109,197,0.1)', border: '1px solid rgba(30,109,197,0.3)',
          }}>
            <div className="text-[9px] uppercase tracking-widest" style={{ color: '#8BAFC8' }}>OPS</div>
            <div className="font-mono text-2xl font-black" style={{
              color: qualityColor(getStatQuality('ops', bs.ops)),
              textShadow: '0 0 20px currentColor',
            }}>
              {fmtOPS(bs.ops)}
            </div>
            <div className="flex justify-center mt-1">
              <Sparkline data={bs.last30Ops} color={qualityColor(getStatQuality('ops', bs.ops))} />
            </div>
          </div>
        </div>

        {/* Count + Situation */}
        <div className="rounded-xl p-3" style={{
          background: '#0A1628', border: '1px solid #1A2E48',
        }}>
          <SectionHeader title="At-Bat" accent="orange" />
          <div className="flex justify-between items-center mb-3">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#4A6A88' }}>COUNT</div>
              <div className="font-mono text-3xl font-black" style={{ color: '#E8F4FD' }}>
                {balls}<span style={{ color: '#4A6A88' }}>-</span>{strikes}
              </div>
            </div>
            <BaseRunners onFirst={onFirst} onSecond={onSecond} onThird={onThird} outs={outs} size="sm" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span style={{ color: '#8BAFC8' }}>Run Expectancy</span>
              <span className="font-mono font-bold" style={{ color: '#FFD700' }}>{runExpect.toFixed(2)} R</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#8BAFC8' }}>Leverage Index</span>
              <span className="font-mono font-bold" style={{ color: li >= 2 ? '#FF4D6D' : li >= 1 ? '#FFB347' : '#8BAFC8' }}>
                {li.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#8BAFC8' }}>Inning</span>
              <span className="font-mono font-bold" style={{ color: '#E8F4FD' }}>{inningLabel}</span>
            </div>
          </div>
        </div>

        {/* Last Pitch */}
        {lastPitch && (
          <div className="rounded-xl p-3" style={{
            background: 'rgba(255,89,16,0.08)', border: '1px solid rgba(255,89,16,0.3)',
          }}>
            <SectionHeader title="Last Pitch" accent="orange" />
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>TYPE</div>
                <div className="text-sm font-black" style={{ color: '#FF5910' }}>
                  {lastPitch.details.type?.description?.split(' ').map(w => w[0]).join('') ?? '--'}
                </div>
                <div className="text-[9px]" style={{ color: '#8BAFC8' }}>
                  {lastPitch.details.type?.description ?? '--'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>VELO</div>
                <div className="font-mono text-xl font-black" style={{ color: '#E8F4FD' }}>
                  {lastPitch.pitchData?.startSpeed?.toFixed(1) ?? '--'}
                </div>
                <div className="text-[9px]" style={{ color: '#8BAFC8' }}>mph</div>
              </div>
            </div>
            {lastPitch.hitData && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>EV</div>
                  <div className="font-mono text-sm font-bold" style={{ color: '#22D3A5' }}>
                    {lastPitch.hitData.launchSpeed?.toFixed(1) ?? '--'} mph
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>LA</div>
                  <div className="font-mono text-sm font-bold" style={{ color: '#60B4FF' }}>
                    {lastPitch.hitData.launchAngle?.toFixed(1) ?? '--'}°
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CENTER COLUMN - Advanced Stats + Charts */}
      <div className="col-span-5 flex flex-col gap-3">

        {/* Win Probability */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <WinProbBar metsProb={winProb} metsName="NYM" oppName={
            metsIsHome
              ? feed.gameData.teams.away.abbreviation
              : feed.gameData.teams.home.abbreviation
          } />
          <div className="mt-2">
            <WinProbChart data={wpHistory} currentProb={winProb} compact />
          </div>
        </div>

        {/* Advanced Batting Metrics Grid */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Advanced Metrics" accent="blue" />
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="wOBA" value={fmtAvg(bs.woba)} statKey="woba" rawValue={bs.woba} size="sm" />
            <StatCard label="wRC+" value={fmtPlus(bs.wrcPlus)} statKey="wrcPlus" rawValue={bs.wrcPlus} size="sm" />
            <StatCard label="ISO" value={fmtAvg(bs.iso)} statKey="iso" rawValue={bs.iso} size="sm" />
            <StatCard label="BABIP" value={fmtAvg(bs.babip)} statKey="babip" rawValue={bs.babip} size="sm" />
            <StatCard label="BB%" value={fmtPct(bs.bbPct)} statKey="bbPct" rawValue={bs.bbPct} size="sm" />
            <StatCard label="K%" value={fmtPct(bs.kPct)} statKey="kPct" rawValue={bs.kPct} size="sm" />
            <StatCard label="xBA" value={fmtAvg(bs.xba)} statKey="xba" rawValue={bs.xba} size="sm" />
            <StatCard label="xwOBA" value={fmtAvg(bs.xwoba)} statKey="xwoba" rawValue={bs.xwoba} size="sm" />
          </div>
        </div>

        {/* Statcast Metrics */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Statcast" accent="orange" />
          <div className="grid grid-cols-3 gap-3 mb-3">
            <GaugeChart value={bs.avgExitVelo} min={80} max={100} label="Exit Velo" unit=" mph" size={70} />
            <GaugeChart value={bs.barrelPct * 100} min={0} max={20} label="Barrel%" unit="%" size={70} />
            <GaugeChart value={bs.hardHitPct * 100} min={20} max={70} label="Hard Hit%" unit="%" size={70} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ProgressBar value={bs.gbPct} label="GB%" valueDisplay={fmtPct(bs.gbPct)} color="#60B4FF" />
            <ProgressBar value={bs.fbPct} label="FB%" valueDisplay={fmtPct(bs.fbPct)} color="#FF5910" />
            <ProgressBar value={bs.ldPct} label="LD%" valueDisplay={fmtPct(bs.ldPct)} color="#22D3A5" />
            <ProgressBar value={bs.xslg} max={0.8} label="xSLG" valueDisplay={fmtAvg(bs.xslg)} color="#B47AFF" />
          </div>
        </div>

        {/* Plate Discipline */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Plate Discipline" accent="green" />
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="BB/K" value={fmtNum(bs.bbk)} size="sm"
              statKey="bbPct" rawValue={bs.bbk} showBadge={false} />
            <StatCard label="Sprint" value={`${fmtNum(bs.sprintSpeed)}`} size="sm"
              subValue="ft/s" showBadge={false} />
            <StatCard label="WAR" value={fmtWAR(bs.war)} statKey="war" rawValue={bs.war} size="sm" />
            <StatCard label="Clutch" value={fmtNum(bs.clutch, 2)} size="sm"
              showBadge={false}
              highlight={bs.clutch > 0} />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Visual Charts + Splits */}
      <div className="col-span-4 flex flex-col gap-3">

        {/* Strike Zone Map */}
        <div className="rounded-xl p-3 flex flex-col items-center" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <StrikeZone pitches={pitchEvents} size={200} />
        </div>

        {/* Player Radar */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Player Profile" accent="blue" />
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#1A2E48" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#8BAFC8', fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="#1E6DC5" fill="#1E6DC5" fillOpacity={0.25}
                  dot={{ fill: '#1E6DC5', r: 2 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Splits */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Splits (OPS)" accent="orange" />
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={splitData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#8BAFC8', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0.4, 1.1]} tick={{ fill: '#4A6A88', fontSize: 8 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => [fmtOPS(v), 'OPS']}
                  contentStyle={{ background: '#0A1628', border: '1px solid #1A2E48', borderRadius: 8 }}
                  labelStyle={{ color: '#8BAFC8' }}
                  itemStyle={{ color: '#E8F4FD' }}
                />
                <Bar dataKey="ops" radius={[4, 4, 0, 0]}>
                  {splitData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Direction Spray */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Batted Ball Profile" accent="green" />
          <div className="space-y-2">
            <div className="flex gap-1">
              {['PULL', 'CENTER', 'OPPO'].map((dir, i) => {
                const vals = [bs.pullPct, bs.centPct, bs.oppoPct]
                const colors = ['#FF5910', '#22D3A5', '#1E6DC5']
                return (
                  <div key={dir} className="flex-1 text-center rounded-lg p-2" style={{
                    background: `${colors[i]}15`, border: `1px solid ${colors[i]}40`,
                  }}>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: colors[i] }}>{dir}</div>
                    <div className="font-mono text-sm font-bold" style={{ color: '#E8F4FD' }}>
                      {fmtPct(vals[i])}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[['SOFT', bs.softPct, '#8BAFC8'], ['MED', bs.medPct, '#FFB347'], ['HARD', bs.hardHitPct, '#22D3A5']].map(([l, v, c]) => (
                <div key={String(l)} className="text-center rounded-lg p-1.5" style={{
                  background: `${c}10`, border: `1px solid ${c}30`,
                }}>
                  <div className="text-[9px] uppercase" style={{ color: String(c) }}>{String(l)}</div>
                  <div className="font-mono text-xs font-bold" style={{ color: '#E8F4FD' }}>
                    {fmtPct(Number(v))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weather */}
        {weather && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#FFD700' }}>⛅ WEATHER</span>
              <span className="text-xs font-mono font-bold" style={{ color: '#E8F4FD' }}>{weather.temp}°F</span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: '#8BAFC8' }}>{weather.condition} · {weather.wind}</div>
          </div>
        )}
      </div>

      {/* BOTTOM ROW - Full stat table */}
      <div className="col-span-12">
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Complete Season Stats" accent="blue" />
          <div className="grid grid-cols-8 gap-1">
            {[
              ['HR', String(bs.hrTotal), 'hrTotal', bs.hrTotal],
              ['RBI', String(bs.rbi), undefined, 0],
              ['R', String(bs.runs), undefined, 0],
              ['SB', String(bs.sb), undefined, 0],
              ['SB%', fmtPct(bs.sbPct), undefined, 0],
              ['OPS+', fmtPlus(bs.opsPlus), 'wrcPlus', bs.opsPlus],
              ['xBA', fmtAvg(bs.xba), 'xba', bs.xba],
              ['xSLG', fmtAvg(bs.xslg), undefined, 0],
            ].map(([l, v, k, r]) => (
              <StatCard key={String(l)} label={String(l)} value={String(v)}
                statKey={k as string | undefined}
                rawValue={typeof r === 'number' && k ? r : undefined}
                size="sm" showBadge={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
