import { useState } from 'react';
import { Match, Player, UserWithGroup } from '../types';
import { Download, FileText, Calendar, MapPin, Users, Trophy, Timer, Target, AlertTriangle, RotateCcw } from 'lucide-react';
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
  
  // Funzione per ottenere il nome del periodo
  const getPeriodName = (periodIndex: number) => {
    if (!match.periods || !match.periods[periodIndex]) return 'Periodo sconosciuto';
    return match.periods[periodIndex].label;
  };

  // Raggruppa eventi per periodo
  const getEventsByPeriod = () => {
    const eventsByPeriod: { [key: number]: { goals: any[], cards: any[], substitutions: any[] } } = {};
    
    // Inizializza tutti i periodi
    match.periods?.forEach((_, index) => {
      eventsByPeriod[index] = { goals: [], cards: [], substitutions: [] };
    });

    // Raggruppa goal per periodo
    const goals = match.events.filter(e => e.type === 'goal');
    goals.forEach(goal => {
      const periodIndex = goal.periodIndex ?? 0;
      if (!eventsByPeriod[periodIndex]) {
        eventsByPeriod[periodIndex] = { goals: [], cards: [], substitutions: [] };
      }
      eventsByPeriod[periodIndex].goals.push(goal);
    });

    // Raggruppa ammonizioni per periodo
    const cards = match.events.filter(e => [
      'yellow-card','red-card','second-yellow-card','blue-card','expulsion','warning'
    ].includes(e.type));
    cards.forEach(card => {
      const periodIndex = card.periodIndex ?? 0;
      if (!eventsByPeriod[periodIndex]) {
        eventsByPeriod[periodIndex] = { goals: [], cards: [], substitutions: [] };
      }
      eventsByPeriod[periodIndex].cards.push(card);
    });

    // Raggruppa sostituzioni per periodo
    match.substitutions.forEach(substitution => {
      const periodIndex = substitution.periodIndex ?? 0;
      if (!eventsByPeriod[periodIndex]) {
        eventsByPeriod[periodIndex] = { goals: [], cards: [], substitutions: [] };
      }
      eventsByPeriod[periodIndex].substitutions.push(substitution);
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
          const timeStr = `${g.minute}${g.second !== undefined ? ':' + g.second.toString().padStart(2, '0') : ''}`;
          csvRows.push(`${timeStr},"${g.description || ''}"`);
        });
        csvRows.push('');
      }
      
      // Ammonizioni del periodo
      if (events.cards.length > 0) {
        csvRows.push('Ammonizioni/Espulsioni');
        csvRows.push('Minuto,Tipo,Descrizione');
        events.cards.forEach(c => {
          const timeStr = `${c.minute}${c.second !== undefined ? ':' + c.second.toString().padStart(2, '0') : ''}`;
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
          const timeStr = `${s.minute}${s.second !== undefined ? ':' + s.second.toString().padStart(2, '0') : ''}`;
          const out = players.find(p => p.id === s.playerOut);
          const outMatchPlayer = out ? match.lineup.find(lp => lp.playerId === out.id) : null;
          const inP = players.find(p => p.id === s.playerIn);
          const inMatchPlayer = inP ? match.lineup.find(lp => lp.playerId === inP.id) : null;
          csvRows.push(`${timeStr},"${out ? `${outMatchPlayer?.jerseyNumber || ''} ${out.lastName}` : s.playerOut}","${inP ? `${inMatchPlayer?.jerseyNumber || ''} ${inP.lastName}` : s.playerIn}"`);
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
          const timeStr = `${g.minute}${g.second !== undefined ? ':' + g.second.toString().padStart(2, '0') : ''}`;
          eventsData.push([timeStr, g.description || '']);
        });
        eventsData.push([]);
      }
      
      if (events.cards.length > 0) {
        eventsData.push(['Ammonizioni/Espulsioni']);
        eventsData.push(['Minuto', 'Tipo', 'Descrizione']);
        events.cards.forEach(c => {
          const timeStr = `${c.minute}${c.second !== undefined ? ':' + c.second.toString().padStart(2, '0') : ''}`;
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
          const timeStr = `${s.minute}${s.second !== undefined ? ':' + s.second.toString().padStart(2, '0') : ''}`;
          const out = players.find(p => p.id === s.playerOut);
          const outMatchPlayer = out ? match.lineup.find(lp => lp.playerId === out.id) : null;
          const inP = players.find(p => p.id === s.playerIn);
          const inMatchPlayer = inP ? match.lineup.find(lp => lp.playerId === inP.id) : null;
          eventsData.push([timeStr, out ? `${outMatchPlayer?.jerseyNumber || ''} ${out.lastName}` : s.playerOut, inP ? `${inMatchPlayer?.jerseyNumber || ''} ${inP.lastName}` : s.playerIn]);
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
            
            {Object.entries(eventsByPeriod).map(([periodIndex, events]) => {
              const periodName = getPeriodName(parseInt(periodIndex));
              const hasEvents = events.goals.length > 0 || events.cards.length > 0 || events.substitutions.length > 0;
              
              if (!hasEvents) return null;
              
              return (
                <div key={periodIndex} className="mb-4 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    {periodName}
                  </h4>
                  
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
                                    {g.minute}{g.second !== undefined ? `:${g.second.toString().padStart(2, '0')}` : ''}
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
                                    {c.minute}{c.second !== undefined ? `:${c.second.toString().padStart(2, '0')}` : ''}
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
                            const outMatchPlayer = out ? match.lineup.find(lp => lp.playerId === out.id) : null;
                            const inP = players.find(p => p.id === s.playerIn);
                            const inMatchPlayer = inP ? match.lineup.find(lp => lp.playerId === inP.id) : null;
                            return (
                              <div key={s.id} className="p-2 rounded border bg-blue-50 border-blue-200">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-700">
                                    {s.minute}{s.second !== undefined ? `:${s.second.toString().padStart(2, '0')}` : ''}
                                  </span>
                                </div>
                                <div className="text-xs space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-red-600 font-medium">Esce:</span>
                                    <span className="text-gray-700">{out ? `${outMatchPlayer?.jerseyNumber || ''} ${out.lastName}` : s.playerOut}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-green-600 font-medium">Entra:</span>
                                    <span className="text-gray-700">{inP ? `${inMatchPlayer?.jerseyNumber || ''} ${inP.lastName}` : s.playerIn}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
