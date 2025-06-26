import { useState } from 'react';
import { Player, MatchPlayer } from '../types';
import { X, Square, AlertTriangle, Ban, SquareStack } from 'lucide-react';

interface AmmonitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  playersOnField: (Player & { matchPlayer: MatchPlayer })[];
  opponentLineup: number[];
  onAmmonition: (
    type: 'yellow-card' | 'red-card' | 'second-yellow-card' | 'blue-card' | 'expulsion' | 'warning',
    playerId: string
  ) => void;
  currentMinute: number;
}

const AMMONITION_TYPES = [
  {
    type: 'yellow-card' as const,
    icon: <Square className="w-7 h-7 text-yellow-400" />, 
    label: 'Cartellino Giallo',
    description: 'Ammonizione semplice'
  },
  {
    type: 'second-yellow-card' as const,
    icon: <SquareStack className="w-7 h-7 text-orange-500" />, 
    label: 'Secondo Giallo',
    description: 'Seconda ammonizione (espulsione)'
  },
  {
    type: 'red-card' as const,
    icon: <Square className="w-7 h-7 text-red-600" />, 
    label: 'Cartellino Rosso',
    description: 'Espulsione diretta'
  },
  {
    type: 'blue-card' as const,
    icon: <Square className="w-7 h-7 text-blue-600" />, 
    label: 'Cartellino Blu',
    description: 'Espulsione temporanea (giovanili, futsal)'
  },
  {
    type: 'expulsion' as const,
    icon: <Ban className="w-7 h-7 text-gray-700" />, 
    label: 'Espulsione',
    description: 'Allontanamento dal campo'
  },
  {
    type: 'warning' as const,
    icon: <AlertTriangle className="w-7 h-7 text-yellow-400" />, 
    label: 'Richiamo Ufficiale',
    description: 'Avvertimento verbale'
  }
];

export function AmmonitionModal({
  isOpen,
  onClose,
  playersOnField,
  opponentLineup,
  onAmmonition,
  currentMinute
}: AmmonitionModalProps) {
  const [selectedType, setSelectedType] = useState<
    'yellow-card' | 'red-card' | 'second-yellow-card' | 'blue-card' | 'expulsion' | 'warning' | ''
  >('');
  const [selectedPlayer, setSelectedPlayer] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedType && selectedPlayer) {
      onAmmonition(selectedType, selectedPlayer);
      setSelectedType('');
      setSelectedPlayer('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Ammonizione - {currentMinute}'
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo di ammonizione</label>
          <div className="grid grid-cols-2 gap-3">
            {AMMONITION_TYPES.map(opt => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setSelectedType(opt.type)}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg border-2 transition-colors shadow-sm ${selectedType === opt.type ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-400'}`}
              >
                {opt.icon}
                <span className="text-xs font-semibold text-gray-700">{opt.label}</span>
                <span className="text-[10px] text-gray-500 text-center">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Destinatario</label>
          <select
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="">Seleziona giocatore o maglia avversaria</option>
            {playersOnField
              .sort((a, b) => a.matchPlayer.jerseyNumber - b.matchPlayer.jerseyNumber)
              .map(p => (
              <option key={p.id} value={p.id}>#{p.matchPlayer.jerseyNumber} - {p.firstName} {p.lastName}</option>
            ))}
            {opponentLineup.map(num => (
              <option key={`opp-${num}`} value={`opp-${num}`}>Maglia avversaria #{num}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleConfirm}
            disabled={!selectedType || !selectedPlayer}
            className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Conferma Ammonizione
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
