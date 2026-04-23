const BASE = 'https://statsapi.mlb.com/api'
export const METS_ID = 121
export const SEASON = new Date().getFullYear()

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 30_000

async function fetchJSON<T>(url: string, ttl = CACHE_TTL): Promise<T> {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.ts < ttl) return cached.data as T
  const res = await fetch(url)
  if (!res.ok) throw new Error(`MLB ${res.status} ${url}`)
  const data = await res.json()
  cache.set(url, { data, ts: Date.now() })
  return data as T
}

export function parseNum(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') return undefined
  const n = typeof val === 'string' ? parseFloat(val) : Number(val)
  return isNaN(n) ? undefined : n
}

function firstSplit(stats: unknown): Record<string, unknown> {
  const arr = stats as Array<{ splits?: Array<{ stat?: Record<string, unknown> }> }>
  return arr?.[0]?.splits?.[0]?.stat ?? {}
}

async function fetchStatGroup(personId: number, statType: string, group: string): Promise<Record<string, unknown>> {
  try {
    const data = await fetchJSON<{ stats: unknown[] }>(
      `${BASE}/v1/people/${personId}/stats?stats=${statType}&group=${group}&season=${SEASON}`
    )
    return firstSplit(data.stats)
  } catch {
    return {}
  }
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export interface TeamRecord { wins: number; losses: number; pct: string }

export interface ScheduleGame {
  gamePk: number
  gameDate: string
  officialDate: string
  status: { abstractGameState: string; codedGameState: string; detailedState: string; startTimeTBD: boolean }
  teams: {
    away: { team: MLBTeam; score?: number; isWinner?: boolean; leagueRecord?: TeamRecord }
    home: { team: MLBTeam; score?: number; isWinner?: boolean; leagueRecord?: TeamRecord }
  }
  venue: { id: number; name: string }
  dayNight: string
  seriesDescription?: string
  seriesGameNumber?: number
  gamesInSeries?: number
  probablePitchers?: { away?: MLBPerson; home?: MLBPerson }
}
export interface MLBTeam { id: number; name: string; abbreviation: string; teamName: string; locationName: string }
export interface MLBPerson { id: number; fullName: string; link: string; primaryPosition?: { abbreviation: string } }

export async function getTodaysGames(): Promise<ScheduleGame[]> {
  const today = new Date().toISOString().split('T')[0]
  const data = await fetchJSON<{ dates: Array<{ games: ScheduleGame[] }> }>(
    `${BASE}/v1/schedule?sportId=1&teamId=${METS_ID}&date=${today}&hydrate=linescore,team,probablePitcher`
  )
  return data.dates?.[0]?.games ?? []
}

export async function getLastGame(): Promise<ScheduleGame | null> {
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - 10)
  const data = await fetchJSON<{ dates: Array<{ games: ScheduleGame[] }> }>(
    `${BASE}/v1/schedule?sportId=1&teamId=${METS_ID}&startDate=${from.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}&hydrate=linescore,team&gameType=R`
  )
  const all = data.dates?.flatMap(d => d.games) ?? []
  const finished = all.filter(g => g.status.abstractGameState === 'Final' || g.status.codedGameState === 'F')
  return finished[finished.length - 1] ?? null
}

export async function getNextGame(): Promise<ScheduleGame | null> {
  const today = new Date()
  const until = new Date(today)
  until.setDate(until.getDate() + 14)
  const data = await fetchJSON<{ dates: Array<{ games: ScheduleGame[] }> }>(
    `${BASE}/v1/schedule?sportId=1&teamId=${METS_ID}&startDate=${today.toISOString().split('T')[0]}&endDate=${until.toISOString().split('T')[0]}&hydrate=team,probablePitcher&gameType=R`
  )
  const all = data.dates?.flatMap(d => d.games) ?? []
  return all.find(g =>
    g.status.abstractGameState === 'Preview' ||
    g.status.codedGameState === 'S' ||
    g.status.codedGameState === 'P'
  ) ?? null
}

// ─── Live feed ───────────────────────────────────────────────────────────────

export async function getLiveGame(gamePk: number) {
  return fetchJSON<import('../types/mlb').LiveGameFeed>(`${BASE}/v1.1/game/${gamePk}/feed/live`, 15_000)
}

// ─── Player stats ─────────────────────────────────────────────────────────────

export interface RealBattingStats {
  // Basic
  avg?: number; obp?: number; slg?: number; ops?: number
  hr?: number; rbi?: number; runs?: number; hits?: number
  doubles?: number; triples?: number
  sb?: number; cs?: number; bb?: number; k?: number
  ab?: number; pa?: number; hitByPitch?: number; sacFlies?: number
  gamesPlayed?: number; babip?: number

  // Sabermetrics (MLB Stats API)
  woba?: number; wrcPlus?: number
  kPct?: number; bbPct?: number
  iso?: number // derived from real slg - avg

  // Expected / Statcast (MLB Stats API expectedStatistics group)
  xba?: number; xslg?: number; xwoba?: number; xobp?: number
  exitVelo?: number; launchAngle?: number
  barrelPct?: number; hardHitPct?: number
}

export interface RealPitchingStats {
  // Basic
  era?: number; whip?: number; wins?: number; losses?: number; saves?: number; holds?: number
  ip?: string; hits?: number; runs?: number; earnedRuns?: number
  hr?: number; bb?: number; k?: number; gamesPlayed?: number; gamesStarted?: number

  // Rate stats (derived from real numbers)
  k9?: number; bb9?: number; h9?: number; hr9?: number; kbb?: number

  // Sabermetrics (MLB Stats API)
  fip?: number; babip?: number
  kPct?: number; bbPct?: number
  lobPct?: number; hrfb?: number; gbToAir?: number

  // Expected (MLB Stats API)
  xera?: number; xba?: number; xslg?: number

  // Pitch arsenal (MLB Stats API pitchArsenal group)
  pitchMix?: RealPitchType[]
}

export interface RealPitchType {
  code: string
  name: string
  usage: number        // 0-1
  avgVelo?: number
  avgSpin?: number
  runValue?: number
  color: string
}

const PITCH_COLORS: Record<string, string> = {
  FF: '#FF5910', FT: '#FF7A3A', SI: '#FF8A50', FC: '#FFD700',
  SL: '#1E6DC5', ST: '#4488DD', SV: '#5599EE',
  CU: '#B47AFF', KC: '#9B5EE0', CS: '#7A4ACC',
  CH: '#22D3A5', FS: '#2AE8C0', FO: '#1AC8A8',
  KN: '#E8F4FD', EP: '#AAAAAA',
}

const PITCH_NAMES: Record<string, string> = {
  FF: 'Four-Seam FB', FT: 'Two-Seam FB', SI: 'Sinker', FC: 'Cutter',
  SL: 'Slider', ST: 'Sweeper', SV: 'Slurve',
  CU: 'Curveball', KC: 'Knuckle Curve', CS: 'Slow Curve',
  CH: 'Changeup', FS: 'Splitter', FO: 'Forkball',
  KN: 'Knuckleball', EP: 'Eephus',
}

export async function getPlayerBattingStats(personId: number): Promise<RealBattingStats> {
  const [basic, saber, expected] = await Promise.all([
    fetchStatGroup(personId, 'season', 'hitting'),
    fetchStatGroup(personId, 'sabermetrics', 'hitting'),
    fetchStatGroup(personId, 'expectedStatistics', 'hitting'),
  ])

  const avg = parseNum(basic.avg)
  const slg = parseNum(basic.slg)

  return {
    avg,
    obp: parseNum(basic.obp),
    slg,
    ops: parseNum(basic.ops),
    hr: parseNum(basic.homeRuns),
    rbi: parseNum(basic.rbi),
    runs: parseNum(basic.runs),
    hits: parseNum(basic.hits),
    doubles: parseNum(basic.doubles),
    triples: parseNum(basic.triples),
    sb: parseNum(basic.stolenBases),
    cs: parseNum(basic.caughtStealing),
    bb: parseNum(basic.baseOnBalls),
    k: parseNum(basic.strikeOuts),
    ab: parseNum(basic.atBats),
    pa: parseNum(basic.plateAppearances),
    hitByPitch: parseNum(basic.hitByPitch),
    sacFlies: parseNum(basic.sacFlies),
    gamesPlayed: parseNum(basic.gamesPlayed),
    babip: parseNum(saber.BABIP) ?? parseNum(basic.babip),

    woba: parseNum(saber.wOBA),
    wrcPlus: parseNum(saber.wRCPlus),
    kPct: parseNum(saber.strikeoutPercentage) != null
      ? parseNum(saber.strikeoutPercentage)! / 100 : undefined,
    bbPct: parseNum(saber.walkPercentage) != null
      ? parseNum(saber.walkPercentage)! / 100 : undefined,
    iso: avg != null && slg != null ? slg - avg : undefined,

    xba: parseNum(expected.xba),
    xslg: parseNum(expected.xslg),
    xwoba: parseNum(expected.xwoba),
    xobp: parseNum(expected.xobp),
    exitVelo: parseNum(expected.exit_velocity_avg) ?? parseNum(expected.launchSpeed),
    launchAngle: parseNum(expected.launch_angle_avg) ?? parseNum(expected.launchAngle),
    barrelPct: parseNum(expected.barrel),
    hardHitPct: parseNum(expected.hard_hit_percent) != null
      ? parseNum(expected.hard_hit_percent)! / 100 : undefined,
  }
}

export async function getPlayerPitchingStats(personId: number): Promise<RealPitchingStats> {
  const [basic, saber, expected, arsenal] = await Promise.all([
    fetchStatGroup(personId, 'season', 'pitching'),
    fetchStatGroup(personId, 'sabermetrics', 'pitching'),
    fetchStatGroup(personId, 'expectedStatistics', 'pitching'),
    fetchPitchArsenal(personId),
  ])

  const k = parseNum(basic.strikeOuts)
  const bb = parseNum(basic.baseOnBalls)
  const ipStr = String(basic.inningsPitched ?? '')
  const ip = parseFloat(ipStr.replace(/\.(\d)$/, (_, d) => `.${Math.round(parseInt(d) / 3 * 10)}`))

  return {
    era: parseNum(basic.era),
    whip: parseNum(basic.whip),
    wins: parseNum(basic.wins),
    losses: parseNum(basic.losses),
    saves: parseNum(basic.saves),
    holds: parseNum(basic.holds),
    ip: ipStr || undefined,
    hits: parseNum(basic.hits),
    runs: parseNum(basic.runs),
    earnedRuns: parseNum(basic.earnedRuns),
    hr: parseNum(basic.homeRuns),
    bb, k,
    gamesPlayed: parseNum(basic.gamesPlayed),
    gamesStarted: parseNum(basic.gamesStarted),

    k9: parseNum(basic.strikeoutsPer9Inn) ?? (ip > 0 && k != null ? (k / ip) * 9 : undefined),
    bb9: parseNum(basic.walksPer9Inn) ?? (ip > 0 && bb != null ? (bb / ip) * 9 : undefined),
    h9: parseNum(basic.hitsPer9Inn),
    hr9: parseNum(basic.homeRunsPer9),
    kbb: k != null && bb != null && bb > 0 ? k / bb : undefined,

    fip: parseNum(saber.fip),
    babip: parseNum(saber.BABIP),
    kPct: parseNum(saber.strikeoutPercentage) != null
      ? parseNum(saber.strikeoutPercentage)! / 100 : undefined,
    bbPct: parseNum(saber.walkPercentage) != null
      ? parseNum(saber.walkPercentage)! / 100 : undefined,
    lobPct: parseNum(saber.leftOnBasePercentage) != null
      ? parseNum(saber.leftOnBasePercentage)! / 100 : undefined,
    hrfb: parseNum(saber.homeRunsPerFlyball) != null
      ? parseNum(saber.homeRunsPerFlyball)! / 100 : undefined,
    gbToAir: parseNum(saber.groundOutsToAirOuts),

    xera: parseNum(expected.xera),
    xba: parseNum(expected.xba),
    xslg: parseNum(expected.xslg),

    pitchMix: arsenal,
  }
}

async function fetchPitchArsenal(personId: number): Promise<RealPitchType[]> {
  try {
    const data = await fetchJSON<{ stats: Array<{ splits: Array<{ stat: Record<string, unknown> }> }> }>(
      `${BASE}/v1/people/${personId}/stats?stats=pitchArsenal&group=pitching&season=${SEASON}&pitchArsenalOptions=avgSpeed,avgSpinRate,runValue`
    )
    const split = data.stats?.[0]?.splits?.[0]?.stat ?? {}
    const pitches: RealPitchType[] = []
    for (const [code, val] of Object.entries(split)) {
      if (typeof val !== 'object' || val === null) continue
      const p = val as Record<string, unknown>
      pitches.push({
        code,
        name: PITCH_NAMES[code] ?? code,
        usage: (parseNum(p.percentage) ?? 0) / 100,
        avgVelo: parseNum(p.avgSpeed),
        avgSpin: parseNum(p.avgSpinRate),
        runValue: parseNum(p.runValue),
        color: PITCH_COLORS[code] ?? '#8BAFC8',
      })
    }
    return pitches.sort((a, b) => b.usage - a.usage)
  } catch {
    return []
  }
}

// ─── Roster + lineup ──────────────────────────────────────────────────────────

export interface RosterPlayer {
  person: MLBPerson
  jerseyNumber?: string
  position: { abbreviation: string; name: string }
  status?: { code: string; description: string }
}

export async function getActiveRoster(teamId: number): Promise<RosterPlayer[]> {
  const data = await fetchJSON<{ roster: RosterPlayer[] }>(
    `${BASE}/v1/teams/${teamId}/roster?rosterType=active&season=${SEASON}&hydrate=person`
  )
  return data.roster ?? []
}

export interface LineupPlayer {
  person: MLBPerson
  position: { abbreviation: string }
  battingOrder?: number
}

export async function getGameLineup(gamePk: number, teamId: number): Promise<LineupPlayer[]> {
  try {
    const data = await fetchJSON<{
      dates: Array<{ games: Array<{ lineups?: { homePlayers?: LineupPlayer[]; awayPlayers?: LineupPlayer[] }; teams: { home: { team: { id: number } } } }> }>
    }>(`${BASE}/v1/schedule?gamePks=${gamePk}&hydrate=lineups`)
    const game = data.dates?.[0]?.games?.[0]
    if (!game?.lineups) return []
    const isHome = game.teams.home.team.id === teamId
    return isHome ? (game.lineups.homePlayers ?? []) : (game.lineups.awayPlayers ?? [])
  } catch {
    return []
  }
}

// Batch-fetch season stats for multiple players (hitting)
export async function getBatchBattingStats(personIds: number[]): Promise<Map<number, RealBattingStats>> {
  const map = new Map<number, RealBattingStats>()
  if (!personIds.length) return map
  await Promise.all(
    personIds.map(async id => {
      const stats = await getPlayerBattingStats(id)
      map.set(id, stats)
    })
  )
  return map
}

// Batch-fetch pitching stats
export async function getBatchPitchingStats(personIds: number[]): Promise<Map<number, RealPitchingStats>> {
  const map = new Map<number, RealPitchingStats>()
  await Promise.all(
    personIds.map(async id => {
      const stats = await getPlayerPitchingStats(id)
      map.set(id, stats)
    })
  )
  return map
}

// ─── Box score ────────────────────────────────────────────────────────────────

export interface GameBoxPlayer {
  person: MLBPerson
  position?: { abbreviation: string }
  battingOrder?: number
  stats: {
    batting?: {
      atBats?: number; runs?: number; hits?: number; rbi?: number
      baseOnBalls?: number; strikeOuts?: number; homeRuns?: number
      stolenBases?: number; avg?: string; obp?: string; slg?: string; ops?: string
    }
    pitching?: {
      inningsPitched?: string; hits?: number; runs?: number; earnedRuns?: number
      baseOnBalls?: number; strikeOuts?: number; homeRuns?: number
      numberOfPitches?: number; era?: string; whip?: string
    }
  }
  seasonStats?: {
    batting?: { avg?: string; obp?: string; slg?: string; ops?: string; homeRuns?: number; rbi?: number }
    pitching?: { era?: string; whip?: string; inningsPitched?: string; wins?: number; losses?: number }
  }
}

export interface BoxscoreTeam {
  team: MLBTeam
  players: Record<string, GameBoxPlayer>
  batters: number[]
  pitchers: number[]
  battingOrder: number[]
  teamStats: {
    batting?: { runs?: number; hits?: number; errors?: number }
    pitching?: { era?: string; strikeOuts?: number; baseOnBalls?: number }
  }
}

export interface FullBoxscore {
  teams: { home: BoxscoreTeam; away: BoxscoreTeam }
}

export async function getFullBoxscore(gamePk: number): Promise<FullBoxscore | null> {
  try {
    const data = await fetchJSON<{ teams: FullBoxscore['teams'] }>(
      `${BASE}/v1/game/${gamePk}/boxscore`
    )
    return { teams: data.teams }
  } catch {
    return null
  }
}

// ─── Scoring plays ────────────────────────────────────────────────────────────

export interface ScoringPlay {
  inning: number
  isTopInning: boolean
  description: string
  awayScore: number
  homeScore: number
}

export async function getScoringPlays(gamePk: number): Promise<ScoringPlay[]> {
  try {
    const data = await fetchJSON<{
      liveData: {
        plays: {
          scoringPlays: number[]
          allPlays: Array<{
            about: { inning: number; isTopInning: boolean; isScoringPlay?: boolean }
            result: { description?: string; awayScore?: number; homeScore?: number; event?: string }
          }>
        }
      }
    }>(`${BASE}/v1.1/game/${gamePk}/feed/live`)

    const allPlays = data.liveData?.plays?.allPlays ?? []
    const scoringIdxs = new Set(data.liveData?.plays?.scoringPlays ?? [])
    return allPlays
      .filter((_, i) => scoringIdxs.has(i))
      .map(p => ({
        inning: p.about.inning,
        isTopInning: p.about.isTopInning,
        description: p.result.description ?? p.result.event ?? '',
        awayScore: p.result.awayScore ?? 0,
        homeScore: p.result.homeScore ?? 0,
      }))
  } catch {
    return []
  }
}

// ─── Run expectancy / win probability (real formulas) ────────────────────────

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

export function calcWinProbability(mets: number, opp: number, inning: number, isTop: boolean, isMetsBatting: boolean): number {
  const diff = mets - opp
  const halfInningsLeft = Math.max(0, (9 - inning) * 2 + (isTop ? 1 : 0))
  const urgency = halfInningsLeft / 18
  const base = 0.5 + diff * (0.08 + (1 - urgency) * 0.06)
  const adj = base + (isMetsBatting ? 0.015 : -0.01) * urgency
  return Math.min(0.97, Math.max(0.03, adj))
}
