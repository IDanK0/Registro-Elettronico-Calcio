import { Plus, Minus } from 'lucide-react';

interface GoalCounterProps {
  teamName: string;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}

export function GoalCounter({ teamName, score, onIncrement, onDecrement, disabled = false }: GoalCounterProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">{teamName}</h3>
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            type="button"
            onClick={onDecrement}
            disabled={score === 0 || disabled}
            className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-5 h-5 text-red-600" />
          </button>
          <div className="text-4xl font-bold text-gray-800 w-12 text-center">
            {score}
          </div>
          <button
            type="button"
            onClick={onIncrement}
            disabled={disabled}
            className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5 text-green-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
