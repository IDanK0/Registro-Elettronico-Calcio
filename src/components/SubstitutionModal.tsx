import { useState } from 'react';
import { Player, MatchPlayer } from '../types';
import { ArrowLeftRight, X } from 'lucide-react';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  playersOnField: (Player & { matchPlayer: MatchPlayer })[];
  playersOnBench: Player[];
  onSubstitute: (playerOutId: string, playerInId: string, jerseyNumber: number) => void;
  currentMinute: number;
  playerJerseyNumbers?: Record<string, number>; // Mappa dei numeri di maglia assegnati
}

export function SubstitutionModal({
  isOpen,
  onClose,
  playersOnField,
  playersOnBench,
  onSubstitute,
  currentMinute,
  playerJerseyNumbers = {}
}: SubstitutionModalProps) {
  const [playerOut, setPlayerOut] = useState('');
  const [playerIn, setPlayerIn] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState<number | ''>('');

  if (!isOpen) return null;

  // Controlla se il giocatore selezionato ha già un numero di maglia
  const selectedPlayerInHasJersey = playerIn && playerJerseyNumbers[playerIn];
  const existingJerseyNumber = selectedPlayerInHasJersey ? playerJerseyNumbers[playerIn] : null;

  const handleSubstitute = () => {
    if (playerOut && playerIn) {
      const finalJerseyNumber = existingJerseyNumber || Number(jerseyNumber);
      if (finalJerseyNumber) {
        onSubstitute(playerOut, playerIn, finalJerseyNumber);
        setPlayerOut('');
        setPlayerIn('');
        setJerseyNumber('');
        onClose();
      }
    }
  };

  const resetForm = () => {
    setPlayerOut('');
    setPlayerIn('');
    setJerseyNumber('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Ottieni i numeri di maglia già utilizzati
  const usedJerseyNumbers = playersOnField.map(p => p.matchPlayer.jerseyNumber);

  // Controlla se il numero di maglia esistente è già utilizzato da un altro giocatore in campo
  const existingJerseyConflict = existingJerseyNumber && usedJerseyNumbers.includes(existingJerseyNumber);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            Sostituzione - {currentMinute}'
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giocatore che esce
            </label>
            <select
              value={playerOut}
              onChange={(e) => setPlayerOut(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleziona giocatore</option>
              {playersOnField.map(playerWithMatch => (
                <option key={playerWithMatch.id} value={playerWithMatch.id}>
                  #{playerWithMatch.matchPlayer.jerseyNumber} {playerWithMatch.firstName} {playerWithMatch.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <ArrowLeftRight className="w-8 h-8 text-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giocatore che entra
            </label>
            <select
              value={playerIn}
              onChange={(e) => setPlayerIn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleziona giocatore</option>
              {playersOnBench.map(player => {
                const hasJersey = playerJerseyNumbers[player.id];
                return (
                  <option key={player.id} value={player.id}>
                    {hasJersey ? `#${hasJersey}` : '#'} {player.firstName} {player.lastName}
                  </option>
                );
              })}
            </select>
          </div>

          {playerIn && !existingJerseyNumber && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numero di maglia per il giocatore che entra
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Numero maglia (1-99)"
              />
              {jerseyNumber !== '' && usedJerseyNumbers.includes(Number(jerseyNumber)) && (
                <p className="text-red-600 text-sm mt-1">
                  Questo numero di maglia è già utilizzato da un giocatore in campo
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubstitute}
            disabled={
              !playerOut || 
              !playerIn || 
              (existingJerseyNumber ? !!existingJerseyConflict : (jerseyNumber === '' || usedJerseyNumbers.includes(Number(jerseyNumber))))
            }
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Conferma Sostituzione
          </button>
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}