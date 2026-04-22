import { useState, useEffect, useCallback, useRef } from 'react'
import type { GameState, GameMode, ScheduleGame, PlayerDetailStats } from '../types/mlb'
import {
  getTodaysGames, getLiveGame, getLastGame, getNextGame,
  buildPlayerDetailStats, METS_ID, calcWinProbability
} from '../utils/mlbApi'

const LIVE_REFRESH_MS = 15_000
const PREGAME_REFRESH_MS = 60_000

function isLive(game: ScheduleGame): boolean {
  const { abstractGameState, codedGameState } = game.status
  return abstractGameState === 'Live' || codedGameState === 'I'
}

function isFinal(game: ScheduleGame): boolean {
  const { abstractGameState, codedGameState } = game.status
  return abstractGameState === 'Final' || codedGameState === 'F' || codedGameState === 'O'
}

function isPreview(game: ScheduleGame): boolean {
  const { abstractGameState, codedGameState } = game.status
  return abstractGameState === 'Preview' || codedGameState === 'S' || codedGameState === 'P'
}

export function useMLBGame(): GameState & { refresh: () => void } {
  const [state, setState] = useState<GameState>({
    mode: 'off-day',
    isLoading: true,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fetchingRef = useRef(false)

  const loadState = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    try {
      const todayGames = await getTodaysGames()
      const liveGame = todayGames.find(isLive)
      const finalGame = todayGames.find(isFinal)
      const previewGame = todayGames.find(isPreview)

      if (liveGame) {
        const feed = await getLiveGame(liveGame.gamePk)
        const ls = feed.liveData.linescore
        const currentPlay = feed.liveData.plays.currentPlay

        const metsIsHome = feed.gameData.teams.home.id === METS_ID
        const metsScore = metsIsHome ? ls.teams.home.runs : ls.teams.away.runs
        const oppScore = metsIsHome ? ls.teams.away.runs : ls.teams.home.runs
        const isTopInning = ls.isTopInning
        const isMetsBatting = metsIsHome ? !isTopInning : isTopInning

        let mode: GameMode = isMetsBatting ? 'live-batting' : 'live-pitching'

        const metsTeam = metsIsHome ? feed.liveData.boxscore.teams.home : feed.liveData.boxscore.teams.away
        let currentBatterStats: PlayerDetailStats | undefined
        let currentPitcherStats: PlayerDetailStats | undefined

        if (currentPlay) {
          const batterId = currentPlay.matchup.batter.id
          const pitcherId = currentPlay.matchup.pitcher.id
          const isBatterOnMets = batterId in (metsTeam.players ?? {}) ||
            metsTeam.batters?.includes(batterId)

          if (isMetsBatting) {
            currentBatterStats = await buildPlayerDetailStats(batterId, 'batter')
            currentPitcherStats = await buildPlayerDetailStats(pitcherId, 'pitcher')
          } else {
            currentBatterStats = await buildPlayerDetailStats(batterId, 'batter')
            currentPitcherStats = await buildPlayerDetailStats(pitcherId, 'pitcher')
          }
          void isBatterOnMets
        }

        const winProb = calcWinProbability(
          metsScore ?? 0, oppScore ?? 0,
          ls.currentInning, isTopInning, isMetsBatting
        )

        setState({
          mode,
          game: feed,
          isMetsBatting,
          currentBatterStats,
          currentPitcherStats,
          isLoading: false,
          lastUpdated: new Date(),
          metsBullpen: [],
        })

        void winProb
        return
      }

      if (finalGame) {
        const lastGame = await getLastGame()
        const nextGame = await getNextGame()
        setState({
          mode: 'postgame',
          lastGame: lastGame ?? undefined,
          nextGame: nextGame ?? undefined,
          isLoading: false,
          lastUpdated: new Date(),
        })
        return
      }

      if (previewGame) {
        const lastGame = await getLastGame()
        setState({
          mode: 'pregame',
          game: undefined,
          nextGame: previewGame,
          lastGame: lastGame ?? undefined,
          isLoading: false,
          lastUpdated: new Date(),
        })
        return
      }

      const lastGame = await getLastGame()
      const nextGame = await getNextGame()
      setState({
        mode: nextGame ? 'pregame' : 'off-day',
        lastGame: lastGame ?? undefined,
        nextGame: nextGame ?? undefined,
        isLoading: false,
        lastUpdated: new Date(),
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load game data',
      }))
    } finally {
      fetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    loadState()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loadState])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const isLiveMode = state.mode === 'live-batting' || state.mode === 'live-pitching'
    const delay = isLiveMode ? LIVE_REFRESH_MS : PREGAME_REFRESH_MS
    intervalRef.current = setInterval(loadState, delay)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.mode, loadState])

  return { ...state, refresh: loadState }
}
