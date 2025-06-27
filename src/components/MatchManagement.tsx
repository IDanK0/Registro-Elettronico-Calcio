import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Minus, 
  Target, 
  Users, 
  ArrowLeftRight, 
  AlertTriangle,
  Timer,
  Activity,
  Flag,
  Zap,
  Ban,
  UserX,
  Calendar,
  FileText,
  Trash2,
  Settings,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { Match, Player, MatchPeriod, UserWithGroup } from '../types';

interface MatchManagementProps {
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
  getPlayerJerseyNumber: (playerId: string) => number | undefined;
  manageError: string | null;
}

export function MatchManagement({
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
}: MatchManagementProps) {
  const [activeView, setActiveView] = useState<'overview' | 'field' | 'events' | 'stats'>('overview');
  const [showFieldVisualization, setShowFieldVisualization] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

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

  // Eventi recenti (ultimi 5)
  const recentEvents = [...match.events, ...match.substitutions.map(s => ({
    ...s,
    type: 'substitution' as const
  }))]
    .sort((a, b) => {
      if (b.minute !== a.minute) return b.minute - a.minute;
      return (b.second || 0) - (a.second || 0);
    })
    .slice(0, 5);

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

      {/* Header con informazioni partita */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">vs {match.opponent}</h1>
            <p className="text-blue-100 text-sm">
              {match.date} • {match.homeAway === 'home' ? 'Casa' : 'Trasferta'}
              {match.location && ` • ${match.location}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {match.homeAway === 'home' ? match.homeScore : match.awayScore}
              <span className="text-blue-200 mx-2">-</span>
              {match.homeAway === 'home' ? match.awayScore : match.homeScore}
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()} text-white mt-2`}>
              <Clock className="w-3.5 h-3.5" />
              {getStatusText()}
            </div>
          </div>
        </div>

        {/* Timer centrale */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <div className="text-5xl font-mono font-bold mb-4">
            {formatTime(currentTime)}
          </div>
          <div className="flex justify-center gap-3">
            {!hasMatchStarted ? (
              <button
                onClick={onTimerStart}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                <Play className="w-5 h-5" />
                Inizia Partita
              </button>
            ) : (
              <>
                {isTimerRunning ? (
                  <button
                    onClick={onTimerPause}
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    Pausa
                  </button>
                ) : (
                  <button
                    onClick={onTimerStart}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Riprendi
                  </button>
                )}
                <button
                  onClick={onTimerInterval}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Timer className="w-4 h-4" />
                  Intervallo
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'overview', label: 'Panoramica', icon: Activity },
          { id: 'field', label: 'Campo', icon: Users },
          { id: 'events', label: 'Eventi', icon: FileText },
          { id: 'stats', label: 'Statistiche', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${
              activeView === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content based on active view */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goal Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goal Counters */}
            <div className="grid grid-cols-2 gap-4">
              {/* Nossa Squadra */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Nostra Squadra</h3>
                  <div className="text-4xl font-bold text-blue-600 my-2">
                    {match.homeAway === 'home' ? match.homeScore : match.awayScore}
                  </div>
                </div>
                <div className="space-y-3">
                  <select
                    value={selectedHomeScorer}
                    onChange={e => onSelectHomeScorer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <div className="flex gap-2">
                    <button
                      onClick={onHomeGoal}
                      disabled={!selectedHomeScorer || match.status === 'finished' || currentPeriod?.type === 'interval'}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Goal
                    </button>
                    <button
                      onClick={onHomeGoalRemove}
                      disabled={match.status === 'finished' || (match.homeAway === 'home' ? match.homeScore : match.awayScore) === 0}
                      className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Squadra Avversaria */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{match.opponent}</h3>
                  <div className="text-4xl font-bold text-red-600 my-2">
                    {match.homeAway === 'home' ? match.awayScore : match.homeScore}
                  </div>
                </div>
                <div className="space-y-3">
                  <select
                    value={selectedAwayScorer}
                    onChange={e => onSelectAwayScorer(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={match.status === 'finished' || currentPeriod?.type === 'interval'}
                  >
                    <option value="">Maglia avversaria</option>
                    {match.opponentLineup.map(num => (
                      <option key={num} value={num}>#{num}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={onAwayGoal}
                      disabled={!selectedAwayScorer || match.status === 'finished' || currentPeriod?.type === 'interval'}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Goal
                    </button>
                    <button
                      onClick={onAwayGoalRemove}
                      disabled={match.status === 'finished' || (match.homeAway === 'home' ? match.awayScore : match.homeScore) === 0}
                      className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Azioni Rapide</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={onSubstitution}
                  disabled={match.status === 'finished' || currentPeriod?.type === 'interval'}
                  className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Sostituzione
                </button>
                <button
                  onClick={onAmmonition}
                  disabled={match.status === 'finished' || currentPeriod?.type === 'interval'}
                  className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Ammonizione
                </button>
                <button
                  onClick={onOtherEvents}
                  disabled={match.status === 'finished' || currentPeriod?.type === 'interval'}
                  className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  Altri Eventi
                </button>
              </div>
            </div>

            {/* Cronologie Complete */}
            <MatchEventChronologies 
              match={match}
              players={players}
              onRemoveEvent={onRemoveEvent}
              onRemoveSubstitution={onRemoveSubstitution}
              currentPeriodIndex={currentPeriodIndex}
            />
          </div>

          {/* Sidebar con eventi recenti */}
          <div className="space-y-6">
            {/* Periodi */}
            {hasMatchStarted && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Periodi</h3>
                <div className="space-y-2">
                  {match.periods?.map((period, index) => {
                    const isCurrent = index === currentPeriodIndex;
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 ${
                          isCurrent
                            ? period.type === 'regular'
                              ? 'border-green-400 bg-green-50'
                              : period.type === 'interval'
                              ? 'border-orange-400 bg-orange-50'
                              : 'border-purple-400 bg-purple-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${isCurrent ? 'text-gray-800' : 'text-gray-600'}`}>
                            {period.label}
                          </span>
                          <span className={`text-sm ${isCurrent ? 'text-gray-700' : 'text-gray-500'}`}>
                            {formatTime(period.duration)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Period controls */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => onAddPeriod('regular')}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Tempo
                  </button>
                  <button
                    onClick={() => onAddPeriod('extra')}
                    className="flex-1 flex items-center justify-center gap-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Extra
                  </button>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={onRemoveLastPeriod}
                    disabled={!match.periods || match.periods.length <= 1}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Minus className="w-3 h-3" />
                    Rimuovi
                  </button>
                  <button
                    onClick={onFinishMatch}
                    className="flex-1 flex items-center justify-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Square className="w-3 h-3" />
                    Termina
                  </button>
                </div>
              </div>
            )}

            {/* Eventi recenti */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Eventi Recenti</h3>
              <div className="space-y-3">
                {recentEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Nessun evento registrato</p>
                ) : (
                  recentEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-12 text-center">
                        <span className="text-xs font-bold text-gray-600">
                          {event.minute}:{(event.second || 0).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex-1 text-sm text-gray-800">
                        {event.description || 
                          (event.type === 'substitution' && 'Sostituzione') ||
                          'Evento'
                        }
                      </div>
                      <button
                        onClick={() => event.type === 'substitution' 
                          ? onRemoveSubstitution(event.id)
                          : onRemoveEvent(event.id)
                        }
                        className="flex-shrink-0 p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'field' && (
        <div className="space-y-6">
          {/* Toggle per visualizzazione campo */}
          <div className="flex items-center justify-between bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800">Visualizzazione Campo</h3>
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
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  In Campo ({getPlayersOnField().length})
                </h3>
                <div className="space-y-3">
                  {getPlayersOnField().length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nessun giocatore in campo</p>
                  ) : (
                    getPlayersOnField().map(player => {
                      const matchPlayer = match.lineup.find(mp => mp.playerId === player.id);
                      return (
                        <div key={player.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                            {matchPlayer?.jerseyNumber}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {player.firstName} {player.lastName}
                            </div>
                            <div className="text-sm text-green-600">{matchPlayer?.position}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* In Panchina */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  In Panchina ({getPlayersOnBench().length})
                </h3>
                <div className="space-y-3">
                  {getPlayersOnBench().length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nessun giocatore in panchina</p>
                  ) : (
                    getPlayersOnBench().map(player => {
                      const jerseyNumber = getPlayerJerseyNumber(player.id);
                      return (
                        <div key={player.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                            {jerseyNumber || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {player.firstName} {player.lastName}
                            </div>
                            <div className="text-sm text-blue-600">Panchina</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'events' && (
        <EventsTimeline 
          match={match}
          players={players}
          onRemoveEvent={onRemoveEvent}
          onRemoveSubstitution={onRemoveSubstitution}
          formatTime={formatTime}
          getPlayerJerseyNumber={getPlayerJerseyNumber}
        />
      )}

      {activeView === 'stats' && (
        <MatchStats match={match} />
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
  getPlayerJerseyNumber: (playerId: string) => number | undefined;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Campo di Gioco</h3>
      
      {/* Campo di calcio stilizzato */}
      <div className="relative bg-green-500 rounded-lg p-8 min-h-[400px]" style={{ backgroundImage: 'linear-gradient(90deg, #22c55e 50%, #16a34a 50%)' }}>
        {/* Linee del campo */}
        <div className="absolute inset-4 border-2 border-white rounded">
          {/* Linea di metà campo */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white"></div>
          {/* Cerchio di centrocampo */}
          <div className="absolute left-1/2 top-1/2 w-24 h-24 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Area di rigore sinistra */}
          <div className="absolute left-0 top-1/2 w-16 h-32 border-2 border-white border-l-0 -translate-y-1/2"></div>
          {/* Area di rigore destra */}
          <div className="absolute right-0 top-1/2 w-16 h-32 border-2 border-white border-r-0 -translate-y-1/2"></div>
          
          {/* Porte */}
          <div className="absolute left-0 top-1/2 w-2 h-16 bg-white -translate-y-1/2 -translate-x-1"></div>
          <div className="absolute right-0 top-1/2 w-2 h-16 bg-white -translate-y-1/2 translate-x-1"></div>
        </div>

        {/* Posizionamento giocatori */}
        <div className="absolute inset-8">
          {match.lineup.map((matchPlayer, index) => {
            const player = players.find(p => p.id === matchPlayer.playerId);
            if (!player) return null;

            // Posizionamento semplificato basato sulla posizione (mock data)
            const positions = {
              'Portiere': { left: '5%', top: '45%' },
              'Difensore': { left: `${20 + (index % 3) * 10}%`, top: `${30 + (index % 2) * 40}%` },
              'Centrocampista': { left: `${45 + (index % 3) * 5}%`, top: `${25 + (index % 3) * 25}%` },
              'Attaccante': { left: `${75 + (index % 2) * 10}%`, top: `${35 + (index % 2) * 30}%` },
            };

            const position = positions[matchPlayer.position as keyof typeof positions] || 
                           { left: `${30 + (index % 4) * 20}%`, top: `${30 + (index % 3) * 20}%` };

            return (
              <div
                key={player.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={position}
              >
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white">
                  {matchPlayer.jerseyNumber}
                </div>
                <div className="text-xs text-white text-center mt-1 font-medium bg-black/50 px-2 py-1 rounded">
                  {player.lastName}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Componente per la timeline degli eventi
function EventsTimeline({ 
  match, 
  players, 
  onRemoveEvent, 
  onRemoveSubstitution, 
  formatTime,
  getPlayerJerseyNumber 
}: {
  match: Match;
  players: Player[];
  onRemoveEvent: (eventId: string) => void;
  onRemoveSubstitution: (subId: string) => void;
  formatTime: (seconds: number) => string;
  getPlayerJerseyNumber: (playerId: string) => number | undefined;
}) {
  const allEvents = [
    ...match.events.map(e => ({ ...e, category: 'event' as const })),
    ...match.substitutions.map(s => ({ ...s, category: 'substitution' as const, type: 'substitution' as const }))
  ].sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute;
    return (a.second || 0) - (b.second || 0);
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal': return { icon: Target, color: 'text-green-600', bg: 'bg-green-50' };
      case 'yellow-card': return { icon: Square, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'red-card': return { icon: Square, color: 'text-red-600', bg: 'bg-red-50' };
      case 'substitution': return { icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'foul': return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'corner': return { icon: Flag, color: 'text-purple-600', bg: 'bg-purple-50' };
      default: return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Timeline Eventi</h3>
      
      {allEvents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nessun evento registrato</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allEvents.map(event => {
            const { icon: Icon, color, bg } = getEventIcon(event.type);
            
            return (
              <div key={event.id} className={`flex items-start gap-4 p-4 ${bg} rounded-lg border group`}>
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full ${bg} border-2 border-current ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">
                      {event.minute}:{(event.second || 0).toString().padStart(2, '0')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
                      {event.type === 'substitution' ? 'Sostituzione' : event.type}
                    </span>
                  </div>
                  
                  <p className="text-gray-700">
                    {event.description || 
                      (event.category === 'substitution' && 'Sostituzione effettuata') ||
                      'Evento registrato'
                    }
                  </p>
                </div>
                
                <button
                  onClick={() => event.category === 'substitution' 
                    ? onRemoveSubstitution(event.id)
                    : onRemoveEvent(event.id)
                  }
                  className="flex-shrink-0 p-2 text-red-500 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Componente per le statistiche della partita
function MatchStats({ match }: { match: Match }) {
  const stats = [
    { 
      label: 'Possesso Palla', 
      home: match.possessionHome || 0, 
      away: match.possessionAway || 0,
      unit: '%'
    },
    { 
      label: 'Tiri Totali', 
      home: match.totalShotsHome || 0, 
      away: match.totalShotsAway || 0 
    },
    { 
      label: 'Tiri in Porta', 
      home: match.shotsOnTargetHome || 0, 
      away: match.shotsOnTargetAway || 0 
    },
    { 
      label: 'Falli Commessi', 
      home: match.foulsCommittedHome || 0, 
      away: match.foulsCommittedAway || 0 
    },
    { 
      label: 'Calci d\'Angolo', 
      home: match.cornersHome || 0, 
      away: match.cornersAway || 0 
    },
    { 
      label: 'Fuorigioco', 
      home: match.offsideHome || 0, 
      away: match.offsideAway || 0 
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Statistiche Partita</h3>
      
      <div className="space-y-6">
        {stats.map(stat => {
          const total = stat.home + stat.away;
          const homePercentage = total > 0 ? (stat.home / total) * 100 : 50;
          const awayPercentage = total > 0 ? (stat.away / total) * 100 : 50;
          
          return (
            <div key={stat.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{stat.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-blue-600 font-bold">
                    {stat.home}{stat.unit || ''}
                  </span>
                  <span className="text-gray-400">-</span>
                  <span className="text-red-600 font-bold">
                    {stat.away}{stat.unit || ''}
                  </span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
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
