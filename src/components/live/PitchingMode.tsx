import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import type { LiveGameFeed } from '../../types/mlb'
import type { RealPitchingStats, RealBattingStats } from '../../utils/mlbApi'
import { StatCard, SectionHeader } from '../shared/StatCard'
import { BaseRunners } from '../shared/BaseRunners'
import { GaugeChart, WinProbBar } from '../shared/GaugeChart'
import { StrikeZone } from '../shared/StrikeZone'
import { WinProbChart } from '../shared/WinProbChart'
import {
  fmtAvg, fmtPct, fmtERA, fmtNum, fmtWHIP, fmtK9,
  getStatQuality, qualityColor, inningDisplay
} from '../../utils/formatters'
import { getRunExpectancy, calcWinProbability } from '../../utils/mlbApi'

interface PitchingModeProps {
  feed: LiveGameFeed
  pitcherStats: RealPitchingStats
  batterStats: RealBattingStats
  isMetsPitching: boolean
}

function Gauge(props: { value: number | undefined; min: number; max: number; label: string; unit?: string; colorOverride?: string }) {
  if (props.value === undefined) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center font-mono text-xl font-black" style={{ height: 53, color: '#4A6A88' }}>--</div>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8BAFC8' }}>{props.label}</span>
      </div>
    )
  }
  return <GaugeChart value={props.value} min={props.min} max={props.max} label={props.label} unit={props.unit} size={70} colorOverride={props.colorOverride} />
}

export function PitchingMode({ feed, pitcherStats, batterStats, isMetsPitching }: PitchingModeProps) {
  const ls = feed.liveData.linescore
  const cp = feed.liveData.plays.currentPlay
  const ps = pitcherStats
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
  const winProb = calcWinProbability(metsScore ?? 0, oppScore ?? 0, ls.currentInning, ls.isTopInning, !isMetsPitching)

  const currentPitcher = cp?.matchup.pitcher
  const currentBatter = cp?.matchup.batter
  const pitchEvents = cp?.playEvents?.filter(e => e.isPitch) ?? []
  const lastPitch = pitchEvents[pitchEvents.length - 1]

  const allPlays = feed.liveData.plays.allPlays ?? []
  const wpHistory = allPlays.slice(-20).map(play => ({
    label: `${play.about.inning}${play.about.isTopInning ? 'T' : 'B'}`,
    prob: calcWinProbability(
      play.result.homeScore ?? metsScore ?? 0,
      play.result.awayScore ?? oppScore ?? 0,
      play.about.inning, play.about.isTopInning,
      metsIsHome ? !play.about.isTopInning : play.about.isTopInning
    ),
    event: play.result.event,
  }))
  if (!wpHistory.length) wpHistory.push({ label: '1T', prob: 0.5, event: undefined })
  wpHistory.push({ label: 'Now', prob: winProb, event: undefined })

  const veloTrend = pitchEvents
    .filter(p => p.pitchData?.startSpeed)
    .map((p, i) => ({ pitch: i + 1, velo: p.pitchData!.startSpeed }))

  const inningLabel = inningDisplay(ls.currentInning, ls.isTopInning)

  const pitchMix = ps.pitchMix ?? []

  return (
    <div className="grid grid-cols-12 gap-3 p-3 animate-fade-in">

      {/* LEFT COLUMN - Pitcher Info + ERA/FIP */}
      <div className="col-span-3 flex flex-col gap-3">

        {/* Pitcher Card */}
        <div className="rounded-xl p-4" style={{
          background: 'linear-gradient(135deg, #1A0A02 0%, #0A0E1A 100%)',
          border: '1px solid rgba(255,89,16,0.4)',
          boxShadow: '0 0 20px rgba(255,89,16,0.1)',
        }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #CC3A00, #FF5910)', color: '#E8F4FD', border: '2px solid #002D72', fontSize: 20 }}>
              ⚾
            </div>
            <div>
              <div className="text-sm font-black" style={{ color: '#E8F4FD' }}>
                {currentPitcher?.fullName ?? '—'}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#FF8A50' }}>
                {isMetsPitching ? 'NYM · PITCHING' : 'OPP · PITCHING'}
              </div>
            </div>
          </div>

          <div className="text-center mb-3">
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#4A6A88' }}>FACING</div>
            <div className="text-xs font-bold" style={{ color: '#8BAFC8' }}>
              {currentBatter?.fullName ?? '—'}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: '#4A6A88' }}>
              {cp?.matchup.batSide.code === 'L' ? '⬅ LHB' : '➡ RHB'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="text-center rounded-lg p-2" style={{ background: 'rgba(255,89,16,0.1)', border: '1px solid rgba(255,89,16,0.3)' }}>
              <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>ERA</div>
              <div className="font-mono text-2xl font-black" style={{ color: qualityColor(getStatQuality('era', ps.era)) }}>
                {fmtERA(ps.era)}
              </div>
            </div>
            <div className="text-center rounded-lg p-2" style={{ background: 'rgba(30,109,197,0.1)', border: '1px solid rgba(30,109,197,0.3)' }}>
              <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>FIP</div>
              <div className="font-mono text-2xl font-black" style={{ color: qualityColor(getStatQuality('fip', ps.fip)) }}>
                {fmtERA(ps.fip)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 mt-2">
            <StatCard label="xERA" value={fmtERA(ps.xera)} statKey="xera" rawValue={ps.xera} size="sm" />
            <StatCard label="WHIP" value={fmtWHIP(ps.whip)} statKey="whip" rawValue={ps.whip} size="sm" />
            <StatCard label="BABIP" value={fmtAvg(ps.babip)} statKey="babip" rawValue={ps.babip} size="sm" />
          </div>
        </div>

        {/* Count + Situation */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Situation" accent="orange" />
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
              <span style={{ color: '#8BAFC8' }}>Inning</span>
              <span className="font-mono font-bold" style={{ color: '#E8F4FD' }}>{inningLabel}</span>
            </div>
          </div>
        </div>

        {/* Rate Stat Gauges */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Rate Stats" accent="green" />
          <div className="flex justify-around">
            <Gauge value={ps.k9} min={4} max={15} label="K/9" colorOverride="#22D3A5" />
            <Gauge value={ps.bb9} min={1} max={5} label="BB/9" colorOverride="#FF4D6D" />
            <Gauge value={ps.kbb} min={1} max={7} label="K/BB" colorOverride="#60B4FF" />
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
                  {lastPitch.details.type?.code ?? '--'}
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
            <div className="mt-2 grid grid-cols-2 gap-2">
              {lastPitch.pitchData?.breaks?.spinRate && (
                <div className="text-center">
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>SPIN</div>
                  <div className="font-mono text-sm font-bold" style={{ color: '#B47AFF' }}>
                    {Math.round(lastPitch.pitchData.breaks.spinRate)} RPM
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-widest" style={{ color: '#4A6A88' }}>RESULT</div>
                <div className="text-xs font-bold" style={{
                  color: lastPitch.details.call?.code === 'S' ? '#FF4D6D' :
                    lastPitch.details.call?.code === 'B' ? '#60B4FF' : '#22D3A5'
                }}>
                  {lastPitch.details.call?.description ?? '--'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CENTER COLUMN */}
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

        {/* Pitch Arsenal */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Pitch Arsenal" accent="orange" />
          {pitchMix.length > 0 ? (
            <div className="space-y-2">
              {pitchMix.map(p => (
                <div key={p.code} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <div className="text-[10px] font-bold w-16 truncate" style={{ color: '#8BAFC8' }}>{p.name}</div>
                  <div className="flex-1">
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#1A2E48' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${p.usage * 100}%`, background: `linear-gradient(90deg, ${p.color}80, ${p.color})` }} />
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-bold w-10 text-right" style={{ color: '#E8F4FD' }}>
                    {fmtPct(p.usage)}
                  </div>
                  <div className="text-[10px] font-mono w-14 text-right" style={{ color: '#8BAFC8' }}>
                    {p.avgVelo !== undefined ? `${p.avgVelo.toFixed(1)} mph` : '--'}
                  </div>
                  <div className="text-[10px] font-mono w-14 text-right" style={{
                    color: p.runValue !== undefined
                      ? (p.runValue <= -1 ? '#22D3A5' : p.runValue >= 1 ? '#FF4D6D' : '#FFB347')
                      : '#8BAFC8',
                  }}>
                    {p.runValue !== undefined ? `${p.runValue > 0 ? '+' : ''}${p.runValue.toFixed(1)} RV` : '--'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-center py-4" style={{ color: '#4A6A88' }}>No arsenal data</div>
          )}
        </div>

        {/* Advanced Pitching Metrics */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Advanced Metrics" accent="blue" />
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="K%" value={fmtPct(ps.kPct)} statKey="kPctP" rawValue={ps.kPct} size="sm" />
            <StatCard label="BB%" value={fmtPct(ps.bbPct)} statKey="bbPctP" rawValue={ps.bbPct} size="sm" />
            <StatCard label="LOB%" value={fmtPct(ps.lobPct)} statKey="lobPct" rawValue={ps.lobPct} size="sm" />
            <StatCard label="HR/FB" value={fmtPct(ps.hrfb)} size="sm" showBadge={false} />
            <StatCard label="xBA" value={fmtAvg(ps.xba)} statKey="xba" rawValue={ps.xba} size="sm" />
            <StatCard label="xSLG" value={fmtAvg(ps.xslg)} size="sm" showBadge={false} />
            <StatCard label="GB/Air" value={fmtNum(ps.gbToAir, 2)} size="sm" showBadge={false} />
            <StatCard label="BABIP" value={fmtAvg(ps.babip)} statKey="babip" rawValue={ps.babip} size="sm" />
          </div>
        </div>

        {/* Velocity Trend in Current At-Bat */}
        {veloTrend.length > 2 && (
          <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
            <SectionHeader title="Velocity Trend (This At-Bat)" accent="orange" />
            <div style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={veloTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="pitch" tick={{ fill: '#4A6A88', fontSize: 8 }} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#4A6A88', fontSize: 8 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid #1A2E48', borderRadius: 8 }}
                    itemStyle={{ color: '#FF5910' }} labelStyle={{ color: '#8BAFC8' }} />
                  <Line type="monotone" dataKey="velo" stroke="#FF5910" strokeWidth={2} dot={{ r: 3, fill: '#FF5910' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="col-span-4 flex flex-col gap-3">

        {/* Strike Zone */}
        <div className="rounded-xl p-3 flex flex-col items-center" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <StrikeZone pitches={pitchEvents} size={200} />
        </div>

        {/* Opposing Batter Analysis */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,89,16,0.05)', border: '1px solid rgba(255,89,16,0.2)' }}>
          <SectionHeader title="Opposing Batter" accent="orange" />
          <div className="space-y-1">
            <div className="font-semibold text-xs mb-2" style={{ color: '#E8F4FD' }}>
              {currentBatter?.fullName ?? '—'}
            </div>
            <div className="grid grid-cols-3 gap-1">
              <StatCard label="AVG" value={fmtAvg(bs.avg)} size="sm" showBadge={false} />
              <StatCard label="OBP" value={fmtAvg(bs.obp)} size="sm" showBadge={false} />
              <StatCard label="SLG" value={fmtAvg(bs.slg)} size="sm" showBadge={false} />
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <StatCard label="K%" value={fmtPct(bs.kPct)} size="sm" showBadge={false} />
              <StatCard label="BB%" value={fmtPct(bs.bbPct)} size="sm" showBadge={false} />
            </div>
          </div>
        </div>

        {/* Season Line */}
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Season Line" accent="blue" />
          <div className="space-y-1.5">
            {[
              ['IP', ps.ip ?? '--'],
              ['W-L', ps.wins !== undefined && ps.losses !== undefined ? `${ps.wins}-${ps.losses}` : '--'],
              ['K', ps.k !== undefined ? String(ps.k) : '--'],
              ['BB', ps.bb !== undefined ? String(ps.bb) : '--'],
              ['LOB%', fmtPct(ps.lobPct)],
              ['HR/FB', fmtPct(ps.hrfb)],
              ['GB/Air', fmtNum(ps.gbToAir, 2)],
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

      {/* BOTTOM - Full stats row */}
      <div className="col-span-12">
        <div className="rounded-xl p-3" style={{ background: '#0A1628', border: '1px solid #1A2E48' }}>
          <SectionHeader title="Complete Season Pitching" accent="orange" />
          <div className="grid grid-cols-8 gap-1">
            {[
              ['K/9', fmtK9(ps.k9)],
              ['BB/9', fmtK9(ps.bb9)],
              ['H/9', fmtK9(ps.h9)],
              ['HR/9', fmtK9(ps.hr9)],
              ['K/BB', fmtNum(ps.kbb, 2)],
              ['LOB%', fmtPct(ps.lobPct)],
              ['xERA', fmtERA(ps.xera)],
              ['BABIP', fmtAvg(ps.babip)],
            ].map(([l, v]) => (
              <StatCard key={String(l)} label={String(l)} value={String(v)} size="sm" showBadge={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
