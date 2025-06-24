import { useMemo, useState } from 'react';
import { Player, Match, Training, PlayerStats } from '../types';
import { Trophy, Target, Users, Calendar, TrendingUp, Award, BarChart3, BarChart2, FileText, Shield, Repeat, UserCheck, Info } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface StatsOverviewProps {
  players: Player[];
  matches: Match[];
  trainings: Training[];
  playerStats: PlayerStats[];
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

  // --- Nuove metriche avanzate ---
  // Estrai eventi da tutte le partite concluse
  const allEvents = useMemo(() => finishedMatches.flatMap(m => m.events || []), [finishedMatches]);
  const allSubs = useMemo(() => finishedMatches.flatMap(m => m.substitutions || []), [finishedMatches]);

  // Ammonizioni/Espulsioni
  const cardTypes = ['yellow-card','red-card','second-yellow-card','blue-card','expulsion','warning'];
  const allCards = allEvents.filter(e => cardTypes.includes(e.type));
  const totalCards = allCards.length;
  const totalReds = allCards.filter(e => e.type === 'red-card' || e.type === 'expulsion').length;
  const totalYellows = allCards.filter(e => e.type === 'yellow-card' || e.type === 'second-yellow-card').length;
  const avgCardsPerMatch = finishedMatches.length > 0 ? (totalCards / finishedMatches.length).toFixed(2) : '0.00';

  // Sostituzioni
  const totalSubs = allSubs.length;
  const avgSubsPerMatch = finishedMatches.length > 0 ? (totalSubs / finishedMatches.length).toFixed(2) : '0.00';
  // Giocatori più sostituiti e che subentrano
  const subOutCount: Record<string, number> = {};
  const subInCount: Record<string, number> = {};
  allSubs.forEach(s => {
    subOutCount[s.playerOut] = (subOutCount[s.playerOut] || 0) + 1;
    subInCount[s.playerIn] = (subInCount[s.playerIn] || 0) + 1;
  });
  const mostSubbedOut = Object.entries(subOutCount)
    .sort((a,b) => b[1]-a[1])
    .slice(0,3)
    .map(([id,count]) => ({ player: players.find(p=>p.id===id), count }));
  const mostSubbedIn = Object.entries(subInCount)
    .sort((a,b) => b[1]-a[1])
    .slice(0,3)
    .map(([id,count]) => ({ player: players.find(p=>p.id===id), count }));

  // Statistiche per ruolo
  const roleStats = useMemo(() => {
    const roles: Record<string, { goals: number; matches: number; yellows: number; reds: number }> = {};
    players.forEach(p => {
      if (!roles[p.position]) roles[p.position] = { goals: 0, matches: 0, yellows: 0, reds: 0 };
    });
    playerStats.forEach(stat => {
      const player = players.find(p => p.id === stat.playerId);
      if (player && roles[player.position]) {
        roles[player.position].goals += stat.goals;
        roles[player.position].matches += stat.matchesPlayed;
        roles[player.position].yellows += stat.yellowCards;
        roles[player.position].reds += stat.redCards;
      }
    });
    return roles;
  }, [players, playerStats]);

  // --- Trend stagionale: risultati, gol, ammonizioni per partita ---
  const trendData = useMemo(() => {
    const sorted = [...finishedMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const labels = sorted.map(m => m.date.replace(/\d{4}-/g, ''));
    const goalsFor = sorted.map(m => (m.homeAway === 'home' ? m.homeScore : m.awayScore));
    const goalsAgainst = sorted.map(m => (m.homeAway === 'home' ? m.awayScore : m.homeScore));
    const cardsPerMatch = sorted.map(m => (m.events ? m.events.filter(e => cardTypes.includes(e.type)).length : 0));
    const results = sorted.map(m => {
      const our = m.homeAway === 'home' ? m.homeScore : m.awayScore;
      const their = m.homeAway === 'home' ? m.awayScore : m.homeScore;
      if (our > their) return 3;
      if (our === their) return 1;
      return 0;
    });
    return { labels, goalsFor, goalsAgainst, cardsPerMatch, results };
  }, [finishedMatches]);

  // Chart.js data
  const lineChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Gol Fatti',
        data: trendData.goalsFor,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Gol Subiti',
        data: trendData.goalsAgainst,
        borderColor: 'rgb(220, 38, 38)',
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Ammonizioni/Partita',
        data: trendData.cardsPerMatch,
        borderColor: 'rgb(202, 138, 4)',
        backgroundColor: 'rgba(202, 138, 4, 0.2)',
        yAxisID: 'y2',
        tension: 0.3,
      },
      {
        label: 'Risultato (3=V,1=P,0=S)',
        data: trendData.results,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        yAxisID: 'y3',
        tension: 0.1,
        pointStyle: 'rectRounded',
      },
    ],
  };
  // Fix Chart.js interaction.mode type (all values must be valid union types)
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Andamento Stagionale' },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Gol' } },
      y2: { beginAtZero: true, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'Ammonizioni' } },
      y3: { beginAtZero: true, position: 'right' as const, grid: { drawOnChartArea: false }, min: 0, max: 3, title: { display: true, text: 'Risultato' } },
    },
  } as const;

  // --- Esportazione globale ---
  const [showExport, setShowExport] = useState(false);
  const handleExportStats = (format: 'pdf' | 'csv' | 'xlsx') => {
    setShowExport(false);
    // TODO: implementare esportazione globale delle statistiche (riassunto, trend, tabelle)
    // Puoi riutilizzare la logica di ReportMatch per esportazione, adattando i dati globali
    alert('Esportazione '+format+' delle statistiche non ancora implementata.');
  };

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

  // --- GRAFICO GOAL PER PARTITA (ORDINE CRONOLOGICO NELL'ANNO SELEZIONATO) ---
  // Trova l'anno più recente con almeno una partita
  const allYears = Array.from(new Set(finishedMatches.map(m => new Date(m.date).getFullYear()))).sort((a, b) => b - a);
  const selectedYear = allYears[0]?.toString();
  const matchesOfYear = finishedMatches
    .filter(m => new Date(m.date).getFullYear().toString() === selectedYear)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const matchLabels = matchesOfYear.map((_, i) => `Partita ${i + 1}`);
  const goalsForEachMatch = matchesOfYear.map(m => m.homeAway === 'home' ? m.homeScore : m.awayScore);
  const goalsAgainstEachMatch = matchesOfYear.map(m => m.homeAway === 'home' ? m.awayScore : m.homeScore);
  const goalsChartDataSingle = {
    labels: matchLabels,
    datasets: [
      {
        label: 'Goal Fatti',
        data: goalsForEachMatch,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: 'rgb(37, 99, 235)',
      },
      {
        label: 'Goal Subiti',
        data: goalsAgainstEachMatch,
        borderColor: 'rgb(220, 38, 38)',
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: 'rgb(220, 38, 38)',
      },
    ],
  };
  const goalsChartOptionsSingle = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Goal' } },
    },
  } as const;

  return (
    <div className="space-y-8">
      {/* Pulsante esportazione globale: rimosso per spostamento nell'header */}

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
          {/* Grafico goal segnati e subiti per partita */}
          {matchesOfYear.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-8 mt-8 relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-blue-700 text-lg">Goal segnati e subiti per partita ({selectedYear})</span>
                <span data-tooltip-id="goals-tip" className="ml-1 cursor-pointer"><Info className="w-4 h-4 text-gray-400" /></span>
                <ReactTooltip id="goals-tip" place="top" content="Numero di goal segnati e subiti per ciascuna partita, asse X = ordine cronologico delle partite." />
              </div>
              <Line data={goalsChartDataSingle} options={goalsChartOptionsSingle} height={120} />
            </div>
          )}
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

      {/* Statistiche Avanzate */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-yellow-600" />
          Fair Play & Sostituzioni
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Shield}
            title="Ammonizioni"
            value={totalYellows}
            subtitle={`Media: ${avgCardsPerMatch}/partita`}
            color="bg-yellow-400"
          />
          <StatCard
            icon={Shield}
            title="Espulsioni"
            value={totalReds}
            subtitle={totalReds > 0 ? `Totale: ${totalReds}` : undefined}
            color="bg-red-600"
          />
          <StatCard
            icon={Repeat}
            title="Sostituzioni"
            value={totalSubs}
            subtitle={`Media: ${avgSubsPerMatch}/partita`}
            color="bg-blue-400"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Più sostituiti
            </h3>
            <ul className="space-y-2">
              {mostSubbedOut.map(({player,count}) => player && (
                <li key={player.id} className="flex justify-between items-center">
                  <span>{player.firstName} {player.lastName} <span className="text-xs text-gray-500">#{player.jerseyNumber}</span></span>
                  <span className="font-bold text-red-600">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              Più subentrati
            </h3>
            <ul className="space-y-2">
              {mostSubbedIn.map(({player,count}) => player && (
                <li key={player.id} className="flex justify-between items-center">
                  <span>{player.firstName} {player.lastName} <span className="text-xs text-gray-500">#{player.jerseyNumber}</span></span>
                  <span className="font-bold text-green-600">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* Statistiche per ruolo */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-purple-600" />
          Statistiche per Ruolo
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow-md">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Ruolo</th>
                <th className="px-4 py-2 text-center">Goal</th>
                <th className="px-4 py-2 text-center">Presenze</th>
                <th className="px-4 py-2 text-center">Gialli</th>
                <th className="px-4 py-2 text-center">Rossi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(roleStats).map(([role, stats]) => (
                <tr key={role} className="border-b">
                  <td className="px-4 py-2 font-medium">{role}</td>
                  <td className="px-4 py-2 text-center">{stats.goals}</td>
                  <td className="px-4 py-2 text-center">{stats.matches}</td>
                  <td className="px-4 py-2 text-center">{stats.yellows}</td>
                  <td className="px-4 py-2 text-center">{stats.reds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}