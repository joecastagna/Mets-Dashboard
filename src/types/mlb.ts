import type { RealBattingStats, RealPitchingStats, ScheduleGame, MLBPerson, ScoringPlay } from '../utils/mlbApi'

export type GameMode = 'live-batting' | 'live-pitching' | 'pregame' | 'postgame' | 'off-day'

// ─── Live feed types ──────────────────────────────────────────────────────────

export interface PitchCoords { pX: number; pZ: number; pfxX?: number; pfxZ?: number }
export interface PitchData {
  startSpeed: number; endSpeed?: number
  strikeZoneTop?: number; strikeZoneBottom?: number
  coordinates?: PitchCoords
  breaks?: { breakAngle?: number; breakLength?: number; breakVertical?: number; breakHorizontal?: number; spinRate?: number }
  zone?: number; extension?: number
}
export interface HitData {
  launchSpeed?: number; launchAngle?: number; totalDistance?: number
  trajectory?: string; hardness?: string; location?: string
}
export interface PlayEvent {
  details: {
    type?: { code: string; description: string }
    call?: { code: string; description: string }
    description?: string; isStrike?: boolean; isBall?: boolean; isOut?: boolean; isInPlay?: boolean
  }
  count: { balls: number; strikes: number; outs: number }
  index: number; isPitch: boolean; type: string
  pitchData?: PitchData; hitData?: HitData
}
export interface CurrentPlay {
  result: { type: string; event?: string; eventType?: string; description?: string; rbi?: number; awayScore?: number; homeScore?: number }
  about: { atBatIndex: number; halfInning: 'top' | 'bottom'; isTopInning: boolean; inning: number; isScoringPlay?: boolean }
  count: { balls: number; strikes: number; outs: number }
  matchup: {
    batter: MLBPerson; batSide: { code: 'L' | 'R' | 'S' }
    pitcher: MLBPerson; pitchHand: { code: 'L' | 'R' }
    postOnFirst?: MLBPerson | null; postOnSecond?: MLBPerson | null; postOnThird?: MLBPerson | null
  }
  runners?: Array<{ movement: { originBase: string | null; end: string | null; isOut: boolean }; details: { runner: MLBPerson } }>
  playEvents?: PlayEvent[]
}
export interface LinescoreInning {
  num: number; ordinalNum: string
  home: { runs?: number; hits: number; errors: number }
  away: { runs?: number; hits: number; errors: number }
}
export interface Linescore {
  currentInning: number; currentInningOrdinal: string; inningHalf: string; isTopInning: boolean
  scheduledInnings: number; innings: LinescoreInning[]
  teams: { home: { runs: number; hits: number; errors: number }; away: { runs: number; hits: number; errors: number } }
  defense?: { pitcher?: MLBPerson }
  offense?: { batter?: MLBPerson; onFirst?: MLBPerson; onSecond?: MLBPerson; onThird?: MLBPerson }
  balls?: number; strikes?: number; outs?: number
}
export interface LiveGameFeed {
  gamePk: number
  gameData: {
    game: { pk: number; season: string }
    datetime: { dateTime: string; officialDate: string; dayNight: string; time: string; ampm: string }
    status: { abstractGameState: string; codedGameState: string; detailedState: string; startTimeTBD: boolean }
    teams: {
      away: { id: number; name: string; abbreviation: string; teamName: string; locationName: string; record?: { wins: number; losses: number; pct: string } }
      home: { id: number; name: string; abbreviation: string; teamName: string; locationName: string; record?: { wins: number; losses: number; pct: string } }
    }
    players: Record<string, MLBPerson & { primaryPosition?: { abbreviation: string; name: string } }>
    venue: { id: number; name: string }
    weather?: { condition: string; temp: string; wind: string }
    probablePitchers?: { away?: MLBPerson; home?: MLBPerson }
  }
  liveData: {
    plays: { currentPlay?: CurrentPlay; allPlays?: CurrentPlay[]; scoringPlays?: number[] }
    linescore: Linescore
    boxscore: {
      teams: {
        home: { team: { id: number }; players: Record<string, { person: MLBPerson; stats?: Record<string, unknown> }>; batters: number[]; pitchers: number[] }
        away: { team: { id: number }; players: Record<string, { person: MLBPerson; stats?: Record<string, unknown> }>; batters: number[]; pitchers: number[] }
      }
    }
    decisions?: { winner?: { person: MLBPerson }; loser?: { person: MLBPerson }; save?: { person: MLBPerson } }
  }
}

// ─── App-level state ──────────────────────────────────────────────────────────

export interface LineupPlayerWithStats {
  person: MLBPerson
  position: { abbreviation: string }
  battingOrder?: number
  stats?: RealBattingStats
}

export interface GamePlayerWithStats {
  person: MLBPerson
  position?: { abbreviation: string }
  battingOrder?: number
  gameStats: {
    batting?: { ab?: number; r?: number; h?: number; rbi?: number; bb?: number; k?: number; hr?: number; sb?: number }
    pitching?: { ip?: string; h?: number; r?: number; er?: number; bb?: number; k?: number; hr?: number; numberOfPitches?: number; era?: string }
  }
  seasonStats?: RealBattingStats | RealPitchingStats
}

export interface PitcherInfo {
  person: MLBPerson
  stats?: RealPitchingStats
}

export interface PreGameData {
  nextGame: ScheduleGame
  metsStarter?: PitcherInfo
  oppStarter?: PitcherInfo
  metsLineup: LineupPlayerWithStats[]
}

export interface PostGameData {
  game: ScheduleGame
  metsIsHome: boolean
  metsScore: number
  oppScore: number
  metsWon: boolean
  metsBatters: GamePlayerWithStats[]
  metsPitchers: GamePlayerWithStats[]
  scoringPlays: ScoringPlay[]
}

export interface GameState {
  mode: GameMode
  game?: LiveGameFeed
  lastGame?: ScheduleGame
  nextGame?: ScheduleGame
  preGameData?: PreGameData
  postGameData?: PostGameData
  currentBatterStats?: RealBattingStats
  currentPitcherStats?: RealPitchingStats
  isLoading: boolean
  error?: string
  lastUpdated?: Date
  isMetsBatting?: boolean
}
