import { useState } from 'react';
import { Match, Player, User } from '../types';
import { Trophy, Calendar, MapPin, Target, Users, Timer, AlertTriangle, RotateCcw, Download, List, FileText, Flag, Ban, Zap, UserX } from 'lucide-react';

interface ReportMatchProps {
  match: Match;
  players: Player[];
  users: User[];
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

  // Raggruppa eventi per periodo basandosi sui timestamp precisi
  const getEventsByPeriod = () => {
    const eventsByPeriod: { [key: number]: { goals: any[], cards: any[], substitutions: any[], otherEvents: any[] } } = {};
    
    // Se non ci sono periodi, usa un periodo di default
    const periods = match.periods || [{ type: 'regular', label: '1° Tempo', duration: 0 }];
    
    // Inizializza solo i periodi di gioco (non gli intervalli)
    periods.forEach((period, index) => {
      if (period.type !== 'interval') {
        eventsByPeriod[index] = { goals: [], cards: [], substitutions: [], otherEvents: [] };
      }
    });

    /**
     * Determina il periodo di gioco corretto per un evento basandosi sui timestamp RELATIVI.
     * 
     * IMPORTANTE: I timestamp degli eventi sono RELATIVI al periodo in cui sono stati registrati,
     * NON assoluti dall'inizio della partita.
     * 
     * Logica:
     * 1. Cerca il primo periodo di gioco la cui durata può contenere l'evento
     * 2. Se nessun periodo può contenere l'evento, lo assegna al periodo più lungo
     * 3. Esclude sempre gli intervalli dalla selezione
     * 
     * @param eventTimeInSeconds - Timestamp dell'evento in secondi (RELATIVO al periodo)
     * @returns Indice del periodo di gioco a cui assegnare l'evento
     */
    const getEventPeriodIndex = (eventTimeInSeconds: number): number => {
      // Filtra solo i periodi di gioco (esclude intervalli)
      const gamePeriodsOnly = periods.filter(p => p.type !== 'interval');
      
      if (gamePeriodsOnly.length === 0) {
        return 0;
      }

      // Trova i periodi che possono contenere questo evento
      const compatiblePeriods = gamePeriodsOnly.filter(period => {
        return eventTimeInSeconds <= period.duration;
      });

      if (compatiblePeriods.length > 0) {
        // Se ci sono periodi compatibili, scegli il primo (più probabile)
        const chosenPeriod = compatiblePeriods[0];
        return periods.findIndex(p => p.label === chosenPeriod.label);
      }

      // Se nessun periodo può contenere l'evento, assegnalo al periodo più lungo
      // (presumibilmente il periodo principale di gioco)
      let longestPeriod = gamePeriodsOnly[0];
      for (const period of gamePeriodsOnly) {
        if (period.duration > longestPeriod.duration) {
          longestPeriod = period;
        }
      }
      
      return periods.findIndex(p => p.label === longestPeriod.label);
    };

    // Funzione helper per processare eventi generici
    const processEvents = (events: any[], eventType: string) => {
      events.forEach(event => {
        const eventTimeInSeconds = (event.minute * 60) + (event.second || 0);
        const periodIndex = event.periodIndex !== undefined ? event.periodIndex : getEventPeriodIndex(eventTimeInSeconds);
        
        // Assicurati che il periodo esista nell'oggetto risultato
        if (!eventsByPeriod[periodIndex]) {
          eventsByPeriod[periodIndex] = { goals: [], cards: [], substitutions: [], otherEvents: [] };
        }
        
        // Aggiungi l'evento al tipo corretto
        switch (eventType) {
          case 'goals':
            eventsByPeriod[periodIndex].goals.push(event);
            break;
          case 'cards':
            eventsByPeriod[periodIndex].cards.push(event);
            break;
          case 'substitutions':
            eventsByPeriod[periodIndex].substitutions.push(event);
            break;
          case 'otherEvents':
            eventsByPeriod[periodIndex].otherEvents.push(event);
            break;
        }
      });
    };

    // Processa tutti i tipi di eventi
    const goals = match.events.filter(e => e.type === 'goal');
    processEvents(goals, 'goals');

    const cards = match.events.filter(e => [
      'yellow-card','red-card','second-yellow-card','blue-card','expulsion','warning'
    ].includes(e.type));
    processEvents(cards, 'cards');

    processEvents(match.substitutions, 'substitutions');

    const otherEvents = match.events.filter(e => [
      'foul', 'corner', 'offside', 'free-kick', 'penalty', 'throw-in', 'injury'
    ].includes(e.type));
    processEvents(otherEvents, 'otherEvents');

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

  // Funzione helper per convertire minuti e secondi in formato mm:ss
  const formatGameTime = (minute: number, second?: number): string => {
    const totalSeconds = minute * 60 + (second || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Nome della squadra e avversario usati per l'esportazione
  const teamName = "ASD Pietra Ligure Calcio";
  const opponentName = match.opponent || "Avversario";

  // Genera e scarica il file CSV dei partecipanti
  const exportParticipantsCSV = () => {
    const participantsRows: string[] = [];
    participantsRows.push('"Squadra","Nome","Ruolo","Numero Maglia"');
    
    // Aggiungi i giocatori titolari
    lineupPlayers.forEach(p => {
      const jerseyNumber = getPlayerJerseyNumber(p.id) || '';
      participantsRows.push(`"${teamName}","${p.firstName} ${p.lastName}","Titolare","${jerseyNumber}"`);
    });
    
    // Aggiungi i giocatori in panchina (se presenti)
    const benchPlayers = players.filter(p => 
      p.isActive && 
      !match.lineup.find(lp => lp.playerId === p.id)
    );
    benchPlayers.forEach(p => {
      const jerseyNumber = (match.playerJerseyNumbers && match.playerJerseyNumbers[p.id]) || '';
      participantsRows.push(`"${teamName}","${p.firstName} ${p.lastName}","Panchina","${jerseyNumber}"`);
    });

    // Aggiungi gli avversari
    if (match.opponentLineup && Array.isArray(match.opponentLineup) && match.opponentLineup.length > 0) {
      match.opponentLineup.forEach(jerseyNumber => {
        participantsRows.push(`"${opponentName}","","Avversario","${jerseyNumber}"`);
      });
    } else {
      const opponentJerseyNumbers = new Set<string>();
      if (match.events && Array.isArray(match.events)) {
        match.events.forEach(event => {
          if (event.teamType === 'opponent' && event.description) {
            const numMatch = event.description.match(/#(\d+)/);
            if (numMatch && numMatch[1]) {
              opponentJerseyNumbers.add(numMatch[1].trim());
            }
          }
        });
      }
      if (opponentJerseyNumbers.size === 0) {
        for (let i = 1; i <= 11; i++) {
          opponentJerseyNumbers.add(i.toString());
        }
      }
      Array.from(opponentJerseyNumbers).forEach(jerseyNumber => {
        participantsRows.push(`"${opponentName}","","Avversario","${jerseyNumber}"`);
      });
    }

    // Aggiungi lo staff tecnico
    if (match.coaches?.length > 0) {
      getStaffNames(match.coaches).forEach(name => {
        participantsRows.push(`"${teamName}","${name}","Allenatore",""`);
      });
    }
    
    if (match.managers?.length > 0) {
      getStaffNames(match.managers).forEach(name => {
        participantsRows.push(`"${teamName}","${name}","Dirigente",""`);
      });
    }

    const participantsContent = participantsRows.join('\n');
    const participantsBlob = new Blob(['\ufeff' + participantsContent], { type: 'text/csv;charset=utf-8;' });
    const participantsUrl = URL.createObjectURL(participantsBlob);
    const participantsLink = document.createElement('a');
    participantsLink.href = participantsUrl;
    participantsLink.download = `partecipanti_partita_${match.date}_${match.opponent.replace(/\s+/g, '-')}.csv`;
    participantsLink.click();
    URL.revokeObjectURL(participantsUrl);
    setShowExportMenu(false);
  };

  // Genera e scarica il file CSV degli eventi
  const exportEventsCSV = () => {
    const eventsRows: string[] = [];
    eventsRows.push('"Periodo","TempoDiGioco","TipoEvento","Squadra","NumeroMaglia","GiocatorePrincipale","GiocatoreSecondario","Note"');
    
    const allEvents: any[] = [];
    
    // Calcola le durate cumulative per ogni periodo
    const calculateCumulativeDurations = () => {
      const periods = match.periods || [{ type: 'regular', label: '1° Tempo', duration: 0 }];
      const cumulativeDurations: number[] = [];
      let cumulative = 0;
      
      periods.forEach((period, index) => {
        cumulativeDurations[index] = cumulative;
        cumulative += period.duration;
      });
      
      return cumulativeDurations;
    };
    
    const cumulativeDurations = calculateCumulativeDurations();
    const periods = match.periods || [{ type: 'regular', label: '1° Tempo', duration: 0 }];
    
    // Aggiungi eventi degli intervalli alla cronologia
    periods.forEach((period, periodIndex) => {
      if (period.type === 'interval') {
        const startTime = cumulativeDurations[periodIndex];
        
        allEvents.push({
          periodName: period.label,
          minute: Math.floor(period.duration / 60),
          second: period.duration % 60,
          tipoEvento: 'Intervallo',
          squadra: '-',
          numeroMaglia: '-',
          giocatorePrincipale: '-',
          giocatoreSecondario: '-',
          note: '-',
          cumulativeDuration: startTime
        });
      }
    });
    
    // Aggiungi gli eventi di gioco esistenti con durata cumulativa corretta
    Object.entries(eventsByPeriod).forEach(([periodIndex, events]) => {
      const periodName = getPeriodName(parseInt(periodIndex));
      const periodStartTime = cumulativeDurations[parseInt(periodIndex)] || 0;
      
      events.goals.forEach(g => {
        // Determina la squadra usando prima teamType, poi fallback sulla descrizione
        let squadra;
        if (g.teamType === 'opponent') {
          squadra = opponentName;
        } else if (g.teamType === 'own') {
          squadra = teamName;
        } else {
          // Fallback per compatibilità con dati vecchi
          squadra = g.description?.includes('avversario') ? opponentName : teamName;
        }
        
        let giocatorePrincipale = '';
        let numeroMaglia = '';
        
        if (g.playerId && g.teamType === 'own') {
          const player = players.find(p => p.id === g.playerId);
          giocatorePrincipale = player ? `${player.firstName} ${player.lastName}` : 'Giocatore non trovato';
          // Ottieni il numero di maglia dal giocatore
          numeroMaglia = getPlayerJerseyNumber(g.playerId)?.toString() || '';
        } else if (g.teamType === 'opponent') {
          const numMatch = g.description?.match(/#(\d+)/);
          if (numMatch) {
            numeroMaglia = numMatch[1];
            giocatorePrincipale = 'Avversario';
          } else {
            giocatorePrincipale = 'Avversario';
          }
        } else {
          // Fallback per compatibilità con dati vecchi
          const numMatch = g.description?.match(/#(\d+)/);
          if (numMatch) {
            numeroMaglia = numMatch[1];
            if (g.description?.includes('avversario')) {
              giocatorePrincipale = 'Avversario';
            } else {
              const player = players.find(p => p.id === g.playerId);
              giocatorePrincipale = player ? `${player.firstName} ${player.lastName}` : 'Giocatore non trovato';
            }
          }
        }
        
        const eventTimeInPeriod = (g.minute * 60) + (g.second || 0);
        const cumulativeDuration = periodStartTime + eventTimeInPeriod;
        
        allEvents.push({ 
          periodName, 
          minute: g.minute, 
          second: g.second, 
          tipoEvento: 'Gol', 
          squadra, 
          numeroMaglia,
          giocatorePrincipale, 
          giocatoreSecondario: '', 
          note: g.description || '',
          cumulativeDuration
        });
      });
      
      events.cards.forEach(c => {
        // Determina la squadra usando prima teamType, poi fallback sulla descrizione
        let squadra;
        if (c.teamType === 'opponent') {
          squadra = opponentName;
        } else if (c.teamType === 'own') {
          squadra = teamName;
        } else {
          // Fallback per compatibilità con dati vecchi
          squadra = c.description?.includes('avversario') ? opponentName : teamName;
        }
        
        let giocatorePrincipale = '';
        let numeroMaglia = '';
        
        if (c.playerId && c.teamType === 'own') {
          const player = players.find(p => p.id === c.playerId);
          giocatorePrincipale = player ? `${player.firstName} ${player.lastName}` : 'Giocatore non trovato';
          // Ottieni il numero di maglia dal giocatore
          numeroMaglia = getPlayerJerseyNumber(c.playerId)?.toString() || '';
        } else if (c.teamType === 'opponent') {
          const numMatch = c.description?.match(/#(\d+)/);
          if (numMatch) {
            numeroMaglia = numMatch[1];
            giocatorePrincipale = 'Avversario';
          } else {
            giocatorePrincipale = 'Avversario';
          }
        } else {
          // Fallback per compatibilità con dati vecchi
          const numMatch = c.description?.match(/#(\d+)/);
          if (numMatch) {
            numeroMaglia = numMatch[1];
            if (c.description?.includes('avversario')) {
              giocatorePrincipale = 'Avversario';
            } else {
              const player = players.find(p => p.id === c.playerId);
              giocatorePrincipale = player ? `${player.firstName} ${player.lastName}` : 'Giocatore non trovato';
            }
          }
        }
        
        let tipoEvento = 'Ammonizione';
        if (c.type === 'red-card' || c.type === 'expulsion') tipoEvento = 'Espulsione';
        else if (c.type === 'second-yellow-card') tipoEvento = 'Seconda Gialla';
        else if (c.type === 'blue-card') tipoEvento = 'Cartellino Blu';
        
        const eventTimeInPeriod = (c.minute * 60) + (c.second || 0);
        const cumulativeDuration = periodStartTime + eventTimeInPeriod;
        
        allEvents.push({ 
          periodName, 
          minute: c.minute, 
          second: c.second, 
          tipoEvento, 
          squadra, 
          numeroMaglia,
          giocatorePrincipale, 
          giocatoreSecondario: '', 
          note: c.description || '',
          cumulativeDuration
        });
      });
      
      events.substitutions.forEach(s => {
        const out = players.find(p => p.id === s.playerOut);
        const inP = players.find(p => p.id === s.playerIn);
        const outName = out ? `${out.firstName} ${out.lastName}` : 'N/A';
        const inName = inP ? `${inP.firstName} ${inP.lastName}` : 'N/A';
        
        // Per le sostituzioni, metti il numero di maglia di chi esce
        const numeroMagliaOut = getPlayerJerseyNumber(s.playerOut)?.toString() || '';
        
        const eventTimeInPeriod = (s.minute * 60) + (s.second || 0);
        const cumulativeDuration = periodStartTime + eventTimeInPeriod;
        
        allEvents.push({ 
          periodName, 
          minute: s.minute, 
          second: s.second, 
          tipoEvento: 'Sostituzione', 
          squadra: teamName, 
          numeroMaglia: numeroMagliaOut,
          giocatorePrincipale: `${outName} (esce)`, 
          giocatoreSecondario: `${inName} (entra)`, 
          note: '',
          cumulativeDuration
        });
      });
      
      events.otherEvents.forEach(e => {
        let tipoEvento = 'Evento';
        switch (e.type) {
          case 'foul': tipoEvento = 'Fallo'; break;
          case 'corner': tipoEvento = 'Calcio d\'angolo'; break;
          case 'offside': tipoEvento = 'Fuorigioco'; break;
          case 'free-kick': tipoEvento = 'Calcio di punizione'; break;
          case 'penalty': tipoEvento = 'Rigore'; break;
          case 'throw-in': tipoEvento = 'Rimessa laterale'; break;
          case 'injury': tipoEvento = 'Infortunio'; break;
        }
        // Determina la squadra usando prima teamType, poi fallback sulla descrizione
        let squadra;
        if (e.teamType === 'opponent') {
          squadra = opponentName;
        } else if (e.teamType === 'own') {
          squadra = teamName;
        } else {
          // Fallback per compatibilità con dati vecchi
          squadra = e.description?.includes('avversario') ? opponentName : teamName;
        }
        
        let giocatorePrincipale = '';
        let numeroMaglia = '';
        
        if (e.playerId && e.teamType === 'own') {
          const player = players.find(p => p.id === e.playerId);
          giocatorePrincipale = player ? `${player.firstName} ${player.lastName}` : 'Giocatore non trovato';
          // Ottieni il numero di maglia dal giocatore
          numeroMaglia = getPlayerJerseyNumber(e.playerId)?.toString() || '';
        } else if (e.teamType === 'opponent') {
          const numMatch = e.description?.match(/#(\d+)/);
          if (numMatch) {
            numeroMaglia = numMatch[1];
            giocatorePrincipale = 'Avversario';
          } else {
            giocatorePrincipale = 'Avversario';
          }
        } else {
          // Fallback per compatibilità con dati vecchi
          const numMatch = e.description?.match(/#(\d+)/);
          if (numMatch) {
            numeroMaglia = numMatch[1];
            if (e.description?.includes('avversario')) {
              giocatorePrincipale = 'Avversario';
            } else {
              const player = players.find(p => p.id === e.playerId);
              giocatorePrincipale = player ? `${player.firstName} ${player.lastName}` : 'Giocatore non trovato';
            }
          }
        }
        
        const eventTimeInPeriod = (e.minute * 60) + (e.second || 0);
        const cumulativeDuration = periodStartTime + eventTimeInPeriod;
        
        allEvents.push({ 
          periodName, 
          minute: e.minute, 
          second: e.second, 
          tipoEvento, 
          squadra, 
          numeroMaglia,
          giocatorePrincipale, 
          giocatoreSecondario: '', 
          note: e.description || '',
          cumulativeDuration
        });
      });
    });
    
    // Ordinamento basato sulla durata cumulativa dall'inizio della partita
    allEvents.sort((a, b) => {
      // Prima priorità: durata cumulativa
      if (a.cumulativeDuration !== b.cumulativeDuration) {
        return a.cumulativeDuration - b.cumulativeDuration;
      }
      
      // Seconda priorità: tempo all'interno dello stesso momento
      const timeA = (a.minute * 60) + (a.second || 0);
      const timeB = (b.minute * 60) + (b.second || 0);
      return timeA - timeB;
    });
    
    allEvents.forEach(event => {
      const tempoDiGioco = formatGameTime(event.minute, event.second);
      eventsRows.push(`"${event.periodName}","${tempoDiGioco}","${event.tipoEvento}","${event.squadra}","${event.numeroMaglia || ''}","${event.giocatorePrincipale}","${event.giocatoreSecondario}","${event.note}"`);
    });
    
    const eventsContent = eventsRows.join('\n');
    const eventsBlob = new Blob(['\ufeff' + eventsContent], { type: 'text/csv;charset=utf-8;' });
    const eventsUrl = URL.createObjectURL(eventsBlob);
    const eventsLink = document.createElement('a');
    eventsLink.href = eventsUrl;
    eventsLink.download = `eventi_partita_${match.date}_${match.opponent.replace(/\s+/g, '-')}.csv`;
    eventsLink.click();
    URL.revokeObjectURL(eventsUrl);
    setShowExportMenu(false);
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

          {/* Formazione Avversaria */}
          {match.opponentLineup && match.opponentLineup.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600" />
                Formazione Avversaria
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {match.opponentLineup.sort((a, b) => a - b).map(jerseyNumber => (
                  <div key={jerseyNumber} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                      <div className="bg-red-100 text-red-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {jerseyNumber}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">Giocatore #{jerseyNumber}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eventi suddivisi per periodo */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-600" />
              Eventi per Periodo
            </h3>
            {/* Mostra TUTTI i periodi, inclusi gli intervalli */}
            {(match.periods || [{ type: 'regular', label: '1° Tempo', duration: 0 }])
              .map((period) => {
                // Trova l'indice originale del periodo nella lista completa
                const originalPeriodIndex = (match.periods || []).findIndex(p => p === period);
                const events = eventsByPeriod[originalPeriodIndex] || { goals: [], cards: [], substitutions: [], otherEvents: [] };
                const hasEvents = events.goals.length > 0 || events.cards.length > 0 || events.substitutions.length > 0 || events.otherEvents.length > 0;
                // Determina il colore del header in base al tipo di periodo
                let headerColorClass = '';
                if (period.type === 'regular') {
                  headerColorClass = 'bg-green-50 border-green-200';
                } else if (period.type === 'interval') {
                  headerColorClass = 'bg-orange-50 border-orange-200';
                } else if (period.type === 'extra') {
                  headerColorClass = 'bg-purple-50 border-purple-200';
                }
                // Se è un intervallo, mostra una card dedicata con layout coerente
                if (period.type === 'interval') {
                  return (
                    <div key={originalPeriodIndex} className={`mb-4 bg-white rounded-lg border shadow-sm ${headerColorClass}`}>
                      <div className="p-4">
                        <h4 className="text-sm font-bold text-orange-700 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-orange-600" />
                            {period.label || 'Intervallo'}
                          </span>
                          <span className="text-xs text-gray-500 font-normal">
                            Durata: {Math.floor(period.duration / 60)}:{(period.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </h4>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={originalPeriodIndex} className={`mb-4 bg-white rounded-lg border shadow-sm ${headerColorClass}`}>
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center justify-between">
                        <span>{period.label}</span>
                        <span className="text-xs text-gray-500 font-normal">
                          Durata: {Math.floor(period.duration / 60)}:{(period.duration % 60).toString().padStart(2, '0')}
                        </span>
                      </h4>
                      {!hasEvents ? (
                        <p className="text-gray-400 text-sm italic text-center py-4">Nessun evento registrato in questo periodo</p>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Goal del periodo */}
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
                                            {s.playerOutJerseyNumber ? 
                                              `#${s.playerOutJerseyNumber}` : 
                                              (match.playerJerseyNumbers && match.playerJerseyNumbers[s.playerOut] ? 
                                                `#${match.playerJerseyNumbers[s.playerOut]}` : 
                                                (getPlayerJerseyNumber(s.playerOut) ? `#${getPlayerJerseyNumber(s.playerOut)}` : '#')
                                              )
                                            } {out ? out.lastName : s.playerOut}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-green-600 font-medium">Entra:</span>
                                          <span className="text-gray-700">
                                            {s.playerInJerseyNumber ? 
                                              `#${s.playerInJerseyNumber}` : 
                                              (match.playerJerseyNumbers && match.playerJerseyNumbers[s.playerIn] ? 
                                                `#${match.playerJerseyNumbers[s.playerIn]}` : 
                                                (getPlayerJerseyNumber(s.playerIn) ? `#${getPlayerJerseyNumber(s.playerIn)}` : '#')
                                              )
                                            } {inP ? inP.lastName : s.playerIn}
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
                                const jerseyNumber = e.playerId ? getPlayerJerseyNumber(e.playerId) : null;
                                return (
                                  <div key={e.id} className={`p-2 rounded border ${bg} ${border}`}>
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-xs font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-700">
                                        {e.minute}{e.second !== null && e.second !== undefined ? `:${e.second.toString().padStart(2, '0')}` : ''}
                                      </span>
                                      <Icon className={`w-3 h-3 ${color}`} />
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

          {/* Pulsanti di azione */}
          <div className="flex justify-end gap-3 items-center pt-4 border-t border-gray-200">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Esporta Report
              </button>
              {showExportMenu && (
                <div className="absolute bottom-full mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <ul className="py-1">
                    <li>
                      <button
                        onClick={exportParticipantsCSV}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Esporta Partecipanti (CSV)
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={exportEventsCSV}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <List className="w-4 h-4" />
                        Esporta Eventi (CSV)
                      </button>
                    </li>
                  </ul>
                </div>
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
