import React from 'react';
import { Clock, Play, Pause, Square, RotateCcw } from 'lucide-react';

interface MatchTimerProps {
  time: number;
  isRunning: boolean;
  status: 'scheduled' | 'first-half' | 'half-time' | 'second-half' | 'finished';
  onStart: () => void;
  onPause: () => void;
  onEndFirstHalf: () => void;
  onStartSecondHalf: () => void;
  onContinueFirstHalf: () => void;
  onFinish: () => void;
  formatTime: (seconds: number) => string;
}

export function MatchTimer({
  time,
  isRunning,
  status,
  onStart,
  onPause,
  onEndFirstHalf,
  onStartSecondHalf,
  onContinueFirstHalf,
  onFinish,
  formatTime
}: MatchTimerProps) {
  const getStatusText = () => {
    switch (status) {
      case 'scheduled': return 'Pre-Partita';
      case 'first-half': return '1° Tempo';
      case 'half-time': return 'Intervallo';
      case 'second-half': return '2° Tempo';
      case 'finished': return 'Partita Terminata';
      default: return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'scheduled': return 'bg-gray-500';
      case 'first-half': return 'bg-green-500';
      case 'half-time': return 'bg-yellow-500';
      case 'second-half': return 'bg-green-500';
      case 'finished': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium ${getStatusColor()}`}>
          <Clock className="w-4 h-4" />
          {getStatusText()}
        </div>
      </div>

      <div className="text-center mb-8">
        <div className="text-6xl font-bold text-gray-800 font-mono">
          {formatTime(time)}
        </div>
        <p className="text-gray-500 mt-2">
          {isRunning ? 'Timer in corso' : 'Timer in pausa'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {status === 'scheduled' && (
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Play className="w-5 h-5" />
            Inizia Partita
          </button>
        )}

        {status === 'first-half' && (
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
            )}
            <button
              onClick={onEndFirstHalf}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              <Square className="w-5 h-5" />
              Fine 1° Tempo
            </button>
          </>
        )}

        {status === 'half-time' && (
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={onStartSecondHalf}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Play className="w-5 h-5" />
              Inizia 2° Tempo
            </button>
            <button
              onClick={onContinueFirstHalf}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RotateCcw className="w-5 h-5" />
              Continua 1° Tempo
            </button>
          </div>
        )}

        {status === 'second-half' && (
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
            )}
            <button
              onClick={onFinish}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Square className="w-5 h-5" />
              Termina Partita
            </button>
          </>
        )}
      </div>
    </div>
  );
}