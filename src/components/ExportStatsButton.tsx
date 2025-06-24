import { useState } from 'react';
import { FileText } from 'lucide-react';

export function ExportStatsButton() {
  const [showExport, setShowExport] = useState(false);

  const handleExportStats = (format: 'pdf' | 'csv' | 'xlsx') => {
    setShowExport(false);
    alert('Esportazione ' + format + ' delle statistiche non ancora implementata.');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowExport(v => !v)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <FileText className="w-5 h-5" />
        Esporta Statistiche
      </button>
      {showExport && (
        <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border z-50 min-w-[180px]">
          <button onClick={() => handleExportStats('pdf')} className="w-full px-4 py-2 hover:bg-blue-50 text-blue-700 text-left flex items-center gap-2"><FileText className="w-4 h-4" /> PDF</button>
          <button onClick={() => handleExportStats('csv')} className="w-full px-4 py-2 hover:bg-green-50 text-green-700 text-left flex items-center gap-2"><FileText className="w-4 h-4" /> CSV</button>
          <button onClick={() => handleExportStats('xlsx')} className="w-full px-4 py-2 hover:bg-yellow-50 text-yellow-700 text-left flex items-center gap-2"><FileText className="w-4 h-4" /> Excel</button>
        </div>
      )}
    </div>
  );
}
