import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import type { LiveGameFeed } from '../../types/mlb'
import type { RealBattingStats } from '../../utils/mlbApi'
import { StatCard, SectionHeader } from '../shared/StatCard'
import { BaseRunners } from '../shared/BaseRunners'
import { GaugeChart, WinProbBar } from '../shared/GaugeChart'
import { StrikeZone } from '../shared/StrikeZone'
import { WinProbChart } from '../shared/WinProbChart'
import {
  fmtAvg, fmtPct, fmtOPS, fmtPlus, fmtInt,
  getStatQuality, qualityColor, inningDisplay
} from '../../utils/formatters'
import { getRunExpectancy, calcWinProbability } from '../../utils/mlbApi'

interface BattingModeProps {
  feed: LiveGameFeed
  batterStats: RealBattingStats
  isMetsBatting: boolean
}

function Gauge(props: { value: number | undefined; min: number; max: number; label: string; unit?: string }) {
  if (props.value === undefined) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center font-mono text-xl font-black" style={{ height: 53, color: '#4A6A88' }}>--</div>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8BAFC8' }}>{props.label}</span>
      </div>
    )
  }
  return <GaugeChart value={props.value} min={props.min} max={props.max} label={props.label} unit={props.unit} size={70} />
}

export function BattingMode({ feed, batterStats, isMetsBatting }: BattingModeProps) {
  const ls = feed.liveData.linescore
  const cp = feed.liveData.plays.currentPlay
  const bs = batterStats
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
  const wpHistory = allPlays.slice(-20).map(play => ({
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
    { metric: 'Contact', value: bs.kPct !== undefined ? Math.min(100, (1 - bs.kPct) * 140) : 0 },
    { metric: 'Power', value: bs.iso !== undefined ? Math.min(100, bs.iso * 400) : 0 },
    { metric: 'Eye', value: bs.bbPct !== undefined ? Math.min(100, bs.bbPct * 500) : 0 },
    { metric: 'Barrel%', value: bs.barrelPct !== undefined ? Math.min(100, bs.barrelPct * 10) : 0 },
    { metric: 'Hard Hit', value: bs.hardHitPct !== undefined ? Math.min(100, bs.hardHitPct * 180) : 0 },
    { metric: 'xStats', value: bs.xwoba !== undefined ? Math.min(100, bs.xwoba * 250) : 0 },
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
                {isMetsBatting ? 'NYM · BATTING' : 'OPP · BATTING'}
              </div>
            </div>
          </div>

          <div className="text-center mb-3">
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#4A6A88' }}>FACING</div>
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
            }}>
              {fmtOPS(bs.ops)}
            </div>
          </div>
        </div>

        {/* Count + Situation */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
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
            metsIsHome ? feed.gameData.teams.away.abbreviation : feed.gameData.teams.home.abbreviation
          } />
          <div className="mt-2">
            <WinProbChart data={wpHistory} currentProb={winProb} compact />
          </div>
        </div>

        {/* Advanced Batting Metrics */}
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

        {/* Statcast */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Statcast" accent="orange" />
          <div className="flex justify-around mb-3">
            <Gauge value={bs.exitVelo} min={80} max={100} label="Exit Velo" unit=" mph" />
            <Gauge value={bs.barrelPct !== undefined ? bs.barrelPct * 100 : undefined} min={0} max={20} label="Barrel%" unit="%" />
            <Gauge value={bs.hardHitPct !== undefined ? bs.hardHitPct * 100 : undefined} min={20} max={70} label="Hard Hit%" unit="%" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['xSLG', fmtAvg(bs.xslg)],
              ['xOBP', fmtAvg(bs.xobp)],
              ['Exit Velo', bs.exitVelo !== undefined ? `${bs.exitVelo.toFixed(1)} mph` : '--'],
              ['Avg LA', bs.launchAngle !== undefined ? `${bs.launchAngle.toFixed(1)}°` : '--'],
            ].map(([l, v]) => (
              <div key={String(l)} className="flex justify-between rounded-lg px-2 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1A2E48' }}>
                <span className="text-[11px] font-semibold" style={{ color: '#8BAFC8' }}>{String(l)}</span>
                <span className="font-mono text-xs font-bold" style={{ color: '#E8F4FD' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Season Counting Stats */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Season Counting Stats" accent="green" />
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="HR" value={fmtInt(bs.hr)} size="sm" showBadge={false} />
            <StatCard label="RBI" value={fmtInt(bs.rbi)} size="sm" showBadge={false} />
            <StatCard label="R" value={fmtInt(bs.runs)} size="sm" showBadge={false} />
            <StatCard label="H" value={fmtInt(bs.hits)} size="sm" showBadge={false} />
            <StatCard label="2B" value={fmtInt(bs.doubles)} size="sm" showBadge={false} />
            <StatCard label="3B" value={fmtInt(bs.triples)} size="sm" showBadge={false} />
            <StatCard label="SB" value={fmtInt(bs.sb)} size="sm" showBadge={false} />
            <StatCard label="BB" value={fmtInt(bs.bb)} size="sm" showBadge={false} />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Charts */}
      <div className="col-span-4 flex flex-col gap-3">

        {/* Strike Zone Map */}
        <div className="rounded-xl p-3 flex flex-col items-center" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <StrikeZone pitches={pitchEvents} size={200} />
        </div>

        {/* Player Profile Radar */}
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

        {/* Expected Stats */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Expected Stats" accent="orange" />
          <div className="space-y-1.5">
            {[
              ['xBA', fmtAvg(bs.xba)],
              ['xSLG', fmtAvg(bs.xslg)],
              ['xOBP', fmtAvg(bs.xobp)],
              ['xwOBA', fmtAvg(bs.xwoba)],
            ].map(([l, v]) => (
              <div key={String(l)} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8BAFC8' }}>{String(l)}</span>
                <span className="font-mono text-xs font-bold" style={{ color: '#E8F4FD' }}>{String(v)}</span>
              </div>
            ))}
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
              ['G', fmtInt(bs.gamesPlayed)],
              ['PA', fmtInt(bs.pa)],
              ['AB', fmtInt(bs.ab)],
              ['HR', fmtInt(bs.hr)],
              ['RBI', fmtInt(bs.rbi)],
              ['SB', fmtInt(bs.sb)],
              ['xBA', fmtAvg(bs.xba)],
              ['xSLG', fmtAvg(bs.xslg)],
            ].map(([l, v]) => (
              <StatCard key={String(l)} label={String(l)} value={String(v)} size="sm" showBadge={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
