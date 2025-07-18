import { useMemo } from 'react';
import { Player, Match, PlayerStats } from '../types';

export function usePlayerStats(players: Player[], matches: Match[]): PlayerStats[] {
  return useMemo(() => {
    const finishedMatches = matches.filter(m => m.status === 'finished');

    const statsMap: Record<string, PlayerStats> = {};
    players.forEach(p => {
      statsMap[p.id] = {
        playerId: p.id,
        goals: 0,
        matchesPlayed: 0,
        yellowCards: 0,
        redCards: 0,
        trainingAttendance: 0,
        totalTrainings: 0
      };
    });    finishedMatches.forEach(m => {
      // count goals per scorer in events
      m.events?.forEach(e => {
        if (e.type === 'goal' && e.description?.includes('(nostro)') && statsMap[e.playerId]) {
          statsMap[e.playerId].goals += 1;
        }
        if (['yellow-card','second-yellow-card'].includes(e.type) && statsMap[e.playerId]) {
          statsMap[e.playerId].yellowCards += 1;
        }
        if (['red-card','expulsion'].includes(e.type) && statsMap[e.playerId]) {
          statsMap[e.playerId].redCards += 1;
        }
      });// count appearances
      m.lineup.forEach(matchPlayer => {
        if (statsMap[matchPlayer.playerId]) statsMap[matchPlayer.playerId].matchesPlayed += 1;
      });
    });

    return Object.values(statsMap);
  }, [players, matches]);
}
