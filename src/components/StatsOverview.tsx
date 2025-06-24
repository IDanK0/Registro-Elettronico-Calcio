import React from 'react';
import { Player, Match, Training, PlayerStats } from '../types';
import { Trophy, Target, Users, Calendar, TrendingUp, Award, Clock, BarChart3 } from 'lucide-react';

interface StatsOverviewProps {
  players: Player[];
  matches: Match[];
  trainings: Training[];
  playerStats: PlayerStats[];
}

export function StatsOverview({ players, matches, trainings, playerStats }: StatsOverviewProps) {
  const finishedMatches = matches.filter(m => m.status === 'finished');
  const wins = finishedMatches.filter(m => {
    const ourScore = m.homeAway === 'home' ? m.homeScore : m.awayScore;
    const theirScore = m.homeAway === 'home' ? m.awayScore : m.homeScore;
    return ourScore > theirScore;
  }).length;

  const draws = finishedMatches.filter(m => {
    const ourScore = m.homeAway === 'home' ? m.homeScore : m.awayScore;
    const theirScore = m.homeAway === 'home' ? m.awayScore : m.homeScore;
    return ourScore === theirScore;
  }).length;

  const losses = finishedMatches.filter(m => {
    const ourScore = m.homeAway === 'home' ? m.homeScore : m.awayScore;
    const theirScore = m.homeAway === 'home' ? m.awayScore : m.homeScore;
    return ourScore < theirScore;
  }).length;

  const totalGoalsFor = finishedMatches.reduce((sum, m) => {
    const ourScore = m.homeAway === 'home' ? m.homeScore : m.awayScore;
    return sum + ourScore;
  }, 0);

  const totalGoalsAgainst = finishedMatches.reduce((sum, m) => {
    const theirScore = m.homeAway === 'home' ? m.awayScore : m.homeScore;
    return sum + theirScore;
  }, 0);

  const avgAttendance = trainings.length > 0 
    ? trainings.reduce((sum, t) => {
        const present = Object.values(t.attendances).filter(Boolean).length;
        const total = Object.keys(t.attendances).length;
        return sum + (total > 0 ? (present / total) * 100 : 0);
      }, 0) / trainings.length 
    : 0;

  const topScorers = playerStats
    .filter(stat => stat.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5)
    .map(stat => ({
      ...stat,
      player: players.find(p => p.id === stat.playerId)
    }))
    .filter(item => item.player);

  const mostActivePlaybers = playerStats
    .filter(stat => stat.matchesPlayed > 0)
    .sort((a, b) => b.matchesPlayed - a.matchesPlayed)
    .slice(0, 5)
    .map(stat => ({
      ...stat,
      player: players.find(p => p.id === stat.playerId)
    }))
    .filter(item => item.player);

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          <p className="text-gray-600 font-medium">{title}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Statistiche Generali */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Panoramica Generale
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="Giocatori Attivi"
            value={players.filter(p => p.isActive).length}
            color="bg-blue-600"
          />
          <StatCard
            icon={Target}
            title="Partite Giocate"
            value={finishedMatches.length}
            color="bg-green-600"
          />
          <StatCard
            icon={Calendar}
            title="Allenamenti"
            value={trainings.length}
            subtitle={`${avgAttendance.toFixed(0)}% presenza media`}
            color="bg-purple-600"
          />
          <StatCard
            icon={Trophy}
            title="Vittorie"
            value={wins}
            subtitle={`${draws}P ${losses}S`}
            color="bg-yellow-600"
          />
        </div>
      </div>

      {/* Statistiche Partite */}
      {finishedMatches.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-red-600" />
            Statistiche Partite
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Risultati</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-medium">Vittorie</span>
                  <span className="text-2xl font-bold text-green-600">{wins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-600 font-medium">Pareggi</span>
                  <span className="text-2xl font-bold text-yellow-600">{draws}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 font-medium">Sconfitte</span>
                  <span className="text-2xl font-bold text-red-600">{losses}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Gol</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-medium">Fatti</span>
                  <span className="text-2xl font-bold text-blue-600">{totalGoalsFor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 font-medium">Subiti</span>
                  <span className="text-2xl font-bold text-red-600">{totalGoalsAgainst}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Differenza</span>
                  <span className={`text-2xl font-bold ${
                    totalGoalsFor - totalGoalsAgainst > 0 ? 'text-green-600' : 
                    totalGoalsFor - totalGoalsAgainst < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {totalGoalsFor - totalGoalsAgainst > 0 ? '+' : ''}{totalGoalsFor - totalGoalsAgainst}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Medie</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-medium">Gol/Partita</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {finishedMatches.length > 0 ? (totalGoalsFor / finishedMatches.length).toFixed(1) : '0.0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 font-medium">Subiti/Partita</span>
                  <span className="text-2xl font-bold text-red-600">
                    {finishedMatches.length > 0 ? (totalGoalsAgainst / finishedMatches.length).toFixed(1) : '0.0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Players */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Capocannonieri */}
        {topScorers.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Capocannonieri
            </h3>
            <div className="space-y-3">
              {topScorers.map((item, index) => (
                <div key={item.playerId} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-yellow-700 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-800">
                        {item.player?.firstName} {item.player?.lastName}
                      </span>
                      <p className="text-xs text-gray-500">#{item.player?.jerseyNumber}</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{item.goals}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Giocatori più attivi */}
        {mostActivePlaybers.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Più Presenti
            </h3>
            <div className="space-y-3">
              {mostActivePlaybers.map((item, index) => (
                <div key={item.playerId} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-green-500 text-white' :
                      index === 1 ? 'bg-blue-500 text-white' :
                      index === 2 ? 'bg-purple-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-800">
                        {item.player?.firstName} {item.player?.lastName}
                      </span>
                      <p className="text-xs text-gray-500">
                        Presenza allenamenti: {item.totalTrainings > 0 ? Math.round((item.trainingAttendance / item.totalTrainings) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-green-600">{item.matchesPlayed}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}