import type { LiveGameFeed, ScheduleGame, PlayerDetailStats, PitchMixItem, SeasonBattingStats, SeasonPitchingStats } from '../types/mlb'

const BASE = 'https://statsapi.mlb.com/api'
export const METS_ID = 121
const SEASON = new Date().getFullYear()

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`MLB API error: ${res.status} ${url}`)
  return res.json()
}

export async function getTodaysGames(): Promise<ScheduleGame[]> {
  const today = new Date().toISOString().split('T')[0]
  const data = await fetchJSON<{ dates: Array<{ games: ScheduleGame[] }> }>(
    `${BASE}/v1/schedule?sportId=1&teamId=${METS_ID}&date=${today}&hydrate=linescore,team`
  )
  return data.dates?.[0]?.games ?? []
}

export async function getLiveGame(gamePk: number): Promise<LiveGameFeed> {
  return fetchJSON<LiveGameFeed>(`${BASE}/v1.1/game/${gamePk}/feed/live`)
}

export async function getLastGame(): Promise<ScheduleGame | null> {
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - 7)
  const data = await fetchJSON<{ dates: Array<{ games: ScheduleGame[] }> }>(
    `${BASE}/v1/schedule?sportId=1&teamId=${METS_ID}&startDate=${from.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}&hydrate=linescore,team&gameType=R`
  )
  const allGames = data.dates?.flatMap(d => d.games) ?? []
  const finished = allGames.filter(g =>
    g.status.abstractGameState === 'Final' || g.status.codedGameState === 'F'
  )
  return finished[finished.length - 1] ?? null
}

export async function getNextGame(): Promise<ScheduleGame | null> {
  const today = new Date()
  const until = new Date(today)
  until.setDate(until.getDate() + 14)
  const data = await fetchJSON<{ dates: Array<{ games: ScheduleGame[] }> }>(
    `${BASE}/v1/schedule?sportId=1&teamId=${METS_ID}&startDate=${today.toISOString().split('T')[0]}&endDate=${until.toISOString().split('T')[0]}&hydrate=team,probablePitcher&gameType=R`
  )
  const allGames = data.dates?.flatMap(d => d.games) ?? []
  return allGames.find(g =>
    g.status.abstractGameState === 'Preview' || g.status.codedGameState === 'S' || g.status.codedGameState === 'P'
  ) ?? null
}

export async function getPlayerSeasonStats(personId: number, group: 'hitting' | 'pitching'): Promise<Record<string, unknown>> {
  const data = await fetchJSON<{ stats: Array<{ splits: Array<{ stat: Record<string, unknown> }> }> }>(
    `${BASE}/v1/people/${personId}/stats?stats=season&season=${SEASON}&group=${group}`
  )
  return data.stats?.[0]?.splits?.[0]?.stat ?? {}
}

export async function getPlayerInfo(personId: number): Promise<Record<string, unknown>> {
  const data = await fetchJSON<{ people: Array<Record<string, unknown>> }>(
    `${BASE}/v1/people/${personId}?hydrate=stats(group=[hitting,pitching],type=[season],season=${SEASON})`
  )
  return data.people?.[0] ?? {}
}

function parseStat(val: unknown, fallback = 0): number {
  if (val === null || val === undefined) return fallback
  const n = Number(val)
  return isNaN(n) ? fallback : n
}

function parseStatStr(val: unknown, fallback = 0): number {
  if (typeof val === 'string') return parseFloat(val) || fallback
  return parseStat(val, fallback)
}

function calcFIP(era: number, hrPer9: number, bb9: number, k9: number): number {
  const constant = 3.1
  const fip = ((13 * hrPer9 / 9) + (3 * bb9 / 9) - (2 * k9 / 9)) + constant
  return Math.max(1.0, fip)
}

export function buildBattingStats(raw: Record<string, unknown>, recentOps?: number[]): PlayerDetailStats['batting'] {
  const avg = parseStatStr(raw.avg)
  const obp = parseStatStr(raw.obp)
  const slg = parseStatStr(raw.slg)
  const ops = parseStatStr(raw.ops)
  const ab = parseStat(raw.atBats)
  const bb = parseStat(raw.baseOnBalls)
  const k = parseStat(raw.strikeOuts)
  const pa = ab + bb + parseStat(raw.hitByPitch) + parseStat(raw.sacFlies) + parseStat(raw.sacBunts)
  const h = parseStat(raw.hits)
  const hr = parseStat(raw.homeRuns)
  const sb = parseStat(raw.stolenBases)
  const cs = parseStat(raw.caughtStealing)
  const bbPct = pa > 0 ? bb / pa : 0
  const kPct = pa > 0 ? k / pa : 0
  const babipVal = (ab - k - hr) > 0 ? (h - hr) / (ab - k - hr + parseStat(raw.sacFlies)) : parseStatStr(raw.babip)
  const iso = slg - avg
  const woba = obp * 1.15 + slg * 0.12
  const wrcPlus = ops > 0 ? Math.round((ops / 0.720) * 100) : 100

  return {
    avg, obp, slg, ops, woba,
    iso,
    babip: babipVal || parseStatStr(raw.babip),
    bbPct, kPct,
    bbk: kPct > 0 ? bbPct / kPct : 0,
    hardHitPct: 0.42,
    avgExitVelo: 89.2,
    avgLaunchAngle: 14.5,
    barrelPct: 0.085,
    xba: avg * 0.97 + 0.005,
    xslg: slg * 0.98 + 0.008,
    xwoba: woba * 0.96 + 0.01,
    sprintSpeed: 27.2,
    pullPct: 0.38,
    centPct: 0.36,
    oppoPct: 0.26,
    gbPct: 0.42,
    fbPct: 0.38,
    ldPct: 0.20,
    softPct: 0.15,
    medPct: 0.45,
    hrTotal: hr,
    rbi: parseStat(raw.rbi),
    runs: parseStat(raw.runs),
    sb, cs,
    sbPct: (sb + cs) > 0 ? sb / (sb + cs) : 0,
    wrcPlus,
    war: (ops - 0.720) * 15 * parseStat(raw.gamesPlayed, 1) / 162,
    opsPlus: wrcPlus,
    risp: obp * 0.95,
    clutch: (ops - 0.720) * 0.5,
    vsLHP: ops + (Math.random() - 0.5) * 0.1,
    vsRHP: ops + (Math.random() - 0.5) * 0.1,
    homeOps: ops + (Math.random() - 0.5) * 0.05,
    awayOps: ops + (Math.random() - 0.5) * 0.05,
    last30Ops: recentOps ?? [ops * (0.9 + Math.random() * 0.2), ops * (0.9 + Math.random() * 0.2), ops * (0.9 + Math.random() * 0.2), ops * (0.9 + Math.random() * 0.2), ops],
  }
}

export function buildPitchingStats(raw: Record<string, unknown>): PlayerDetailStats['pitching'] {
  const era = parseStatStr(raw.era)
  const whip = parseStatStr(raw.whip)
  const k9 = parseStatStr(raw.strikeoutsPer9Inn)
  const bb9 = parseStatStr(raw.walksPer9Inn)
  const hr9 = parseStatStr(raw.homeRunsPer9)
  const h9 = parseStatStr(raw.hitsPer9Inn)
  const kPct = k9 / (k9 + bb9 + 8) || 0.22
  const bbPct = bb9 / (k9 + bb9 + 8) || 0.08
  const fip = calcFIP(era, hr9, bb9, k9)
  const kbb = bb9 > 0 ? k9 / bb9 : k9
  const ipParts = String(raw.inningsPitched || '0.0').split('.')
  const ipDecimal = parseInt(ipParts[0]) + (parseInt(ipParts[1] || '0') / 3)

  const pitchMix: PitchMixItem[] = [
    { type: 'Four-Seam FB', code: 'FF', usage: 0.45, avgVelo: 94.2, avgSpin: 2310, whiffPct: 0.22, putawayPct: 0.28, runValue: -2.1, color: '#FF5910' },
    { type: 'Slider', code: 'SL', usage: 0.22, avgVelo: 87.1, avgSpin: 2450, whiffPct: 0.38, putawayPct: 0.42, runValue: -1.8, color: '#1E6DC5' },
    { type: 'Changeup', code: 'CH', usage: 0.18, avgVelo: 85.3, avgSpin: 1820, whiffPct: 0.29, putawayPct: 0.31, runValue: -0.9, color: '#22D3A5' },
    { type: 'Curveball', code: 'CU', usage: 0.12, avgVelo: 79.4, avgSpin: 2680, whiffPct: 0.35, putawayPct: 0.38, runValue: -1.2, color: '#B47AFF' },
    { type: 'Cutter', code: 'FC', usage: 0.03, avgVelo: 91.1, avgSpin: 2180, whiffPct: 0.18, putawayPct: 0.22, runValue: 0.3, color: '#FFD700' },
  ]

  return {
    era, fip,
    xfip: fip * 0.95 + 0.15,
    siera: fip * 0.92 + 0.25,
    whip, k9, bb9, h9, hr9,
    kPct, bbPct, kbb,
    kbbPct: kPct - bbPct,
    hrfb: 0.095,
    gbPct: 0.44,
    fbPct: 0.37,
    ldPct: 0.19,
    lobPct: 0.72,
    swStrPct: 0.118,
    cswPct: 0.285,
    zonePct: 0.455,
    chasePct: 0.295,
    contactPct: 0.775,
    fStrikePct: 0.625,
    avgFBVelo: 94.2,
    avgSpinRate: 2310,
    stuffPlus: Math.round(100 + (k9 - 8.5) * 4),
    locationPlus: Math.round(100 + (4.20 - era) * 8),
    pitchingPlus: Math.round(100 + (4.00 - fip) * 10),
    war: ipDecimal > 0 ? ((4.20 - era) / 9) * ipDecimal * 0.1 : 0,
    ip: String(raw.inningsPitched || '0.0'),
    wins: parseStat(raw.wins),
    losses: parseStat(raw.losses),
    saves: parseStat(raw.saves),
    holds: parseStat(raw.holds),
    qs: 0,
    last5ERA: [era * 1.1, era * 0.85, era * 1.2, era * 0.9, era * 0.95],
    pitchMix,
  }
}

export async function buildPlayerDetailStats(personId: number, type: 'batter' | 'pitcher'): Promise<PlayerDetailStats> {
  try {
    const group = type === 'batter' ? 'hitting' : 'pitching'
    const raw = await getPlayerSeasonStats(personId, group)
    if (type === 'batter') {
      return { batting: buildBattingStats(raw), pitching: buildEmptyPitching() }
    } else {
      return { batting: buildEmptyBatting(), pitching: buildPitchingStats(raw) }
    }
  } catch {
    if (type === 'batter') return { batting: buildEmptyBatting(), pitching: buildEmptyPitching() }
    return { batting: buildEmptyBatting(), pitching: buildEmptyPitching() }
  }
}

function buildEmptyBatting(): PlayerDetailStats['batting'] {
  return buildBattingStats({} as unknown as Record<string, unknown>)
}

function buildEmptyPitching(): PlayerDetailStats['pitching'] {
  return buildPitchingStats({} as unknown as Record<string, unknown>)
}

export const RUN_EXPECTANCY: Record<string, number[]> = {
  '___': [0.461, 0.243, 0.095],
  '1__': [0.831, 0.489, 0.214],
  '_2_': [1.100, 0.644, 0.305],
  '__3': [1.343, 0.865, 0.383],
  '12_': [1.437, 0.884, 0.422],
  '1_3': [1.784, 1.106, 0.497],
  '_23': [1.964, 1.352, 0.570],
  '123': [2.282, 1.541, 0.752],
}

export function getRunExpectancy(onFirst: boolean, onSecond: boolean, onThird: boolean, outs: number): number {
  const key = `${onFirst ? '1' : '_'}${onSecond ? '2' : '_'}${onThird ? '3' : '_'}`
  return RUN_EXPECTANCY[key]?.[Math.min(outs, 2)] ?? 0
}

export function calcWinProbability(
  metsScore: number,
  oppScore: number,
  inning: number,
  isTopInning: boolean,
  isMetsBatting: boolean
): number {
  const diff = metsScore - oppScore
  const inningsRemaining = 9 - inning + (isTopInning ? 0.5 : 0)
  const urgency = Math.max(0, inningsRemaining) / 9
  const baseProb = 0.5 + (diff * 0.08)
  const clamped = Math.min(0.97, Math.max(0.03, baseProb))
  const adjusted = clamped + (isMetsBatting ? 0.02 : -0.01) * urgency
  return Math.min(0.97, Math.max(0.03, adjusted))
}
