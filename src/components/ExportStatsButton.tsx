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
    const finished = matches.filter(m => m.status === 'finished');
    const wins = finished.filter(m => (m.homeAway === 'home' ? m.homeScore : m.awayScore) > (m.homeAway === 'home' ? m.awayScore : m.homeScore)).length;
    const draws = finished.filter(m => (m.homeAway === 'home' ? m.homeScore : m.awayScore) === (m.homeAway === 'home' ? m.awayScore : m.homeScore)).length;
    const losses = finished.filter(m => (m.homeAway === 'home' ? m.homeScore : m.awayScore) < (m.homeAway === 'home' ? m.awayScore : m.homeScore)).length;
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
    const avgAttendance = trainings.length > 0 
      ? trainings.reduce((sum, t) => {
          const present = Object.values(t.attendances).filter(Boolean).length;
          const total = Object.keys(t.attendances).length;
          return sum + (total > 0 ? (present / total) * 100 : 0);
        }, 0) / trainings.length 
      : 0;
    const topScorers = playerStats.filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0,5);
    const mostActive = playerStats.filter(s => s.matchesPlayed > 0).sort((a, b) => b.matchesPlayed - a.matchesPlayed).slice(0,5);
    // Fix type for subOutCount and subInCount
    const subOutCount: Record<string, number> = {};
    const subInCount: Record<string, number> = {};
    allSubs.forEach(s => {
      subOutCount[String(s.playerOut)] = (subOutCount[String(s.playerOut)] || 0) + 1;
      subInCount[String(s.playerIn)] = (subInCount[String(s.playerIn)] || 0) + 1;
    });
    const mostSubbedOut = Object.entries(subOutCount).sort((a,b) => b[1]-a[1]).slice(0,3).map(([id,count]) => ({ player: players.find(p=>p.id===id), count }));
    const mostSubbedIn = Object.entries(subInCount).sort((a,b) => b[1]-a[1]).slice(0,3).map(([id,count]) => ({ player: players.find(p=>p.id===id), count }));
    const roleStats = Object.entries(players.reduce((acc, p) => {
      const st = playerStats.find(s => s.playerId === p.id)!;
      if (!acc[p.position]) acc[p.position] = { goals:0, matches:0, yellows:0, reds:0 };
      acc[p.position].goals += st.goals;
      acc[p.position].matches += st.matchesPlayed;
      acc[p.position].yellows += st.yellowCards;
      acc[p.position].reds += st.redCards;
      return acc;
    }, {} as Record<string, any>));

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginTop = 40;
    const marginBottom = 40;
    let y = marginTop;
    let pageNum = 1;
    function drawFooter(page: number, totalPages: number) {
      const footerY = pageHeight - marginBottom + 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(128);
      const now = new Date();
      const timestamp = now.toLocaleString('it-IT');
      doc.text(`Esportato il ${timestamp}`, 60, footerY);
      doc.text(`Pagina ${page} di ${totalPages}`, pageWidth - 60, footerY, { align: 'right' });
    }
    function addPageIfNeeded(extraHeight = 0) {
      if (y + extraHeight > pageHeight - marginBottom) {
        doc.addPage();
        pageNum++;
        y = marginTop;
      }
    }
    // Titolo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(30, 64, 175);
    doc.text('Statistiche Stagionali', pageWidth / 2, y, { align: 'center' });
    y += 36;
    // Box panoramica
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    const infoBoxX = 60;
    const infoBoxY = y;
    const infoBoxW = pageWidth - 120;
    const infoBoxH = 120; // aumentato per più spazio verticale
    doc.roundedRect(infoBoxX, infoBoxY, infoBoxW, infoBoxH, 16, 16, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    const labelX = infoBoxX + 24;
    const valueX = labelX + 90; // ridotto spazio orizzontale
    const row1Y = infoBoxY + 36;
    const row2Y = infoBoxY + 62;
    const row3Y = infoBoxY + 88;
    // Colonna 1
    doc.text('Giocatori attivi:', labelX, row1Y);
    doc.text(String(players.filter(p => p.isActive).length), valueX, row1Y);
    doc.text('Partite giocate:', labelX, row2Y);
    doc.text(String(finished.length), valueX, row2Y);
    doc.text('Allenamenti:', labelX, row3Y);
    doc.text(String(trainings.length), valueX, row3Y);
    // Colonna 2
    const label2X = labelX + 180; // ridotto spazio orizzontale
    doc.text('Vittorie:', label2X, row1Y);
    doc.text(String(wins), label2X + 60, row1Y);
    doc.text('Pareggi:', label2X, row2Y);
    doc.text(String(draws), label2X + 60, row2Y);
    doc.text('Sconfitte:', label2X, row3Y);
    doc.text(String(losses), label2X + 60, row3Y);
    // Colonna 3
    const label3X = label2X + 140; // ridotto spazio orizzontale
    doc.text('Presenza media:', label3X, row1Y);
    doc.text(`${Math.round(avgAttendance)}%`, label3X + 80, row1Y);
    doc.text('Gol fatti:', label3X, row2Y);
    doc.text(String(totalGoalsFor), label3X + 80, row2Y);
    doc.text('Gol subiti:', label3X, row3Y);
    doc.text(String(totalGoalsAgainst), label3X + 80, row3Y);
    y += infoBoxH + 32;
    addPageIfNeeded(infoBoxH + 32);
    // Statistiche Partite
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text('Statistiche Partite', 70, y);
    y += 10;
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(1);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(37, 99, 235);
    doc.text(`Differenza reti: ${diff >= 0 ? '+' : ''}${diff}`, 70, y);
    doc.text(`Media gol/partita: ${avgGoals}`, 250, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`Media subiti/partita: ${avgConceded}`, 430, y);
    y += 24;
    addPageIfNeeded(24);
    // Fair Play & Sostituzioni
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(202, 138, 4);
    doc.text('Fair Play & Sostituzioni', 70, y);
    y += 10;
    doc.setDrawColor(254, 243, 199);
    doc.setLineWidth(0.7);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(202, 138, 4);
    doc.text(`Ammonizioni: ${totalYellows} (media: ${avgYellows}/partita)`, 70, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`Espulsioni: ${totalReds}`, 320, y);
    doc.setTextColor(37, 99, 235);
    doc.text(`Sostituzioni: ${totalSubs} (media: ${avgSubs}/partita)`, 470, y);
    y += 24;
    addPageIfNeeded(24);
    // Capocannonieri
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(22, 163, 74);
    doc.text('Capocannonieri', 70, y);
    y += 10;
    doc.setDrawColor(187, 247, 208);
    doc.setLineWidth(0.7);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    if (topScorers.length === 0) {
      doc.setTextColor(156, 163, 175);
      doc.text('Nessun marcatore', 90, y);
      y += 20;
    } else {
      topScorers.forEach((s, i) => {
        const p = players.find(pl => pl.id === s.playerId);
        if (!p) return;
        doc.setFillColor(i === 0 ? 253 : i === 1 ? 229 : 250, i === 0 ? 224 : i === 1 ? 231 : 204, i === 0 ? 71 : i === 1 ? 219 : 21);
        doc.setDrawColor(191, 219, 254);
        doc.roundedRect(90, y - 10, 32, 24, 12, 12, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(30, 64, 175);
        doc.text(String(i + 1), 106, y + 6, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text(`${p.firstName} ${p.lastName} (#${p.jerseyNumber})`, 134, y + 6);
        doc.setTextColor(22, 163, 74);
        doc.text(`${s.goals} goal`, 320, y + 6);
        y += 28;
        addPageIfNeeded(28);
      });
    }
    y += 8;
    addPageIfNeeded(8);
    // Più presenti
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('Più Presenti', 70, y);
    y += 10;
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.7);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    if (mostActive.length === 0) {
      doc.setTextColor(156, 163, 175);
      doc.text('Nessun dato', 90, y);
      y += 20;
    } else {
      mostActive.forEach((s, i) => {
        const p = players.find(pl => pl.id === s.playerId);
        if (!p) return;
        doc.setFillColor(i === 0 ? 16 : i === 1 ? 59 : 139, i === 0 ? 185 : i === 1 ? 130 : 92, i === 0 ? 129 : i === 1 ? 246 : 246);
        doc.setDrawColor(191, 219, 254);
        doc.roundedRect(90, y - 10, 32, 24, 12, 12, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(30, 64, 175);
        doc.text(String(i + 1), 106, y + 6, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text(`${p.firstName} ${p.lastName} (#${p.jerseyNumber})`, 134, y + 6);
        doc.setTextColor(16, 185, 129);
        doc.text(`${s.matchesPlayed} presenze`, 320, y + 6);
        y += 28;
        addPageIfNeeded(28);
      });
    }
    y += 8;
    addPageIfNeeded(8);
    // Più sostituiti/subentrati
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text('Sostituzioni', 70, y);
    y += 10;
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.7);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(220, 38, 38);
    doc.text('Più sostituiti:', 90, y);
    let yStart = y;
    mostSubbedOut.forEach(({player, count}, i) => {
      if (!player) return;
      doc.text(`${player.firstName} ${player.lastName} (#${player.jerseyNumber})`, 180, yStart + i * 18);
      doc.text(String(count), 340, yStart + i * 18);
    });
    y += 18 * Math.max(1, mostSubbedOut.length);
    doc.setTextColor(22, 163, 74);
    doc.text('Più subentrati:', 90, y);
    yStart = y;
    mostSubbedIn.forEach(({player, count}, i) => {
      if (!player) return;
      doc.text(`${player.firstName} ${player.lastName} (#${player.jerseyNumber})`, 180, yStart + i * 18);
      doc.text(String(count), 340, yStart + i * 18);
    });
    y += 18 * Math.max(1, mostSubbedIn.length);
    addPageIfNeeded(18 * (Math.max(mostSubbedOut.length, mostSubbedIn.length)));
    // Statistiche per ruolo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(139, 92, 246);
    doc.text('Statistiche per Ruolo', 70, y);
    y += 10;
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.7);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(55, 65, 81);
    // Tabella ruoli
    const tableX = 90;
    let tableY = y;
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(tableX, tableY, pageWidth - 180, 28, 8, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 64, 175);
    doc.text('Ruolo', tableX + 40, tableY + 18);
    doc.text('Goal', tableX + 140, tableY + 18);
    doc.text('Presenze', tableX + 220, tableY + 18);
    doc.text('Gialli', tableX + 320, tableY + 18);
    doc.text('Rossi', tableX + 400, tableY + 18);
    tableY += 32;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    roleStats.forEach(([role, st], idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 243, idx % 2 === 0 ? 255 : 244, idx % 2 === 0 ? 255 : 246);
      doc.roundedRect(tableX, tableY, pageWidth - 180, 24, 8, 8, 'F');
      doc.setTextColor(55, 65, 81);
      doc.text(role, tableX + 40, tableY + 16);
      doc.text(String(st.goals), tableX + 140, tableY + 16);
      doc.text(String(st.matches), tableX + 220, tableY + 16);
      doc.text(String(st.yellows), tableX + 320, tableY + 16);
      doc.text(String(st.reds), tableX + 400, tableY + 16);
      tableY += 26;
      addPageIfNeeded(26);
    });
    y = tableY + 10;
    addPageIfNeeded(10);
    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawFooter(i, totalPages);
    }
    doc.save(`statistiche-${new Date().toISOString().slice(0,10)}.pdf`);
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
