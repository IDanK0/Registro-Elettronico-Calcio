import { useState } from 'react';
import { FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Player, Match, Training, PlayerStats } from '../types';

export interface ExportStatsButtonProps {
  players: Player[];
  matches: Match[];
  trainings: Training[];
  playerStats: PlayerStats[];
}

export function ExportStatsButton({ players, matches, trainings, playerStats }: ExportStatsButtonProps) {
  const [showExport, setShowExport] = useState(false);

  const buildCsv = () => {
    const finished = matches.filter(m => m.status === 'finished');
    const wins = finished.filter(m => {
      const our = m.homeAway === 'home' ? m.homeScore : m.awayScore;
      const their = m.homeAway === 'home' ? m.awayScore : m.homeScore;
      return our > their;
    }).length;
    const draws = finished.filter(m => {
      const our = m.homeAway === 'home' ? m.homeScore : m.awayScore;
      const their = m.homeAway === 'home' ? m.awayScore : m.homeScore;
      return our === their;
    }).length;
    const losses = finished.filter(m => {
      const our = m.homeAway === 'home' ? m.homeScore : m.awayScore;
      const their = m.homeAway === 'home' ? m.awayScore : m.homeScore;
      return our < their;
    }).length;
    const totalGoalsFor = finished.reduce((sum, m) => sum + (m.homeAway === 'home' ? m.homeScore : m.awayScore), 0);
    const totalGoalsAgainst = finished.reduce((sum, m) => sum + (m.homeAway === 'home' ? m.awayScore : m.homeScore), 0);
    const diff = totalGoalsFor - totalGoalsAgainst;
    const avgGoals = finished.length > 0 ? (totalGoalsFor / finished.length).toFixed(1) : '0.0';
    const avgConceded = finished.length > 0 ? (totalGoalsAgainst / finished.length).toFixed(1) : '0.0';
    const allEvents = finished.flatMap(m => m.events || []);
    const allSubs = finished.flatMap(m => m.substitutions || []);
    const totalYellows = allEvents.filter(e => e.type === 'yellow-card' || e.type === 'second-yellow-card').length;
    const avgYellows = finished.length > 0 ? (allEvents.length / finished.length).toFixed(2) : '0.00';
    const totalReds = allEvents.filter(e => e.type === 'red-card' || e.type === 'expulsion').length;
    const totalSubs = allSubs.length;
    const avgSubs = finished.length > 0 ? (totalSubs / finished.length).toFixed(2) : '0.00';

    let csv = '';
    csv += 'Categoria,Statistica,Valore\n';
    csv += `Panoramica Generale,Giocatori Attivi,${players.filter(p => p.isActive).length}\n`;
    csv += `Panoramica Generale,Partite Giocate,${finished.length}\n`;
    csv += `Panoramica Generale,Allenamenti,${trainings.length}\n`;
    csv += `Panoramica Generale,Vittorie su Partite Giocate,"${wins} su ${finished.length}"\n`;
    csv += ',\n';
    csv += `Statistiche Partite,Vittorie,${wins}\n`;
    csv += `Statistiche Partite,Pareggi,${draws}\n`;
    csv += `Statistiche Partite,Sconfitte,${losses}\n`;
    csv += `Statistiche Partite,Goal Fatti,${totalGoalsFor}\n`;
    csv += `Statistiche Partite,Goal Subiti,${totalGoalsAgainst}\n`;
    csv += `Statistiche Partite,Differenza Reti,${diff >= 0 ? '+' : ''}${diff}\n`;
    csv += `Statistiche Partite,Media Gol/Partita,${avgGoals}\n`;
    csv += `Statistiche Partite,Media Subiti/Partita,${avgConceded}\n`;
    csv += ',\n';
    csv += `Fair Play,Ammonizioni totali,${totalYellows}\n`;
    csv += `Fair Play,Media Ammonizioni/Partita,${avgYellows}\n`;
    csv += `Fair Play,Espulsioni totali,${totalReds}\n`;
    csv += `Fair Play,Sostituzioni totali,${totalSubs}\n`;
    csv += `Fair Play,Media Sostituzioni/Partita,${avgSubs}\n`;
    csv += ',\n';
    // top scorers
    csv += 'Giocatore,Numero,Goal (Capocannoniere),Presenze,Più Sostituito,Più Subentrato\n';
    const topScorers = playerStats.filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0,5);
    topScorers.forEach(s => {
      const p = players.find(pl => pl.id === s.playerId)!;
      const subOut = allSubs.filter(x => x.playerOut === p.id).length;
      const subIn = allSubs.filter(x => x.playerIn === p.id).length;
      csv += `${p.firstName} ${p.lastName},${p.jerseyNumber},${s.goals},${s.matchesPlayed},${subOut},${subIn}\n`;
    });
    csv += ',\n';
    // roles
    csv += 'Ruolo,Goal,Presenze,Gialli,Rossi\n';
    const roleStats = Object.entries(players.reduce((acc, p) => {
      const st = playerStats.find(s => s.playerId === p.id)!;
      if (!acc[p.position]) acc[p.position] = { goals:0, matches:0, yellows:0, reds:0 };
      acc[p.position].goals += st.goals;
      acc[p.position].matches += st.matchesPlayed;
      acc[p.position].yellows += st.yellowCards;
      acc[p.position].reds += st.redCards;
      return acc;
    }, {} as Record<string, any>));
    roleStats.forEach(([role, st]) => {
      csv += `${role},${st.goals},${st.matches},${st.yellows},${st.reds}\n`;
    });
    return csv;
  };

  const exportCSV = () => {
    const csv = buildCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistiche-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = () => {
    const csv = buildCsv();
    const rows = csv.split('\n').map(r => r.split(','));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statistiche');
    XLSX.writeFile(wb, `statistiche-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportPDF = () => {
    const pdf = new jsPDF();
    const csv = buildCsv();
    pdf.setFontSize(10);
    pdf.text(csv.split('\n'), 10, 10);
    pdf.save(`statistiche-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleExportStats = (format: 'pdf' | 'csv' | 'xlsx') => {
    setShowExport(false);
    if (format === 'csv') exportCSV();
    else if (format === 'xlsx') exportXLSX();
    else exportPDF();
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
