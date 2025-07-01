import { Download } from 'lucide-react';
import { Training, Player } from '../types';
import { exportTrainingAttendanceToCSV } from '../utils/csvUtils';
import useIsMobile from '../hooks/useIsMobile';

interface ExportTrainingAttendanceButtonProps {
  trainings: Training[];
  players: Player[];
}

export function ExportTrainingAttendanceButton({ trainings, players }: ExportTrainingAttendanceButtonProps) {
  const isMobile = useIsMobile();
  
  const handleExport = () => {
    exportTrainingAttendanceToCSV(trainings, players);
  };

  return (
    <button
      onClick={handleExport}
      className={`inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors`}
      title="Esporta riepilogo presenze allenamenti in CSV"
    >
      <Download className="w-4 h-4 mr-2" />
      {isMobile ? 'CSV' : 'Esporta Presenze CSV'}
    </button>
  );
}
