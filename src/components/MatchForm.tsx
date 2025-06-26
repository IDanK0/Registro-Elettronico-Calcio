import React, { useState } from 'react';
import { Match, Player, MatchPlayer } from '../types';
import { Calendar, MapPin, Users, Home, Plane, Plus, Minus } from 'lucide-react';

interface MatchFormProps {
  players: Player[];
  onSubmit: (match: Omit<Match, 'id' | 'status' | 'startTime' | 'firstHalfDuration' | 'secondHalfDuration' | 'substitutions' | 'events'>) => void;
  initialData?: Match;
  onCancel?: () => void;
}

// Available positions for player selection
const POSITIONS = [
  'Portiere', 'Difensore', 'Centrocampista', 'Attaccante',
  'Terzino Destro', 'Terzino Sinistro', 'Centrale',
  'Mediano', 'Mezzala', 'Trequartista', 'Ala Destra', 'Ala Sinistra'
];

export function MatchForm({ players, onSubmit, initialData, onCancel }: MatchFormProps) {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    opponent: initialData?.opponent || '',
    homeAway: initialData?.homeAway || 'home' as 'home' | 'away',
    homeScore: initialData?.homeScore || 0,
    awayScore: initialData?.awayScore || 0,
    lineup: initialData?.lineup || [] as MatchPlayer[],
    opponentLineup: initialData?.opponentLineup || []
  });
  const [newJerseyNumber, setNewJerseyNumber] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedJersey, setSelectedJersey] = useState<string>('');
  const activePlayers = players.filter(p => p.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.lineup.length === 0) {
      setFormError('Devi inserire almeno un giocatore titolare della tua squadra.');
      return;
    }
    if (formData.opponentLineup.length === 0) {
      setFormError('Devi inserire almeno un numero di maglia avversario.');
      return;
    }
    setFormError(null);
    onSubmit(formData);
  };

  const addPlayerToLineup = () => {
    if (!selectedPlayer || !selectedPosition || !selectedJersey) {
      setFormError('Seleziona giocatore, posizione e numero di maglia.');
      return;
    }
    
    const jerseyNum = parseInt(selectedJersey);
    if (isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99) {
      setFormError('Numero di maglia non valido (1-99).');
      return;
    }
    
    // Check if player is already in lineup
    if (formData.lineup.some(mp => mp.playerId === selectedPlayer)) {
      setFormError('Il giocatore è già nella formazione.');
      return;
    }
    
    // Check if jersey number is already used
    if (formData.lineup.some(mp => mp.jerseyNumber === jerseyNum)) {
      setFormError('Numero di maglia già utilizzato.');
      return;
    }
    
    const newMatchPlayer: MatchPlayer = {
      playerId: selectedPlayer,
      position: selectedPosition,
      jerseyNumber: jerseyNum
    };
    
    setFormData(prev => ({
      ...prev,
      lineup: [...prev.lineup, newMatchPlayer]
    }));
    
    setSelectedPlayer('');
    setSelectedPosition('');
    setSelectedJersey('');
    setFormError(null);
  };

  const removePlayerFromLineup = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      lineup: prev.lineup.filter(mp => mp.playerId !== playerId)
    }));
  };

  const addOpponentJerseyNumber = () => {
    if (newJerseyNumber && !isNaN(Number(newJerseyNumber))) {
      const jerseyNum = Number(newJerseyNumber);
      if (!formData.opponentLineup.includes(jerseyNum)) {
        setFormData(prev => ({
          ...prev,
          opponentLineup: [...prev.opponentLineup, jerseyNum].sort((a, b) => a - b)
        }));
        setNewJerseyNumber('');
      }
    }
  };

  const removeOpponentJerseyNumber = (number: number) => {
    setFormData(prev => ({
      ...prev,
      opponentLineup: prev.opponentLineup.filter(n => n !== number)
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-red-600" />
        {initialData ? 'Modifica Partita' : 'Nuova Partita'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-2 text-sm font-medium">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Data
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Avversario
            </label>
            <input
              type="text"
              required
              value={formData.opponent}
              onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="Nome squadra avversaria"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tipo di partita</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="homeAway"
                value="home"
                checked={formData.homeAway === 'home'}
                onChange={(e) => setFormData({ ...formData, homeAway: e.target.value as 'home' | 'away' })}
                className="sr-only"
              />
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.homeAway === 'home' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <Home className="w-4 h-4" />
                Casa
              </div>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="homeAway"
                value="away"
                checked={formData.homeAway === 'away'}
                onChange={(e) => setFormData({ ...formData, homeAway: e.target.value as 'home' | 'away' })}
                className="sr-only"
              />
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.homeAway === 'away' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <Plane className="w-4 h-4" />
                Trasferta
              </div>
            </label>
          </div>
        </div>

        {initialData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gol {formData.homeAway === 'home' ? 'nostri' : 'avversari'}
              </label>
              <input
                type="number"
                min="0"
                value={formData.homeAway === 'home' ? formData.homeScore : formData.awayScore}
                onChange={(e) => {
                  const score = parseInt(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    [formData.homeAway === 'home' ? 'homeScore' : 'awayScore']: score
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gol {formData.homeAway === 'home' ? 'avversari' : 'nostri'}
              </label>
              <input
                type="number"
                min="0"
                value={formData.homeAway === 'home' ? formData.awayScore : formData.homeScore}
                onChange={(e) => {
                  const score = parseInt(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    [formData.homeAway === 'home' ? 'awayScore' : 'homeScore']: score
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Formazione Titolare ({formData.lineup.length}/11)
          </h4>
          
          {/* Add Player Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giocatore</label>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Seleziona giocatore</option>
                  {activePlayers
                    .filter(p => !formData.lineup.some(mp => mp.playerId === p.id))
                    .map(player => (
                      <option key={player.id} value={player.id}>
                        {player.firstName} {player.lastName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posizione</label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Seleziona posizione</option>
                  {POSITIONS.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maglia</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={selectedJersey}
                  onChange={(e) => setSelectedJersey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="N°"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addPlayerToLineup}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi
                </button>
              </div>
            </div>
          </div>

          {/* Current Lineup */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {formData.lineup.map((matchPlayer) => {
              const player = players.find(p => p.id === matchPlayer.playerId);
              if (!player) return null;
              
              return (
                <div
                  key={matchPlayer.playerId}
                  className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <span className="font-bold text-sm">#{matchPlayer.jerseyNumber}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">
                        {player.firstName} {player.lastName}
                      </span>
                      <p className="text-sm text-gray-600">{matchPlayer.position}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePlayerFromLineup(matchPlayer.playerId)}
                    className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {formData.lineup.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nessun giocatore aggiunto alla formazione</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Numeri Maglia Avversari ({formData.opponentLineup.length})
          </h4>
          <div className="flex items-end gap-2 mb-4">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero maglia
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={newJerseyNumber}
                onChange={(e) => setNewJerseyNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Inserisci numero maglia"
              />
            </div>
            <button
              type="button"
              onClick={addOpponentJerseyNumber}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.opponentLineup.map(number => (
              <div 
                key={number} 
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-800 font-bold text-sm">#{number}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeOpponentJerseyNumber(number)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
            {formData.opponentLineup.length === 0 && (
              <p className="text-gray-500 text-sm italic">Nessun numero di maglia aggiunto</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            {initialData ? 'Aggiorna' : 'Crea'} Partita
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Annulla
            </button>
          )}
        </div>
      </form>
    </div>
  );
}