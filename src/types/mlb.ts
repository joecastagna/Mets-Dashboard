export type GameMode = 'live-batting' | 'live-pitching' | 'pregame' | 'postgame' | 'off-day'

export interface MLBTeam {
  id: number
  name: string
  abbreviation: string
  teamName: string
  locationName: string
}

export interface MLBPerson {
  id: number
  fullName: string
  link: string
}

export interface PitchCoords {
  pX: number
  pZ: number
  pfxX?: number
  pfxZ?: number
}

export interface PitchData {
  startSpeed: number
  endSpeed?: number
  strikeZoneTop?: number
  strikeZoneBottom?: number
  coordinates?: PitchCoords
  breaks?: {
    breakAngle?: number
    breakLength?: number
    breakVertical?: number
    breakHorizontal?: number
    spinRate?: number
  }
  zone?: number
  extension?: number
}

export interface HitData {
  launchSpeed?: number
  launchAngle?: number
  totalDistance?: number
  trajectory?: string
  hardness?: string
  location?: string
}

export interface PlayEvent {
  details: {
    type?: { code: string; description: string }
    call?: { code: string; description: string }
    description?: string
    isStrike?: boolean
    isBall?: boolean
    isOut?: boolean
    isInPlay?: boolean
  }
  count: { balls: number; strikes: number; outs: number }
  index: number
  isPitch: boolean
  type: string
  pitchData?: PitchData
  hitData?: HitData
}

export interface CurrentPlay {
  result: {
    type: string
    event?: string
    eventType?: string
    description?: string
    rbi?: number
    awayScore?: number
    homeScore?: number
  }
  about: {
    atBatIndex: number
    halfInning: 'top' | 'bottom'
    isTopInning: boolean
    inning: number
    startTime?: string
    isScoringPlay?: boolean
    hasOut?: boolean
    captivatingIndex?: number
  }
  count: { balls: number; strikes: number; outs: number }
  matchup: {
    batter: MLBPerson
    batSide: { code: 'L' | 'R' | 'S' }
    pitcher: MLBPerson
    pitchHand: { code: 'L' | 'R' }
    postOnFirst?: MLBPerson | null
    postOnSecond?: MLBPerson | null
    postOnThird?: MLBPerson | null
    splits?: {
      batter?: string
      pitcher?: string
      menOnBase?: string
    }
  }
  runners?: Array<{
    movement: { originBase: string | null; end: string | null; outBase: string | null; isOut: boolean }
    details: { event: string; runner: MLBPerson }
  }>
  playEvents?: PlayEvent[]
}

export interface LinescoreInning {
  num: number
  ordinalNum: string
  home: { runs?: number; hits: number; errors: number; leftOnBase?: number }
  away: { runs?: number; hits: number; errors: number; leftOnBase?: number }
}

export interface Linescore {
  currentInning: number
  currentInningOrdinal: string
  inningHalf: string
  isTopInning: boolean
  scheduledInnings: number
  innings: LinescoreInning[]
  teams: {
    home: { runs: number; hits: number; errors: number; leftOnBase?: number }
    away: { runs: number; hits: number; errors: number; leftOnBase?: number }
  }
  defense?: {
    pitcher?: MLBPerson
    catcher?: MLBPerson
    first?: MLBPerson
    second?: MLBPerson
    third?: MLBPerson
    shortstop?: MLBPerson
    left?: MLBPerson
    center?: MLBPerson
    right?: MLBPerson
  }
  offense?: {
    batter?: MLBPerson
    onDeck?: MLBPerson
    onFirst?: MLBPerson
    onSecond?: MLBPerson
    onThird?: MLBPerson
    battingOrder?: number
  }
  balls?: number
  strikes?: number
  outs?: number
}

export interface BoxscorePlayer {
  person: MLBPerson
  jerseyNumber?: string
  position?: { name: string; type: string; abbreviation: string; code: string }
  status?: { code: string; description: string }
  stats?: {
    batting?: {
      gamesPlayed?: number
      atBats?: number
      runs?: number
      hits?: number
      doubles?: number
      triples?: number
      homeRuns?: number
      rbi?: number
      stolenBases?: number
      strikeOuts?: number
      baseOnBalls?: number
      avg?: string
      obp?: string
      slg?: string
      ops?: string
    }
    pitching?: {
      gamesPlayed?: number
      inningsPitched?: string
      hits?: number
      runs?: number
      earnedRuns?: number
      baseOnBalls?: number
      strikeOuts?: number
      homeRuns?: number
      era?: string
      numberOfPitches?: number
      strikes?: number
      groundOuts?: number
      airOuts?: number
    }
    fielding?: {
      assists?: number
      putOuts?: number
      errors?: number
    }
  }
  seasonStats?: {
    batting?: SeasonBattingStats
    pitching?: SeasonPitchingStats
  }
}

export interface SeasonBattingStats {
  gamesPlayed: number
  atBats: number
  runs: number
  hits: number
  doubles: number
  triples: number
  homeRuns: number
  rbi: number
  stolenBases: number
  caughtStealing: number
  strikeOuts: number
  baseOnBalls: number
  intentionalWalks: number
  hitByPitch: number
  sacBunts: number
  sacFlies: number
  avg: string
  obp: string
  slg: string
  ops: string
  babip?: string
  atBatsPerHomeRun?: string
}

export interface SeasonPitchingStats {
  gamesPlayed: number
  gamesStarted: number
  wins: number
  losses: number
  saves: number
  saveOpportunities: number
  holds: number
  blownSaves: number
  inningsPitched: string
  hits: number
  runs: number
  earnedRuns: number
  homeRuns: number
  baseOnBalls: number
  strikeOuts: number
  whip: string
  era: string
  strikeoutWalkRatio?: string
  strikeoutsPer9Inn?: string
  walksPer9Inn?: string
  hitsPer9Inn?: string
  runsScoredPer9?: string
  homeRunsPer9?: string
}

export interface Boxscore {
  teams: {
    home: {
      team: MLBTeam
      teamStats: {
        batting?: SeasonBattingStats
        pitching?: SeasonPitchingStats
      }
      players: Record<string, BoxscorePlayer>
      batters: number[]
      pitchers: number[]
      bullpen: number[]
      bench: number[]
      battingOrder: number[]
      info: Array<{ title: string; fieldList: Array<{ label: string; value: string }> }>
      note: Array<{ label: string; value: string }>
    }
    away: {
      team: MLBTeam
      teamStats: {
        batting?: SeasonBattingStats
        pitching?: SeasonPitchingStats
      }
      players: Record<string, BoxscorePlayer>
      batters: number[]
      pitchers: number[]
      bullpen: number[]
      bench: number[]
      battingOrder: number[]
      info: Array<{ title: string; fieldList: Array<{ label: string; value: string }> }>
      note: Array<{ label: string; value: string }>
    }
  }
  officials?: Array<{ official: MLBPerson; officialType: string }>
  info?: Array<{ label: string; value: string }>
}

export interface LiveGameFeed {
  gamePk: number
  gameData: {
    game: { pk: number; season: string; type: string }
    datetime: { dateTime: string; originalDate: string; officialDate: string; dayNight: string; time: string; ampm: string }
    status: {
      abstractGameState: string
      codedGameState: string
      detailedState: string
      statusCode: string
      startTimeTBD: boolean
      abstractGameCode: string
    }
    teams: {
      away: MLBTeam & { record?: { wins: number; losses: number; pct: string } }
      home: MLBTeam & { record?: { wins: number; losses: number; pct: string } }
    }
    players: Record<string, MLBPerson & { currentTeam?: { id: number }; primaryPosition?: { code: string; name: string; type: string; abbreviation: string } }>
    venue: { id: number; name: string; link: string }
    weather?: { condition: string; temp: string; wind: string }
    gameInfo?: {
      attendance?: number
      gameDurationMinutes?: number
    }
    review?: {
      hasChallenges: boolean
      away: { used: number; remaining: number }
      home: { used: number; remaining: number }
    }
    flags?: {
      noHitter: boolean
      perfectGame: boolean
      awayTeamNoHitter: boolean
      awayTeamPerfectGame: boolean
      homeTeamNoHitter: boolean
      homeTeamPerfectGame: boolean
    }
    probablePitchers?: {
      away?: MLBPerson
      home?: MLBPerson
    }
  }
  liveData: {
    plays: {
      currentPlay?: CurrentPlay
      allPlays?: CurrentPlay[]
      scoringPlays?: number[]
      playsByInning?: Array<{
        startIndex: number
        endIndex: number
        top: number[]
        bottom: number[]
      }>
    }
    linescore: Linescore
    boxscore: Boxscore
    decisions?: {
      winner?: BoxscorePlayer
      loser?: BoxscorePlayer
      save?: BoxscorePlayer
    }
    leaders?: {
      hitDistance?: { label: string; value: string; leader: MLBPerson }
      hitSpeed?: { label: string; value: string; leader: MLBPerson }
      pitchSpeed?: { label: string; value: string; leader: MLBPerson }
    }
  }
}

export interface ScheduleGame {
  gamePk: number
  gameDate: string
  officialDate: string
  status: {
    abstractGameState: string
    codedGameState: string
    detailedState: string
    startTimeTBD: boolean
  }
  teams: {
    away: { team: MLBTeam; score?: number; isWinner?: boolean; leagueRecord?: { wins: number; losses: number; pct: string } }
    home: { team: MLBTeam; score?: number; isWinner?: boolean; leagueRecord?: { wins: number; losses: number; pct: string } }
  }
  venue: { id: number; name: string }
  dayNight: string
  seriesDescription?: string
  seriesGameNumber?: number
  gamesInSeries?: number
}

export interface PlayerDetailStats {
  batting: {
    avg: number
    obp: number
    slg: number
    ops: number
    woba: number
    iso: number
    babip: number
    bbPct: number
    kPct: number
    bbk: number
    hardHitPct: number
    avgExitVelo: number
    avgLaunchAngle: number
    barrelPct: number
    xba: number
    xslg: number
    xwoba: number
    sprintSpeed: number
    pullPct: number
    centPct: number
    oppoPct: number
    gbPct: number
    fbPct: number
    ldPct: number
    softPct: number
    medPct: number
    hrTotal: number
    rbi: number
    runs: number
    sb: number
    cs: number
    sbPct: number
    wrcPlus: number
    war: number
    opsPlus: number
    risp: number
    clutch: number
    vsLHP: number
    vsRHP: number
    homeOps: number
    awayOps: number
    last30Ops: number[]
  }
  pitching: {
    era: number
    fip: number
    xfip: number
    siera: number
    whip: number
    k9: number
    bb9: number
    h9: number
    hr9: number
    kPct: number
    bbPct: number
    kbb: number
    kbbPct: number
    hrfb: number
    gbPct: number
    fbPct: number
    ldPct: number
    lobPct: number
    swStrPct: number
    cswPct: number
    zonePct: number
    chasePct: number
    contactPct: number
    fStrikePct: number
    avgFBVelo: number
    avgSpinRate: number
    stuffPlus: number
    locationPlus: number
    pitchingPlus: number
    war: number
    ip: string
    wins: number
    losses: number
    saves: number
    holds: number
    qs: number
    last5ERA: number[]
    pitchMix: PitchMixItem[]
  }
}

export interface PitchMixItem {
  type: string
  code: string
  usage: number
  avgVelo: number
  avgSpin: number
  whiffPct: number
  putawayPct: number
  runValue: number
  color: string
}

export interface GameState {
  mode: GameMode
  game?: LiveGameFeed
  lastGame?: ScheduleGame
  nextGame?: ScheduleGame
  currentBatterStats?: PlayerDetailStats
  currentPitcherStats?: PlayerDetailStats
  isLoading: boolean
  error?: string
  lastUpdated?: Date
  isMetsBatting?: boolean
  metsBullpen?: BullpenArmStatus[]
}

export interface BullpenArmStatus {
  person: MLBPerson
  pitchCount?: number
  lastPitched?: string
  warmingUp?: boolean
  era?: string
  available?: boolean
}

export interface WinProbabilityPoint {
  inning: number
  halfInning: 'top' | 'bottom'
  homeWinProbability: number
  awayWinProbability: number
  metsWinProbability: number
  event?: string
}

export interface RunExpectancyMatrix {
  [baseState: string]: {
    [outs: number]: number
  }
}
