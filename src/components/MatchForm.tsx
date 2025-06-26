import React, { useState, useEffect, useRef } from 'react';
import { Match, Player, MatchPlayer, UserWithGroup } from '../types';
import { Calendar, MapPin, Users, Home, Plane, Plus, Minus, Clock, FileText, Download, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface MatchFormProps {
  players: Player[];
  users?: UserWithGroup[];
  onSubmit: (match: Omit<Match, 'id' | 'status' | 'startTime' | 'firstHalfDuration' | 'secondHalfDuration' | 'substitutions' | 'events'>) => void;
  initialData?: Match;
  onCancel?: () => void;
}

// Available positions for player selection
const POSITIONS = [
  'Portiere', 'Difensore', 'Centrocampista', 'Attaccante',
  'Terzino Destro', 'Terzino Sinistro', 'Centrale',
  'Mediano', 'Trequartista', 'Ala Destra', 'Ala Sinistra', 'Punta'
];

// FIGC Society configuration - can be moved to a config file
const SOCIETY_CONFIG = {
  name: 'A.S.D. NOME SOCIETÀ',
  figcId: '000000',
  region: 'COMITATO REGIONALE LIGURIA - L.N.D. - SAVONA',
  category: 'Lista Formazione Gara – Attività Giovanile'
};

export function MatchForm({ players, users = [], onSubmit, initialData, onCancel }: MatchFormProps) {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    time: initialData?.time || '15:00',
    opponent: initialData?.opponent || '',
    homeAway: initialData?.homeAway || 'home' as 'home' | 'away',
    location: initialData?.location || '',
    field: initialData?.field || '',
    coaches: initialData?.coaches || [] as string[],
    managers: initialData?.managers || [] as string[],
    homeScore: initialData?.homeScore || 0,
    awayScore: initialData?.awayScore || 0,
    lineup: initialData?.lineup || [] as MatchPlayer[],
    opponentLineup: initialData?.opponentLineup || []
  });
  const [newJerseyNumber, setNewJerseyNumber] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedJersey, setSelectedJersey] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showExportMenu2, setShowExportMenu2] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef2 = useRef<HTMLDivElement>(null);
  const activePlayers = players.filter(p => p.isActive);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (dropdownRef2.current && !dropdownRef2.current.contains(event.target as Node)) {
        setShowExportMenu2(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter coaches and managers from users
  const coaches = users.filter(u => u.group.name === 'Allenatore' || u.group.permissions.matchManagement);
  const managers = users.filter(u => u.group.name === 'Dirigente' || u.group.permissions.teamManagement);

  // Function to generate team sheet PDF
  const generateTeamSheet = (format: 'pdf' | 'csv' | 'xlsx') => {
    if (formData.lineup.length === 0) {
      alert('Aggiungi almeno un giocatore alla formazione per generare la distinta.');
      return;
    }

    // Create team sheet content
    const teamSheet = {
      date: formData.date,
      time: formData.time,
      opponent: formData.opponent,
      location: formData.homeAway === 'away' ? formData.location : 'Casa',
      field: formData.homeAway === 'away' ? formData.field : '',
      coaches: formData.coaches.map(id => users.find(u => u.id === id)).filter((u): u is UserWithGroup => u !== undefined),
      managers: formData.managers.map(id => users.find(u => u.id === id)).filter((u): u is UserWithGroup => u !== undefined),
      lineup: formData.lineup.map(mp => {
        const player = players.find(p => p.id === mp.playerId);
        return { ...mp, player };
      }).filter((item): item is typeof item & { player: Player } => item.player !== undefined)
    };

    switch (format) {
      case 'pdf':
        generatePDF(teamSheet);
        break;
      case 'csv':
        generateCSV(teamSheet);
        break;
      case 'xlsx':
        generateXLSX(teamSheet);
        break;
    }
  };

  const generatePDF = (teamSheet: any) => {
    // Generate and download PDF following official FIGC format
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = 30;

      // Helper function to draw table borders
      const drawTable = (x: number, y: number, width: number, height: number, cols: number[], rows: number) => {
        // Outer border
        doc.rect(x, y, width, height);
        
        // Vertical lines
        let currentX = x;
        for (let i = 0; i < cols.length - 1; i++) {
          currentX += cols[i];
          doc.line(currentX, y, currentX, y + height);
        }
        
        // Horizontal lines
        const rowHeight = height / rows;
        for (let i = 1; i < rows; i++) {
          doc.line(x, y + (i * rowHeight), x + width, y + (i * rowHeight));
        }
      };

      // HEADER - INTESTAZIONE E IDENTIFICAZIONE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('COMITATO REGIONALE LIGURIA - L.N.D. - SAVONA', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(9);
      doc.text('Lista Formazione Gara – Attività Giovanile', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Add a simple football icon representation
      doc.setFontSize(8);
      doc.text('⚽ FIGC', pageWidth / 2, y, { align: 'center' });
      y += 20;

      // SOCIETÀ INFORMATION
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('INFORMAZIONI SOCIETÀ', margin, y);
      y += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Società: ________________________', margin, y);
      doc.text('Matricola F.I.G.C.: _______________', margin + 200, y);
      y += 12;
      doc.text(`Campionato/Torneo: vs ${formData.opponent}`, margin, y);
      y += 10;
      doc.text(`Girone: ____________`, margin, y);
      doc.text(`Gara N°: ________`, margin + 100, y);
      doc.text(`Data/Ora: ${formData.date} ${formData.time}`, margin + 200, y);
      y += 20;

      // MAIN SECTION - FORMAZIONE DELLA SQUADRA
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('FORMAZIONE DELLA SQUADRA', margin, y);
      y += 15;

      // Table headers
      const tableStartY = y;
      const tableWidth = pageWidth - (2 * margin);
      const colWidths = [25, 25, 130, 30, 30, 30, 80, 120]; // Column widths
      const rowHeight = 15;
      const totalRows = 21; // 20 players + header

      // Draw table structure
      drawTable(margin, tableStartY, tableWidth, rowHeight * totalRows, colWidths, totalRows);

      // Table headers
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      let currentX = margin + 2;
      
      doc.text('N°', currentX, tableStartY + 10);
      currentX += colWidths[0];
      
      doc.text('R', currentX, tableStartY + 10);
      currentX += colWidths[1];
      
      doc.text('CALCIATORI (Cognome e Nome)', currentX, tableStartY + 10);
      currentX += colWidths[2];
      
      doc.text('G', currentX, tableStartY + 8);
      doc.text('(Giorno)', currentX - 5, tableStartY + 12);
      currentX += colWidths[3];
      
      doc.text('M', currentX, tableStartY + 8);
      doc.text('(Mese)', currentX - 5, tableStartY + 12);
      currentX += colWidths[4];
      
      doc.text('A', currentX, tableStartY + 8);
      doc.text('(Anno)', currentX - 5, tableStartY + 12);
      currentX += colWidths[5];
      
      doc.text('N° MATRICOLA', currentX, tableStartY + 8);
      doc.text('o TESSERA "GIOVANE"', currentX, tableStartY + 12);
      currentX += colWidths[6];
      
      doc.text('DOCUMENTI UFFICIALI', currentX, tableStartY + 8);
      doc.text('per l\'accertamento dell\'identità dei calciatori', currentX, tableStartY + 12);

      // Fill player data
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      for (let i = 0; i < 20; i++) {
        const currentRowY = tableStartY + ((i + 1) * rowHeight) + 10;
        let currentX = margin + 2;
        
        // Row number (skip 16 as per FIGC format)
        const displayNumber = i >= 15 ? i + 2 : i + 1;
        doc.text(displayNumber.toString(), currentX, currentRowY);
        currentX += colWidths[0];
        
        if (i < teamSheet.lineup.length) {
          const player = teamSheet.lineup[i];
          
          // Role
          const roleAbbrev = player.position === 'Portiere' ? 'P' : 
                           player.position?.includes('Difensore') ? 'D' :
                           player.position?.includes('Centrocampista') ? 'C' :
                           player.position?.includes('Attaccante') ? 'A' : '';
          doc.text(roleAbbrev, currentX, currentRowY);
          currentX += colWidths[1];
          
          // Player name
          const playerName = `${player.player.lastName.toUpperCase()} ${player.player.firstName}`;
          doc.text(playerName, currentX, currentRowY);
          currentX += colWidths[2];
          
          // Birth date (if available)
          if (player.player.birthDate) {
            const birthDate = new Date(player.player.birthDate);
            doc.text(birthDate.getDate().toString().padStart(2, '0'), currentX, currentRowY);
            currentX += colWidths[3];
            doc.text((birthDate.getMonth() + 1).toString().padStart(2, '0'), currentX, currentRowY);
            currentX += colWidths[4];
            doc.text(birthDate.getFullYear().toString(), currentX, currentRowY);
            currentX += colWidths[5];
          } else {
            currentX += colWidths[3] + colWidths[4] + colWidths[5];
          }
          
          // Jersey number as matricola
          doc.text(player.jerseyNumber.toString(), currentX, currentRowY);
          currentX += colWidths[6];
          
          // Document field
          doc.text('C.A FIGC', currentX, currentRowY);
        }
      }

      y = tableStartY + (rowHeight * totalRows) + 15;

      // GUARDIALINEE section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('GUARDIALINEE: _______________________________________________', margin, y);
      y += 15;

      // STAFF SECTION - PERSONE AMMESSE SUL TERRENO DI GIOCO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('PERSONE AMMESSE SUL TERRENO DI GIOCO', margin, y);
      y += 12;

      // Staff table
      const staffRoles = [
        'Accompagnatore', 'Ufficiale', 'Dirigente', 'Allenatore', 
        'Dirigente', 'Massaggiatore', 'Medico', 'Sociale (Accompagnatore)'
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      staffRoles.forEach((role, index) => {
        const isAssigned = (role === 'Allenatore' && teamSheet.coaches.length > 0) ||
                          (role === 'Dirigente' && teamSheet.managers.length > 0);
        
        if (isAssigned) {
          const staff = role === 'Allenatore' ? teamSheet.coaches[0] : teamSheet.managers[0];
          doc.text(`${role}: ${staff.firstName} ${staff.lastName}`, margin, y);
        } else {
          doc.text(`${role}: ________________________________`, margin, y);
        }
        
        doc.text('Doc.: ________________', margin + 250, y);
        doc.text('Tessera: __________', margin + 370, y);
        y += 10;
      });

      y += 10;

      // LEGAL NOTES
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const legalText = 'Il Dirigente Accompagnatore dichiara sotto la propria responsabilità che i documenti d\'identità ' +
                       'e le tessere federali dei calciatori sono regolari e valide. NON SARANNO ACCETTATI ELENCHI ' +
                       'FORMAZIONE PRIVI DELL\'INDICAZIONE DEL GIORNO, MESE, ANNO DI NASCITA DEI CALCIATORI.';
      
      const lines = doc.splitTextToSize(legalText, pageWidth - (2 * margin));
      doc.text(lines, margin, y);
      y += lines.length * 8 + 15;

      // SIGNATURES
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Accompagnatore Ufficiale', margin, y);
      doc.text('Firma dell\'Arbitro', margin + 250, y);
      y += 5;
      doc.text('(firma leggibile)', margin, y);
      y += 20;
      doc.text('_____________________', margin, y);
      doc.text('_____________________', margin + 250, y);

      // Footer note
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('COPIA DA ALLEGARE AL RAPPORTO DI GARA', pageWidth / 2, y, { align: 'center' });

      // Save
      doc.save(`distinta-figc-${formData.opponent}-${formData.date}.pdf`);
    });
  };

  const generateCSV = (teamSheet: any) => {
    let csvContent = '';
    
    // Header information following FIGC format
    csvContent += 'COMITATO REGIONALE LIGURIA - L.N.D. - SAVONA\n';
    csvContent += 'Lista Formazione Gara – Attività Giovanile\n';
    csvContent += '\n';
    csvContent += 'INFORMAZIONI SOCIETÀ\n';
    csvContent += 'Società,Matricola F.I.G.C.\n';
    csvContent += ',\n';
    csvContent += `Campionato/Torneo,vs ${formData.opponent}\n`;
    csvContent += `Data/Ora,${formData.date} ${formData.time}\n`;
    csvContent += '\n';
    
    // Main player formation table
    csvContent += 'FORMAZIONE DELLA SQUADRA\n';
    csvContent += 'N°,Ruolo,Calciatori (Cognome e Nome),Giorno,Mese,Anno,N° Matricola,Documenti Ufficiali\n';
    
    // Players data
    for (let i = 0; i < 20; i++) {
      const displayNumber = i >= 15 ? i + 2 : i + 1; // Skip 16 as per FIGC format
      
      if (i < teamSheet.lineup.length) {
        const player = teamSheet.lineup[i];
        const roleAbbrev = player.position === 'Portiere' ? 'P' : 
                          player.position?.includes('Difensore') ? 'D' :
                          player.position?.includes('Centrocampista') ? 'C' :
                          player.position?.includes('Attaccante') ? 'A' : '';
        
        const playerName = `${player.player.lastName.toUpperCase()} ${player.player.firstName}`;
        
        let birthDay = '', birthMonth = '', birthYear = '';
        if (player.player.birthDate) {
          const birthDate = new Date(player.player.birthDate);
          birthDay = birthDate.getDate().toString().padStart(2, '0');
          birthMonth = (birthDate.getMonth() + 1).toString().padStart(2, '0');
          birthYear = birthDate.getFullYear().toString();
        }
        
        csvContent += `${displayNumber},${roleAbbrev},"${playerName}",${birthDay},${birthMonth},${birthYear},${player.jerseyNumber},C.A FIGC\n`;
      } else {
        csvContent += `${displayNumber},,,,,,\n`;
      }
    }
    
    csvContent += '\n';
    csvContent += 'GUARDIALINEE,\n';
    csvContent += '\n';
    
    // Staff section
    csvContent += 'PERSONE AMMESSE SUL TERRENO DI GIOCO\n';
    csvContent += 'Ruolo,Nome,Documento,Tessera\n';
    
    const staffRoles = [
      'Accompagnatore', 'Ufficiale', 'Dirigente', 'Allenatore', 
      'Dirigente', 'Massaggiatore', 'Medico', 'Sociale (Accompagnatore)'
    ];
    
    staffRoles.forEach(role => {
      const isAssigned = (role === 'Allenatore' && teamSheet.coaches.length > 0) ||
                        (role === 'Dirigente' && teamSheet.managers.length > 0);
      
      if (isAssigned) {
        const staff = role === 'Allenatore' ? teamSheet.coaches[0] : teamSheet.managers[0];
        csvContent += `${role},"${staff.firstName} ${staff.lastName}",,\n`;
      } else {
        csvContent += `${role},,,\n`;
      }
    });
    
    csvContent += '\n';
    csvContent += 'NOTE LEGALI\n';
    csvContent += '"Il Dirigente Accompagnatore dichiara sotto la propria responsabilità che i documenti d\'identità e le tessere federali dei calciatori sono regolari e valide."\n';
    csvContent += '"NON SARANNO ACCETTATI ELENCHI FORMAZIONE PRIVI DELL\'INDICAZIONE DEL GIORNO, MESE, ANNO DI NASCITA DEI CALCIATORI."\n';
    csvContent += '\n';
    csvContent += 'FIRME\n';
    csvContent += 'Accompagnatore Ufficiale,Firma dell\'Arbitro\n';
    csvContent += ',\n';
    csvContent += '\n';
    csvContent += 'COPIA DA ALLEGARE AL RAPPORTO DI GARA\n';
    
    // Create and download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `distinta-figc-${formData.opponent}-${formData.date}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const generateXLSX = (teamSheet: any) => {
    const wb = XLSX.utils.book_new();
    
    // Create worksheet data following FIGC format
    const wsData = [
      ['COMITATO REGIONALE LIGURIA - L.N.D. - SAVONA'],
      ['Lista Formazione Gara – Attività Giovanile'],
      [],
      ['INFORMAZIONI SOCIETÀ'],
      ['Società:', '', 'Matricola F.I.G.C.:'],
      [`Campionato/Torneo: vs ${formData.opponent}`],
      [`Data/Ora: ${formData.date} ${formData.time}`],
      [],
      ['FORMAZIONE DELLA SQUADRA'],
      ['N°', 'Ruolo', 'Calciatori (Cognome e Nome)', 'G', 'M', 'A', 'N° Matricola', 'Documenti Ufficiali']
    ];
    
    // Add player rows
    for (let i = 0; i < 20; i++) {
      const displayNumber = i >= 15 ? i + 2 : i + 1; // Skip 16 as per FIGC format
      
      if (i < teamSheet.lineup.length) {
        const player = teamSheet.lineup[i];
        const roleAbbrev = player.position === 'Portiere' ? 'P' : 
                          player.position?.includes('Difensore') ? 'D' :
                          player.position?.includes('Centrocampista') ? 'C' :
                          player.position?.includes('Attaccante') ? 'A' : '';
        
        const playerName = `${player.player.lastName.toUpperCase()} ${player.player.firstName}`;
        
        let birthDay = '', birthMonth = '', birthYear = '';
        if (player.player.birthDate) {
          const birthDate = new Date(player.player.birthDate);
          birthDay = birthDate.getDate().toString().padStart(2, '0');
          birthMonth = (birthDate.getMonth() + 1).toString().padStart(2, '0');
          birthYear = birthDate.getFullYear().toString();
        }
        
        wsData.push([
          displayNumber,
          roleAbbrev,
          playerName,
          birthDay,
          birthMonth,
          birthYear,
          player.jerseyNumber,
          'C.A FIGC'
        ]);
      } else {
        wsData.push([displayNumber, '', '', '', '', '', '', '']);
      }
    }
    
    // Add remaining sections
    wsData.push([]);
    wsData.push(['GUARDIALINEE:']);
    wsData.push([]);
    wsData.push(['PERSONE AMMESSE SUL TERRENO DI GIOCO']);
    wsData.push(['Ruolo', 'Nome', 'Documento', 'Tessera']);
    
    const staffRoles = [
      'Accompagnatore', 'Ufficiale', 'Dirigente', 'Allenatore', 
      'Dirigente', 'Massaggiatore', 'Medico', 'Sociale (Accompagnatore)'
    ];
    
    staffRoles.forEach(role => {
      const isAssigned = (role === 'Allenatore' && teamSheet.coaches.length > 0) ||
                        (role === 'Dirigente' && teamSheet.managers.length > 0);
      
      if (isAssigned) {
        const staff = role === 'Allenatore' ? teamSheet.coaches[0] : teamSheet.managers[0];
        wsData.push([role, `${staff.firstName} ${staff.lastName}`, '', '']);
      } else {
        wsData.push([role, '', '', '']);
      }
    });
    
    wsData.push([]);
    wsData.push(['NOTE LEGALI']);
    wsData.push(['Il Dirigente Accompagnatore dichiara sotto la propria responsabilità che i documenti d\'identità e le tessere federali dei calciatori sono regolari e valide.']);
    wsData.push(['NON SARANNO ACCETTATI ELENCHI FORMAZIONE PRIVI DELL\'INDICAZIONE DEL GIORNO, MESE, ANNO DI NASCITA DEI CALCIATORI.']);
    wsData.push([]);
    wsData.push(['FIRME']);
    wsData.push(['Accompagnatore Ufficiale', 'Firma dell\'Arbitro']);
    wsData.push([]);
    wsData.push(['COPIA DA ALLEGARE AL RAPPORTO DI GARA']);
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 5 },   // N°
      { wch: 8 },   // Ruolo
      { wch: 30 },  // Calciatori
      { wch: 5 },   // G
      { wch: 5 },   // M
      { wch: 6 },   // A
      { wch: 12 },  // Matricola
      { wch: 20 }   // Documenti
    ];
    
    // Style headers
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }); // Header merge
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }); // Subtitle merge
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Distinta FIGC');
    
    // Save file
    XLSX.writeFile(wb, `distinta-figc-${formData.opponent}-${formData.date}.xlsx`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.lineup.length === 0) {
      setFormError('Devi inserire almeno un giocatore titolare della tua squadra.');
      return;
    }
    if (formData.opponentLineup.length === 0) {
      setFormError('Devi inserire almeno un numero di maglia avversario.');
      return;
    }
    if (formData.homeAway === 'away' && (!formData.location || formData.location.trim() === '')) {
      setFormError('Inserisci il luogo per le partite in trasferta.');
      return;
    }
    setFormError(null);
    onSubmit(formData);
  };

  const addPlayerToLineup = () => {
    if (!selectedPlayer || !selectedPosition || !selectedJersey) {
      setFormError('Seleziona giocatore, posizione e numero di maglia.');
      return;
    }
    
    const jerseyNum = parseInt(selectedJersey);
    if (isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99) {
      setFormError('Numero di maglia non valido (1-99).');
      return;
    }
    
    // Check if player is already in lineup
    if (formData.lineup.some(mp => mp.playerId === selectedPlayer)) {
      setFormError('Il giocatore è già nella formazione.');
      return;
    }
    
    // Check if jersey number is already used
    if (formData.lineup.some(mp => mp.jerseyNumber === jerseyNum)) {
      setFormError('Numero di maglia già utilizzato.');
      return;
    }
    
    const newMatchPlayer: MatchPlayer = {
      playerId: selectedPlayer,
      position: selectedPosition,
      jerseyNumber: jerseyNum
    };
    
    setFormData(prev => ({
      ...prev,
      lineup: [...prev.lineup, newMatchPlayer]
    }));
    
    setSelectedPlayer('');
    setSelectedPosition('');
    setSelectedJersey('');
    setFormError(null);
  };

  const removePlayerFromLineup = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      lineup: prev.lineup.filter(mp => mp.playerId !== playerId)
    }));
  };

  const addOpponentJerseyNumber = () => {
    if (newJerseyNumber && !isNaN(Number(newJerseyNumber))) {
      const jerseyNum = Number(newJerseyNumber);
      if (!formData.opponentLineup.includes(jerseyNum)) {
        setFormData(prev => ({
          ...prev,
          opponentLineup: [...prev.opponentLineup, jerseyNum].sort((a, b) => a - b)
        }));
        setNewJerseyNumber('');
      }
    }
  };

  const removeOpponentJerseyNumber = (number: number) => {
    setFormData(prev => ({
      ...prev,
      opponentLineup: prev.opponentLineup.filter(n => n !== number)
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-red-600" />
        {initialData ? 'Modifica Partita' : 'Nuova Partita'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-2 text-sm font-medium">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Data
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Orario
            </label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Avversario
            </label>
            <input
              type="text"
              required
              value={formData.opponent}
              onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="Nome squadra avversaria"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tipo di partita</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="homeAway"
                value="home"
                checked={formData.homeAway === 'home'}
                onChange={(e) => setFormData({ ...formData, homeAway: e.target.value as 'home' | 'away' })}
                className="sr-only"
              />
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.homeAway === 'home' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <Home className="w-4 h-4" />
                Casa
              </div>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="homeAway"
                value="away"
                checked={formData.homeAway === 'away'}
                onChange={(e) => setFormData({ ...formData, homeAway: e.target.value as 'home' | 'away' })}
                className="sr-only"
              />
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.homeAway === 'away' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <Plane className="w-4 h-4" />
                Trasferta
              </div>
            </label>
          </div>
        </div>

        {/* Location and Field for Away matches */}
        {formData.homeAway === 'away' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Luogo
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Inserisci il luogo della partita"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campo
              </label>
              <input
                type="text"
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Nome del campo (opzionale)"
              />
            </div>
          </div>
        )}

        {/* Staff Selection */}
        {(coaches.length > 0 || managers.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coaches.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Allenatori</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {coaches.map(coach => (
                    <label key={coach.id} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.coaches.includes(coach.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, coaches: [...prev.coaches, coach.id] }));
                          } else {
                            setFormData(prev => ({ ...prev, coaches: prev.coaches.filter(id => id !== coach.id) }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{coach.firstName} {coach.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {managers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Dirigenti</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {managers.map(manager => (
                    <label key={manager.id} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.managers.includes(manager.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, managers: [...prev.managers, manager.id] }));
                          } else {
                            setFormData(prev => ({ ...prev, managers: prev.managers.filter(id => id !== manager.id) }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{manager.firstName} {manager.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {initialData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gol {formData.homeAway === 'home' ? 'nostri' : 'avversari'}
              </label>
              <input
                type="number"
                min="0"
                value={formData.homeAway === 'home' ? formData.homeScore : formData.awayScore}
                onChange={(e) => {
                  const score = parseInt(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    [formData.homeAway === 'home' ? 'homeScore' : 'awayScore']: score
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gol {formData.homeAway === 'home' ? 'avversari' : 'nostri'}
              </label>
              <input
                type="number"
                min="0"
                value={formData.homeAway === 'home' ? formData.awayScore : formData.homeScore}
                onChange={(e) => {
                  const score = parseInt(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    [formData.homeAway === 'home' ? 'awayScore' : 'homeScore']: score
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Formazione Titolare ({formData.lineup.length} giocatori)
            </h4>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                Genera Distinta
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showExportMenu && (
                <div ref={dropdownRef} className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    type="button"
                    onClick={() => {
                      generateTeamSheet('pdf');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-t-lg text-sm"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      generateTeamSheet('csv');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      generateTeamSheet('xlsx');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-b-lg text-sm"
                  >
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Add Player Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giocatore</label>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Seleziona giocatore</option>
                  {activePlayers
                    .filter(p => !formData.lineup.some(mp => mp.playerId === p.id))
                    .map(player => (
                      <option key={player.id} value={player.id}>
                        {player.firstName} {player.lastName}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posizione</label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Seleziona posizione</option>
                  {POSITIONS.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maglia</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={selectedJersey}
                  onChange={(e) => setSelectedJersey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="N°"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addPlayerToLineup}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi
                </button>
              </div>
            </div>
          </div>

          {/* Current Lineup */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {formData.lineup.map((matchPlayer) => {
              const player = players.find(p => p.id === matchPlayer.playerId);
              if (!player) return null;
              
              return (
                <div
                  key={matchPlayer.playerId}
                  className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <span className="font-bold text-sm">#{matchPlayer.jerseyNumber}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">
                        {player.firstName} {player.lastName}
                      </span>
                      <p className="text-sm text-gray-600">{matchPlayer.position}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePlayerFromLineup(matchPlayer.playerId)}
                    className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {formData.lineup.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nessun giocatore aggiunto alla formazione</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Numeri Maglia Avversari ({formData.opponentLineup.length})
          </h4>
          <div className="flex items-end gap-2 mb-4">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero maglia
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={newJerseyNumber}
                onChange={(e) => setNewJerseyNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Inserisci numero maglia"
              />
            </div>
            <button
              type="button"
              onClick={addOpponentJerseyNumber}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.opponentLineup.map(number => (
              <div 
                key={number} 
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-800 font-bold text-sm">#{number}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeOpponentJerseyNumber(number)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
            {formData.opponentLineup.length === 0 && (
              <p className="text-gray-500 text-sm italic">Nessun numero di maglia aggiunto</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <div className="relative" ref={dropdownRef2}>
            <button
              type="button"
              onClick={() => setShowExportMenu2(!showExportMenu2)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Distinta
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showExportMenu2 && (
              <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                <button
                  type="button"
                  onClick={() => {
                    generateTeamSheet('pdf');
                    setShowExportMenu2(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-t-lg text-sm"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    generateTeamSheet('csv');
                    setShowExportMenu2(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    generateTeamSheet('xlsx');
                    setShowExportMenu2(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-b-lg text-sm"
                >
                  Excel
                </button>
              </div>
            )}
          </div>
          <button
            type="submit"
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            {initialData ? 'Aggiorna' : 'Crea'} Partita
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Annulla
            </button>
          )}
        </div>
      </form>
    </div>
  );
}