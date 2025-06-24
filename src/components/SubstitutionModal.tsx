import React, { useState } from 'react';
import { Player } from '../types';
import { ArrowLeftRight, X } from 'lucide-react';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  playersOnField: Player[];
  playersOnBench: Player[];
  onSubstitute: (playerOutId: string, playerInId: string) => void;
  currentMinute: number;
}

export function SubstitutionModal({
  isOpen,
  onClose,
  playersOnField,
  playersOnBench,
  onSubstitute,
  currentMinute
}: SubstitutionModalProps) {
  const [playerOut, setPlayerOut] = useState('');
  const [playerIn, setPlayerIn] = useState('');

  if (!isOpen) return null;

  const handleSubstitute = () => {
    if (playerOut && playerIn) {
      onSubstitute(playerOut, playerIn);
      setPlayerOut('');
      setPlayerIn('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            Sostituzione - {currentMinute}'
          </h3>
          <button
            onClick={onClose}
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
              {playersOnField.map(player => (
                <option key={player.id} value={player.id}>
                  #{player.jerseyNumber} {player.firstName} {player.lastName}
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
              {playersOnBench.map(player => (
                <option key={player.id} value={player.id}>
                  #{player.jerseyNumber} {player.firstName} {player.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubstitute}
            disabled={!playerOut || !playerIn}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Conferma Sostituzione
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}