import { useState, useMemo } from 'react';
import { Match, Player } from '../types';
import { Calendar, Clock, Edit2, Trash2, Home, Plane, Trophy, Target, Search, X } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

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
        
        // Se la partita è programmata (non ancora iniziata), mostra il testo appropriato
        if (status === 'scheduled') {
          if (match.homeAway === 'away' && match.location) {
            if (match.field) {
              return `Programmata a ${match.location} al campo ${match.field}`;
            }
            return `Programmata a ${match.location}`;
          }
          return 'Programmata';
        }
        
        // Altrimenti mostra il periodo corrente
        return currentPeriod.label;
      }
    }
    
    // Fallback al vecchio sistema
    switch (status) {
      case 'scheduled': 
        if (match.homeAway === 'away' && match.location) {
          if (match.field) {
            return `Programmata a ${match.location} al campo ${match.field}`;
          }
          return `Programmata a ${match.location}`;
        }
        return 'Programmata';
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
        
        // Se la partita è programmata (non ancora iniziata), usa il colore grigio
        if (status === 'scheduled') {
          return 'bg-gray-400';
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
      case 'scheduled': return 'bg-gray-400';
      case 'first-half': return 'bg-green-500';
      case 'half-time': return 'bg-orange-500';
      case 'second-half': return 'bg-green-500';
      case 'finished': return 'bg-blue-500';
      default: return 'bg-gray-400';
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

  const filteredAndSortedMatches = useMemo(() => {
    let filtered = matches;

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = matches.filter(match => {
        // Search in opponent name
        if (match.opponent.toLowerCase().includes(search)) return true;
        
        // Search in date
        const formattedDate = formatDate(match.date).toLowerCase();
        if (formattedDate.includes(search)) return true;
        
        // Search in status
        const statusText = getStatusText(match).toLowerCase();
        if (statusText.includes(search)) return true;
        
        // Search in location
        if (match.location && match.location.toLowerCase().includes(search)) return true;
        
        // Search in field
        if (match.field && match.field.toLowerCase().includes(search)) return true;
        
        // Search in result type for finished matches
        if (match.status === 'finished') {
          const result = getResult(match);
          if (result && result.toLowerCase().includes(search)) return true;
        }
        
        return false;
      });
    }

    // Sort by date (newest first)
    return [...filtered].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [matches, searchTerm]);

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cerca partite per avversario, data, stato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {filteredAndSortedMatches.map(match => {
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
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cerca partite per avversario, data, stato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {filteredAndSortedMatches.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'Nessuna partita trovata' : 'Nessuna partita registrata'}
          </p>
          <p className="text-gray-400">
            {searchTerm ? 'Prova a modificare i termini di ricerca' : 'Aggiungi la prima partita per iniziare'}
          </p>
        </div>
      ) : (
        filteredAndSortedMatches.map(match => {
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