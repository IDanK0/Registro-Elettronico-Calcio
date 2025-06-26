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
    csv += ',\n';    // top scorers
    csv += 'Giocatore,Goal (Capocannoniere),Presenze,Più Sostituito,Più Subentrato\n';
    const topScorers = playerStats.filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0,5);
    topScorers.forEach(s => {
      const p = players.find(pl => pl.id === s.playerId)!;
      const subOut = allSubs.filter(x => x.playerOut === p.id).length;
      const subIn = allSubs.filter(x => x.playerIn === p.id).length;
      csv += `${p.firstName} ${p.lastName},${s.goals},${s.matchesPlayed},${subOut},${subIn}\n`;
    });
    csv += ',\n';    // roles - calculated from matches
    csv += 'Ruolo,Goal,Presenze,Gialli,Rossi\n';
    const finishedMatches = matches.filter(m => m.status === 'finished');
    const roleStats = Object.entries(finishedMatches.reduce((acc, match) => {
      match.lineup.forEach(matchPlayer => {
        if (!acc[matchPlayer.position]) acc[matchPlayer.position] = { goals:0, matches:0, yellows:0, reds:0 };
        acc[matchPlayer.position].matches += 1;
      });
      
      match.events?.forEach(event => {
        const playerInMatch = match.lineup.find(mp => mp.playerId === event.playerId);
        if (playerInMatch) {
          if (event.type === 'goal' && event.description?.includes('(nostro)')) {
            acc[playerInMatch.position].goals += 1;
          }
          if (['yellow-card','second-yellow-card'].includes(event.type)) {
            acc[playerInMatch.position].yellows += 1;
          }
          if (['red-card','expulsion'].includes(event.type)) {
            acc[playerInMatch.position].reds += 1;
          }
        }
      });
      
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
    });    const mostSubbedOut = Object.entries(subOutCount).sort((a,b) => b[1]-a[1]).slice(0,3).map(([id,count]) => ({ player: players.find(p=>p.id===id), count }));
    const mostSubbedIn = Object.entries(subInCount).sort((a,b) => b[1]-a[1]).slice(0,3).map(([id,count]) => ({ player: players.find(p=>p.id===id), count }));
    
    // Calculate role stats from matches
    const finishedMatchesForPDF = matches.filter(m => m.status === 'finished');
    const roleStats = Object.entries(finishedMatchesForPDF.reduce((acc, match) => {
      match.lineup.forEach(matchPlayer => {
        if (!acc[matchPlayer.position]) acc[matchPlayer.position] = { goals:0, matches:0, yellows:0, reds:0 };
        acc[matchPlayer.position].matches += 1;
      });
      
      match.events?.forEach(event => {
        const playerInMatch = match.lineup.find(mp => mp.playerId === event.playerId);
        if (playerInMatch) {
          if (event.type === 'goal' && event.description?.includes('(nostro)')) {
            acc[playerInMatch.position].goals += 1;
          }
          if (['yellow-card','second-yellow-card'].includes(event.type)) {
            acc[playerInMatch.position].yellows += 1;
          }
          if (['red-card','expulsion'].includes(event.type)) {
            acc[playerInMatch.position].reds += 1;
          }
        }
      });
      
      return acc;
    }, {} as Record<string, any>));

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginTop = 40;
    const marginBottom = 40;
    let y = marginTop;    let pageNum = 1;
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
    // Box panoramica migliorato
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    const infoBoxX = 60;
    const infoBoxY = y;
    const infoBoxW = pageWidth - 120;
    const infoBoxH = 120;
    doc.roundedRect(infoBoxX, infoBoxY, infoBoxW, infoBoxH, 16, 16, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    // Layout a griglia 3 righe x 3 colonne, allineamento costante
    const cellW = (infoBoxW - 48) / 3; // 3 colonne, 24px padding ai lati
    const col1X = infoBoxX + 24;
    const col2X = col1X + cellW;
    const col3X = col2X + cellW;
    const row1Y = infoBoxY + 38;
    const row2Y = infoBoxY + 68;
    const row3Y = infoBoxY + 98;
    // Riga 1
    doc.text('Giocatori attivi:', col1X, row1Y);
    doc.text(String(players.filter(p => p.isActive).length), col1X + 120, row1Y, { align: 'right' });
    doc.text('Vittorie:', col2X, row1Y);
    doc.text(String(wins), col2X + 90, row1Y, { align: 'right' });
    doc.text('Presenza media:', col3X, row1Y);
    doc.text(`${Math.round(avgAttendance)}%`, col3X + 140, row1Y, { align: 'right' });
    // Riga 2
    doc.text('Partite giocate:', col1X, row2Y);
    doc.text(String(finished.length), col1X + 120, row2Y, { align: 'right' });
    doc.text('Pareggi:', col2X, row2Y);
    doc.text(String(draws), col2X + 90, row2Y, { align: 'right' });
    doc.text('Gol fatti:', col3X, row2Y);
    doc.text(String(totalGoalsFor), col3X + 140, row2Y, { align: 'right' });
    // Riga 3
    doc.text('Allenamenti:', col1X, row3Y);
    doc.text(String(trainings.length), col1X + 120, row3Y, { align: 'right' });
    doc.text('Sconfitte:', col2X, row3Y);
    doc.text(String(losses), col2X + 90, row3Y, { align: 'right' });
    doc.text('Gol subiti:', col3X, row3Y);
    doc.text(String(totalGoalsAgainst), col3X + 140, row3Y, { align: 'right' });
    y += infoBoxH + 40;
    addPageIfNeeded(infoBoxH + 40);
    // Spazio extra tra le sezioni
    const sectionSpace = 24;
    // Statistiche Partite
    y += sectionSpace;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text('Statistiche Partite', 70, y);
    y += 10;
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(1.2);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(37, 99, 235);
    doc.text(`Differenza reti: ${diff >= 0 ? '+' : ''}${diff}`, 70, y);
    doc.text(`Media gol/partita: ${avgGoals}`, 200, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`Media subiti/partita: ${avgConceded}`, 340, y);
    y += 32;
    addPageIfNeeded(32);
    // Fair Play & Sostituzioni
    y += sectionSpace; // aggiunto spazio come per Statistiche Partite
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(202, 138, 4);
    doc.text('Fair Play & Sostituzioni', 70, y);
    y += 10;
    doc.setDrawColor(202, 138, 4);
    doc.setLineWidth(1.2);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(202, 138, 4);
    doc.text(`Ammonizioni: ${totalYellows} (media: ${avgYellows}/partita)`, 70, y);
    y += 20;
    doc.setTextColor(220, 38, 38);
    doc.text(`Espulsioni: ${totalReds}`, 70, y);
    y += 20;
    doc.setTextColor(37, 99, 235);
    doc.text(`Sostituzioni: ${totalSubs} (media: ${avgSubs}/partita)`, 70, y);
    y += 32;
    addPageIfNeeded(32);
    // Capocannonieri
    y += sectionSpace;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(22, 163, 74);
    doc.text('Capocannonieri', 70, y);
    y += 10;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(1.2);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 24;
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
        doc.text(String(i + 1), 106, y + 6, { align: 'center' });        doc.setFont('helvetica', 'normal');
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text(`${p.firstName} ${p.lastName}`, 134, y + 6);
        doc.setTextColor(22, 163, 74);
        doc.text(`${s.goals} goal`, 420, y + 6, { align: 'right' }); // più spazio tra nome e goal
        y += 28;
        addPageIfNeeded(28);
      });
    }
    y += 12;
    addPageIfNeeded(12);
    // Più presenti
    y += sectionSpace;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('Più Presenti', 70, y);
    y += 10;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1.2);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 24;
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
        doc.setFont('helvetica', 'normal');        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text(`${p.firstName} ${p.lastName}`, 134, y + 6);
        doc.setTextColor(16, 185, 129);
        doc.text(`${s.matchesPlayed} presenze`, 420, y + 6, { align: 'right' }); // più spazio tra nome e presenze
        y += 28;
        addPageIfNeeded(28);
      });
    }
    y += 12;
    addPageIfNeeded(12);
    // Più sostituiti/subentrati
    y += sectionSpace;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text('Sostituzioni', 70, y);
    y += 10;
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.2);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(220, 38, 38);
    doc.text('Più sostituiti:', 90, y);
    let yStart = y;
    mostSubbedOut.forEach(({player, count}, i) => {      if (!player) return;
      doc.text(`${player.firstName} ${player.lastName}`, 180, yStart + i * 18);
      doc.text(String(count), 420, yStart + i * 18, { align: 'right' }); // più spazio tra nome e numero
    });
    y += 18 * Math.max(1, mostSubbedOut.length);
    doc.setTextColor(22, 163, 74);
    doc.text('Più subentrati:', 90, y);
    yStart = y;
    mostSubbedIn.forEach(({player, count}, i) => {
      if (!player) return;
      doc.text(`${player.firstName} ${player.lastName}`, 180, yStart + i * 18);
      doc.text(String(count), 420, yStart + i * 18, { align: 'right' }); // più spazio tra nome e numero
    });
    y += 18 * Math.max(1, mostSubbedIn.length);
    addPageIfNeeded(18 * (Math.max(mostSubbedOut.length, mostSubbedIn.length)));
    // Statistiche per ruolo
    y += sectionSpace;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(139, 92, 246);
    doc.text('Statistiche per Ruolo', 70, y);
    y += 10;
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(1.2);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 64, 175);
    // Tabella ruoli header
    const tableX = 90;
    let tableY = y;
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(tableX, tableY, pageWidth - 180, 28, 8, 8, 'F');
    doc.text('Ruolo', tableX + 40, tableY + 18, { align: 'center' });
    doc.text('Goal', tableX + 140, tableY + 18, { align: 'right' });
    doc.text('Presenze', tableX + 220, tableY + 18, { align: 'right' });
    doc.text('Gialli', tableX + 320, tableY + 18, { align: 'right' });
    doc.text('Rossi', tableX + 400, tableY + 18, { align: 'right' });
    tableY += 32;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    roleStats.forEach(([role, st], idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 243, idx % 2 === 0 ? 255 : 244, idx % 2 === 0 ? 255 : 246);
      doc.roundedRect(tableX, tableY, pageWidth - 180, 24, 8, 8, 'F');
      doc.setTextColor(55, 65, 81);
      doc.text(role, tableX + 40, tableY + 16, { align: 'center' });
      doc.text(String(st.goals), tableX + 140, tableY + 16, { align: 'right' });
      doc.text(String(st.matches), tableX + 220, tableY + 16, { align: 'right' });
      doc.text(String(st.yellows), tableX + 320, tableY + 16, { align: 'right' });
      doc.text(String(st.reds), tableX + 400, tableY + 16, { align: 'right' });
      tableY += 26;
      addPageIfNeeded(26);
    });
    y = tableY + 10;
    addPageIfNeeded(10);
    // Footer rimosso
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
