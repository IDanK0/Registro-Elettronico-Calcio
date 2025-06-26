import { Download } from 'lucide-react';
import { Training, Player } from '../types';
import { exportTrainingAttendanceToCSV } from '../utils/csvUtils';

interface ExportTrainingAttendanceButtonProps {
  trainings: Training[];
  players: Player[];
}

export function ExportTrainingAttendanceButton({ trainings, players }: ExportTrainingAttendanceButtonProps) {
  const handleExport = () => {
    exportTrainingAttendanceToCSV(trainings, players);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      title="Esporta riepilogo presenze allenamenti in CSV"
    >
      <Download className="w-4 h-4 mr-2" />
      Esporta Presenze CSV
    </button>
  );
}
