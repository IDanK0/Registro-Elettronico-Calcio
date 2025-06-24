import React, { useState } from 'react';
import { Match, Player } from '../types';
import { Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

interface ReportMatchProps {
  match: Match;
  players: Player[];
  onClose: () => void;
}

export function ReportMatch({ match, players, onClose }: ReportMatchProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const lineupPlayers = players.filter(p => match.lineup.includes(p.id));
  const goals = match.events.filter(e => e.type === 'goal');
  const cards = match.events.filter(e => [
    'yellow-card','red-card','second-yellow-card','blue-card','expulsion','warning'
  ].includes(e.type));
  const substitutions = match.substitutions;

  // --- PDF ---
  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 48;
    // Titolo grande e centrato
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(30, 64, 175);
    doc.text('Report Partita', pageWidth / 2, y, { align: 'center' });
    y += 32;

    // Box info partita elegante e allineato
    doc.setFillColor(239, 246, 255); // bg-blue-50
    doc.setDrawColor(191, 219, 254); // border-blue-200
    const infoBoxX = 60;
    const infoBoxY = y;
    const infoBoxW = pageWidth - 120;
    const infoBoxH = 80;
    doc.roundedRect(infoBoxX, infoBoxY, infoBoxW, infoBoxH, 16, 16, 'FD');
    // Etichette e valori su due colonne
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    const labelX = infoBoxX + 24;
    const valueX = labelX + 90;
    const row1Y = infoBoxY + 32;
    const row2Y = infoBoxY + 54;
    doc.text('Data:', labelX, row1Y);
    doc.text(match.date, valueX, row1Y);
    doc.text('Avversario:', labelX, row2Y);
    doc.text(match.opponent, valueX, row2Y);
    // Seconda colonna (Tipo)
    const label2X = labelX + 240;
    doc.text('Tipo:', label2X, row1Y);
    doc.text(match.homeAway === 'home' ? 'Casa' : 'Trasferta', label2X + 50, row1Y);
    // Risultato allineato come gli altri
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Risultato:', label2X, row2Y);
    doc.text(`${match.homeAway === 'home' ? match.homeScore : match.awayScore} - ${match.homeAway === 'home' ? match.awayScore : match.homeScore}`, label2X + 65, row2Y);
    y += infoBoxH + 32; // Maggiore distanza tra box e formazione titolare

    // --- Formazione Titolare ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text('Formazione Titolare', 70, y);
    y += 10;
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(1);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 20; // Maggiore spaziatura
    let col = 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    lineupPlayers.forEach((p) => {
      const badgeX = 70 + (col * 250);
      doc.setFillColor(191, 219, 254);
      doc.setDrawColor(147, 197, 253);
      doc.roundedRect(badgeX, y - 12, 32, 32, 16, 16, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(30, 64, 175);
      doc.text(String(p.jerseyNumber), badgeX + 16, y + 8, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(`${p.firstName} ${p.lastName} `, badgeX + 44, y + 7);
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.text(`(${p.position})`, badgeX + 160, y + 7);
      col++;
      if (col === 2) {
        col = 0;
        y += 44; // Maggiore spaziatura
      }
    });
    if (col === 1) y += 44;
    else y += 12;
    y += 18;

    // --- Goal ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(22, 163, 74);
    doc.text('Goal', 70, y);
    y += 12;
    doc.setDrawColor(187, 247, 208);
    doc.setLineWidth(0.7);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 20;
    if (goals.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(156, 163, 175);
      doc.text('Nessun goal', 90, y);
      y += 26;
    } else {
      goals.forEach(g => {
        const isOpponent = g.description?.includes('avversario');
        doc.setFillColor(isOpponent ? 254 : 220, isOpponent ? 202 : 232, isOpponent ? 202 : 232);
        doc.setDrawColor(isOpponent ? 252 : 187, isOpponent ? 165 : 247, isOpponent ? 165 : 208);
        doc.roundedRect(90, y - 10, 36, 24, 12, 12, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(isOpponent ? 220 : 22, isOpponent ? 38 : 163, isOpponent ? 38 : 74);
        doc.text(`${g.minute}${g.second !== undefined ? ':' + g.second.toString().padStart(2, '0') : ''}`, 108, y + 6, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text(g.description ?? '', 134, y + 6);
        y += 36;
      });
    }
    y += 8;

    // --- Ammonizioni / Espulsioni ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(202, 138, 4);
    doc.text('Ammonizioni / Espulsioni', 70, y);
    y += 12;
    doc.setDrawColor(254, 243, 199);
    doc.setLineWidth(0.7);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 20;
    if (cards.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(156, 163, 175);
      doc.text('Nessuna', 90, y);
      y += 26;
    } else {
      cards.forEach(c => {
        let color: [number, number, number] = [202, 138, 4];
        let bg: [number, number, number] = [254, 243, 199];
        let border: [number, number, number] = [253, 230, 138];
        if (c.type === 'yellow-card') { color = [202, 138, 4]; bg = [254, 243, 199]; border = [253, 230, 138]; }
        else if (c.type === 'red-card') { color = [220, 38, 38]; bg = [254, 202, 202]; border = [252, 165, 165]; }
        else if (c.type === 'second-yellow-card') { color = [251, 146, 60]; bg = [255, 237, 213]; border = [253, 186, 116]; }
        else if (c.type === 'blue-card') { color = [37, 99, 235]; bg = [191, 219, 254]; border = [147, 197, 253]; }
        else if (c.type === 'expulsion') { color = [55, 65, 81]; bg = [229, 231, 235]; border = [209, 213, 219]; }
        else if (c.type === 'warning') { color = [202, 138, 4]; bg = [254, 243, 199]; border = [253, 230, 138]; }
        doc.setFillColor(...bg);
        doc.setDrawColor(...border);
        doc.roundedRect(90, y - 10, 36, 24, 12, 12, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...color);
        doc.text(`${c.minute}${c.second !== undefined ? ':' + c.second.toString().padStart(2, '0') : ''}`, 108, y + 6, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text(c.description ?? '', 134, y + 6);
        y += 36;
      });
    }
    y += 8;

    // --- Sostituzioni ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text('Sostituzioni', 70, y);
    y += 12;
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.7);
    doc.line(70, y + 4, pageWidth - 70, y + 4);
    y += 20;
    if (substitutions.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(156, 163, 175);
      doc.text('Nessuna', 90, y);
      y += 26;
    } else {
      substitutions.forEach((s: any) => {
        doc.setFillColor(191, 219, 254);
        doc.setDrawColor(147, 197, 253);
        doc.roundedRect(90, y - 10, 36, 24, 12, 12, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(37, 99, 235);
        doc.text(`${s.minute}${s.second !== undefined ? ':' + s.second.toString().padStart(2, '0') : ''}`, 108, y + 6, { align: 'center' });
        const out = players.find(p => p.id === s.playerOut);
        const inP = players.find(p => p.id === s.playerIn);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(13);
        doc.setTextColor(220, 38, 38);
        doc.text(`Esce ${out ? out.jerseyNumber + ' ' + out.lastName : s.playerOut}`, 134, y + 6);
        doc.setTextColor(107, 114, 128);
        doc.text('-->', 290, y + 6); // Sostituito la freccia con -->
        doc.setTextColor(22, 163, 74);
        doc.text(`Entra ${inP ? inP.jerseyNumber + ' ' + inP.lastName : s.playerIn}`, 320, y + 6);
        y += 36;
      });
    }
    doc.save(`report-partita-${match.date}.pdf`);
  };

  // --- CSV ---
  const exportCSV = () => {
    const header = [
      'Data',
      'Avversario',
      'Tipo',
      'Risultato finale',
      'Numero Giocatore',
      'Nome Giocatore',
      'Posizione Giocatore',
      'Minuto Evento',
      'Tipo Evento',
      'Dettagli Evento'
    ];
    let csv = header.join(',') + '\n';
    // Info partita base
    const baseInfo = [
      match.date,
      match.opponent,
      match.homeAway === 'home' ? 'Casa' : 'Trasferta',
      `${match.homeAway === 'home' ? match.homeScore : match.awayScore}-${match.homeAway === 'home' ? match.awayScore : match.homeScore}`
    ];
    // Formazione titolare (una riga per ogni giocatore)
    lineupPlayers.forEach(p => {
      csv += [
        ...baseInfo,
        p.jerseyNumber,
        `${p.firstName} ${p.lastName}`,
        p.position,
        '', '', ''
      ].join(',') + '\n';
    });
    // Eventi: goal, ammonizioni, sostituzioni
    // Goal
    goals.forEach(g => {
      csv += [
        '', '', '', '', '', '', '',
        `${g.minute}${g.second !== undefined ? ':' + g.second.toString().padStart(2, '0') : ''}`,
        'Goal',
        g.description ? `"${g.description}"` : ''
      ].join(',') + '\n';
    });
    // Ammonizioni/Espulsioni
    cards.forEach(c => {
      let tipo = 'Ammonizione';
      if (c.type === 'red-card' || c.type === 'expulsion') tipo = 'Espulsione';
      else if (c.type === 'blue-card') tipo = 'Ammonizione';
      else if (c.type === 'second-yellow-card') tipo = 'Seconda Gialla';
      csv += [
        '', '', '', '', '', '', '',
        `${c.minute}${c.second !== undefined ? ':' + c.second.toString().padStart(2, '0') : ''}`,
        tipo,
        c.description ? `"${c.description}"` : ''
      ].join(',') + '\n';
    });
    // Sostituzioni
    substitutions.forEach(s => {
      const out = players.find(p => p.id === s.playerOut);
      const inP = players.find(p => p.id === s.playerIn);
      csv += [
        '', '', '', '', '', '', '',
        `${s.minute}${s.second !== undefined ? ':' + s.second.toString().padStart(2, '0') : ''}`,
        'Sostituzione',
        `Esce ${out ? out.jerseyNumber + ' ' + out.lastName : s.playerOut} -> Entra ${inP ? inP.jerseyNumber + ' ' + inP.lastName : s.playerIn}`
      ].join(',') + '\n';
    });
    // Salva CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-partita-${match.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- XLSX ---
  const exportXLSX = () => {
    const header = [
      'Data',
      'Avversario',
      'Tipo',
      'Risultato finale',
      'Numero Giocatore',
      'Nome Giocatore',
      'Posizione Giocatore',
      'Minuto Evento',
      'Tipo Evento',
      'Dettagli Evento'
    ];
    const wsData = [header];
    // Info partita base
    const baseInfo = [
      match.date,
      match.opponent,
      match.homeAway === 'home' ? 'Casa' : 'Trasferta',
      `${match.homeAway === 'home' ? match.homeScore : match.awayScore}-${match.homeAway === 'home' ? match.awayScore : match.homeScore}`
    ];
    // Formazione titolare (una riga per ogni giocatore)
    lineupPlayers.forEach(p => {
      wsData.push([
        ...baseInfo,
        p.jerseyNumber,
        `${p.firstName} ${p.lastName}`,
        p.position,
        '', '', ''
      ]);
    });
    // Eventi: goal, ammonizioni, sostituzioni
    // Goal
    goals.forEach(g => {
      wsData.push([
        '', '', '', '', '', '', '',
        `${g.minute}${g.second !== undefined ? ':' + g.second.toString().padStart(2, '0') : ''}`,
        'Goal',
        g.description ? `${g.description}` : ''
      ]);
    });
    // Ammonizioni/Espulsioni
    cards.forEach(c => {
      let tipo = 'Ammonizione';
      if (c.type === 'red-card' || c.type === 'expulsion') tipo = 'Espulsione';
      else if (c.type === 'blue-card') tipo = 'Ammonizione';
      else if (c.type === 'second-yellow-card') tipo = 'Seconda Gialla';
      wsData.push([
        '', '', '', '', '', '', '',
        `${c.minute}${c.second !== undefined ? ':' + c.second.toString().padStart(2, '0') : ''}`,
        tipo,
        c.description ? `${c.description}` : ''
      ]);
    });
    // Sostituzioni
    substitutions.forEach(s => {
      const out = players.find(p => p.id === s.playerOut);
      const inP = players.find(p => p.id === s.playerIn);
      wsData.push([
        '', '', '', '', '', '', '',
        `${s.minute}${s.second !== undefined ? ':' + s.second.toString().padStart(2, '0') : ''}`,
        'Sostituzione',
        `Esce ${out ? out.jerseyNumber + ' ' + out.lastName : s.playerOut} -> Entra ${inP ? inP.jerseyNumber + ' ' + inP.lastName : s.playerIn}`
      ]);
    });
    // Crea foglio e salva
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report Partita');
    XLSX.writeFile(wb, `report-partita-${match.date}.xlsx`);
  };

  const handleExport = (format: 'pdf' | 'csv' | 'xlsx') => {
    setShowExportMenu(false);
    if (format === 'pdf') exportPDF();
    if (format === 'csv') exportCSV();
    if (format === 'xlsx') exportXLSX();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative overflow-y-auto max-h-[90vh] border-4 border-blue-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-3xl font-bold transition-colors">&times;</button>
        <h2 className="text-3xl font-extrabold text-blue-700 mb-2 flex items-center gap-2">
          <span className="text-2xl font-bold">⚽</span>
          Report Partita
        </h2>
        <div className="mb-4 text-gray-600 flex flex-wrap gap-6">
          <div>
            <span className="font-semibold">Data:</span> {match.date} <br />
            <span className="font-semibold">Avversario:</span> {match.opponent} <br />
            <span className="font-semibold">Tipo:</span> {match.homeAway === 'home' ? 'Casa' : 'Trasferta'}
          </div>
          <div className="bg-blue-50 rounded-xl px-6 py-2 flex flex-col items-center shadow-sm border border-blue-200">
            <span className="text-xs text-gray-500 font-semibold">Risultato finale</span>
            <span className="text-2xl font-bold text-blue-700 mt-1">{match.homeAway === 'home' ? match.homeScore : match.awayScore} - {match.homeAway === 'home' ? match.awayScore : match.homeScore}</span>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1 border-gray-200 flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-blue-100 rounded-full"></span>
            Formazione Titolare
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            {lineupPlayers.map(p => (
              <li key={p.id} className="flex items-center gap-2 text-blue-900">
                <span className="inline-block w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">{p.jerseyNumber}</span>
                <span>{p.firstName} {p.lastName} <span className="text-xs text-gray-500">({p.position})</span></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1 border-gray-200 flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-green-100 rounded-full"></span>
              Goal
            </h3>
            {goals.length === 0 ? <p className="text-gray-400 text-sm">Nessun goal</p> : (
              <ul className="space-y-2">
                {goals.map(g => {
                  const isOpponent = g.description?.includes('avversario');
                  return (
                    <li key={g.id} className={`flex items-center gap-2 p-2 rounded-lg group ${isOpponent ? 'bg-red-50' : 'bg-green-50'}`}>
                      <span className={`text-sm font-bold min-w-[40px] ${isOpponent ? 'text-red-600' : 'text-green-600'}`}>{g.minute}{g.second !== undefined ? `:${g.second.toString().padStart(2, '0')}` : ''}</span>
                      <span className="text-gray-800">{g.description}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1 border-gray-200 flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-yellow-100 rounded-full"></span>
              Ammonizioni / Espulsioni
            </h3>
            {cards.length === 0 ? <p className="text-gray-400 text-sm">Nessuna</p> : (
              <ul className="space-y-2">
                {cards.map(c => (
                  <li key={c.id} className={`flex items-center gap-2 p-2 rounded-lg ${c.type === 'yellow-card' ? 'bg-yellow-50' : c.type === 'red-card' ? 'bg-red-50' : c.type === 'second-yellow-card' ? 'bg-orange-50' : c.type === 'blue-card' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <span className={`text-sm font-bold ${c.type === 'yellow-card' ? 'text-yellow-600' : c.type === 'red-card' ? 'text-red-600' : c.type === 'second-yellow-card' ? 'text-orange-600' : c.type === 'blue-card' ? 'text-blue-600' : 'text-gray-600'}`}>{c.minute}{c.second !== undefined ? `:${c.second.toString().padStart(2, '0')}` : ''}</span>
                    <span className="text-gray-800">{c.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1 border-gray-200 flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-blue-200 rounded-full"></span>
            Sostituzioni
          </h3>
          {substitutions.length === 0 ? <p className="text-gray-400 text-sm">Nessuna</p> : (
            <ul className="space-y-2">
              {substitutions.map(s => {
                const out = players.find(p => p.id === s.playerOut);
                const inP = players.find(p => p.id === s.playerIn);
                return (
                  <li key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                    <span className="text-sm font-bold text-blue-700 min-w-[40px]">{s.minute}{s.second !== undefined ? `:${s.second.toString().padStart(2, '0')}` : ''}</span>
                    <span className="text-red-700">Esce {out ? `${out.jerseyNumber} ${out.lastName}` : s.playerOut}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-700">Entra {inP ? `${inP.jerseyNumber} ${inP.lastName}` : s.playerIn}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="mt-8 flex justify-end gap-2 items-center">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow font-semibold text-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Esporta
            </button>
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 bg-black bg-opacity-60 z-[1100]"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-lg shadow-2xl z-[1200] min-w-[180px] p-1">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-blue-50 text-blue-700 text-left"
                  >
                    <FileText className="w-4 h-4" /> PDF
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-green-50 text-green-700 text-left"
                  >
                    <FileText className="w-4 h-4" /> CSV
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-yellow-50 text-yellow-700 text-left"
                  >
                    <FileText className="w-4 h-4" /> Excel
                  </button>
                </div>
              </>
            )}
          </div>
          <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow font-semibold text-lg transition-colors">Chiudi</button>
        </div>
      </div>
    </div>
  );
}
