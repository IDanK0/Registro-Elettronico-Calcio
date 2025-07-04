import { useState, useMemo } from 'react';
import { Match, Player } from '../types';
import { Calendar, Clock, Edit2, Trash2, Home, Plane, Trophy, Target, Search, X, Users, ChevronDown, Activity, Award } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'SCHEDULED' | 'active' | 'FINISHED'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'opponent' | 'status'>('date');

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
        if (status === 'FINISHED') {
          return 'Terminata';
        }
        
        // Se la partita è programmata (non ancora iniziata), mostra il testo appropriato
        if (status === 'SCHEDULED') {
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
      case 'SCHEDULED': 
        if (match.homeAway === 'away' && match.location) {
          if (match.field) {
            return `Programmata a ${match.location} al campo ${match.field}`;
          }
          return `Programmata a ${match.location}`;
        }
        return 'Programmata';
      case 'FIRST_HALF': return '1° Tempo';
      case 'HALF_TIME': return 'Intervallo';
      case 'SECOND_HALF': return '2° Tempo';
      case 'FINISHED': return 'Terminata';
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
        if (status === 'FINISHED') {
          return 'bg-blue-500';
        }
        
        // Se la partita è programmata (non ancora iniziata), usa il colore grigio
        if (status === 'SCHEDULED') {
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
      case 'SCHEDULED': return 'bg-gray-400';
      case 'FIRST_HALF': return 'bg-green-500';
      case 'HALF_TIME': return 'bg-orange-500';
      case 'SECOND_HALF': return 'bg-green-500';
      case 'FINISHED': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusTextColor = (match: Match) => {
    const { status, periods, currentPeriodIndex } = match;
    
    // Se la partita ha periodi dinamici e un indice corrente valido, usa quello
    if (periods && periods.length > 0 && currentPeriodIndex !== undefined) {
      const currentPeriod = periods[currentPeriodIndex];
      if (currentPeriod) {
        // Se la partita è finita, usa il colore blu
        if (status === 'FINISHED') {
          return 'text-blue-700';
        }
        
        // Se la partita è programmata (non ancora iniziata), usa il colore grigio
        if (status === 'SCHEDULED') {
          return 'text-gray-600';
        }
        
        // Usa i colori in base al tipo di periodo
        if (currentPeriod.type === 'regular') {
          return 'text-green-700'; // Verde per periodi regolari
        } else if (currentPeriod.type === 'interval') {
          return 'text-orange-700'; // Arancione per intervalli
        } else if (currentPeriod.type === 'extra') {
          return 'text-purple-700'; // Viola per tempi supplementari
        }
      }
    }
    
    // Fallback al vecchio sistema
    switch (status) {
      case 'SCHEDULED': return 'text-gray-600';
      case 'FIRST_HALF': return 'text-green-700';
      case 'HALF_TIME': return 'text-orange-700';
      case 'SECOND_HALF': return 'text-green-700';
      case 'FINISHED': return 'text-blue-700';
      default: return 'text-gray-600';
    }
  };

  const getStatusBackgroundColor = (match: Match) => {
    const { status, periods, currentPeriodIndex } = match;
    
    // Se la partita ha periodi dinamici e un indice corrente valido, usa quello
    if (periods && periods.length > 0 && currentPeriodIndex !== undefined) {
      const currentPeriod = periods[currentPeriodIndex];
      if (currentPeriod) {
        // Se la partita è finita, usa il colore blu
        if (status === 'FINISHED') {
          return 'from-blue-50 to-blue-100';
        }
        
        // Se la partita è programmata (non ancora iniziata), usa il colore grigio
        if (status === 'SCHEDULED') {
          return 'from-gray-50 to-gray-100';
        }
        
        // Usa i colori in base al tipo di periodo
        if (currentPeriod.type === 'regular') {
          return 'from-green-50 to-emerald-50'; // Verde per periodi regolari
        } else if (currentPeriod.type === 'interval') {
          return 'from-orange-50 to-yellow-50'; // Arancione per intervalli
        } else if (currentPeriod.type === 'extra') {
          return 'from-purple-50 to-indigo-50'; // Viola per tempi supplementari
        }
      }
    }
    
    // Fallback al vecchio sistema
    switch (status) {
      case 'SCHEDULED': return 'from-gray-50 to-gray-100';
      case 'FIRST_HALF': return 'from-green-50 to-emerald-50';
      case 'HALF_TIME': return 'from-orange-50 to-yellow-50';
      case 'SECOND_HALF': return 'from-green-50 to-emerald-50';
      case 'FINISHED': return 'from-blue-50 to-blue-100';
      default: return 'from-gray-50 to-gray-100';
    }
  };

  const getStatusBorderColor = (match: Match) => {
    const { status, periods, currentPeriodIndex } = match;
    
    // Se la partita ha periodi dinamici e un indice corrente valido, usa quello
    if (periods && periods.length > 0 && currentPeriodIndex !== undefined) {
      const currentPeriod = periods[currentPeriodIndex];
      if (currentPeriod) {
        // Se la partita è finita, usa il colore blu
        if (status === 'FINISHED') {
          return 'border-blue-500';
        }
        
        // Se la partita è programmata (non ancora iniziata), usa il colore grigio
        if (status === 'SCHEDULED') {
          return 'border-gray-400';
        }
        
        // Usa i colori in base al tipo di periodo
        if (currentPeriod.type === 'regular') {
          return 'border-green-500'; // Verde per periodi regolari
        } else if (currentPeriod.type === 'interval') {
          return 'border-orange-500'; // Arancione per intervalli
        } else if (currentPeriod.type === 'extra') {
          return 'border-purple-500'; // Viola per tempi supplementari
        }
      }
    }
    
    // Fallback al vecchio sistema
    switch (status) {
      case 'SCHEDULED': return 'border-gray-400';
      case 'FIRST_HALF': return 'border-green-500';
      case 'HALF_TIME': return 'border-orange-500';
      case 'SECOND_HALF': return 'border-green-500';
      case 'FINISHED': return 'border-blue-500';
      default: return 'border-gray-400';
    }
  };

  const getHomeAwayIconBackgroundColor = (match: Match) => {
    const { status, periods, currentPeriodIndex } = match;
    
    // Per partite programmate, usa grigio
    if (status === 'SCHEDULED') {
      return 'bg-gray-100';
    }
    
    // Per partite finite, usa blu
    if (status === 'FINISHED') {
      return 'bg-blue-100';
    }
    
    // Per partite in corso, usa i colori dinamici basati sul periodo
    if (periods && periods.length > 0 && currentPeriodIndex !== undefined) {
      const currentPeriod = periods[currentPeriodIndex];
      if (currentPeriod) {
        // Usa i colori in base al tipo di periodo
        if (currentPeriod.type === 'regular') {
          return 'bg-green-100'; // Verde per periodi regolari
        } else if (currentPeriod.type === 'interval') {
          return 'bg-orange-100'; // Arancione per intervalli
        } else if (currentPeriod.type === 'extra') {
          return 'bg-purple-100'; // Viola per tempi supplementari
        }
      }
    }
    
    // Fallback al vecchio sistema per partite in corso
    switch (status) {
      case 'FIRST_HALF': return 'bg-green-100';
      case 'HALF_TIME': return 'bg-orange-100';
      case 'SECOND_HALF': return 'bg-green-100';
      default: return match.homeAway === 'home' ? 'bg-green-100' : 'bg-blue-100';
    }
  };

  const getHomeAwayIconColor = (match: Match) => {
    const { status, periods, currentPeriodIndex } = match;
    
    // Per partite programmate, usa grigio
    if (status === 'SCHEDULED') {
      return 'text-gray-600';
    }
    
    // Per partite finite, usa blu
    if (status === 'FINISHED') {
      return 'text-blue-600';
    }
    
    // Per partite in corso, usa i colori dinamici basati sul periodo
    if (periods && periods.length > 0 && currentPeriodIndex !== undefined) {
      const currentPeriod = periods[currentPeriodIndex];
      if (currentPeriod) {
        // Usa i colori in base al tipo di periodo
        if (currentPeriod.type === 'regular') {
          return 'text-green-600'; // Verde per periodi regolari
        } else if (currentPeriod.type === 'interval') {
          return 'text-orange-600'; // Arancione per intervalli
        } else if (currentPeriod.type === 'extra') {
          return 'text-purple-600'; // Viola per tempi supplementari
        }
      }
    }
    
    // Fallback al vecchio sistema per partite in corso
    switch (status) {
      case 'FIRST_HALF': return 'text-green-600';
      case 'HALF_TIME': return 'text-orange-600';
      case 'SECOND_HALF': return 'text-green-600';
      default: return match.homeAway === 'home' ? 'text-green-600' : 'text-blue-600';
    }
  };

  const getResult = (match: Match) => {
    if (match.status === 'FINISHED') {
      const ourScore = match.homeAway === 'home' ? match.homeScore : match.awayScore;
      const theirScore = match.homeAway === 'home' ? match.awayScore : match.homeScore;
      
      if (ourScore > theirScore) return 'Vittoria';
      if (ourScore < theirScore) return 'Sconfitta';
      return 'Pareggio';
    }
    return null;
  };

  const filteredAndSortedMatches = useMemo(() => {
    let filtered = matches;

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = matches.filter(match => match.status !== 'SCHEDULED' && match.status !== 'FINISHED');
      } else {
        filtered = matches.filter(match => match.status === statusFilter);
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(match => {
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
        if (match.status === 'FINISHED') {
          const result = getResult(match);
          if (result && result.toLowerCase().includes(search)) return true;
        }
        
        return false;
      });
    }

    // Sort matches
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'opponent':
          return a.opponent.localeCompare(b.opponent);
        case 'status':
          if (a.status === b.status) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          }
          // Priority: active > scheduled > finished
          const statusPriority = { 'active': 3, 'SCHEDULED': 2, 'FINISHED': 1 };
          const aPriority = a.status === 'SCHEDULED' || a.status === 'FINISHED' ? statusPriority[a.status] : statusPriority.active;
          const bPriority = b.status === 'SCHEDULED' || b.status === 'FINISHED' ? statusPriority[b.status] : statusPriority.active;
          return bPriority - aPriority;
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [matches, searchTerm, statusFilter, sortBy]);

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-4">
            <Trophy className="w-7 h-7 text-blue-600" />
            <span>Gestione Partite</span>
          </h2>
          
          {/* Filters and Search */}
          <div className="space-y-3">
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

            {/* Status Filter */}
            <div className="flex rounded-lg shadow-sm border border-gray-300 overflow-hidden">
              {[
                { key: 'all', label: 'Tutte', icon: Trophy },
                { key: 'scheduled', label: 'Programmate', icon: Calendar },
                { key: 'active', label: 'Live', icon: Activity },
                { key: 'finished', label: 'Finite', icon: Award }
              ].map(({ key, label, icon: Icon }) => (
                <button 
                  key={key}
                  onClick={() => setStatusFilter(key as any)} 
                  className={`flex-1 px-2 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                    statusFilter === key 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-white border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Ordina per Data</option>
              <option value="opponent">Ordina per Avversario</option>
              <option value="status">Ordina per Stato</option>
            </select>
          </div>

          {/* Stats Summary */}
          {matches.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">{matches.filter(m => m.status === 'SCHEDULED').length}</div>
                  <div className="text-xs text-gray-600">Programmate</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{matches.filter(m => m.status !== 'SCHEDULED' && m.status !== 'FINISHED').length}</div>
                  <div className="text-xs text-gray-600">In corso</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-600">{matches.filter(m => m.status === 'FINISHED').length}</div>
                  <div className="text-xs text-gray-600">Terminate</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Match Cards */}
        {filteredAndSortedMatches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Nessuna partita trovata' : 'Nessuna partita registrata'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Prova a modificare i filtri di ricerca' 
                : 'Aggiungi la prima partita per iniziare'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Mostra tutte le partite
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedMatches.map(match => {
            const statusText = getStatusText(match);
            const statusColor = getStatusColor(match);
            const result = getResult(match);
            const ourScore = match.homeAway === 'home' ? match.homeScore : match.awayScore;
            const theirScore = match.homeAway === 'home' ? match.awayScore : match.homeScore;

            // Get lineup players for details
            const lineupPlayers = match.lineup
              .map(matchPlayer => players.find(p => p.id === matchPlayer.playerId))
              .filter(Boolean);

            return (
              <div key={match.id} className="bg-white rounded-xl shadow-md p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getHomeAwayIconBackgroundColor(match)}`}>
                      {match.homeAway === 'home' ? (
                        <Home className={`w-5 h-5 ${getHomeAwayIconColor(match)}`} />
                      ) : (
                        <Plane className={`w-5 h-5 ${getHomeAwayIconColor(match)}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">vs {match.opponent}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(match.date)}
                        {match.time && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {match.time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status bar */}
                  <div className={`w-full h-1 rounded-full mb-2 ${statusColor}`}></div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${getStatusTextColor(match)}`}>
                      {match.status === 'SCHEDULED' ? 'Programmata' :
                       match.status === 'FINISHED' ? 'Terminata' : statusText}
                    </span>
                    {match.status === 'SCHEDULED' && match.location && (
                      <span className="text-xs text-gray-500 truncate ml-2">
                        {match.homeAway === 'away' ? '@ ' : ''}{match.location}
                        {match.field && ` - Campo ${match.field}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Result Section for Finished Matches */}
                {match.status === 'FINISHED' && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                      {/* Our Score */}
                      <div className="flex-1 flex justify-center">
                        <p className="text-3xl font-bold text-gray-800">{ourScore}</p>
                      </div>
                      
                      {/* Result Badge */}
                      <div className="flex-shrink-0 px-4">
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                          result === 'Vittoria' ? 'bg-green-100 text-green-800' :
                          result === 'Sconfitta' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result}
                        </div>
                      </div>
                      
                      {/* Their Score */}
                      <div className="flex-1 flex justify-center">
                        <p className="text-3xl font-bold text-gray-800">{theirScore}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Match Status */}
                {match.status !== 'SCHEDULED' && match.status !== 'FINISHED' && (
                  <div className={`mb-4 p-3 bg-gradient-to-r ${getStatusBackgroundColor(match)} rounded-lg border-l-4 ${getStatusBorderColor(match)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 ${getStatusColor(match).replace('bg-', 'bg-')} rounded-full animate-pulse`}></div>
                        <span className={`text-sm font-medium ${getStatusTextColor(match).replace('text-', 'text-').replace('-700', '-800')}`}>Partita in corso</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getStatusTextColor(match).replace('text-', 'text-').replace('-700', '-900')}`}>{ourScore} - {theirScore}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Match Info */}
                <div className="space-y-3 mb-4">
                  {match.substitutions.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        <span className="font-medium text-orange-800">Sostituzioni</span>
                      </div>
                      <span className="font-bold text-orange-900">{match.substitutions.length}</span>
                    </div>
                  )}
                </div>

                {/* Collapsible Details */}
                {lineupPlayers.length > 0 && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <ChevronDown className="w-4 h-4 transition-transform duration-200 [details[open]_&]:rotate-180" />
                      <Users className="w-4 h-4" />
                      <span>Dettagli formazione ({match.lineup.length})</span>
                      {match.substitutions.length > 0 && (
                        <span className="text-xs text-gray-500">
                          • {match.substitutions.length} sost.
                        </span>
                      )}
                    </summary>
                    <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wide">Formazione titolare</h5>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {match.lineup.map(matchPlayer => {
                            const player = players.find(p => p.id === matchPlayer.playerId);
                            return (
                              <div key={matchPlayer.playerId} className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-blue-100">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {matchPlayer.jerseyNumber}
                                </span>
                                <span className="font-medium flex-1">{player?.firstName} {player?.lastName}</span>
                                <span className="text-gray-400 text-xs">{matchPlayer.position}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {match.substitutions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-orange-600" />
                            <h5 className="text-xs font-medium text-orange-700 uppercase tracking-wide">Sostituzioni</h5>
                          </div>
                          <div className="space-y-2">
                            {match.substitutions.map((sub, index) => {
                              const playerOut = players.find(p => p.id === sub.playerOut);
                              const playerIn = players.find(p => p.id === sub.playerIn);
                              return (
                                <div key={index} className="bg-white p-2 rounded border border-orange-100">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        {sub.playerOutJerseyNumber && (
                                          <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {sub.playerOutJerseyNumber}
                                          </span>
                                        )}
                                        <span className="font-medium">{playerOut?.firstName} {playerOut?.lastName}</span>
                                      </div>
                                      <span className="mx-1 text-gray-400">→</span>
                                      <div className="flex items-center gap-1">
                                        {sub.playerInJerseyNumber && (
                                          <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {sub.playerInJerseyNumber}
                                          </span>
                                        )}
                                        <span className="font-medium">{playerIn?.firstName} {playerIn?.lastName}</span>
                                      </div>
                                    </div>
                                    {sub.minute && (
                                      <span className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                        {sub.minute}'
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Opponent Lineup */}
                      {match.opponentLineup && match.opponentLineup.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-red-600" />
                            <h5 className="text-xs font-medium text-red-700 uppercase tracking-wide">Formazione {match.opponent}</h5>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {match.opponentLineup.map((jerseyNumber, index) => {
                              // Ensure jerseyNumber is a number
                              const displayNumber = typeof jerseyNumber === 'object' && jerseyNumber && 'jerseyNumber' in jerseyNumber
                                ? (jerseyNumber as any).jerseyNumber 
                                : jerseyNumber;
                              
                              return (
                                <div key={index} className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-red-100">
                                  <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {displayNumber}
                                  </span>
                                  <span className="font-medium text-gray-800">Giocatore #{displayNumber}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  {match.status !== 'FINISHED' && (
                    <button 
                      onClick={() => onManage(match)} 
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Gestisci partita"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                  )}
                  {match.status === 'FINISHED' && onReport && (
                    <button 
                      onClick={() => onReport(match)} 
                      className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Report partita"
                    >
                      <Trophy className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => onEdit(match)} 
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Modifica partita"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onDelete(match.id)} 
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Elimina partita"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <Trophy className="w-7 h-7 text-blue-600" />
          <span>Gestione Partite</span>
        </h2>
        
        {/* Filters and Search */}
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

          {/* Status Filter */}
          <div className="flex rounded-lg shadow-sm border border-gray-300 overflow-hidden">
            <button 
              onClick={() => setStatusFilter('all')} 
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                statusFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Tutte</span>
            </button>
            <button 
              onClick={() => setStatusFilter('SCHEDULED')} 
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                statusFilter === 'SCHEDULED' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Programmate</span>
            </button>
            <button 
              onClick={() => setStatusFilter('active')} 
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                statusFilter === 'active' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Live</span>
            </button>
            <button 
              onClick={() => setStatusFilter('FINISHED')} 
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                statusFilter === 'FINISHED' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Finite</span>
            </button>
          </div>

          {/* Sort Options */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-white border border-gray-300 hover:border-gray-400 px-3 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date">Ordina per Data</option>
            <option value="opponent">Ordina per Avversario</option>
            <option value="status">Ordina per Stato</option>
          </select>
        </div>

        {/* Stats Summary */}
        {matches.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{matches.filter(m => m.status === 'SCHEDULED').length}</div>
                <div className="text-sm text-gray-600">Programmate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{matches.filter(m => m.status !== 'SCHEDULED' && m.status !== 'FINISHED').length}</div>
                <div className="text-sm text-gray-600">In corso</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{matches.filter(m => m.status === 'FINISHED').length}</div>
                <div className="text-sm text-gray-600">Terminate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">{matches.length}</div>
                <div className="text-sm text-gray-600">Totali</div>
              </div>
            </div>
          </div>
        )}
      </div>

      
      {filteredAndSortedMatches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Trophy className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'Nessuna partita trovata' : 'Nessuna partita registrata'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca o i criteri di ordinamento' 
              : 'Aggiungi la prima partita per iniziare a gestire il calendario della squadra'}
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mostra tutte le partite
            </button>
          )}
        </div>
      ) : (
        filteredAndSortedMatches.map(match => {
          const result = getResult(match);
          const ourScore = match.homeAway === 'home' ? match.homeScore : match.awayScore;
          const theirScore = match.homeAway === 'home' ? match.awayScore : match.homeScore;

          // Get lineup players for details
          const lineupPlayers = (match.lineup || [])
            .map(matchPlayer => players.find(p => p.id === matchPlayer.playerId))
            .filter(Boolean);

          return (
            <div key={match.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
              <div className="p-6">
                {/* Header with Match Info */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getHomeAwayIconBackgroundColor(match)}`}>
                      {match.homeAway === 'home' ? (
                        <Home className={`w-6 h-6 ${getHomeAwayIconColor(match)}`} />
                      ) : (
                        <Plane className={`w-6 h-6 ${getHomeAwayIconColor(match)}`} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 mb-1">
                        vs {match.opponent}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(match.date)}
                        </span>
                        {match.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {match.time}
                          </span>
                        )}
                        {match.location && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Target className="w-4 h-4" />
                            {match.location}{match.field ? ` - Campo ${match.field}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-full text-white text-sm font-semibold shadow-sm ${getStatusColor(match)}`}>
                      {getStatusText(match)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      {match.lineup.length}
                    </div>
                  </div>
                </div>

                {/* Match Result Section */}
                {match.status === 'FINISHED' && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                      {/* Our Score */}
                      <div className="flex-1 flex justify-center">
                        <p className="text-4xl font-bold text-gray-800">{ourScore}</p>
                      </div>
                      
                      {/* Result Badge */}
                      <div className="flex-shrink-0 px-6">
                        <div className={`px-4 py-2 rounded-full text-base font-bold ${
                          result === 'Vittoria' ? 'bg-green-100 text-green-800' :
                          result === 'Sconfitta' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result}
                        </div>
                      </div>
                      
                      {/* Their Score */}
                      <div className="flex-1 flex justify-center">
                        <p className="text-4xl font-bold text-gray-800">{theirScore}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Match Status */}
                {match.status !== 'SCHEDULED' && match.status !== 'FINISHED' && (
                  <div className={`mb-6 p-4 bg-gradient-to-r ${getStatusBackgroundColor(match)} rounded-xl border-l-4 ${getStatusBorderColor(match)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 ${getStatusColor(match).replace('bg-', 'bg-')} rounded-full animate-pulse`}></div>
                        <span className={`text-base font-semibold ${getStatusTextColor(match).replace('text-', 'text-').replace('-700', '-800')}`}>Partita in corso</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getStatusTextColor(match).replace('text-', 'text-').replace('-700', '-900')}`}>{ourScore} - {theirScore}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collapsible Formation Details */}
                {lineupPlayers.length > 0 && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <ChevronDown className="w-4 h-4 transition-transform duration-200 [details[open]_&]:rotate-180" />
                      <Users className="w-4 h-4" />
                      <span>Dettagli formazione ({match.lineup.length})</span>
                      {match.substitutions.length > 0 && (
                        <span className="text-xs text-gray-500">
                          • {match.substitutions.length} sostituzione{match.substitutions.length > 1 ? 'i' : ''}
                        </span>
                      )}
                    </summary>
                    <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h5 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Formazione titolare</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {match.lineup.map(matchPlayer => {
                            const player = players.find(p => p.id === matchPlayer.playerId);
                            return (
                              <div key={matchPlayer.playerId} className="flex items-center gap-3 text-sm bg-white p-3 rounded-lg border border-blue-100">
                                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {matchPlayer.jerseyNumber}
                                </span>
                                <div className="flex-1">
                                  <span className="font-medium text-gray-800">{player?.firstName} {player?.lastName}</span>
                                  <div className="text-xs text-gray-500">{matchPlayer.position}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {match.substitutions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="w-5 h-5 text-orange-600" />
                            <h5 className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Sostituzioni</h5>
                          </div>
                          <div className="space-y-2">
                            {match.substitutions.map((sub, index) => {
                              const playerOut = players.find(p => p.id === sub.playerOut);
                              const playerIn = players.find(p => p.id === sub.playerIn);
                              return (
                                <div key={index} className="bg-white p-3 rounded-lg border border-orange-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        {sub.playerOutJerseyNumber && (
                                          <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {sub.playerOutJerseyNumber}
                                          </span>
                                        )}
                                        <span className="font-medium text-gray-800">{playerOut?.firstName} {playerOut?.lastName}</span>
                                      </div>
                                      <span className="text-gray-400">→</span>
                                      <div className="flex items-center gap-2">
                                        {sub.playerInJerseyNumber && (
                                          <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {sub.playerInJerseyNumber}
                                          </span>
                                        )}
                                        <span className="font-medium text-gray-800">{playerIn?.firstName} {playerIn?.lastName}</span>
                                      </div>
                                    </div>
                                    {sub.minute && (
                                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {sub.minute}'
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Opponent Lineup */}
                      {match.opponentLineup && match.opponentLineup.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="w-5 h-5 text-red-600" />
                            <h5 className="text-sm font-semibold text-red-700 uppercase tracking-wide">Formazione {match.opponent}</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {match.opponentLineup.map((jerseyNumber, index) => {
                              // Ensure jerseyNumber is a number
                              const displayNumber = typeof jerseyNumber === 'object' && jerseyNumber && 'jerseyNumber' in jerseyNumber
                                ? (jerseyNumber as any).jerseyNumber 
                                : jerseyNumber;
                              
                              return (
                                <div key={index} className="flex items-center gap-3 text-sm bg-white p-3 rounded-lg border border-red-100">
                                  <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    {displayNumber}
                                  </span>
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-800">Giocatore #{displayNumber}</span>
                                    <div className="text-xs text-gray-500">Avversario</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Match Info Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div></div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {match.status === 'FINISHED' && onReport && (
                      <button
                        onClick={() => onReport(match)}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Report partita"
                      >
                        <Trophy className="w-5 h-5" />
                      </button>
                    )}
                    {match.status !== 'FINISHED' && (
                      <button
                        onClick={() => onManage(match)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Gestisci partita"
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(match)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Modifica partita"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(match.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Elimina partita"
                    >
                      <Trash2 className="w-5 h-5" />
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