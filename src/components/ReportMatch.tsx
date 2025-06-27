import { useState } from 'react';
import { Match, Player, UserWithGroup } from '../types';
import { Download, FileText, Calendar, MapPin, Users, Trophy, Timer, Target, AlertTriangle, RotateCcw, Flag, Ban, Zap, UserX } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportMatchProps {
  match: Match;
  players: Player[];
  users: UserWithGroup[];
  onClose: () => void;
}

export function ReportMatch({ match, players, users, onClose }: ReportMatchProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const lineupPlayers = players.filter(p => match.lineup.find(lp => lp.playerId === p.id));
  
  // Funzione per ottenere il numero di maglia di un giocatore
  const getPlayerJerseyNumber = (playerId: string) => {
    const matchPlayer = match.lineup.find(lp => lp.playerId === playerId);
    return matchPlayer?.jerseyNumber;
  };
  
  // Funzione per ottenere il nome del periodo
  const getPeriodName = (periodIndex: number) => {
    if (!match.periods || !match.periods[periodIndex]) return 'Periodo sconosciuto';
    return match.periods[periodIndex].label;
  };

  // Raggruppa eventi per periodo basandosi sui tempi
  const getEventsByPeriod = () => {
    const eventsByPeriod: { [key: number]: { goals: any[], cards: any[], substitutions: any[], otherEvents: any[] } } = {};
    
    // Se non ci sono periodi, usa un periodo di default
    const periods = match.periods || [{ type: 'regular', label: '1° Tempo', duration: 0 }];
    
    // Inizializza tutti i periodi
    periods.forEach((_, index) => {
      eventsByPeriod[index] = { goals: [], cards: [], substitutions: [], otherEvents: [] };
    });

    // Funzione per determinare in quale periodo di gioco appartiene un evento, basandosi sul timestamp assoluto.
    // Gli eventi non vengono mai assegnati a periodi di tipo 'interval'.
    const getEventPeriodIndex = (eventTimeInSeconds: number) => {
      let cumulativeTime = 0;
      let lastValidPeriodIndex = 0;

      // Calcola i tempi di inizio e fine per ogni periodo (inclusi intervalli)
      const periodTimings = periods.map((period, index) => {
        const startTime = cumulativeTime;
        cumulativeTime += period.duration;
        const endTime = cumulativeTime;
        if (period.type !== 'interval') {
          lastValidPeriodIndex = index;
        }
        return { startTime, endTime, type: period.type, index };
      });

      // 1. Trova il periodo in cui cade l'evento in base al tempo assoluto
      const containingPeriod = periodTimings.find(p => eventTimeInSeconds >= p.startTime && eventTimeInSeconds < p.endTime);

      if (containingPeriod) {
        // 2. Se il periodo trovato è un intervallo, non è valido.
        // La logica cerca il *prossimo* periodo di gioco valido.
        if (containingPeriod.type === 'interval') {
          for (let i = containingPeriod.index + 1; i < periodTimings.length; i++) {
            if (periodTimings[i].type !== 'interval') {
              return i; // Trovato il prossimo periodo di gioco.
            }
          }
          // Se non ci sono periodi di gioco successivi, ritorna l'ultimo valido (fallback).
          return lastValidPeriodIndex;
        } else {
          // 3. Se è un periodo di gioco, l'assegnazione è corretta.
          return containingPeriod.index;
        }
      }

      // 4. Se l'evento è accaduto dopo la fine di tutti i periodi, 
      //    assegnalo all'ultimo periodo di gioco valido.
      return lastValidPeriodIndex;
    };

    // Raggruppa goal per periodo
    const goals = match.events.filter(e => e.type === 'goal');
    goals.forEach(goal => {
      const eventTimeInSeconds = (goal.minute * 60) + (goal.second || 0);
      const periodIndex = goal.periodIndex !== undefined ? goal.periodIndex : getEventPeriodIndex(eventTimeInSeconds);
      
      if (!eventsByPeriod[periodIndex]) {
        eventsByPeriod[periodIndex] = { goals: [], cards: [], substitutions: [], otherEvents: [] };
      }
      eventsByPeriod[periodIndex].goals.push(goal);
    });

    // Raggruppa ammonizioni per periodo
    const cards = match.events.filter(e => [
      'yellow-card','red-card','second-yellow-card','blue-card','expulsion','warning'
    ].includes(e.type));
    cards.forEach(card => {
      const eventTimeInSeconds = (card.minute * 60) + (card.second || 0);
      const periodIndex = card.periodIndex !== undefined ? card.periodIndex : getEventPeriodIndex(eventTimeInSeconds);
      
      if (!eventsByPeriod[periodIndex]) {
        eventsByPeriod[periodIndex] = { goals: [], cards: [], substitutions: [], otherEvents: [] };
      }
      eventsByPeriod[periodIndex].cards.push(card);
    });

    // Raggruppa sostituzioni per periodo
    match.substitutions.forEach(substitution => {
      const eventTimeInSeconds = (substitution.minute * 60) + (substitution.second || 0);
      const periodIndex = substitution.periodIndex !== undefined ? substitution.periodIndex : getEventPeriodIndex(eventTimeInSeconds);
      
      if (!eventsByPeriod[periodIndex]) {
        eventsByPeriod[periodIndex] = { goals: [], cards: [], substitutions: [], otherEvents: [] };
      }
      eventsByPeriod[periodIndex].substitutions.push(substitution);
    });

    // Raggruppa altri eventi per periodo
    const otherEvents = match.events.filter(e => [
      'foul', 'corner', 'offside', 'free-kick', 'penalty', 'throw-in', 'injury'
    ].includes(e.type));
    otherEvents.forEach(event => {
      const eventTimeInSeconds = (event.minute * 60) + (event.second || 0);
      const periodIndex = event.periodIndex !== undefined ? event.periodIndex : getEventPeriodIndex(eventTimeInSeconds);
      
      if (!eventsByPeriod[periodIndex]) {
        eventsByPeriod[periodIndex] = { goals: [], cards: [], substitutions: [], otherEvents: [] };
      }
      eventsByPeriod[periodIndex].otherEvents.push(event);
    });

    return eventsByPeriod;
  };

  const eventsByPeriod = getEventsByPeriod();

  // Get staff members by ID
  const getStaffNames = (userIds: string[]) => {
    return userIds.map(id => {
      const user = users.find(u => u.id === id);
      return user ? `${user.firstName} ${user.lastName}` : 'Utente non trovato';
    });
  };

  // CSV migliorato con suddivisione per periodi
  const exportCSV = () => {
    const csvRows: string[] = [];
    
    // Header generale
    csvRows.push('REPORT PARTITA');
    csvRows.push('');
    csvRows.push(`Data,${match.date}`);
    csvRows.push(`Ora,${match.time || 'Non specificata'}`);
    csvRows.push(`Avversario,${match.opponent}`);
    csvRows.push(`Tipo,${match.homeAway === 'home' ? 'Casa' : 'Trasferta'}`);
    if (match.location) csvRows.push(`Luogo,${match.location}`);
    if (match.field) csvRows.push(`Campo,${match.field}`);
    csvRows.push(`Risultato finale,${match.homeAway === 'home' ? match.homeScore : match.awayScore}-${match.homeAway === 'home' ? match.awayScore : match.homeScore}`);
    csvRows.push('');
    
    // Staff tecnico
    if (match.coaches?.length > 0 || match.managers?.length > 0) {
      csvRows.push('STAFF TECNICO');
      if (match.coaches?.length > 0) {
        csvRows.push('Allenatori');
        getStaffNames(match.coaches).forEach(name => csvRows.push(`,${name}`));
      }
      if (match.managers?.length > 0) {
        csvRows.push('Dirigenti');
        getStaffNames(match.managers).forEach(name => csvRows.push(`,${name}`));
      }
      csvRows.push('');
    }
    
    // Formazione titolare
    csvRows.push('FORMAZIONE TITOLARE');
    csvRows.push('Numero,Nome,Cognome,Posizione');
    lineupPlayers.forEach(p => {
      const matchPlayer = match.lineup.find(lp => lp.playerId === p.id);
      csvRows.push(`${matchPlayer?.jerseyNumber || ''},${p.firstName},${p.lastName},${matchPlayer?.position || ''}`);
    });
    csvRows.push('');
    
    // Eventi per periodo
    Object.entries(eventsByPeriod).forEach(([periodIndex, events]) => {
      const periodName = getPeriodName(parseInt(periodIndex));
      csvRows.push(`PERIODO: ${periodName}`);
      csvRows.push('');
      
      // Goal del periodo
      if (events.goals.length > 0) {
        csvRows.push('Goal');
        csvRows.push('Minuto,Descrizione');
        events.goals.forEach(g => {
          const timeStr = `${g.minute}${g.second !== null && g.second !== undefined ? ':' + g.second.toString().padStart(2, '0') : ''}`;
          csvRows.push(`${timeStr},"${g.description || ''}"`);
        });
        csvRows.push('');
      }
      
      // Ammonizioni del periodo
      if (events.cards.length > 0) {
        csvRows.push('Ammonizioni/Espulsioni');
        csvRows.push('Minuto,Tipo,Descrizione');
        events.cards.forEach(c => {
          const timeStr = `${c.minute}${c.second !== null && c.second !== undefined ? ':' + c.second.toString().padStart(2, '0') : ''}`;
          let tipo = 'Ammonizione';
          if (c.type === 'red-card' || c.type === 'expulsion') tipo = 'Espulsione';
          else if (c.type === 'second-yellow-card') tipo = 'Seconda Gialla';
          else if (c.type === 'blue-card') tipo = 'Cartellino Blu';
          csvRows.push(`${timeStr},${tipo},"${c.description || ''}"`);
        });
        csvRows.push('');
      }
      
      // Sostituzioni del periodo
      if (events.substitutions.length > 0) {
        csvRows.push('Sostituzioni');
        csvRows.push('Minuto,Esce,Entra');
        events.substitutions.forEach(s => {
          const timeStr = `${s.minute}${s.second !== null && s.second !== undefined ? ':' + s.second.toString().padStart(2, '0') : ''}`;
          const out = players.find(p => p.id === s.playerOut);
          const inP = players.find(p => p.id === s.playerIn);
          const outDisplay = `${s.playerOutJerseyNumber ? `#${s.playerOutJerseyNumber}` : '#'} ${out ? out.lastName : s.playerOut}`;
          const inDisplay = `${s.playerInJerseyNumber ? `#${s.playerInJerseyNumber}` : '#'} ${inP ? inP.lastName : s.playerIn}`;
          csvRows.push(`${timeStr},"${outDisplay}","${inDisplay}"`);
        });
        csvRows.push('');
      }
      
      // Altri eventi del periodo
      if (events.otherEvents.length > 0) {
        csvRows.push('Altri Eventi');
        csvRows.push('Minuto,Tipo,Giocatore,Descrizione');
        events.otherEvents.forEach(e => {
          const timeStr = `${e.minute}${e.second !== null && e.second !== undefined ? ':' + e.second.toString().padStart(2, '0') : ''}`;
          let tipo = '';
          switch (e.type) {
            case 'foul': tipo = 'Fallo'; break;
            case 'corner': tipo = 'Calcio d\'angolo'; break;
            case 'offside': tipo = 'Fuorigioco'; break;
            case 'free-kick': tipo = 'Calcio di punizione'; break;
            case 'penalty': tipo = 'Rigore'; break;
            case 'throw-in': tipo = 'Rimessa laterale'; break;
            case 'injury': tipo = 'Infortunio'; break;
            default: tipo = 'Evento'; break;
          }
          
          // Ottieni informazioni giocatore
          let playerInfo = '';
          if (e.playerId && e.teamType === 'own') {
            const player = players.find(p => p.id === e.playerId);
            const jerseyNumber = getPlayerJerseyNumber(e.playerId);
            if (player && jerseyNumber) {
              playerInfo = `#${jerseyNumber} ${player.lastName}`;
            } else if (player) {
              playerInfo = player.lastName;
            }
          } else if (e.teamType === 'opponent') {
            playerInfo = 'Avversario';
          }
          
          csvRows.push(`${timeStr},${tipo},"${playerInfo}","${e.description || ''}"`);
        });
        csvRows.push('');
      }
    });
    
    // Statistiche
    csvRows.push('STATISTICHE PARTITA');
    csvRows.push('Statistica,Squadra,Avversario');
    csvRows.push(`Possesso palla,${match.possessionHome || 0}%,${match.possessionAway || 0}%`);
    csvRows.push(`Tiri totali,${match.totalShotsHome || 0},${match.totalShotsAway || 0}`);
    csvRows.push(`Tiri in porta,${match.shotsOnTargetHome || 0},${match.shotsOnTargetAway || 0}`);
    csvRows.push(`Falli commessi,${match.foulsCommittedHome || 0},${match.foulsCommittedAway || 0}`);
    csvRows.push(`Calci d'angolo,${match.cornersHome || 0},${match.cornersAway || 0}`);
    csvRows.push(`Fuorigioco,${match.offsideHome || 0},${match.offsideAway || 0}`);
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-partita-${match.date}-${match.opponent.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // XLSX migliorato con fogli multipli
  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    
    // Foglio 1: Informazioni generali
    const infoData = [
      ['REPORT PARTITA'],
      [],
      ['Data', match.date],
      ['Ora', match.time || 'Non specificata'],
      ['Avversario', match.opponent],
      ['Tipo', match.homeAway === 'home' ? 'Casa' : 'Trasferta'],
      ...(match.location ? [['Luogo', match.location]] : []),
      ...(match.field ? [['Campo', match.field]] : []),
      ['Risultato finale', `${match.homeAway === 'home' ? match.homeScore : match.awayScore}-${match.homeAway === 'home' ? match.awayScore : match.homeScore}`],
      [],
      ['FORMAZIONE TITOLARE'],
      ['Numero', 'Nome', 'Cognome', 'Posizione'],
      ...lineupPlayers.map(p => {
        const matchPlayer = match.lineup.find(lp => lp.playerId === p.id);
        return [matchPlayer?.jerseyNumber || '', p.firstName, p.lastName, matchPlayer?.position || ''];
      })
    ];
    
    if (match.coaches?.length > 0 || match.managers?.length > 0) {
      infoData.push([]);
      infoData.push(['STAFF TECNICO']);
      if (match.coaches?.length > 0) {
        infoData.push(['Allenatori']);
        getStaffNames(match.coaches).forEach(name => infoData.push(['', name]));
      }
      if (match.managers?.length > 0) {
        infoData.push(['Dirigenti']);
        getStaffNames(match.managers).forEach(name => infoData.push(['', name]));
      }
    }
    
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Informazioni Partita');
    
    // Foglio 2: Eventi per periodo
    const eventsData = [['EVENTI PER PERIODO'], []];
    
    Object.entries(eventsByPeriod).forEach(([periodIndex, events]) => {
      const periodName = getPeriodName(parseInt(periodIndex));
      eventsData.push([`PERIODO: ${periodName}`]);
      eventsData.push([]);
      
      if (events.goals.length > 0) {
        eventsData.push(['Goal']);
        eventsData.push(['Minuto', 'Descrizione']);
        events.goals.forEach(g => {
          const timeStr = `${g.minute}${g.second !== null && g.second !== undefined ? ':' + g.second.toString().padStart(2, '0') : ''}`;
          eventsData.push([timeStr, g.description || '']);
        });
        eventsData.push([]);
      }
      
      if (events.cards.length > 0) {
        eventsData.push(['Ammonizioni/Espulsioni']);
        eventsData.push(['Minuto', 'Tipo', 'Descrizione']);
        events.cards.forEach(c => {
          const timeStr = `${c.minute}${c.second !== null && c.second !== undefined ? ':' + c.second.toString().padStart(2, '0') : ''}`;
          let tipo = 'Ammonizione';
          if (c.type === 'red-card' || c.type === 'expulsion') tipo = 'Espulsione';
          else if (c.type === 'second-yellow-card') tipo = 'Seconda Gialla';
          else if (c.type === 'blue-card') tipo = 'Cartellino Blu';
          eventsData.push([timeStr, tipo, c.description || '']);
        });
        eventsData.push([]);
      }
      
      if (events.substitutions.length > 0) {
        eventsData.push(['Sostituzioni']);
        eventsData.push(['Minuto', 'Esce', 'Entra']);
        events.substitutions.forEach(s => {
          const timeStr = `${s.minute}${s.second !== null && s.second !== undefined ? ':' + s.second.toString().padStart(2, '0') : ''}`;
          const out = players.find(p => p.id === s.playerOut);
          const inP = players.find(p => p.id === s.playerIn);
          const outDisplay = `${s.playerOutJerseyNumber ? `#${s.playerOutJerseyNumber}` : '#'} ${out ? out.lastName : s.playerOut}`;
          const inDisplay = `${s.playerInJerseyNumber ? `#${s.playerInJerseyNumber}` : '#'} ${inP ? inP.lastName : s.playerIn}`;
          eventsData.push([timeStr, outDisplay, inDisplay]);
        });
        eventsData.push([]);
      }
      
      if (events.otherEvents.length > 0) {
        eventsData.push(['Altri Eventi']);
        eventsData.push(['Minuto', 'Tipo', 'Giocatore', 'Descrizione']);
        events.otherEvents.forEach(e => {
          const timeStr = `${e.minute}${e.second !== null && e.second !== undefined ? ':' + e.second.toString().padStart(2, '0') : ''}`;
          let tipo = '';
          switch (e.type) {
            case 'foul': tipo = 'Fallo'; break;
            case 'corner': tipo = 'Calcio d\'angolo'; break;
            case 'offside': tipo = 'Fuorigioco'; break;
            case 'free-kick': tipo = 'Calcio di punizione'; break;
            case 'penalty': tipo = 'Rigore'; break;
            case 'throw-in': tipo = 'Rimessa laterale'; break;
            case 'injury': tipo = 'Infortunio'; break;
            default: tipo = 'Evento'; break;
          }
          
          // Ottieni informazioni giocatore
          let playerInfo = '';
          if (e.playerId && e.teamType === 'own') {
            const player = players.find(p => p.id === e.playerId);
            const jerseyNumber = getPlayerJerseyNumber(e.playerId);
            if (player && jerseyNumber) {
              playerInfo = `#${jerseyNumber} ${player.lastName}`;
            } else if (player) {
              playerInfo = player.lastName;
            }
          } else if (e.teamType === 'opponent') {
            playerInfo = 'Avversario';
          }
          
          eventsData.push([timeStr, tipo, playerInfo, e.description || '']);
        });
        eventsData.push([]);
      }
    });
    
    const wsEvents = XLSX.utils.aoa_to_sheet(eventsData);
    XLSX.utils.book_append_sheet(wb, wsEvents, 'Eventi per Periodo');
    
    // Foglio 3: Statistiche
    const statsData = [
      ['STATISTICHE PARTITA'],
      [],
      ['Statistica', 'Squadra', 'Avversario'],
      ['Possesso palla (%)', match.possessionHome || 0, match.possessionAway || 0],
      ['Tiri totali', match.totalShotsHome || 0, match.totalShotsAway || 0],
      ['Tiri in porta', match.shotsOnTargetHome || 0, match.shotsOnTargetAway || 0],
      ['Falli commessi', match.foulsCommittedHome || 0, match.foulsCommittedAway || 0],
      ['Calci d\'angolo', match.cornersHome || 0, match.cornersAway || 0],
      ['Fuorigioco', match.offsideHome || 0, match.offsideAway || 0]
    ];
    
    const wsStats = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiche');
    
    XLSX.writeFile(wb, `report-partita-${match.date}-${match.opponent.replace(/\s+/g, '-')}.xlsx`);
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    setShowExportMenu(false);
    if (format === 'csv') exportCSV();
    if (format === 'xlsx') exportXLSX();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full relative overflow-y-auto max-h-[90vh] border border-gray-200">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors z-10 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm"
        >
          &times;
        </button>
        
        {/* Header semplificato per coerenza con il resto dell'app */}
        <div className="bg-white border-b border-gray-200 p-4 rounded-t-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Trophy className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Report Partita</h2>
              <p className="text-gray-600 text-sm">{match.opponent}</p>
            </div>
          </div>
          
          {/* Info partita nel header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Data e Ora</p>
                <p className="text-sm font-medium text-gray-800">{match.date} {match.time && `alle ${match.time}`}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Luogo</p>
                <p className="text-sm font-medium text-gray-800">
                  {match.homeAway === 'home' ? 'Casa' : 'Trasferta'}
                  {match.location && ` - ${match.location}`}
                  {match.field && ` (${match.field})`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Risultato Finale</p>
                <p className="text-lg font-bold text-gray-800">
                  {match.homeAway === 'home' ? match.homeScore : match.awayScore} - {match.homeAway === 'home' ? match.awayScore : match.homeScore}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Formazione titolare */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Formazione Titolare
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lineupPlayers.map(p => {
                const matchPlayer = match.lineup.find(lp => lp.playerId === p.id);
                return (
                  <div key={p.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {matchPlayer?.jerseyNumber}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-blue-600">{matchPlayer?.position}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Eventi suddivisi per periodo */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-600" />
              Eventi per Periodo
            </h3>
            
            {(match.periods || [{ type: 'regular', label: '1° Tempo', duration: 0 }]).map((period, periodIndex) => {
              const events = eventsByPeriod[periodIndex] || { goals: [], cards: [], substitutions: [], otherEvents: [] };
              const hasEvents = events.goals.length > 0 || events.cards.length > 0 || events.substitutions.length > 0 || events.otherEvents.length > 0;
              
              // Mostra il periodo se ha eventi o se è un periodo di gioco (non intervallo)
              if (!hasEvents && period.type === 'interval') return null;
              
              // Determina il colore del header in base al tipo di periodo
              let headerColorClass = '';
              if (period.type === 'regular') {
                headerColorClass = 'bg-green-50 border-green-200';
              } else if (period.type === 'interval') {
                headerColorClass = 'bg-orange-50 border-orange-200';
              } else if (period.type === 'extra') {
                headerColorClass = 'bg-purple-50 border-purple-200';
              }
              
              return (
                <div key={periodIndex} className={`mb-4 bg-white rounded-lg border shadow-sm ${headerColorClass}`}>
                  <div className="p-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center justify-between">
                      <span>{period.label}</span>
                      <span className="text-xs text-gray-500 font-normal">
                        Durata: {Math.floor(period.duration / 60)}:{(period.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </h4>
                    
                    {!hasEvents && period.type !== 'interval' ? (
                      <p className="text-gray-400 text-sm italic text-center py-4">Nessun evento registrato in questo periodo</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Goal del periodo */}
                        <div>
                          <h5 className="text-xs font-semibold mb-2 text-green-700 flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Goal ({events.goals.length})
                          </h5>
                          {events.goals.length === 0 ? (
                            <p className="text-gray-400 text-xs italic">Nessun goal</p>
                          ) : (
                            <div className="space-y-1">
                              {events.goals.map(g => {
                                const isOpponent = g.description?.includes('avversario');
                                return (
                                  <div key={g.id} className={`p-2 rounded border ${isOpponent ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-xs font-bold px-1 py-0.5 rounded ${isOpponent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {g.minute}{g.second !== null && g.second !== undefined ? `:${g.second.toString().padStart(2, '0')}` : ''}
                                      </span>
                                      <span className="text-gray-700 text-xs">{g.description}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Ammonizioni del periodo */}
                        <div>
                          <h5 className="text-xs font-semibold mb-2 text-yellow-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Ammonizioni ({events.cards.length})
                          </h5>
                          {events.cards.length === 0 ? (
                            <p className="text-gray-400 text-xs italic">Nessuna ammonizione</p>
                          ) : (
                            <div className="space-y-1">
                              {events.cards.map(c => {
                                let colorClass = 'bg-yellow-50 border-yellow-200';
                                let badgeClass = 'bg-yellow-100 text-yellow-700';
                                if (c.type === 'red-card' || c.type === 'expulsion') {
                                  colorClass = 'bg-red-50 border-red-200';
                                  badgeClass = 'bg-red-100 text-red-700';
                                } else if (c.type === 'blue-card') {
                                  colorClass = 'bg-blue-50 border-blue-200';
                                  badgeClass = 'bg-blue-100 text-blue-700';
                                }
                                
                                return (
                                  <div key={c.id} className={`p-2 rounded border ${colorClass}`}>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-xs font-bold px-1 py-0.5 rounded ${badgeClass}`}>
                                        {c.minute}{c.second !== null && c.second !== undefined ? `:${c.second.toString().padStart(2, '0')}` : ''}
                                      </span>
                                      <span className="text-gray-700 text-xs">{c.description}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Sostituzioni del periodo */}
                        <div>
                          <h5 className="text-xs font-semibold mb-2 text-blue-700 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            Sostituzioni ({events.substitutions.length})
                          </h5>
                          {events.substitutions.length === 0 ? (
                            <p className="text-gray-400 text-xs italic">Nessuna sostituzione</p>
                          ) : (
                            <div className="space-y-1">
                              {events.substitutions.map(s => {
                                const out = players.find(p => p.id === s.playerOut);
                                const inP = players.find(p => p.id === s.playerIn);
                                return (
                                  <div key={s.id} className="p-2 rounded border bg-blue-50 border-blue-200">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-xs font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-700">
                                        {s.minute}{s.second !== null && s.second !== undefined ? `:${s.second.toString().padStart(2, '0')}` : ''}
                                      </span>
                                    </div>
                                    <div className="text-xs space-y-0.5">
                                      <div className="flex items-center gap-1">
                                        <span className="text-red-600 font-medium">Esce:</span>
                                        <span className="text-gray-700">
                                          {s.playerOutJerseyNumber ? `#${s.playerOutJerseyNumber}` : '#'} {out ? out.lastName : s.playerOut}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-green-600 font-medium">Entra:</span>
                                        <span className="text-gray-700">
                                          {s.playerInJerseyNumber ? `#${s.playerInJerseyNumber}` : '#'} {inP ? inP.lastName : s.playerIn}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Altri Eventi del periodo */}
                    {events.otherEvents.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="text-xs font-semibold mb-2 text-gray-700 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Altri Eventi ({events.otherEvents.length})
                          </h5>
                          <div className="space-y-1">
                            {events.otherEvents.map(e => {
                              // Funzione per ottenere l'icona e il colore dell'evento
                              const getEventIcon = (type: string) => {
                                switch (type) {
                                  case 'foul': return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
                                  case 'corner': return { icon: Flag, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
                                  case 'offside': return { icon: Ban, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
                                  case 'free-kick': return { icon: Zap, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
                                  case 'penalty': return { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
                                  case 'throw-in': return { icon: UserX, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
                                  case 'injury': return { icon: UserX, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
                                  default: return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
                                }
                              };

                              const { icon: Icon, color, bg, border } = getEventIcon(e.type);

                              // Ottieni il numero di maglia del giocatore se disponibile
                              const jerseyNumber = e.playerId ? getPlayerJerseyNumber(e.playerId) : null;

                              return (
                                <div key={e.id} className={`p-2 rounded border ${bg} ${border}`}>
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="text-xs font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-700">
                                      {e.minute}{e.second !== null && e.second !== undefined ? `:${e.second.toString().padStart(2, '0')}` : ''}
                                    </span>
                                    <Icon className={`w-3 h-3 ${color}`} />
                                    {/* Mostra numero di maglia se disponibile */}
                                    {jerseyNumber && (
                                      <span className="text-xs font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-700">
                                        #{jerseyNumber}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-700">
                                    {e.description}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Staff tecnico */}
          {((match.coaches && match.coaches.length > 0) || (match.managers && match.managers.length > 0)) && (
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Staff Tecnico
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {match.coaches && match.coaches.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2 text-sm">Allenatori</h4>
                    <ul className="space-y-1">
                      {getStaffNames(match.coaches).map((coachName, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-700 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          {coachName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {match.managers && match.managers.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2 text-sm">Dirigenti</h4>
                    <ul className="space-y-1">
                      {getStaffNames(match.managers).map((managerName, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-700 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          {managerName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statistiche dettagliate */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              Statistiche Dettagliate
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Possesso palla */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <h4 className="font-medium text-gray-800 mb-3 text-center text-sm">Possesso Palla</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-blue-600">Squadra</span>
                      <span className="text-sm font-bold text-blue-600">{match.possessionHome || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${match.possessionHome || 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-red-600">Avversario</span>
                      <span className="text-sm font-bold text-red-600">{match.possessionAway || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full transition-all duration-500" style={{ width: `${match.possessionAway || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tiri */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <h4 className="font-medium text-gray-800 mb-3 text-center text-sm">Tiri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Tiri Totali</span>
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold text-sm">{match.totalShotsHome || 0}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-red-600 font-bold text-sm">{match.totalShotsAway || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Tiri in Porta</span>
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold text-sm">{match.shotsOnTargetHome || 0}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-red-600 font-bold text-sm">{match.shotsOnTargetAway || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Altre statistiche */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <h4 className="font-medium text-gray-800 mb-3 text-center text-sm">Altre Statistiche</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Falli</span>
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold text-sm">{match.foulsCommittedHome || 0}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-red-600 font-bold text-sm">{match.foulsCommittedAway || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Calci d'angolo</span>
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold text-sm">{match.cornersHome || 0}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-red-600 font-bold text-sm">{match.cornersAway || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Fuorigioco</span>
                    <div className="flex gap-2">
                      <span className="text-blue-600 font-bold text-sm">{match.offsideHome || 0}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-red-600 font-bold text-sm">{match.offsideAway || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pulsanti di azione */}
          <div className="flex justify-end gap-3 items-center pt-4 border-t border-gray-200">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Esporta Dati
              </button>
              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 bg-black bg-opacity-30 z-[1100]"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-lg shadow-lg z-[1200] min-w-[200px] p-3">
                    <h3 className="text-sm font-medium text-gray-800 mb-3 text-center">Esporta Report</h3>
                    <button
                      onClick={() => handleExport('csv')}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-blue-50 text-blue-700 text-left rounded-md transition-colors text-sm mb-1"
                    >
                      <FileText className="w-4 h-4" /> 
                      <div>
                        <div className="font-medium">CSV</div>
                        <div className="text-xs text-gray-500">File separato da virgole</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExport('xlsx')}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-blue-50 text-blue-700 text-left rounded-md transition-colors text-sm"
                    >
                      <FileText className="w-4 h-4" /> 
                      <div>
                        <div className="font-medium">Excel</div>
                        <div className="text-xs text-gray-500">Fogli multipli</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 shadow-sm font-medium transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
