import React, { useState } from 'react';
import { Player, MatchEvent, MatchPlayer } from '../types';
import { X, AlertTriangle, Flag, Ban, Zap, UserX, Calendar } from 'lucide-react';

interface OtherEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  lineup: MatchPlayer[];
  currentTimeInSeconds: number;
  onEventAdd: (event: Omit<MatchEvent, 'id'>) => void;
}

// Definizione dei tipi di eventi disponibili
const EVENT_TYPES = [
  {
    type: 'foul' as const,
    label: 'Fallo',
    icon: AlertTriangle,
    color: 'text-orange-600',
    requiresReason: true,
    requiresPlayer: true,
    teamOptions: true
  },
  {
    type: 'corner' as const,
    label: 'Calcio d\'angolo',
    icon: Flag,
    color: 'text-blue-600',
    requiresReason: false,
    requiresPlayer: true,
    teamOptions: true
  },
  {
    type: 'offside' as const,
    label: 'Fuorigioco',
    icon: Ban,
    color: 'text-red-600',
    requiresReason: false,
    requiresPlayer: true,
    teamOptions: true
  },
  {
    type: 'free-kick' as const,
    label: 'Calcio di punizione',
    icon: Zap,
    color: 'text-green-600',
    requiresReason: false,
    requiresPlayer: true,
    teamOptions: true
  },
  {
    type: 'penalty' as const,
    label: 'Rigore',
    icon: Calendar,
    color: 'text-purple-600',
    requiresReason: true,
    requiresPlayer: true,
    teamOptions: true
  },
  {
    type: 'throw-in' as const,
    label: 'Rimessa laterale',
    icon: UserX,
    color: 'text-gray-600',
    requiresReason: false,
    requiresPlayer: true,
    teamOptions: true
  },
  {
    type: 'injury' as const,
    label: 'Infortunio',
    icon: UserX,
    color: 'text-red-500',
    requiresReason: true,
    requiresPlayer: true,
    teamOptions: false // Solo per la propria squadra
  }
];

export function OtherEventsModal({ isOpen, onClose, players, lineup, currentTimeInSeconds, onEventAdd }: OtherEventsModalProps) {
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [teamType, setTeamType] = useState<'own' | 'opponent'>('own');

  const selectedEvent = EVENT_TYPES.find(e => e.type === selectedEventType);
  
  // Ottieni i giocatori in campo con i loro numeri di maglia
  const playersInLineup = lineup.map(matchPlayer => {
    const player = players.find(p => p.id === matchPlayer.playerId);
    return player ? { 
      ...player, 
      jerseyNumber: matchPlayer.jerseyNumber 
    } : null;
  }).filter((player): player is (Player & { jerseyNumber: number }) => player !== null);
  
  // Calcola minuti e secondi dal tempo totale
  const currentMinute = Math.floor(currentTimeInSeconds / 60);
  const currentSecond = currentTimeInSeconds % 60;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEventType) {
      alert('Seleziona un tipo di evento');
      return;
    }

    if (selectedEvent?.requiresPlayer && !selectedPlayer && teamType === 'own') {
      alert('Seleziona un giocatore');
      return;
    }

    if (selectedEvent?.requiresReason && !reason) {
      alert('Inserisci una motivazione');
      return;
    }

    // Crea la descrizione dell'evento
    let description = selectedEvent?.label || '';
    if (teamType === 'own' && selectedPlayer) {
      const player = playersInLineup.find(p => p.id === selectedPlayer);
      if (player) {
        description = `${selectedEvent?.label}: #${player.jerseyNumber} ${player.firstName} ${player.lastName}`;
      }
    } else if (teamType === 'opponent') {
      description = `${selectedEvent?.label} (Avversari)`;
    }

    if (reason) {
      description += ` - ${reason}`;
    }

    const newEvent: Omit<MatchEvent, 'id'> = {
      type: selectedEventType as MatchEvent['type'],
      minute: currentMinute,
      second: currentSecond,
      playerId: teamType === 'own' ? selectedPlayer : '', // Vuoto per eventi avversari
      description,
      reason: reason || undefined,
      teamType
    };

    onEventAdd(newEvent);
    
    // Reset form
    setSelectedEventType('');
    setSelectedPlayer('');
    setReason('');
    setTeamType('own');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Chiudi il modal se si clicca sul backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Altri Eventi - {currentMinute}:{currentSecond.toString().padStart(2, '0')}'
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo di evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo di evento
              </label>
              <div className="grid grid-cols-1 gap-2">
                {EVENT_TYPES.map(eventType => {
                  const Icon = eventType.icon;
                  return (
                    <label key={eventType.type} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="eventType"
                        value={eventType.type}
                        checked={selectedEventType === eventType.type}
                        onChange={(e) => setSelectedEventType(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors w-full ${
                        selectedEventType === eventType.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <Icon className={`w-5 h-5 ${eventType.color}`} />
                        <span className="font-medium text-gray-800">{eventType.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Squadra (se supportato) */}
            {selectedEvent?.teamOptions && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Squadra
                </label>
                <div className="flex gap-2">
                  <label className="flex items-center cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="teamType"
                      value="own"
                      checked={teamType === 'own'}
                      onChange={(e) => setTeamType(e.target.value as 'own' | 'opponent')}
                      className="sr-only"
                    />
                    <div className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-colors w-full ${
                      teamType === 'own'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      Nostra
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="teamType"
                      value="opponent"
                      checked={teamType === 'opponent'}
                      onChange={(e) => setTeamType(e.target.value as 'own' | 'opponent')}
                      className="sr-only"
                    />
                    <div className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-colors w-full ${
                      teamType === 'opponent'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      Avversari
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Selezione giocatore (solo per la propria squadra) */}
            {selectedEvent?.requiresPlayer && teamType === 'own' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giocatore
                </label>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleziona giocatore</option>
                  {playersInLineup
                    .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
                    .map(player => (
                    <option key={player.id} value={player.id}>
                      #{player.jerseyNumber} - {player.firstName} {player.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Motivazione/Dettagli */}
            {selectedEvent?.requiresReason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedEvent.type === 'foul' ? 'Motivazione del fallo' : 
                   selectedEvent.type === 'penalty' ? 'Motivo del rigore' :
                   selectedEvent.type === 'injury' ? 'Tipo di infortunio' : 'Dettagli'}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={selectedEvent.type === 'foul' ? 'Es: Fallo di gioco, Simulazione, ecc.' :
                              selectedEvent.type === 'penalty' ? 'Es: Fallo in area, Tocco di mano, ecc.' :
                              selectedEvent.type === 'injury' ? 'Es: Contusione, Stiramento, ecc.' : 'Inserisci dettagli'}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Aggiungi Evento
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
