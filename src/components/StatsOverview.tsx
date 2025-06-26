import { useMemo } from 'react';
import { Player, Match, Training, PlayerStats } from '../types';
import { Trophy, Target, Users, Calendar, Award, BarChart3, BarChart2, Shield, Info, TrendingUp, Repeat, UserCheck } from 'lucide-react';
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
import useIsMobile from '../hooks/useIsMobile';

interface StatsOverviewProps {
  players: Player[];
  matches: Match[];
  trainings: Training[];
  playerStats: PlayerStats[];
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function StatsOverview({ players, matches, trainings, playerStats }: StatsOverviewProps) {
  const isMobile = useIsMobile();

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
  // Filtra solo i cartellini dei giocatori del team
  const teamCards = allEvents.filter(e => cardTypes.includes(e.type) && players.some(p => p.id === e.playerId));  const totalReds = teamCards.filter(e => e.type === 'red-card' || e.type === 'expulsion').length;
  const totalYellows = teamCards.filter(e => e.type === 'yellow-card' || e.type === 'second-yellow-card').length;
  const avgCardsPerMatch = finishedMatches.length > 0 ? (teamCards.length / finishedMatches.length).toFixed(2) : '0.00';

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
  // Statistiche per ruolo - ora calcolate dalle partite
  const roleStats = useMemo(() => {
    const roles: Record<string, { goals: number; matches: number; yellows: number; reds: number }> = {};
    
    // Raccogli ruoli da tutte le partite
    finishedMatches.forEach(match => {
      match.lineup.forEach(matchPlayer => {
        if (!roles[matchPlayer.position]) {
          roles[matchPlayer.position] = { goals: 0, matches: 0, yellows: 0, reds: 0 };
        }
        roles[matchPlayer.position].matches += 1;
      });
      
      // Conta goal per ruolo
      match.events?.forEach(event => {
        if (event.type === 'goal' && event.description?.includes('(nostro)')) {
          const playerInMatch = match.lineup.find(mp => mp.playerId === event.playerId);
          if (playerInMatch && roles[playerInMatch.position]) {
            roles[playerInMatch.position].goals += 1;
          }
        }
        
        // Conta cartellini per ruolo
        if (['yellow-card','second-yellow-card'].includes(event.type)) {
          const playerInMatch = match.lineup.find(mp => mp.playerId === event.playerId);
          if (playerInMatch && roles[playerInMatch.position]) {
            roles[playerInMatch.position].yellows += 1;
          }
        }
        
        if (['red-card','expulsion'].includes(event.type)) {
          const playerInMatch = match.lineup.find(mp => mp.playerId === event.playerId);
          if (playerInMatch && roles[playerInMatch.position]) {
            roles[playerInMatch.position].reds += 1;
          }
        }
      });
    });
    
    return roles;  }, [finishedMatches]);

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
          {subtitle && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              {subtitle}
              {title === 'Vittorie' && (
                <span data-tooltip-id="vittorie-tip" className="ml-1 cursor-pointer"><Info className="w-4 h-4 text-gray-400" /></span>
              )}
              {title === 'Vittorie' && (
                <ReactTooltip id="vittorie-tip" place="top" content="P = Pareggi, S = Sconfitte. Esempio: 1P 2S significa 1 pareggio e 2 sconfitte." />
              )}
            </p>
          )}
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

  if (isMobile) {
    // Mobile specific components for better UI
    const StatCardMobile = ({ icon: Icon, label, value, colorClass }: { icon: React.ElementType, label: string, value: string | number, colorClass: string }) => (
      <div className="bg-white p-3 rounded-lg shadow flex items-center gap-3">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${colorClass}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    );

    const LeaderboardItem = ({ rank, player, stat, colorClass }: { rank: number, player: Player | undefined, stat: string | number, colorClass: string }) => (
      <li className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${colorClass}`}>{rank}</span>
          <span className="text-sm font-medium">{player?.firstName} {player?.lastName}</span>
        </div>
        <span className="text-sm font-bold">{stat}</span>
      </li>
    );

    return (
      <div className="p-2 bg-gray-50 min-h-screen font-sans">
        <div className="space-y-4">

          {/* General Overview */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600"/>Panoramica</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCardMobile icon={Users} label="Giocatori" value={players.filter(p => p.isActive).length} colorClass="bg-blue-500" />
              <StatCardMobile icon={Target} label="Partite" value={finishedMatches.length} colorClass="bg-green-500" />
              <StatCardMobile icon={Calendar} label="Allenamenti" value={trainings.length} colorClass="bg-purple-500" />
              <StatCardMobile icon={Trophy} label="Vittorie" value={wins} colorClass="bg-yellow-500" />
            </div>
          </div>

          {/* Match Stats */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-red-600"/>Statistiche Partite</h3>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-green-100 text-green-800 p-2 rounded-md">
                <p className="font-bold text-xl">{wins}</p><p className="text-xs">Vittorie</p>
              </div>
              <div className="bg-yellow-100 text-yellow-800 p-2 rounded-md">
                <p className="font-bold text-xl">{draws}</p><p className="text-xs">Pareggi</p>
              </div>
              <div className="bg-red-100 text-red-800 p-2 rounded-md">
                <p className="font-bold text-xl">{losses}</p><p className="text-xs">Sconfitte</p>
              </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                    <span className="font-medium text-gray-700">Gol Fatti / Subiti</span>
                    <span className="font-bold"><span className="text-blue-600">{totalGoalsFor}</span> / <span className="text-red-600">{totalGoalsAgainst}</span></span>
                </div>
                 <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                    <span className="font-medium text-gray-700">Differenza Reti</span>
                    <span className={`font-bold ${totalGoalsFor - totalGoalsAgainst >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalGoalsFor - totalGoalsAgainst > 0 ? '+' : ''}{totalGoalsFor - totalGoalsAgainst}</span>
                </div>
            </div>
          </div>

          {/* Leaderboards */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Award className="w-5 h-5 text-yellow-600"/>Leaderboard</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-md text-gray-800 mb-2">Capocannonieri</h4>
                <ul className="space-y-1.5">
                  {topScorers.map((item, index) => (
                    <LeaderboardItem key={item.playerId} rank={index + 1} player={item.player} stat={`${item.goals} Gol`} colorClass="bg-yellow-500" />
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-md text-gray-800 mb-2">Più Presenti</h4>
                <ul className="space-y-1.5">
                  {mostActivePlaybers.map((item, index) => (
                     <LeaderboardItem key={item.playerId} rank={index + 1} player={item.player} stat={`${item.matchesPlayed} Pres.`} colorClass="bg-green-500" />
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Fair Play & Subs */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-orange-500"/>Fair Play & Sostituzioni</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold">{totalYellows}</p>
                    <p className="text-xs font-medium">Gialli</p>
                </div>
                 <div className="bg-red-100 text-red-800 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold">{totalReds}</p>
                    <p className="text-xs font-medium">Rossi</p>
                </div>
            </div>
             <div className="space-y-3">
                <div>
                    <h4 className="font-semibold text-md text-gray-800 mb-2">Sostituzioni</h4>
                     <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                        <span className="font-medium text-gray-700">Più Sostituiti</span>
                        <span className="font-bold">{mostSubbedOut[0]?.player?.lastName || '-'} ({mostSubbedOut[0]?.count || 0})</span>
                    </div>
                     <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md mt-1">
                        <span className="font-medium text-gray-700">Più Subentrati</span>
                        <span className="font-bold">{mostSubbedIn[0]?.player?.lastName || '-'} ({mostSubbedIn[0]?.count || 0})</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Role Stats */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-purple-600"/>Statistiche per Ruolo</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Ruolo</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-600">Goal</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-600">Pres.</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-600">G</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-600">R</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(roleStats).map(([role, stats], idx) => (
                    <tr key={role} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 font-medium text-gray-800">{role}</td>
                      <td className="px-3 py-2 text-center font-bold text-blue-600">{stats.goals}</td>
                      <td className="px-3 py-2 text-center">{stats.matches}</td>
                      <td className="px-3 py-2 text-center text-yellow-600">{stats.yellows}</td>
                      <td className="px-3 py-2 text-center text-red-600">{stats.reds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Panoramica Generale */}
      <section>
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Panoramica Generale
          <span data-tooltip-id="overview-tip" className="ml-1 cursor-pointer"><Info className="w-4 h-4 text-gray-400" /></span>
        </h2>
        <ReactTooltip id="overview-tip" place="top" content="Statistiche riassuntive della squadra" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatCard icon={Users} title="Giocatori Attivi" value={players.filter(p => p.isActive).length} color="bg-blue-600" />
          <StatCard icon={Target} title="Partite Giocate" value={finishedMatches.length} color="bg-green-600" />
          <StatCard icon={Calendar} title="Allenamenti" value={trainings.length} subtitle={`${avgAttendance.toFixed(0)}% presenza media`} color="bg-purple-600" />
          <StatCard icon={Trophy} title="Vittorie" value={wins} subtitle={`${draws}P ${losses}S`} color="bg-yellow-600" />
        </div>
      </section>

      {/* Statistiche Partite */}
      {finishedMatches.length > 0 && (
        <section>
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-red-600" />
            Statistiche Partite
            <span data-tooltip-id="matches-tip" className="ml-1 cursor-pointer"><Info className="w-4 h-4 text-gray-400" /></span>
          </h2>
          <ReactTooltip id="matches-tip" place="top" content="Risultati e performance delle partite concluse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-xl shadow p-4 md:p-6 flex flex-col gap-2">
              <h3 className="text-base font-semibold text-gray-800 mb-2">Risultati</h3>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center"><span className="text-green-600 font-medium">Vittorie</span><span className="font-bold text-green-600">{wins}</span></div>
                <div className="flex justify-between items-center"><span className="text-yellow-600 font-medium">Pareggi</span><span className="font-bold text-yellow-600">{draws}</span></div>
                <div className="flex justify-between items-center"><span className="text-red-600 font-medium">Sconfitte</span><span className="font-bold text-red-600">{losses}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 md:p-6 flex flex-col gap-2">
              <h3 className="text-base font-semibold text-gray-800 mb-2">Gol</h3>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center"><span className="text-blue-600 font-medium">Fatti</span><span className="font-bold text-blue-600">{totalGoalsFor}</span></div>
                <div className="flex justify-between items-center"><span className="text-red-600 font-medium">Subiti</span><span className="font-bold text-red-600">{totalGoalsAgainst}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-600 font-medium">Differenza</span><span className={`font-bold ${totalGoalsFor-totalGoalsAgainst>0?'text-green-600':totalGoalsFor-totalGoalsAgainst<0?'text-red-600':'text-gray-600'}`}>{totalGoalsFor-totalGoalsAgainst>0?'+':''}{totalGoalsFor-totalGoalsAgainst}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 md:p-6 flex flex-col gap-2">
              <h3 className="text-base font-semibold text-gray-800 mb-2">Medie</h3>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center"><span className="text-blue-600 font-medium">Gol/Partita</span><span className="font-bold text-blue-600">{finishedMatches.length > 0 ? (totalGoalsFor / finishedMatches.length).toFixed(1) : '0.0'}</span></div>
                <div className="flex justify-between items-center"><span className="text-red-600 font-medium">Subiti/Partita</span><span className="font-bold text-red-600">{finishedMatches.length > 0 ? (totalGoalsAgainst / finishedMatches.length).toFixed(1) : '0.0'}</span></div>
              </div>
            </div>
          </div>
          {/* Grafico goal segnati e subiti per partita */}
          {matchesOfYear.length > 0 && (
            <div className="bg-white rounded-xl shadow p-4 md:p-8 mt-6 relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-blue-700 text-base md:text-lg">Goal segnati e subiti per partita ({selectedYear})</span>
                <span data-tooltip-id="goals-tip" className="ml-1 cursor-pointer"><Info className="w-4 h-4 text-gray-400" /></span>
                <ReactTooltip id="goals-tip" place="top" content="Numero di goal segnati e subiti per ciascuna partita, asse X = ordine cronologico delle partite." />
              </div>
              <Line data={goalsChartDataSingle} options={goalsChartOptionsSingle} height={120} />
            </div>
          )}
        </section>
      )}

      {/* Top Players */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* Capocannonieri */}
          {topScorers.length > 0 && (
            <div className="bg-white rounded-xl shadow p-4 md:p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Capocannonieri
                <span data-tooltip-id="topscorers-tip" className="ml-1 cursor-pointer"><Info className="w-4 h-4 text-gray-400" /></span>
              </h3>
              <ReactTooltip id="topscorers-tip" place="top" content="Giocatori con il maggior numero di goal" />
              <ul className="space-y-2">                {topScorers.map((item, index) => (
                  <li key={item.playerId} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white shadow ${index===0?'bg-yellow-500 text-white':index===1?'bg-gray-400 text-white':index===2?'bg-yellow-700 text-white':'bg-gray-200 text-gray-600'}`}>{index+1}</span>
                      <div>
                        <span className="font-medium text-gray-800">{item.player?.firstName} {item.player?.lastName}</span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{item.goals}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Giocatori più attivi */}
          {mostActivePlaybers.length > 0 && (
            <div className="bg-white rounded-xl shadow p-4 md:p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Più Presenti
                <span data-tooltip-id="mostpresent-tip" className="ml-1 cursor-pointer"><Info className="w-4 h-4 text-gray-400" /></span>
              </h3>
              <ReactTooltip id="mostpresent-tip" place="top" content="Giocatori più presenti in campo e allenamenti" />
              <ul className="space-y-2">
                {mostActivePlaybers.map((item, index) => (
                  <li key={item.playerId} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white shadow ${index===0?'bg-green-500 text-white':index===1?'bg-blue-500 text-white':index===2?'bg-purple-500 text-white':'bg-gray-200 text-gray-600'}`}>{index+1}</span>                      <div>
                        <span className="font-medium text-gray-800">{item.player?.firstName} {item.player?.lastName}</span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-600">{item.matchesPlayed}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Fair Play & Sostituzioni */}
      <section>
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-yellow-600" />
          Fair Play & Sostituzioni
          <span data-tooltip-id="fairplay-tip" className="ml-1 cursor-pointer"><Info className="w-4 h-4 text-gray-400" /></span>
        </h2>
        <ReactTooltip id="fairplay-tip" place="top" content="Cartellini e sostituzioni effettuate dalla squadra" />
        <div className="flex justify-between gap-4 mb-6">
          <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center">
            <Shield className="w-8 h-8 text-yellow-400 mb-2" />
            <span className="text-3xl font-bold text-yellow-600">{totalYellows}</span>
            <span className="text-sm text-gray-600 mt-1">Ammonizioni</span>
            <span className="text-xs text-gray-500 mt-0.5">Media: {avgCardsPerMatch}/partita</span>
          </div>
          <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center">
            <Shield className="w-8 h-8 text-red-600 mb-2" />
            <span className="text-3xl font-bold text-red-600">{totalReds}</span>
            <span className="text-sm text-gray-600 mt-1">Espulsioni</span>
            {totalReds > 0 && <span className="text-xs text-gray-500 mt-0.5">Totale: {totalReds}</span>}
          </div>
          <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center">
            <Repeat className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-3xl font-bold text-blue-400">{totalSubs}</span>
            <span className="text-sm text-gray-600 mt-1">Sostituzioni</span>
            <span className="text-xs text-gray-500 mt-0.5">Media: {avgSubsPerMatch}/partita</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6">
          <div className="bg-white rounded-xl shadow p-4 md:p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Più sostituiti
            </h3>            <ul className="space-y-2">
              {mostSubbedOut.map(({player,count}) => player && (
                <li key={player.id} className="flex justify-between items-center">
                  <span>{player.firstName} {player.lastName}</span>
                  <span className="font-bold text-red-600">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow p-4 md:p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              Più subentrati
            </h3>
            <ul className="space-y-2">
              {mostSubbedIn.map(({player,count}) => player && (
                <li key={player.id} className="flex justify-between items-center">
                  <span>{player.firstName} {player.lastName}</span>
                  <span className="font-bold text-green-600">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Statistiche per ruolo */}
      <section>
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-purple-600" />
          Statistiche per Ruolo
          <span data-tooltip-id="byrole-tip" className="ml-1 cursor-pointer"><Info className="w-4 h-4 text-gray-400" /></span>
        </h2>
        <ReactTooltip id="byrole-tip" place="top" content="Statistiche aggregate per ciascun ruolo in campo" />
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow-md text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Ruolo</th>
                <th className="px-4 py-2 text-center">Goal</th>
                <th className="px-4 py-2 text-center">Presenze</th>
                <th className="px-4 py-2 text-center">Gialli</th>
                <th className="px-4 py-2 text-center">Rossi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(roleStats).map(([role, stats], idx) => (
                <tr key={role} className={idx%2===0?"bg-white":"bg-gray-50"}>
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
      </section>
    </div>
  );
}