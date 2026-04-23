import { useState, useEffect, useCallback, useRef } from 'react'
import type { GameState, PreGameData, PostGameData, LineupPlayerWithStats, GamePlayerWithStats } from '../types/mlb'
import type { ScheduleGame } from '../utils/mlbApi'
import {
  getTodaysGames, getLiveGame, getLastGame, getNextGame,
  getPlayerBattingStats, getPlayerPitchingStats,
  getGameLineup, getFullBoxscore, getScoringPlays,
  calcWinProbability, METS_ID, parseNum,
} from '../utils/mlbApi'

const LIVE_REFRESH_MS   = 15_000
const STATIC_REFRESH_MS = 120_000

function isLive(g: ScheduleGame)    { return g.status.abstractGameState === 'Live'  || g.status.codedGameState === 'I' }
function isFinal(g: ScheduleGame)   { return g.status.abstractGameState === 'Final' || g.status.codedGameState === 'F' || g.status.codedGameState === 'O' }
function isPreview(g: ScheduleGame) { return g.status.abstractGameState === 'Preview' || g.status.codedGameState === 'S' || g.status.codedGameState === 'P' }

// ─── Pre-game loader ─────────────────────────────────────────────────────────

async function loadPreGameData(nextGame: ScheduleGame): Promise<PreGameData> {
  const metsIsHome = nextGame.teams.home.team.id === METS_ID

  // Probable pitchers from the schedule hydration
  const metsPitcherId   = metsIsHome ? nextGame.probablePitchers?.home?.id : nextGame.probablePitchers?.away?.id
  const oppPitcherId    = metsIsHome ? nextGame.probablePitchers?.away?.id : nextGame.probablePitchers?.home?.id
  const metsPitcherInfo = metsIsHome ? nextGame.probablePitchers?.home : nextGame.probablePitchers?.away
  const oppPitcherInfo  = metsIsHome ? nextGame.probablePitchers?.away : nextGame.probablePitchers?.home

  const [metsPitcherStats, oppPitcherStats] = await Promise.all([
    metsPitcherId ? getPlayerPitchingStats(metsPitcherId) : Promise.resolve(undefined),
    oppPitcherId  ? getPlayerPitchingStats(oppPitcherId)  : Promise.resolve(undefined),
  ])

  // Try to get today's lineup from the game; fall back to last game's lineup
  let lineupPlayers: LineupPlayerWithStats[] = []
  const lineupEntries = await getGameLineup(nextGame.gamePk, METS_ID)

  if (lineupEntries.length > 0) {
    const statsArr = await Promise.all(
      lineupEntries.map(p => getPlayerBattingStats(p.person.id))
    )
    lineupPlayers = lineupEntries.map((p, i) => ({
      person: p.person,
      position: p.position,
      battingOrder: p.battingOrder,
      stats: statsArr[i],
    }))
  } else {
    // Fall back: last game's batting order
    const lastGame = await getLastGame()
    if (lastGame) {
      const lastLineup = await getGameLineup(lastGame.gamePk, METS_ID)
      if (lastLineup.length > 0) {
        const statsArr = await Promise.all(
          lastLineup.map(p => getPlayerBattingStats(p.person.id))
        )
        lineupPlayers = lastLineup.map((p, i) => ({
          person: p.person,
          position: p.position,
          battingOrder: p.battingOrder,
          stats: statsArr[i],
        }))
      }
    }
  }

  return {
    nextGame,
    metsStarter: metsPitcherInfo
      ? { person: metsPitcherInfo, stats: metsPitcherStats }
      : undefined,
    oppStarter: oppPitcherInfo
      ? { person: oppPitcherInfo, stats: oppPitcherStats }
      : undefined,
    metsLineup: lineupPlayers,
  }
}

// ─── Post-game loader ────────────────────────────────────────────────────────

async function loadPostGameData(lastGame: ScheduleGame): Promise<PostGameData> {
  const metsIsHome = lastGame.teams.home.team.id === METS_ID
  const metsScore  = (metsIsHome ? lastGame.teams.home.score : lastGame.teams.away.score) ?? 0
  const oppScore   = (metsIsHome ? lastGame.teams.away.score : lastGame.teams.home.score) ?? 0

  const [boxscore, scoringPlays] = await Promise.all([
    getFullBoxscore(lastGame.gamePk),
    getScoringPlays(lastGame.gamePk),
  ])

  const metsSide  = metsIsHome ? boxscore?.teams.home : boxscore?.teams.away
  const batterIds  = metsSide?.batters  ?? []
  const pitcherIds = metsSide?.pitchers ?? []

  // Fetch season stats for Mets batters and pitchers in parallel
  const uniqueBatterIds  = batterIds
  const uniquePitcherIds = pitcherIds

  const [batterSeasonStats, pitcherSeasonStats] = await Promise.all([
    Promise.all(uniqueBatterIds.map(id => getPlayerBattingStats(id))),
    Promise.all(uniquePitcherIds.map(id => getPlayerPitchingStats(id))),
  ])

  const players = metsSide?.players ?? {}

  const metsBatters: GamePlayerWithStats[] = uniqueBatterIds.map((id, i) => {
    const p = players[`ID${id}`]
    const gameBat = p?.stats?.batting
    return {
      person: p?.person ?? { id, fullName: `Player ${id}`, link: '' },
      position: p?.position,
      battingOrder: i + 1,
      gameStats: {
        batting: gameBat ? {
          ab:  parseNum(gameBat.atBats),
          r:   parseNum(gameBat.runs),
          h:   parseNum(gameBat.hits),
          rbi: parseNum(gameBat.rbi),
          bb:  parseNum(gameBat.baseOnBalls),
          k:   parseNum(gameBat.strikeOuts),
          hr:  parseNum(gameBat.homeRuns),
          sb:  parseNum(gameBat.stolenBases),
        } : {},
      },
      seasonStats: batterSeasonStats[i],
    }
  })

  const metsPitchers: GamePlayerWithStats[] = uniquePitcherIds.map((id, i) => {
    const p = players[`ID${id}`]
    const gamePit = p?.stats?.pitching
    return {
      person: p?.person ?? { id, fullName: `Player ${id}`, link: '' },
      position: { abbreviation: 'P' },
      gameStats: {
        pitching: gamePit ? {
          ip:             gamePit.inningsPitched ? String(gamePit.inningsPitched) : undefined,
          h:              parseNum(gamePit.hits),
          r:              parseNum(gamePit.runs),
          er:             parseNum(gamePit.earnedRuns),
          bb:             parseNum(gamePit.baseOnBalls),
          k:              parseNum(gamePit.strikeOuts),
          hr:             parseNum(gamePit.homeRuns),
          numberOfPitches:parseNum(gamePit.numberOfPitches),
          era:            gamePit.era ? String(gamePit.era) : undefined,
        } : {},
      },
      seasonStats: pitcherSeasonStats[i],
    }
  })

  return {
    game: lastGame,
    metsIsHome,
    metsScore,
    oppScore,
    metsWon: metsScore > oppScore,
    metsBatters,
    metsPitchers,
    scoringPlays,
  }
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useMLBGame(): GameState & { refresh: () => void } {
  const [state, setState] = useState<GameState>({ mode: 'off-day', isLoading: true })
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const fetchingRef  = useRef(false)

  const loadState = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    try {
      const todayGames = await getTodaysGames()
      const liveGame   = todayGames.find(isLive)
      const finalGame  = todayGames.find(isFinal)
      const previewGame = todayGames.find(isPreview)

      // ── LIVE ───────────────────────────────────────────────────────────────
      if (liveGame) {
        const feed = await getLiveGame(liveGame.gamePk)
        const ls   = feed.liveData.linescore
        const cp   = feed.liveData.plays.currentPlay

        const metsIsHome    = feed.gameData.teams.home.id === METS_ID
        const metsScore     = metsIsHome ? ls.teams.home.runs : ls.teams.away.runs
        const oppScore      = metsIsHome ? ls.teams.away.runs : ls.teams.home.runs
        const isMetsBatting = metsIsHome ? !ls.isTopInning : ls.isTopInning

        let currentBatterStats  = undefined
        let currentPitcherStats = undefined

        if (cp) {
          const [bat, pit] = await Promise.all([
            getPlayerBattingStats(cp.matchup.batter.id),
            getPlayerPitchingStats(cp.matchup.pitcher.id),
          ])
          currentBatterStats  = bat
          currentPitcherStats = pit
        }

        void calcWinProbability(metsScore ?? 0, oppScore ?? 0, ls.currentInning, ls.isTopInning, isMetsBatting)

        setState({
          mode: isMetsBatting ? 'live-batting' : 'live-pitching',
          game: feed,
          isMetsBatting,
          currentBatterStats,
          currentPitcherStats,
          isLoading: false,
          lastUpdated: new Date(),
        })
        return
      }

      // ── POST-GAME ─────────────────────────────────────────────────────────
      if (finalGame || (!previewGame && !liveGame)) {
        const lastGame = finalGame ?? await getLastGame()
        const nextGame = await getNextGame()

        let postGameData: PostGameData | undefined
        if (lastGame) {
          try { postGameData = await loadPostGameData(lastGame) } catch (e) { console.error('loadPostGameData failed:', e) }
        }

        setState({
          mode: 'postgame',
          lastGame: lastGame ?? undefined,
          nextGame: nextGame ?? undefined,
          postGameData,
          isLoading: false,
          lastUpdated: new Date(),
        })
        return
      }

      // ── PRE-GAME ──────────────────────────────────────────────────────────
      if (previewGame) {
        const lastGame = await getLastGame()
        let preGameData: PreGameData | undefined
        let postGameData: PostGameData | undefined
        await Promise.all([
          (async () => { try { preGameData = await loadPreGameData(previewGame) } catch (e) { console.error('loadPreGameData failed:', e) } })(),
          (async () => { if (lastGame) try { postGameData = await loadPostGameData(lastGame) } catch (e) { console.error('loadPostGameData failed:', e) } })(),
        ])

        setState({
          mode: 'pregame',
          nextGame: previewGame,
          lastGame: lastGame ?? undefined,
          preGameData,
          postGameData,
          isLoading: false,
          lastUpdated: new Date(),
        })
        return
      }

      // ── OFF-DAY ───────────────────────────────────────────────────────────
      const [lastGame, nextGame] = await Promise.all([getLastGame(), getNextGame()])
      let postGameData: PostGameData | undefined
      if (lastGame) {
        try { postGameData = await loadPostGameData(lastGame) } catch (e) { console.error('loadPostGameData failed:', e) }
      }
      setState({
        mode: nextGame ? 'pregame' : 'off-day',
        lastGame: lastGame ?? undefined,
        nextGame: nextGame ?? undefined,
        postGameData,
        isLoading: false,
        lastUpdated: new Date(),
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load',
      }))
    } finally {
      fetchingRef.current = false
    }
  }, [])

  useEffect(() => { loadState() }, [loadState])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const isLiveMode = state.mode === 'live-batting' || state.mode === 'live-pitching'
    intervalRef.current = setInterval(loadState, isLiveMode ? LIVE_REFRESH_MS : STATIC_REFRESH_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state.mode, loadState])

  return { ...state, refresh: loadState }
}
