import React from 'react';
import { Match, Player } from '../types';
import { Calendar, MapPin, Clock, Edit2, Trash2, Home, Plane, Trophy, Target } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

interface MatchListProps {
  matches: Match[];
  players: Player[];
  onEdit: (match: Match) => void;
  onDelete: (matchId: string) => void;
  onManage: (match: Match) => void;
  onReport?: (match: Match) => void;
}

export function MatchList({ matches, players, onEdit, onDelete, onManage, onReport }: MatchListProps) {
  const isMobile = useIsMobile();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusText = (match: Match) => {
    const { status, periods, currentPeriodIndex } = match;
    
    // Se la partita ha periodi dinamici e un indice corrente valido, usa quello
    if (periods && periods.length > 0 && currentPeriodIndex !== undefined) {
      const currentPeriod = periods[currentPeriodIndex];
      if (currentPeriod) {
        // Se la partita è finita, mostra "Terminata"
        if (status === 'finished') {
          return 'Terminata';
        }
        // Altrimenti mostra il periodo corrente
        return currentPeriod.label;
      }
    }
    
    // Fallback al vecchio sistema
    switch (status) {
      case 'scheduled': return 'Programmata';
      case 'first-half': return '1° Tempo';
      case 'half-time': return 'Intervallo';
      case 'second-half': return '2° Tempo';
      case 'finished': return 'Terminata';
      default: return '';
    }
  };

  const getStatusColor = (match: Match) => {
    const { status, periods, currentPeriodIndex } = match;
    
    // Se la partita ha periodi dinamici e un indice corrente valido, usa quello
    if (periods && periods.length > 0 && currentPeriodIndex !== undefined) {
      const currentPeriod = periods[currentPeriodIndex];
      if (currentPeriod) {
        // Se la partita è finita, usa il colore blu
        if (status === 'finished') {
          return 'bg-blue-500';
        }
        
        // Usa i colori in base al tipo di periodo
        if (currentPeriod.type === 'regular') {
          return 'bg-green-500'; // Verde per periodi regolari
        } else if (currentPeriod.type === 'interval') {
          return 'bg-orange-500'; // Arancione per intervalli
        } else if (currentPeriod.type === 'extra') {
          return 'bg-purple-500'; // Viola per tempi supplementari
        }
      }
    }
    
    // Fallback al vecchio sistema
    switch (status) {
      case 'scheduled': return 'bg-gray-500';
      case 'first-half': return 'bg-green-500';
      case 'half-time': return 'bg-orange-500';
      case 'second-half': return 'bg-green-500';
      case 'finished': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getResult = (match: Match) => {
    if (match.status === 'finished') {
      const ourScore = match.homeAway === 'home' ? match.homeScore : match.awayScore;
      const theirScore = match.homeAway === 'home' ? match.awayScore : match.homeScore;
      
      if (ourScore > theirScore) return 'Vittoria';
      if (ourScore < theirScore) return 'Sconfitta';
      return 'Pareggio';
    }
    return null;
  };

  const getResultColor = (match: Match) => {
    const result = getResult(match);
    switch (result) {
      case 'Vittoria': return 'text-green-600';
      case 'Sconfitta': return 'text-red-600';
      case 'Pareggio': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const sortedMatches = [...matches].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        {sortedMatches.map(match => {
          const statusText = getStatusText(match);
          const statusColor = getStatusColor(match);
          return (
            <div key={match.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">vs {match.opponent}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(match.date)}
                    {match.time && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {match.time}
                      </span>
                    )}
                  </p>
                </div>
                <div className={`px-2 py-1 text-xs font-medium rounded-full text-white ${statusColor}`}>{statusText}</div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>Formazione: {match.lineup.length} giocator{match.lineup.length === 1 ? 'e' : 'i'}</span>
                {match.substitutions.length > 0 && <span>Sostituzioni: {match.substitutions.length}</span>}
              </div>
              <div className="flex justify-end gap-2">
                {match.status !== 'finished' && (
                  <button onClick={() => onManage(match)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </button>
                )}
                {match.status === 'finished' && onReport && (
                  <button onClick={() => onReport(match)} className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg">
                    <Trophy className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => onEdit(match)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(match.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedMatches.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nessuna partita registrata</p>
          <p className="text-gray-400">Aggiungi la prima partita per iniziare</p>
        </div>
      ) : (
        sortedMatches.map(match => {
          const result = getResult(match);
          const ourScore = match.homeAway === 'home' ? match.homeScore : match.awayScore;
          const theirScore = match.homeAway === 'home' ? match.awayScore : match.homeScore;

          return (
            <div key={match.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      match.homeAway === 'home' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {match.homeAway === 'home' ? (
                        <Home className="w-6 h-6 text-green-600" />
                      ) : (
                        <Plane className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        vs {match.opponent}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(match.date)}
                        {match.time && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {match.time}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(match)}`}>
                      {getStatusText(match)}
                    </div>
                  </div>
                </div>

                {match.status === 'finished' && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Pietra Ligure</p>
                        <p className="text-3xl font-bold text-gray-800">{ourScore}</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getResultColor(match)}`}>
                          {result}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">{match.opponent}</p>
                        <p className="text-3xl font-bold text-gray-800">{theirScore}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      {match.homeAway === 'home' ? (
                        <>
                          <Home className="w-4 h-4" />
                          Casa
                        </>
                      ) : (
                        <>
                          <Plane className="w-4 h-4" />
                          Trasferta
                        </>
                      )}
                    </span>
                    <span>Formazione: {match.lineup.length} giocator{match.lineup.length === 1 ? 'e' : 'i'}</span>
                    {match.substitutions.length > 0 && (
                      <span>Sostituzioni: {match.substitutions.length}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {match.status === 'finished' && onReport && (
                      <button
                        onClick={() => onReport(match)}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Report Partita"
                      >
                        <Trophy className="w-4 h-4" />
                      </button>
                    )}
                    {match.status !== 'finished' && (
                      <button
                        onClick={() => onManage(match)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Gestisci partita"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(match)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Modifica partita"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(match.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Elimina partita"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}