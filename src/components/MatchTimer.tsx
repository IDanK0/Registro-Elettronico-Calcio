import { Clock, Play, Pause, Square, Plus, Minus } from 'lucide-react';
import { MatchPeriod } from '../types';

interface MatchTimerProps {
  periods: MatchPeriod[];
  currentPeriodIndex: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onInterval: () => void; // Crea un nuovo periodo di tipo intervallo
  onAddPeriod: (type: 'regular' | 'extra') => void;
  onRemoveLastPeriod: () => void;
  onFinish: () => void;
  formatTime: (seconds: number) => string;
}

export function MatchTimer({
  periods,
  currentPeriodIndex,
  isRunning,
  onStart,
  onPause,
  onInterval,
  onAddPeriod,
  onRemoveLastPeriod,
  onFinish,
  formatTime
}: MatchTimerProps) {const currentPeriod = periods[currentPeriodIndex];
  const canRemovePeriod = periods.length > 1;
  
  // Verifica se la partita è mai stata iniziata
  const hasMatchStarted = periods.some(p => p.duration > 0 || p.isFinished);
  const getStatusText = () => {
    if (!currentPeriod) return 'Pre-Partita';
    if (!hasMatchStarted) return 'Pre-Partita';
    if (currentPeriod.type === 'interval') return currentPeriod.label;
    if (currentPeriod.isFinished) return `${currentPeriod.label} - Terminato`;
    return currentPeriod.label;
  };  const getStatusColor = () => {
    if (!currentPeriod || !hasMatchStarted) return 'bg-gray-500';
    if (currentPeriod.isFinished) return 'bg-blue-500';
    if (currentPeriod.type === 'extra') return 'bg-purple-500';
    if (currentPeriod.type === 'interval') return 'bg-orange-500';
    return isRunning ? 'bg-green-500' : 'bg-yellow-500';
  };

  const getCurrentTime = () => {
    return currentPeriod ? currentPeriod.duration : 0;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium ${getStatusColor()}`}>
          <Clock className="w-4 h-4" />
          {getStatusText()}
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-bold text-gray-800 font-mono">
          {formatTime(getCurrentTime())}
        </div>
        <p className="text-gray-500 mt-2">
          {isRunning ? 'Timer in corso' : 'Timer in pausa'}
        </p>
      </div>      {/* Periodi Overview - Mostra solo dopo che la partita è iniziata */}
      {hasMatchStarted && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Periodi</h4>
          <div className="flex flex-wrap gap-2 justify-center">
            {periods.map((period, index) => (              <div
                key={index}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  index === currentPeriodIndex
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                    : period.isFinished
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {period.label}: {formatTime(period.duration)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-4">        {/* Timer Controls */}
        <div className="flex flex-wrap gap-3 justify-center">
          {!hasMatchStarted ? (
            <button
              onClick={onStart}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Play className="w-5 h-5" />
              Inizia Partita
            </button>
          ) : !currentPeriod?.isFinished ? (
            <>
              {isRunning ? (
                <button
                  onClick={onPause}
                  className="flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  <Pause className="w-5 h-5" />
                  Pausa
                </button>
              ) : (
                <button
                  onClick={onStart}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Play className="w-5 h-5" />
                  Riprendi
                </button>
              )}              <button
                onClick={onInterval}
                className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                <Square className="w-5 h-5" />
                Intervallo
              </button>
            </>
          ) : null}
        </div>        {/* Period Management Controls - Mostra solo dopo che la partita è iniziata */}
        {hasMatchStarted && (
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => onAddPeriod('regular')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Aggiungi Tempo
            </button>
            
            <button
              onClick={() => onAddPeriod('extra')}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Supplementare
            </button>

            {canRemovePeriod && (
              <button
                onClick={onRemoveLastPeriod}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Minus className="w-4 h-4" />
                Rimuovi Ultimo
              </button>
            )}

            <button
              onClick={onFinish}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Square className="w-4 h-4" />
              Termina Partita
            </button>
          </div>
        )}
      </div>
    </div>
  );
}