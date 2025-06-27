import React, { useState } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Target, 
  Users, 
  Activity,
  FileText,
  TrendingUp,
  Eye,
  EyeOff,
  Timer,
  ArrowLeftRight,
  AlertTriangle,
  Flag,
  Plus,
  Minus,
  Square,
  Trash2,
  Ban,
  UserX,
  Calendar,
  Zap
} from 'lucide-react';
import { Match, Player, UserWithGroup } from '../types';

interface EnhancedMatchManagementProps {
  match: Match;
  players: Player[];
  users: UserWithGroup[];
  currentPeriodIndex: number;
  isTimerRunning: boolean;
  currentTime: number;
  onTimerStart: () => void;
  onTimerPause: () => void;
  onTimerInterval: () => void;
  onAddPeriod: (type: 'regular' | 'extra') => void;
  onRemoveLastPeriod: (event: React.MouseEvent) => void;
  onFinishMatch: (event: React.MouseEvent) => void;
  onHomeGoal: () => void;
  onAwayGoal: () => void;
  onHomeGoalRemove: () => void;
  onAwayGoalRemove: () => void;
  onSubstitution: () => void;
  onAmmonition: () => void;
  onOtherEvents: () => void;
  onRemoveEvent: (eventId: string) => void;
  onRemoveSubstitution: (subId: string) => void;
  selectedHomeScorer: string;
  selectedAwayScorer: number | '';
  onSelectHomeScorer: (playerId: string) => void;
  onSelectAwayScorer: (jerseyNumber: number | '') => void;
  formatTime: (seconds: number) => string;
  getPlayersOnField: () => Player[];
  getPlayersOnBench: () => Player[];
  getPlayerJerseyNumber: (playerId: string) => number | null | undefined;
  manageError: string | null;
}

export function EnhancedMatchManagement({
  match,
  players,
  currentPeriodIndex,
  isTimerRunning,
  currentTime,
  onTimerStart,
  onTimerPause,
  onTimerInterval,
  onAddPeriod,
  onRemoveLastPeriod,
  onFinishMatch,
  onHomeGoal,
  onAwayGoal,
  onHomeGoalRemove,
  onAwayGoalRemove,
  onSubstitution,
  onAmmonition,
  onOtherEvents,
  onRemoveEvent,
  onRemoveSubstitution,
  selectedHomeScorer,
  selectedAwayScorer,
  onSelectHomeScorer,
  onSelectAwayScorer,
  formatTime,
  getPlayersOnField,
  getPlayersOnBench,
  getPlayerJerseyNumber,
  manageError
}: EnhancedMatchManagementProps) {
  const [activeView, setActiveView] = useState<'overview' | 'field' | 'events' | 'stats'>('overview');
  const [showFieldVisualization, setShowFieldVisualization] = useState(false);

  const currentPeriod = match.periods?.[currentPeriodIndex];
  const hasMatchStarted = match.periods?.some(p => p.duration > 0) || false;
  
  const getStatusColor = () => {
    if (!currentPeriod || !hasMatchStarted) return 'bg-gray-500';
    if (currentPeriod.type === 'extra') return 'bg-purple-500';
    if (currentPeriod.type === 'interval') return 'bg-orange-500';
    return isTimerRunning ? 'bg-green-500' : 'bg-yellow-500';
  };

  const getStatusText = () => {
    if (!currentPeriod) return 'Pre-Partita';
    if (!hasMatchStarted) return 'Pre-Partita';
    if (currentPeriod.type === 'interval') return currentPeriod.label;
    return currentPeriod.label;
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {manageError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Errore di Gestione</h4>
            <p className="text-red-700 text-sm mt-1">{manageError}</p>
          </div>
        </div>
      )}

      {/* Header migliorato con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">vs {match.opponent}</h1>
            <div className="flex items-center gap-4 text-blue-100">
              <span>{match.date}</span>
              <span>•</span>
              <span>{match.homeAway === 'home' ? 'Casa' : 'Trasferta'}</span>
              {match.location && (
                <>
                  <span>•</span>
                  <span>{match.location}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold mb-2">
              {match.homeAway === 'home' ? match.homeScore : match.awayScore}
              <span className="text-blue-200 mx-3">-</span>
              {match.homeAway === 'home' ? match.awayScore : match.homeScore}
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor()} text-white`}>
              <Clock className="w-4 h-4" />
              {getStatusText()}
            </div>
          </div>
        </div>

        {/* Timer centrale migliorato */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <div className="text-6xl font-mono font-bold mb-4 tracking-wide">
            {formatTime(currentTime)}
          </div>
          <div className="flex justify-center gap-4">
            {!hasMatchStarted ? (
              <button
                onClick={onTimerStart}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg transform hover:scale-105"
              >
                <Play className="w-5 h-5" />
                Inizia Partita
              </button>
            ) : (
              <>
                {isTimerRunning ? (
                  <button
                    onClick={onTimerPause}
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg"
                  >
                    <Pause className="w-4 h-4" />
                    Pausa
                  </button>
                ) : (
                  <button
                    onClick={onTimerStart}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg"
                  >
                    <Play className="w-4 h-4" />
                    Riprendi
                  </button>
                )}
                <button
                  onClick={onTimerInterval}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg"
                >
                  <Timer className="w-4 h-4" />
                  Intervallo
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation tabs migliorata */}
      <div className="flex gap-2 bg-gray-100 p-2 rounded-xl shadow-inner">
        {[
          { id: 'overview', label: 'Panoramica', icon: Activity },
          { id: 'field', label: 'Campo', icon: Users },
          { id: 'events', label: 'Eventi', icon: FileText },
          { id: 'stats', label: 'Statistiche', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 flex-1 justify-center font-medium ${
              activeView === tab.id
                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenuto basato sulla vista attiva */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sezione Goal migliorata */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Nostra Squadra */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Nostra Squadra</h3>
                  <div className="text-5xl font-bold text-blue-600 mb-4">
                    {match.homeAway === 'home' ? match.homeScore : match.awayScore}
                  </div>
                </div>
                <div className="space-y-4">
                  <select
                    value={selectedHomeScorer}
                    onChange={e => onSelectHomeScorer(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={match.status === 'finished' || currentPeriod?.type === 'interval'}
                  >
                    <option value="">Seleziona marcatore</option>
                    {match.lineup.map(matchPlayer => {
                      const player = players.find(p => p.id === matchPlayer.playerId);
                      if (!player) return null;
                      return (
                        <option key={player.id} value={player.id}>
                          #{matchPlayer.jerseyNumber} {player.firstName} {player.lastName}
                        </option>
                      );
                    })}
                  </select>
                  <div className="flex gap-3">
                    <button
                      onClick={onHomeGoal}
                      disabled={!selectedHomeScorer || match.status === 'finished' || currentPeriod?.type === 'interval'}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      Goal
                    </button>
                    <button
                      onClick={onHomeGoalRemove}
                      disabled={match.status === 'finished' || (match.homeAway === 'home' ? match.homeScore : match.awayScore) === 0}
                      className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-md"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Squadra Avversaria */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{match.opponent}</h3>
                  <div className="text-5xl font-bold text-red-600 mb-4">
                    {match.homeAway === 'home' ? match.awayScore : match.homeScore}
                  </div>
                </div>
                <div className="space-y-4">
                  <select
                    value={selectedAwayScorer}
                    onChange={e => onSelectAwayScorer(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    disabled={match.status === 'finished' || currentPeriod?.type === 'interval'}
                  >
                    <option value="">Maglia avversaria</option>
                    {match.opponentLineup.map(num => (
                      <option key={num} value={num}>#{num}</option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <button
                      onClick={onAwayGoal}
                      disabled={!selectedAwayScorer || match.status === 'finished' || currentPeriod?.type === 'interval'}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      Goal
                    </button>
                    <button
                      onClick={onAwayGoalRemove}
                      disabled={match.status === 'finished' || (match.homeAway === 'home' ? match.awayScore : match.homeScore) === 0}
                      className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-md"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Azioni Rapide */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Azioni Rapide</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={onSubstitution}
                  disabled={match.status === 'finished' || currentPeriod?.type === 'interval'}
                  className="flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-4 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                  Sostituzione
                </button>
                <button
                  onClick={onAmmonition}
                  disabled={match.status === 'finished' || currentPeriod?.type === 'interval'}
                  className="flex items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white px-6 py-4 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Ammonizione
                </button>
                <button
                  onClick={onOtherEvents}
                  disabled={match.status === 'finished' || currentPeriod?.type === 'interval'}
                  className="flex items-center justify-center gap-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-6 py-4 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  <Flag className="w-5 h-5" />
                  Altri Eventi
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar migliorata */}
          <div className="space-y-6">
            {/* Periodi */}
            {hasMatchStarted && (
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Periodi</h3>
                <div className="space-y-3">
                  {match.periods?.map((period, index) => {
                    const isCurrent = index === currentPeriodIndex;
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          isCurrent
                            ? period.type === 'regular'
                              ? 'border-green-400 bg-green-50 shadow-md'
                              : period.type === 'interval'
                              ? 'border-orange-400 bg-orange-50 shadow-md'
                              : 'border-purple-400 bg-purple-50 shadow-md'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold ${isCurrent ? 'text-gray-800' : 'text-gray-600'}`}>
                            {period.label}
                          </span>
                          <span className={`text-sm font-mono ${isCurrent ? 'text-gray-700' : 'text-gray-500'}`}>
                            {formatTime(period.duration)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Controlli periodo */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={() => onAddPeriod('regular')}
                    className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-md text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Tempo
                  </button>
                  <button
                    onClick={() => onAddPeriod('extra')}
                    className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-md text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Extra
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    onClick={onRemoveLastPeriod}
                    disabled={!match.periods || match.periods.length <= 1}
                    className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-md text-sm"
                  >
                    <Minus className="w-4 h-4" />
                    Rimuovi
                  </button>
                  <button
                    onClick={onFinishMatch}
                    className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-md text-sm"
                  >
                    <Square className="w-4 h-4" />
                    Termina
                  </button>
                </div>
              </div>
            )}

            {/* Eventi Recenti */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Eventi Recenti
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(() => {
                  const recentEvents = [...match.events, ...match.substitutions.map(s => ({
                    ...s,
                    type: 'substitution' as const
                  }))]
                    .sort((a, b) => {
                      if (b.minute !== a.minute) return b.minute - a.minute;
                      return (b.second || 0) - (a.second || 0);
                    })
                    .slice(0, 8);

                  if (recentEvents.length === 0) {
                    return (
                      <p className="text-gray-500 text-center py-8 text-sm">
                        Nessun evento registrato
                      </p>
                    );
                  }

                  return recentEvents.map((event, index) => {
                    let icon = <Activity className="w-4 h-4" />;
                    let colorClass = 'bg-gray-100 text-gray-600';
                    
                    if (event.type === 'goal') {
                      icon = <Target className="w-4 h-4" />;
                      colorClass = event.description?.includes('avversario') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';
                    } else if (['yellow-card', 'red-card', 'second-yellow-card', 'blue-card'].includes(event.type)) {
                      icon = <Square className="w-4 h-4" />;
                      colorClass = event.type === 'red-card' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600';
                    } else if (event.type === 'substitution') {
                      icon = <ArrowLeftRight className="w-4 h-4" />;
                      colorClass = 'bg-blue-100 text-blue-600';
                    }

                    return (
                      <div key={`${event.type}-${index}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <span className="font-mono font-bold">
                              {event.minute}:{(event.second || 0).toString().padStart(2, '0')}
                            </span>
                            <span className="capitalize">
                              {event.type === 'substitution' ? 'Sostituzione' : 
                               event.type === 'goal' ? 'Goal' :
                               event.type === 'yellow-card' ? 'Giallo' :
                               event.type === 'red-card' ? 'Rosso' :
                               event.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 truncate">
                            {event.type === 'substitution' ? 
                              `${players.find(p => p.id === (event as any).playerOut)?.lastName || 'Sconosciuto'} ↔ ${players.find(p => p.id === (event as any).playerIn)?.lastName || 'Sconosciuto'}` :
                              event.description
                            }
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Altre viste placeholder */}
      {activeView === 'field' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Visualizzazione Campo</h3>
            <button
              onClick={() => setShowFieldVisualization(!showFieldVisualization)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {showFieldVisualization ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showFieldVisualization ? 'Vista Lista' : 'Vista Campo'}
            </button>
          </div>
          
          {showFieldVisualization ? (
            <FieldVisualization 
              match={match}
              players={players}
              getPlayerJerseyNumber={getPlayerJerseyNumber}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* In Campo */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  In Campo ({getPlayersOnField().length})
                </h4>
                <div className="space-y-3">
                  {getPlayersOnField().map(player => {
                    const matchPlayer = match.lineup.find(mp => mp.playerId === player.id);
                    return (
                      <div key={player.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                          {matchPlayer?.jerseyNumber}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {player.firstName} {player.lastName}
                          </div>
                          <div className="text-sm text-green-600">{matchPlayer?.position}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* In Panchina */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  In Panchina ({getPlayersOnBench().length})
                </h4>
                <div className="space-y-3">
                  {getPlayersOnBench().map(player => {
                    const jerseyNumber = getPlayerJerseyNumber(player.id);
                    return (
                      <div key={player.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          {jerseyNumber || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {player.firstName} {player.lastName}
                          </div>
                          <div className="text-sm text-blue-600">Panchina</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'events' && (
        <MatchEventChronologies
          match={match}
          players={players}
          onRemoveEvent={onRemoveEvent}
          onRemoveSubstitution={onRemoveSubstitution}
          currentPeriodIndex={currentPeriodIndex}
        />
      )}

      {activeView === 'stats' && (
        <MatchStats match={match} />
      )}
    </div>
  );
}

// Componente per le cronologie complete degli eventi
function MatchEventChronologies({ 
  match, 
  players, 
  onRemoveEvent, 
  onRemoveSubstitution, 
  currentPeriodIndex 
}: {
  match: Match;
  players: Player[];
  onRemoveEvent: (eventId: string) => void;
  onRemoveSubstitution: (subId: string) => void;
  currentPeriodIndex: number;
}) {
  // Filtra goal
  const goals = match.events.filter(e => e.type === 'goal');
  
  // Filtra ammonizioni
  const cards = match.events.filter(e => 
    ['yellow-card', 'red-card', 'second-yellow-card', 'blue-card', 'expulsion', 'warning'].includes(e.type)
  );
  
  // Filtra altri eventi
  const otherEvents = match.events.filter(e => 
    ['foul', 'corner', 'offside', 'free-kick', 'penalty', 'throw-in', 'injury'].includes(e.type)
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'foul': return { icon: AlertTriangle, color: 'text-orange-600' };
      case 'corner': return { icon: Flag, color: 'text-blue-600' };
      case 'offside': return { icon: Ban, color: 'text-red-600' };
      case 'free-kick': return { icon: Zap, color: 'text-green-600' };
      case 'penalty': return { icon: Calendar, color: 'text-purple-600' };
      case 'throw-in': return { icon: UserX, color: 'text-gray-600' };
      case 'injury': return { icon: UserX, color: 'text-red-500' };
      default: return { icon: FileText, color: 'text-gray-600' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Cronologia Goal */}
      {goals.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Cronologia Goal ({goals.length})
          </h3>
          <div className="space-y-3">
            {goals
              .sort((a, b) => {
                if (b.minute !== a.minute) return b.minute - a.minute;
                return (b.second || 0) - (a.second || 0);
              })
              .map(goal => (
                <div
                  key={goal.id}
                  className={`flex items-center gap-4 p-3 rounded-lg group relative ${
                    goal.description?.includes('avversario') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    goal.description?.includes('avversario') ? 'bg-red-500' : 'bg-green-500'
                  }`}>
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${
                        goal.description?.includes('avversario') ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {goal.minute}:{(goal.second || 0).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-gray-800">{goal.description}</p>
                  </div>
                  <button
                    onClick={() => onRemoveEvent(goal.id)}
                    disabled={match.periods?.[currentPeriodIndex]?.type === 'interval'}
                    className="flex-shrink-0 p-2 text-red-500 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-all disabled:text-gray-400"
                    title="Rimuovi goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Cronologia Ammonizioni */}
      {cards.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Cronologia Ammonizioni ({cards.length})
          </h3>
          <div className="space-y-3">
            {cards
              .sort((a, b) => {
                if (b.minute !== a.minute) return b.minute - a.minute;
                return (b.second || 0) - (a.second || 0);
              })
              .map(card => {
                let colorClass = 'bg-yellow-50 border-yellow-200';
                let iconColor = 'text-yellow-600';
                let bgColor = 'bg-yellow-500';
                
                if (card.type === 'red-card' || card.type === 'expulsion') {
                  colorClass = 'bg-red-50 border-red-200';
                  iconColor = 'text-red-600';
                  bgColor = 'bg-red-500';
                } else if (card.type === 'second-yellow-card') {
                  colorClass = 'bg-orange-50 border-orange-200';
                  iconColor = 'text-orange-600';
                  bgColor = 'bg-orange-500';
                } else if (card.type === 'blue-card') {
                  colorClass = 'bg-blue-50 border-blue-200';
                  iconColor = 'text-blue-600';
                  bgColor = 'bg-blue-500';
                }

                return (
                  <div key={card.id} className={`flex items-center gap-4 p-3 rounded-lg border group relative ${colorClass}`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white ${bgColor}`}>
                      {card.type === 'expulsion' ? (
                        <Ban className="w-5 h-5" />
                      ) : card.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold ${iconColor}`}>
                          {card.minute}:{(card.second || 0).toString().padStart(2, '0')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass} ${iconColor}`}>
                          {card.type === 'yellow-card' && 'Giallo'}
                          {card.type === 'red-card' && 'Rosso'}
                          {card.type === 'second-yellow-card' && 'Secondo Giallo'}
                          {card.type === 'blue-card' && 'Blu'}
                          {card.type === 'expulsion' && 'Espulsione'}
                          {card.type === 'warning' && 'Richiamo'}
                        </span>
                      </div>
                      <p className="text-gray-800">{card.description}</p>
                    </div>
                    <button
                      onClick={() => onRemoveEvent(card.id)}
                      disabled={match.periods?.[currentPeriodIndex]?.type === 'interval'}
                      className="flex-shrink-0 p-2 text-red-500 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-all disabled:text-gray-400"
                      title="Rimuovi ammonizione"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Cronologia Sostituzioni */}
      {match.substitutions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            Sostituzioni ({match.substitutions.length})
          </h3>
          <div className="space-y-3">
            {match.substitutions
              .slice()
              .sort((a, b) => {
                if (b.minute !== a.minute) return b.minute - a.minute;
                return (b.second || 0) - (a.second || 0);
              })
              .map(sub => {
                const playerOut = players.find(p => p.id === sub.playerOut);
                const playerIn = players.find(p => p.id === sub.playerIn);
                
                return (
                  <div key={sub.id} className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg group relative">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-blue-600">
                          {sub.minute}:{(sub.second || 0).toString().padStart(2, '0')}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                          Sostituzione
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-red-600 font-medium">Esce:</span>
                          <span className="text-gray-800">
                            {sub.playerOutJerseyNumber ? `#${sub.playerOutJerseyNumber}` : '#'} {playerOut ? `${playerOut.firstName} ${playerOut.lastName}` : sub.playerOut}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600 font-medium">Entra:</span>
                          <span className="text-gray-800">
                            {sub.playerInJerseyNumber ? `#${sub.playerInJerseyNumber}` : '#'} {playerIn ? `${playerIn.firstName} ${playerIn.lastName}` : sub.playerIn}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveSubstitution(sub.id)}
                      disabled={match.periods?.[currentPeriodIndex]?.type === 'interval'}
                      className="flex-shrink-0 p-2 text-red-500 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-all disabled:text-gray-400"
                      title="Rimuovi sostituzione"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Cronologia Altri Eventi */}
      {otherEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Altri Eventi ({otherEvents.length})
          </h3>
          <div className="space-y-3">
            {otherEvents
              .sort((a, b) => {
                if (b.minute !== a.minute) return b.minute - a.minute;
                return (b.second || 0) - (a.second || 0);
              })
              .map(event => {
                const { icon: Icon, color } = getEventIcon(event.type);
                
                return (
                  <div key={event.id} className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg group relative">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-500 text-white rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-600">
                          {event.minute}:{(event.second || 0).toString().padStart(2, '0')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 ${color}`}>
                          {event.type === 'foul' && 'Fallo'}
                          {event.type === 'corner' && 'Calcio d\'angolo'}
                          {event.type === 'offside' && 'Fuorigioco'}
                          {event.type === 'free-kick' && 'Calcio di punizione'}
                          {event.type === 'penalty' && 'Rigore'}
                          {event.type === 'throw-in' && 'Rimessa laterale'}
                          {event.type === 'injury' && 'Infortunio'}
                        </span>
                      </div>
                      <p className="text-gray-800">{event.description}</p>
                    </div>
                    <button
                      onClick={() => onRemoveEvent(event.id)}
                      disabled={match.periods?.[currentPeriodIndex]?.type === 'interval'}
                      className="flex-shrink-0 p-2 text-red-500 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-all disabled:text-gray-400"
                      title="Rimuovi evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente per la visualizzazione del campo
function FieldVisualization({ 
  match, 
  players, 
  getPlayerJerseyNumber 
}: { 
  match: Match; 
  players: Player[]; 
  getPlayerJerseyNumber: (playerId: string) => number | null | undefined;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Campo di Gioco</h3>
      
      {/* Campo di calcio stilizzato */}
      <div className="relative bg-green-500 rounded-xl p-12 min-h-[500px] shadow-inner" style={{ backgroundImage: 'linear-gradient(90deg, #22c55e 50%, #16a34a 50%)' }}>
        {/* Linee del campo */}
        <div className="absolute inset-6 border-2 border-white rounded-lg">
          {/* Linea di metà campo */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white"></div>
          {/* Cerchio di centrocampo */}
          <div className="absolute left-1/2 top-1/2 w-32 h-32 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Area di rigore sinistra */}
          <div className="absolute left-0 top-1/2 w-20 h-40 border-2 border-white border-l-0 -translate-y-1/2"></div>
          <div className="absolute left-0 top-1/2 w-12 h-24 border-2 border-white border-l-0 -translate-y-1/2"></div>
          
          {/* Area di rigore destra */}
          <div className="absolute right-0 top-1/2 w-20 h-40 border-2 border-white border-r-0 -translate-y-1/2"></div>
          <div className="absolute right-0 top-1/2 w-12 h-24 border-2 border-white border-r-0 -translate-y-1/2"></div>
          
          {/* Porte */}
          <div className="absolute left-0 top-1/2 w-3 h-20 bg-white -translate-y-1/2 -translate-x-1.5 rounded-sm"></div>
          <div className="absolute right-0 top-1/2 w-3 h-20 bg-white -translate-y-1/2 translate-x-1.5 rounded-sm"></div>
          
          {/* Punti di rigore */}
          <div className="absolute left-16 top-1/2 w-2 h-2 bg-white rounded-full -translate-y-1/2"></div>
          <div className="absolute right-16 top-1/2 w-2 h-2 bg-white rounded-full -translate-y-1/2"></div>
        </div>

        {/* Posizionamento giocatori */}
        <div className="absolute inset-12">
          {match.lineup.map((matchPlayer, index) => {
            const player = players.find(p => p.id === matchPlayer.playerId);
            if (!player) return null;

            // Posizionamento migliorato basato sulla posizione
            const getPlayerPosition = (position: string, index: number) => {
              const positions = {
                'defense': [
                  { left: '15%', top: '20%' },  // Difensore sinistro
                  { left: '15%', top: '40%' },  // Difensore centrale sx
                  { left: '15%', top: '60%' },  // Difensore centrale dx
                  { left: '15%', top: '80%' },  // Difensore destro
                ],
                'midfield': [
                  { left: '45%', top: '25%' },  // Centrocampista sinistro
                  { left: '45%', top: '50%' },  // Centrocampista centrale
                  { left: '45%', top: '75%' },  // Centrocampista destro
                ],
                'forward': [
                  { left: '75%', top: '35%' },  // Attaccante sinistro
                  { left: '75%', top: '65%' },  // Attaccante destro
                ]
              };
              
              if (position.toLowerCase().includes('portiere')) {
                return { left: '5%', top: '50%' };
              } else if (position.toLowerCase().includes('difens')) {
                return positions.defense[index % positions.defense.length] || { left: `${15 + (index % 4) * 5}%`, top: `${20 + (index % 4) * 20}%` };
              } else if (position.toLowerCase().includes('centrocampi')) {
                return positions.midfield[index % positions.midfield.length] || { left: `${45 + (index % 3) * 5}%`, top: `${25 + (index % 3) * 25}%` };
              } else if (position.toLowerCase().includes('attaccan')) {
                return positions.forward[index % positions.forward.length] || { left: `${75 + (index % 2) * 5}%`, top: `${35 + (index % 2) * 30}%` };
              }
              
              // Posizione di fallback
              return { left: `${25 + (index % 4) * 20}%`, top: `${25 + (index % 3) * 25}%` };
            };

            const position = getPlayerPosition(matchPlayer.position, index);

            return (
              <div
                key={player.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                style={position}
                title={`${player.firstName} ${player.lastName} - ${matchPlayer.position}`}
              >
                <div className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white hover:bg-blue-700 transition-colors">
                  {matchPlayer.jerseyNumber}
                </div>
                <div className="text-xs text-white text-center mt-2 font-medium bg-black/70 px-2 py-1 rounded-md shadow-sm">
                  {player.lastName}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legenda */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Legenda Posizioni</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">P</div>
            <span className="text-gray-700">Portiere</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">D</div>
            <span className="text-gray-700">Difensore</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">C</div>
            <span className="text-gray-700">Centrocampista</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">A</div>
            <span className="text-gray-700">Attaccante</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente per le statistiche della partita
function MatchStats({ match }: { match: Match }) {
  // Calcola le statistiche di base
  const ourGoals = match.events.filter(e => e.type === 'goal' && e.description?.includes('(nostro)')).length;
  const opponentGoals = match.events.filter(e => e.type === 'goal' && e.description?.includes('avversario')).length;
  
  const totalCards = match.events.filter(e => 
    ['yellow-card', 'red-card', 'second-yellow-card', 'blue-card'].includes(e.type)
  ).length;
  
  const ourCards = match.events.filter(e => 
    ['yellow-card', 'red-card', 'second-yellow-card', 'blue-card'].includes(e.type) &&
    !e.description?.includes('avversario')
  ).length;
  
  const opponentCards = totalCards - ourCards;
  
  const totalSubstitutions = match.substitutions.length;
  
  const stats = [
    {
      label: 'Goal Totali',
      home: ourGoals,
      away: opponentGoals,
      unit: ''
    },
    {
      label: 'Cartellini',
      home: ourCards,
      away: opponentCards,
      unit: ''
    },
    {
      label: 'Sostituzioni',
      home: totalSubstitutions,
      away: 0,
      unit: ''
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        Statistiche Partita
      </h3>
      
      <div className="space-y-6">
        {stats.map((stat, index) => {
          const total = stat.home + stat.away;
          const homePercentage = total === 0 ? 50 : (stat.home / total) * 100;
          const awayPercentage = total === 0 ? 50 : (stat.away / total) * 100;
          
          return (
            <div key={index} className="space-y-3">
              {/* Header with values */}
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-bold">
                  {stat.home}{stat.unit || ''}
                </span>
                <span className="text-gray-700 font-medium">
                  {stat.label}
                </span>
                <span className="text-red-600 font-bold">
                  {stat.away}{stat.unit || ''}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${homePercentage}%` }}
                ></div>
                <div 
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${awayPercentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Riassunto tempo */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-semibold text-gray-800 mb-3">Riepilogo Tempi</h4>
        <div className="space-y-2">
          {match.periods?.map((period, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">{period.label}:</span>
              <span className="font-mono font-medium">
                {Math.floor(period.duration / 60)}:{(period.duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
