import { useState, useEffect } from 'react';
import React from 'react';
import { useDatabase } from './hooks/useDatabase';
import { useTimer } from './hooks/useTimer';
import { useSession } from './hooks/useSession';
import { Player, Training, Match, MatchPlayer, Substitution, User, Group, UserWithGroup, Permission, MatchPeriod, MatchEvent } from './types';
import { usePlayerStats } from './hooks/usePlayerStats';
import { PlayerForm } from './components/PlayerForm';
import { PlayerList } from './components/PlayerList';
import { TrainingForm } from './components/TrainingForm';
import { TrainingList } from './components/TrainingList';
import { MatchForm } from './components/MatchForm';
import { MatchList } from './components/MatchList';
import { EnhancedMatchManagement } from './components/EnhancedMatchManagement';
import { SubstitutionModal } from './components/SubstitutionModal';
import { StatsOverview } from './components/StatsOverview';
import { LoginForm } from './components/LoginForm';
import { UserForm } from './components/UserForm';
import { UserList } from './components/UserList';
import { GroupForm } from './components/GroupForm';
import { GroupList } from './components/GroupList';
import { CSVManager } from './components/CSVManager';
import { ExportTrainingAttendanceButton } from './components/ExportTrainingAttendanceButton';
import {
  Users,
  Dumbbell,
  Target,
  BarChart3,
  Plus,
  ArrowLeft,
  Menu,
  X,
  Loader2,
  Shield,
  UserCog,
  LogOut,
  FileText
} from 'lucide-react';
import { AmmonitionModal } from './components/AmmonitionModal';
import { OtherEventsModal } from './components/OtherEventsModal';
import { ReportMatch } from './components/ReportMatch';
import { ExportStatsButton } from './components/ExportStatsButton';
import useIsMobile from './hooks/useIsMobile';

type Tab = 'players' | 'trainings' | 'matches' | 'stats' | 'users' | 'groups';
type View = 'list' | 'form' | 'manage' | 'csv';

function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserWithGroup | null>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('players');
  const [currentView, setCurrentView] = useState<View>('list');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [managingMatch, setManagingMatch] = useState<Match | null>(null);
  const [initialLineup, setInitialLineup] = useState<MatchPlayer[] | null>(null);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [showAmmonitionModal, setShowAmmonitionModal] = useState(false);
  const [showOtherEventsModal, setShowOtherEventsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showReportMatch, setShowReportMatch] = useState<null | Match>(null);

  // Stato per selezione marcatore
  const [selectedHomeScorer, setSelectedHomeScorer] = useState<string>('');
  const [selectedAwayScorer, setSelectedAwayScorer] = useState<number | ''>('');

  // Stato per errori di gestione partita
  const [manageError, setManageError] = useState<string | null>(null);
  // Database hook
  const database = useDatabase();
  // Session hook
  const session = useSession();
  // Data state
  const [players, setPlayers] = useState<Player[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<UserWithGroup[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  // Timer for match management
  const timer = useTimer();
  const isMobile = useIsMobile();
  
  // State for dynamic periods
  const defaultPeriods: MatchPeriod[] = [
    { type: 'regular' as const, label: '1° Tempo', duration: 0 }
  ];
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
  
  // Auto-save timer state to DB on each tick when running
  useEffect(() => {
    if (currentView === 'manage' && managingMatch && timer.isRunning) {
      const now = Date.now();
      const periods = [...(managingMatch.periods || defaultPeriods)];
      
      // Aggiorna la durata del periodo corrente
      if (periods[currentPeriodIndex]) {
        periods[currentPeriodIndex] = {
          ...periods[currentPeriodIndex],
          duration: timer.time
        };
      }
      
      const updated: any = {
        ...managingMatch,
        periods,
        currentPeriodIndex,
        isRunning: true,
        lastTimestamp: now
      };
      setManagingMatch(updated);
      database.updateMatch(managingMatch.id, updated);
    }
  }, [timer.time, currentPeriodIndex]);
  // Persist timer state on page unload or navigation
  useEffect(() => {
    const handler = () => {
      if (managingMatch) {
        const now = Date.now();
        const periods = [...(managingMatch.periods || defaultPeriods)];
        
        // Aggiorna la durata del periodo corrente se in corso
        if (periods[currentPeriodIndex]) {
          periods[currentPeriodIndex] = {
            ...periods[currentPeriodIndex],
            duration: timer.time
          };
        }
        
        const updated: any = {
          ...managingMatch,
          periods,
          currentPeriodIndex,
          isRunning: timer.isRunning,
          lastTimestamp: now
        };
        database.updateMatch(managingMatch.id, updated);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [managingMatch, timer.time, timer.isRunning, currentPeriodIndex]);
  // Load data when database is ready
  useEffect(() => {
    if (!database.isLoading && !database.error) {
      loadData();
    }
  }, [database.isLoading, database.error]);

  // Load session on app start
  useEffect(() => {
    if (!database.isLoading && !database.error && !currentUser) {
      const savedUser = session.loadSession();
      if (savedUser) {
        // Verifica che l'utente esista ancora nel database
        const users = database.getUsers();
        const existingUser = users.find(u => u.id === savedUser.id);
        if (existingUser && existingUser.status === 'active') {
          setCurrentUser(savedUser);
          loadData();
        } else {
          // L'utente non esiste più o è stato disattivato, rimuovi la sessione
          session.clearSession();
        }
      }
    }
  }, [database.isLoading, database.error, currentUser]);
  const loadData = () => {
    setPlayers(database.getPlayers());
    setTrainings(database.getTrainings());
    setMatches(database.getMatches());
    setUsers(database.getUsers());
    setGroups(database.getGroups());
  };

  // Helper functions
  const generateId = () => Date.now().toString();
  // Player stats extracted to hook
  const playerStats = usePlayerStats(players, matches);

  // Player management
  const handlePlayerSubmit = (playerData: Omit<Player, 'id'>) => {
    if (editingItem) {
      database.updatePlayer(editingItem.id, playerData);
    } else {
      database.addPlayer(playerData);
    }
    loadData();
    setCurrentView('list');
    setEditingItem(null);
  };

  const handlePlayerEdit = (player: Player) => {
    setEditingItem(player);
    setCurrentView('form');
  };
  const handlePlayerDelete = (playerId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo giocatore?')) {
      database.deletePlayer(playerId);
      loadData();
    }
  };
  const handleImportPlayers = (importedPlayers: Omit<Player, 'id'>[]) => {
    importedPlayers.forEach(playerData => {
      database.addPlayer(playerData);
    });
    loadData();
  };

  // Training management
  const handleTrainingSubmit = (trainingData: Omit<Training, 'id'>) => {
    if (editingItem) {
      database.updateTraining(editingItem.id, trainingData);
    } else {
      database.addTraining(trainingData);
    }
    loadData();
    setCurrentView('list');
    setEditingItem(null);
  };

  const handleTrainingEdit = (training: Training) => {
    setEditingItem(training);
    setCurrentView('form');
  };

  const handleTrainingDelete = (trainingId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo allenamento?')) {
      database.deleteTraining(trainingId);
      loadData();
    }
  };
  // Match management
  const handleMatchSubmit = (matchData: Omit<Match, 'id' | 'status' | 'startTime' | 'firstHalfDuration' | 'secondHalfDuration' | 'substitutions' | 'events'>) => {
    const newMatch: Match = {
      ...matchData,
      id: editingItem?.id || generateId(),
      status: 'scheduled',
      firstHalfDuration: 0,
      secondHalfDuration: 0,
      substitutions: editingItem?.substitutions || [],
      events: editingItem?.events || [],
      opponentLineup: matchData.opponentLineup || [],
      periods: editingItem?.periods || defaultPeriods,
      currentPeriodIndex: editingItem?.currentPeriodIndex || 0,
    };    if (editingItem) {
      database.updateMatch(editingItem.id, newMatch);
    } else {
      database.addMatch(newMatch);
      // Reset selezione marcatori quando viene creata una nuova partita
      setSelectedHomeScorer('');
      setSelectedAwayScorer('');
    }
    loadData();
    setCurrentView('list');
    setEditingItem(null);
  };

  const handleMatchEdit = (match: Match) => {
    setEditingItem(match);
    setCurrentView('form');
  };

  const handleMatchDelete = (matchId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa partita?')) {
      database.deleteMatch(matchId);
      loadData();
    }
  };
  const handleMatchManage = (match: Match) => {
    // Inizializza la mappa dei numeri di maglia se non esiste
    const playerJerseyNumbers = match.playerJerseyNumbers || {};
    
    // Popola la mappa con i numeri di maglia dei giocatori attualmente in formazione
    match.lineup.forEach(matchPlayer => {
      if (!playerJerseyNumbers[matchPlayer.playerId]) {
        playerJerseyNumbers[matchPlayer.playerId] = matchPlayer.jerseyNumber;
      }
    });

    const matchWithJerseyNumbers = {
      ...match,
      playerJerseyNumbers
    };

    setManagingMatch(matchWithJerseyNumbers);
    setInitialLineup(match.lineup);
    setCurrentView('manage');
    
    // Inizializza i periodi se non esistono
    if (!match.periods || match.periods.length === 0) {
      const updatedMatch = { 
        ...matchWithJerseyNumbers, 
        periods: defaultPeriods,
        currentPeriodIndex: 0 
      };
      setManagingMatch(updatedMatch);
      database.updateMatch(match.id, updatedMatch);
      setCurrentPeriodIndex(0);
    } else {
      setCurrentPeriodIndex(match.currentPeriodIndex || 0);
      // Aggiorna il database con la mappa dei numeri di maglia se necessario
      if (!match.playerJerseyNumbers) {
        database.updateMatch(match.id, matchWithJerseyNumbers);
      }
      // Assicurati che managingMatch abbia sempre la mappa dei numeri di maglia
      setManagingMatch(matchWithJerseyNumbers);
    }
    
    // Restore timer based on current period and lastTimestamp
    const now = Date.now();
    const periods = match.periods || defaultPeriods;
    const currentPeriod = periods[match.currentPeriodIndex || 0];
    
    if (currentPeriod) {
      const computeTime = (base: number) => {
        if (match.isRunning && match.lastTimestamp) {
          const elapsed = Math.floor((now - match.lastTimestamp) / 1000);
          return base + elapsed;
        }
        return base;
      };
      
      const secs = computeTime(currentPeriod.duration);
      timer.resetTo(secs);
      if (match.isRunning) timer.start(); else timer.pause();
    } else {
      timer.resetTo(0);
      timer.pause();
    }  };

  // Substitution functions
  const handleSubstitution = (playerOutId: string, playerInId: string, jerseyNumber: number) => {
    if (!managingMatch) return;

    // Trova il numero di maglia del giocatore che esce
    const playerOutMatch = managingMatch.lineup.find(mp => mp.playerId === playerOutId);
    const playerOutJerseyNumber = playerOutMatch?.jerseyNumber;

    // Aggiorna la mappa dei numeri di maglia per conservare il numero del giocatore che esce
    const updatedPlayerJerseyNumbers = {
      ...managingMatch.playerJerseyNumbers,
      [playerOutId]: playerOutJerseyNumber || 0,
      [playerInId]: jerseyNumber
    };

    const nowSeconds = timer.time;
    const substitution: Substitution = {
      id: generateId(),
      minute: Math.floor(nowSeconds / 60),
      second: nowSeconds % 60,
      playerOut: playerOutId,
      playerIn: playerInId,
      playerOutJerseyNumber: playerOutJerseyNumber,
      playerInJerseyNumber: jerseyNumber
    };

    const updatedLineup = managingMatch.lineup.map(matchPlayer => 
      matchPlayer.playerId === playerOutId 
        ? { ...matchPlayer, playerId: playerInId, jerseyNumber: jerseyNumber } 
        : matchPlayer
    );

    const updatedMatch = {
      ...managingMatch,
      lineup: updatedLineup,
      playerJerseyNumbers: updatedPlayerJerseyNumbers,
      substitutions: [...managingMatch.substitutions, substitution]
    };

    // Se il giocatore che esce è il marcatore selezionato, resetta la selezione
    if (selectedHomeScorer === playerOutId) {
      setSelectedHomeScorer('');
    }

    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    loadData();
  };
  const getPlayersOnField = () => {
    if (!managingMatch) return [];
    return managingMatch.lineup.map(matchPlayer => {
      const player = players.find(p => p.id === matchPlayer.playerId);
      if (!player) return null;
      return { ...player, matchPlayer };
    }).filter(Boolean) as (Player & { matchPlayer: MatchPlayer })[];
  };

  const getPlayersOnBench = () => {
    if (!managingMatch) return [];
    const activePlayerIds = players.filter(p => p.isActive).map(p => p.id);
    const onFieldIds = managingMatch.lineup.map(mp => mp.playerId);
    return players.filter(p => activePlayerIds.includes(p.id) && !onFieldIds.includes(p.id));
  };

  // Funzione per ottenere il numero di maglia di un giocatore
  const getPlayerJerseyNumber = (playerId: string): number | null => {
    if (!managingMatch) return null;
    
    // Prima controlla se il giocatore è attualmente in campo
    const inLineup = managingMatch.lineup.find(mp => mp.playerId === playerId);
    if (inLineup) return inLineup.jerseyNumber;
    
    // Se non è in campo, controlla la mappa dei numeri di maglia
    return managingMatch.playerJerseyNumbers?.[playerId] || null;
  };

  // Navigation
  const handleBackToList = () => {
    // Persist timer before exiting manage view
    if (managingMatch) {
      if (managingMatch.status === 'first-half') {
        const updatedMatch = { ...managingMatch, firstHalfDuration: timer.time };
        database.updateMatch(managingMatch.id, updatedMatch);
      } else if (managingMatch.status === 'second-half') {
        const secDur = timer.time - managingMatch.firstHalfDuration;
        const updatedMatch = { ...managingMatch, secondHalfDuration: secDur };
        database.updateMatch(managingMatch.id, updatedMatch);
      }
      loadData();
    }
    setCurrentView('list');
    setEditingItem(null);
    setManagingMatch(null);
    setInitialLineup(null); // azzera la formazione iniziale quando si esce dalla gestione partita
    timer.reset();
  };
  const tabs = [
    { id: 'players' as const, name: 'Giocatori', icon: Users, color: 'text-blue-600' },
    { id: 'trainings' as const, name: 'Allenamenti', icon: Dumbbell, color: 'text-green-600' },
    { id: 'matches' as const, name: 'Partite', icon: Target, color: 'text-red-600' },
    { id: 'stats' as const, name: 'Statistiche', icon: BarChart3, color: 'text-purple-600' },
    { id: 'users' as const, name: 'Utenti', icon: UserCog, color: 'text-indigo-600' },
    { id: 'groups' as const, name: 'Gruppi', icon: Shield, color: 'text-yellow-600' }
  ];
  // Authentication functions
  const handleLogin = async (username: string, password: string, rememberMe: boolean = true) => {
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      const user = database.authenticateUser(username, password);
      if (user) {
        setCurrentUser(user);
        session.saveSession(user, rememberMe);
        loadData();
      } else {
        setLoginError('Credenziali non valide o utente scaduto');
      }
    } catch (error) {
      setLoginError('Errore durante l\'autenticazione');
    } finally {
      setIsLoggingIn(false);
    }
  };
  const handleLogout = () => {
    setCurrentUser(null);
    session.clearSession();
    setActiveTab('players');
    setCurrentView('list');
  };

  // User management functions
  const handleUserSubmit = (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      if (editingItem) {
        database.updateUser(editingItem.id, userData);
      } else {
        database.addUser(userData);
      }
      loadData();
      setCurrentView('list');
      setEditingItem(null);
    } catch (error) {
      alert('Errore durante il salvataggio dell\'utente: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

  const handleUserEdit = (user: UserWithGroup) => {
    setEditingItem(user);
    setCurrentView('form');
  };

  const handleUserDelete = (userId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo utente?')) {
      try {
        database.deleteUser(userId);
        loadData();
      } catch (error) {
        alert('Errore durante l\'eliminazione dell\'utente: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
      }
    }
  };

  // Group management functions
  const handleGroupSubmit = (groupData: Omit<Group, 'id' | 'createdAt'>) => {
    try {
      if (editingItem) {
        database.updateGroup(editingItem.id, groupData);
      } else {
        database.addGroup(groupData);
      }
      loadData();
      setCurrentView('list');
      setEditingItem(null);
    } catch (error) {
      alert('Errore durante il salvataggio del gruppo: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

  const handleGroupEdit = (group: Group) => {
    setEditingItem(group);
    setCurrentView('form');
  };

  const handleGroupDelete = (groupId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo gruppo?')) {
      try {
        database.deleteGroup(groupId);
        loadData();
      } catch (error) {
        alert('Errore durante l\'eliminazione del gruppo: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
      }
    }
  };

  // CSV Import functions
  const handleImportGroups = (groupsData: Omit<Group, 'id' | 'createdAt'>[]) => {
    try {
      groupsData.forEach(groupData => {
        database.addGroup(groupData);
      });
      loadData();
    } catch (error) {
      throw new Error('Errore durante l\'importazione dei gruppi: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

  const handleImportUsers = (usersData: Omit<User, 'id' | 'createdAt'>[]) => {
    try {
      usersData.forEach(userData => {
        database.addUser(userData);
      });
      loadData();
    } catch (error) {
      throw new Error('Errore durante l\'importazione degli utenti: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };
  // Permission check functions
  const hasPermission = (permission: keyof Permission): boolean => {
    if (!currentUser) return false;
    return currentUser.group.permissions[permission];
  };

  const canAccessTab = (tab: Tab): boolean => {
    if (!currentUser) return false;
    
    switch (tab) {
      case 'players':
        return hasPermission('teamManagement');
      case 'trainings':
      case 'matches':
        return hasPermission('matchManagement');
      case 'stats':
        return hasPermission('statisticsView') || hasPermission('resultsView');
      case 'users':
        return hasPermission('userManagement');
      case 'groups':
        return hasPermission('groupManagement');
      default:
        return false;
    }
  };
  // Loading state
  if (database.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Caricamento Database</h2>
          <p className="text-gray-600">Inizializzazione del registro elettronico...</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!currentUser) {
    return (
      <LoginForm 
        onLogin={handleLogin}
        error={loginError}
        isLoading={isLoggingIn}
      />
    );
  }

  // Error state
  if (database.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Errore Database</h2>
          <p className="text-gray-600 mb-4">{database.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ricarica Pagina
          </button>
        </div>
      </div>
    );
  }

  // handleAmmonition deve essere dichiarata PRIMA del renderContent
  const handleAmmonition = (
    type: 'yellow-card' | 'red-card' | 'second-yellow-card' | 'blue-card' | 'expulsion' | 'warning',
    playerId: string
  ) => {
    if (!managingMatch) return;
    const nowSeconds = timer.time;
    let description = '';
    if (playerId.startsWith('opp-')) {
      const jersey = playerId.replace('opp-', '');
      switch (type) {
        case 'yellow-card': description = `Giallo a maglia avversaria #${jersey}`; break;
        case 'second-yellow-card': description = `Secondo giallo a maglia avversaria #${jersey}`; break;
        case 'red-card': description = `Rosso a maglia avversaria #${jersey}`; break;
        case 'blue-card': description = `Blu a maglia avversaria #${jersey}`; break;
        case 'expulsion': description = `Espulsione maglia avversaria #${jersey}`; break;
        case 'warning': description = `Richiamo a maglia avversaria #${jersey}`; break;
      }    } else {
      const player = players.find(p => p.id === playerId);
      const jerseyNumber = getPlayerJerseyNumber(playerId);
      const jerseyDisplay = jerseyNumber ? `#${jerseyNumber} ` : '';
      switch (type) {
        case 'yellow-card': description = `Giallo a ${jerseyDisplay}${player ? player.lastName : ''}`; break;
        case 'second-yellow-card': description = `Secondo giallo a ${jerseyDisplay}${player ? player.lastName : ''}`; break;
        case 'red-card': description = `Rosso a ${jerseyDisplay}${player ? player.lastName : ''}`; break;
        case 'blue-card': description = `Blu a ${jerseyDisplay}${player ? player.lastName : ''}`; break;
        case 'expulsion': description = `Espulsione ${jerseyDisplay}${player ? player.lastName : ''}`; break;
        case 'warning': description = `Richiamo a ${jerseyDisplay}${player ? player.lastName : ''}`; break;
      }
    }
    const ammonitionEvent = {
      id: generateId(),
      type,
      minute: Math.floor(nowSeconds / 60),
      second: nowSeconds % 60,
      playerId,
      description
    };
    const updatedMatch = {
      ...managingMatch,
      events: [...managingMatch.events, ammonitionEvent]
    };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    loadData();
  };

  // Funzione per gestire altri eventi (falli, calci d'angolo, ecc.)
  const handleOtherEvent = (eventData: Omit<MatchEvent, 'id'>) => {
    if (!managingMatch) return;
    
    const currentPeriodIndex = managingMatch.currentPeriodIndex || 0;
    const newEvent = {
      ...eventData,
      id: generateId(),
      periodIndex: currentPeriodIndex
    };

    const updatedMatch = {
      ...managingMatch,
      events: [...managingMatch.events, newEvent]
    };
    
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    loadData();
  };

  // Funzione per rimuovere un evento (goal o ammonizione)
  function handleRemoveEvent(eventId: string) {
    if (!managingMatch) return;
    // Rimuovi l'evento
    const updatedEvents = managingMatch.events.filter(e => e.id !== eventId);

    // Ricalcola il punteggio in base ai goal rimasti
    let homeScore = 0;
    let awayScore = 0;
    updatedEvents.forEach(ev => {
      if (ev.type === 'goal') {
        if (ev.description?.includes('(nostro)')) {
          if (managingMatch.homeAway === 'home') homeScore++;
          else awayScore++;
        } else if (ev.description?.includes('avversario')) {
          if (managingMatch.homeAway === 'home') awayScore++;
          else homeScore++;
        }
      }
    });

    const updatedMatch = { ...managingMatch, events: updatedEvents, homeScore, awayScore };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    loadData();
  }

  // Funzione per rimuovere una sostituzione e ricalcolare la lineup
  function handleRemoveSubstitution(subId: string) {
    if (!managingMatch || !initialLineup) return;
    // Rimuovi la sostituzione
    const updatedSubs = managingMatch.substitutions.filter(s => s.id !== subId);    // Ricostruisci la lineup a partire dalla formazione iniziale e dalle sostituzioni rimaste
    let lineup = [...initialLineup];
    let error = null;
    // Trova la lista delle sostituzioni rimaste ordinate per tempo
    const orderedSubs = updatedSubs.slice().sort((a, b) => {
      if (a.minute !== b.minute) return a.minute - b.minute;
      return (a.second || 0) - (b.second || 0);
    });
    // Applica ogni sostituzione solo se valida
    for (const sub of orderedSubs) {
      const playerOutInLineup = lineup.find(mp => mp.playerId === sub.playerOut);
      const playerInInLineup = lineup.find(mp => mp.playerId === sub.playerIn);
      
      if (!playerOutInLineup) {
        const playerOut = players.find(p => p.id === sub.playerOut);
        error = `Impossibile applicare la sostituzione: il giocatore che esce (${playerOut?.firstName} ${playerOut?.lastName}) non è in campo.`;
        break;
      }
      if (playerInInLineup) {
        const playerIn = players.find(p => p.id === sub.playerIn);
        error = `Impossibile applicare la sostituzione: il giocatore che entra (${playerIn?.firstName} ${playerIn?.lastName}) è già in campo.`;
        break;
      }
      lineup = lineup.map(mp => mp.playerId === sub.playerOut ? { ...mp, playerId: sub.playerIn } : mp);
    }
    
    // Rimuovi eventuali duplicati basati su playerId
    const uniquePlayerIds = new Set();
    lineup = lineup.filter(mp => {
      if (uniquePlayerIds.has(mp.playerId)) {
        return false;
      }
      uniquePlayerIds.add(mp.playerId);
      return true;
    });
    
    if (error) {
      setManageError(error);
      return;
    }
    setManageError(null);
    const updatedMatch = { ...managingMatch, substitutions: updatedSubs, lineup };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    loadData();
  }
  const renderContent = () => {
    if (currentView === 'form') {
      switch (activeTab) {
        case 'players':
          return (
            <PlayerForm
              onSubmit={handlePlayerSubmit}
              initialData={editingItem}
              onCancel={handleBackToList}
            />
          );
        case 'trainings':
          return (
            <TrainingForm
              players={players}
              onSubmit={handleTrainingSubmit}
              initialData={editingItem}
              onCancel={handleBackToList}
            />
          );        case 'matches':
          return (
            <MatchForm
              players={players}
              users={users}
              onSubmit={handleMatchSubmit}
              initialData={editingItem}
              onCancel={handleBackToList}
            />
          );
        case 'users':
          return (
            <UserForm
              user={editingItem}
              groups={groups}
              onSubmit={handleUserSubmit}
              onCancel={handleBackToList}
            />
          );
        case 'groups':
          return (
            <GroupForm
              group={editingItem}
              onSubmit={handleGroupSubmit}
              onCancel={handleBackToList}
            />
          );
      }
    }

    if (currentView === 'manage' && managingMatch) {
      // Solo interfaccia migliorata
      return (
        <>
          <EnhancedMatchManagement
            match={managingMatch}
            players={players}
            users={users}
            currentPeriodIndex={currentPeriodIndex}
            isTimerRunning={timer.isRunning}
            currentTime={timer.time}
            onTimerStart={handleStartPeriod}
            onTimerPause={handlePausePeriod}
            onTimerInterval={handleInterval}
            onAddPeriod={handleAddPeriod}
            onRemoveLastPeriod={handleRemoveLastPeriod}
            onFinishMatch={handleFinishMatchDynamic}
            onHomeGoal={handleHomeGoal}
            onAwayGoal={handleAwayGoal}
            onHomeGoalRemove={handleHomeGoalRemove}
            onAwayGoalRemove={handleAwayGoalRemove}
            onSubstitution={() => setShowSubstitutionModal(true)}
            onAmmonition={() => setShowAmmonitionModal(true)}
            onOtherEvents={() => setShowOtherEventsModal(true)}
            onRemoveEvent={handleRemoveEvent}
            onRemoveSubstitution={handleRemoveSubstitution}
            selectedHomeScorer={selectedHomeScorer}
            selectedAwayScorer={selectedAwayScorer}
            onSelectHomeScorer={setSelectedHomeScorer}
            onSelectAwayScorer={setSelectedAwayScorer}
            formatTime={timer.formatTime}
            getPlayersOnField={getPlayersOnField}
            getPlayersOnBench={getPlayersOnBench}
            getPlayerJerseyNumber={getPlayerJerseyNumber}
            manageError={manageError}
          />
          <SubstitutionModal
            isOpen={showSubstitutionModal}
            onClose={() => setShowSubstitutionModal(false)}
            playersOnField={getPlayersOnField()}
            playersOnBench={getPlayersOnBench()}
            onSubstitute={handleSubstitution}
            currentMinute={Math.floor(timer.time / 60)}
            playerJerseyNumbers={managingMatch.playerJerseyNumbers}
          />
          <AmmonitionModal
            isOpen={showAmmonitionModal}
            onClose={() => setShowAmmonitionModal(false)}
            playersOnField={getPlayersOnField()}
            opponentLineup={managingMatch.opponentLineup}
            onAmmonition={handleAmmonition}
            currentMinute={Math.floor(timer.time / 60)}
          />
          <OtherEventsModal
            isOpen={showOtherEventsModal}
            onClose={() => setShowOtherEventsModal(false)}
            players={players}
            lineup={managingMatch.lineup}
            currentTimeInSeconds={timer.time}
            onEventAdd={handleOtherEvent}
          />
        </>
      );
    }    // List views
    if (currentView === 'csv') {
      return (
        <CSVManager
          groups={groups}
          users={users}
          onImportGroups={handleImportGroups}
          onImportUsers={handleImportUsers}
        />
      );
    }

    switch (activeTab) {
      case 'players':        return (
          <PlayerList
            players={players}
            onEdit={handlePlayerEdit}
            onDelete={handlePlayerDelete}
            onImportPlayers={handleImportPlayers}
          />
        );
      case 'trainings':
        return (
          <TrainingList
            trainings={trainings}
            players={players}
            onEdit={handleTrainingEdit}
            onDelete={handleTrainingDelete}
          />
        );
      case 'matches':
        return (
          <>
            <MatchList
              matches={matches}
              players={players}
              onEdit={handleMatchEdit}
              onDelete={handleMatchDelete}
              onManage={handleMatchManage}
              onReport={match => setShowReportMatch(match)}
            />            {showReportMatch && (
              <ReportMatch
                match={showReportMatch}
                players={players}
                users={users}
                onClose={() => setShowReportMatch(null)}
              />
            )}
          </>
        );
      case 'users':
        return (
          <UserList
            users={users}
            onEdit={handleUserEdit}
            onDelete={handleUserDelete}
          />
        );
      case 'groups':
        return (
          <GroupList
            groups={groups}
            onEdit={handleGroupEdit}
            onDelete={handleGroupDelete}
          />
        );
      case 'stats':
        return (
          <StatsOverview
            players={players}
            matches={matches}
            trainings={trainings}
            playerStats={playerStats}
          />
        );
      default:
        return null;
    }
  };

  // Utility per trovare l'ultimo indice che soddisfa una condizione
  const findLastIndex = (array: any[], predicate: (item: any) => boolean) => {
    for (let i = array.length - 1; i >= 0; i--) {
      if (predicate(array[i])) {
        return i;
      }
    }
    return -1;
  };

  // Gestione goal (logica corretta per casa e trasferta)
  const handleHomeGoal = () => {
    if (!managingMatch) return;
    const scorerId = selectedHomeScorer;
    const nowSeconds = timer.time;
    if (!scorerId) return;
    
    // Se giochiamo in casa, i nostri goal vanno in homeScore
    // Se giochiamo in trasferta, i nostri goal vanno in awayScore
    const updatedMatch = {
      ...managingMatch,
      homeScore: managingMatch.homeAway === 'home' ? managingMatch.homeScore + 1 : managingMatch.homeScore,
      awayScore: managingMatch.homeAway === 'away' ? managingMatch.awayScore + 1 : managingMatch.awayScore,
      events: [
        ...managingMatch.events,
        {
          id: generateId(),
          type: 'goal' as const,
          minute: Math.floor(nowSeconds / 60),
          second: nowSeconds % 60,
          playerId: scorerId,
          description: `Goal di #${getPlayerJerseyNumber(scorerId) || '?'} ${players.find(p => p.id === scorerId)?.lastName || ''} (nostro)`
        }
      ]
    };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    
    // Reset selezione marcatore
    setSelectedHomeScorer('');
    
    loadData();
  };
  const handleAwayGoal = () => {
    if (!managingMatch) return;
    const jerseyNumber = selectedAwayScorer;
    const nowSeconds = timer.time;
    if (!jerseyNumber) return;
    
    // Se giochiamo in casa, i goal avversari vanno in awayScore
    // Se giochiamo in trasferta, i goal avversari vanno in homeScore
    const updatedMatch = {
      ...managingMatch,
      homeScore: managingMatch.homeAway === 'away' ? managingMatch.homeScore + 1 : managingMatch.homeScore,
      awayScore: managingMatch.homeAway === 'home' ? managingMatch.awayScore + 1 : managingMatch.awayScore,
      events: [
        ...managingMatch.events,
        {
          id: generateId(),
          type: 'goal' as const,
          minute: Math.floor(nowSeconds / 60),
          second: nowSeconds % 60,
          playerId: String(jerseyNumber),
          description: `Goal avversario #${jerseyNumber}`
        }
      ]
    };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    
    // Reset selezione marcatore
    setSelectedAwayScorer('');
    
    loadData();
  };
  const handleHomeGoalRemove = () => {
    if (!managingMatch) return;
    
    // Controlla il punteggio corretto basato su dove giochiamo
    const ourCurrentScore = managingMatch.homeAway === 'home' ? managingMatch.homeScore : managingMatch.awayScore;
    if (ourCurrentScore <= 0) return;
    
    const events = [...managingMatch.events];
    const ourGoals = events.filter(e => e.type === 'goal' && e.description?.includes('(nostro)'));
    
    let goalToRemoveIndex = -1;
    
    // Se c'è un marcatore selezionato, cerca prima i suoi goal
    if (selectedHomeScorer) {
      const selectedPlayerGoals = ourGoals.filter(g => g.playerId === selectedHomeScorer);
      if (selectedPlayerGoals.length > 0) {
        // Trova il goal più recente del giocatore selezionato
        const mostRecentPlayerGoal = selectedPlayerGoals.reduce((latest, current) => {
          const latestTime = latest.minute * 60 + (latest.second || 0);
          const currentTime = current.minute * 60 + (current.second || 0);
          return currentTime > latestTime ? current : latest;
        });
        goalToRemoveIndex = events.findIndex(e => e.id === mostRecentPlayerGoal.id);
      } else {
        // Il giocatore selezionato non ha goal, rimuovi il goal più recente della squadra
        goalToRemoveIndex = findLastIndex(events, e => e.type === 'goal' && e.description?.includes('(nostro)'));
      }
    } else {
      // Nessun marcatore selezionato, rimuovi il goal più recente della squadra
      goalToRemoveIndex = findLastIndex(events, e => e.type === 'goal' && e.description?.includes('(nostro)'));
    }
    
    if (goalToRemoveIndex !== -1) {
      events.splice(goalToRemoveIndex, 1);
    }
    
    const updatedMatch = {
      ...managingMatch,
      homeScore: managingMatch.homeAway === 'home' ? managingMatch.homeScore - 1 : managingMatch.homeScore,
      awayScore: managingMatch.homeAway === 'away' ? managingMatch.awayScore - 1 : managingMatch.awayScore,
      events
    };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    loadData();
  };
  const handleAwayGoalRemove = () => {
    if (!managingMatch) return;
    
    // Controlla il punteggio avversario corretto basato su dove giochiamo
    const theirCurrentScore = managingMatch.homeAway === 'home' ? managingMatch.awayScore : managingMatch.homeScore;
    if (theirCurrentScore <= 0) return;
    
    const events = [...managingMatch.events];
    const theirGoals = events.filter(e => e.type === 'goal' && e.description?.includes('avversario'));
    
    let goalToRemoveIndex = -1;
    
    // Se c'è un numero maglia selezionato, cerca prima i goal di quel numero
    if (selectedAwayScorer) {
      const selectedJerseyGoals = theirGoals.filter(g => {
        // Estrai il numero di maglia dalla descrizione del goal
        const match = g.description?.match(/#(\d+)/);
        return match && parseInt(match[1]) === selectedAwayScorer;
      });
      
      if (selectedJerseyGoals.length > 0) {
        // Trova il goal più recente del numero di maglia selezionato
        const mostRecentJerseyGoal = selectedJerseyGoals.reduce((latest, current) => {
          const latestTime = latest.minute * 60 + (latest.second || 0);
          const currentTime = current.minute * 60 + (current.second || 0);
          return currentTime > latestTime ? current : latest;
        });
        goalToRemoveIndex = events.findIndex(e => e.id === mostRecentJerseyGoal.id);
      } else {
        // Il numero di maglia selezionato non ha goal, rimuovi il goal più recente della squadra avversaria
        goalToRemoveIndex = findLastIndex(events, e => e.type === 'goal' && e.description?.includes('avversario'));
      }
    } else {
      // Nessun numero maglia selezionato, rimuovi il goal più recente della squadra avversaria
      goalToRemoveIndex = findLastIndex(events, e => e.type === 'goal' && e.description?.includes('avversario'));
    }
    
    if (goalToRemoveIndex !== -1) {
      events.splice(goalToRemoveIndex, 1);
    }
    
    const updatedMatch = {
      ...managingMatch,
      homeScore: managingMatch.homeAway === 'away' ? managingMatch.homeScore - 1 : managingMatch.homeScore,
      awayScore: managingMatch.homeAway === 'home' ? managingMatch.awayScore - 1 : managingMatch.awayScore,
      events
    };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    loadData();
  };
  const handleAddPeriod = (type: 'regular' | 'extra') => {
    if (!managingMatch) return;
    const periods = [...(managingMatch.periods || defaultPeriods)];
    const regularPeriodsCount = periods.filter(p => p.type === 'regular').length;
    const extraPeriodsCount = periods.filter(p => p.type === 'extra').length;
    
    const label = type === 'regular'
      ? `${regularPeriodsCount + 1}° Tempo`
      : `${extraPeriodsCount + 1}° Supplementare`;
      
    periods.push({ type, label, duration: timer.time });
    const newCurrentPeriodIndex = periods.length - 1;
    
    const updatedMatch = { 
      ...managingMatch, 
      periods,
      currentPeriodIndex: newCurrentPeriodIndex 
    };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    setCurrentPeriodIndex(newCurrentPeriodIndex);
    loadData();
  };
  const handleRemoveLastPeriod = (event: React.MouseEvent) => {
    if (!managingMatch) return;
    let periods = [...(managingMatch.periods || defaultPeriods)];
    if (periods.length <= 1) return;
    
    // Salta la conferma se Shift è premuto
    if (!event.shiftKey && !window.confirm('Sei sicuro di voler rimuovere l\'ultimo periodo?')) return;
    
    periods.pop();
    const newCurrentPeriodIndex = Math.max(0, periods.length - 1);
    
    // Aggiorna il nuovo periodo corrente con il tempo del timer
    if (periods[newCurrentPeriodIndex]) {
      periods[newCurrentPeriodIndex] = {
        ...periods[newCurrentPeriodIndex],
        duration: timer.time
      };
    }
    
    const updatedMatch = { 
      ...managingMatch, 
      periods,
      currentPeriodIndex: newCurrentPeriodIndex 
    };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    setCurrentPeriodIndex(newCurrentPeriodIndex);
    loadData();
  };  const handleInterval = () => {
    if (!managingMatch) return;
    
    // Aggiorna il periodo corrente con il tempo trascorso
    const periods = [...(managingMatch.periods || defaultPeriods)];
    if (!periods[currentPeriodIndex]) return;
    periods[currentPeriodIndex] = {
      ...periods[currentPeriodIndex],
      duration: timer.time
    };

    // Crea un nuovo periodo di intervallo con numerazione
    const intervalNumber = periods.filter(p => p.type === 'interval').length + 1;
    const newPeriod: MatchPeriod = {
      type: 'interval',
      label: `${intervalNumber}° Intervallo`,
      duration: timer.time // Continua dal tempo corrente
    };
    
    periods.push(newPeriod);
    const newCurrentPeriodIndex = periods.length - 1;
    
    const updatedMatch = { 
      ...managingMatch, 
      periods, 
      currentPeriodIndex: newCurrentPeriodIndex,
      status: 'half-time' as const, // Aggiorna lo status per l'intervallo
      isRunning: true,
      lastTimestamp: Date.now()
    };
    
    setManagingMatch(updatedMatch);
    setCurrentPeriodIndex(newCurrentPeriodIndex);
    database.updateMatch(managingMatch.id, updatedMatch);
    
    // Il timer continua dal punto in cui era, senza reset
    // Non chiamiamo timer.reset() né timer.start() perché deve continuare
    loadData();
  };

  const handleStartPeriod = () => {
    if (!managingMatch) return;
    
    const currentPeriod = managingMatch?.periods?.[currentPeriodIndex];
    if (currentPeriod) {
      timer.resetTo(currentPeriod.duration || 0);
    }
    
    // Aggiorna lo status della partita quando inizia
    let newStatus = managingMatch.status;
    
    // Se la partita è programmata e non è mai iniziata, imposta il primo tempo
    if (managingMatch.status === 'scheduled') {
      newStatus = 'first-half' as const;
    }
    // Se il periodo corrente è di tipo regular e la partita non è finita
    else if (currentPeriod && managingMatch.status !== 'finished') {
      if (currentPeriod.type === 'regular') {
        // Determina se è primo o secondo tempo in base all'indice
        if (currentPeriodIndex === 0) {
          newStatus = 'first-half' as const;
        } else if (currentPeriodIndex === 1) {
          newStatus = 'second-half' as const;
        } else {
          // Per periodi regolari successivi, mantieni secondo tempo
          newStatus = 'second-half' as const;
        }
      } else if (currentPeriod.type === 'extra') {
        // Per tempi supplementari, usa secondo tempo
        newStatus = 'second-half' as const;
      } else if (currentPeriod.type === 'interval') {
        // Per gli intervalli, mantieni lo status precedente o imposta half-time
        newStatus = 'half-time' as const;
      }
    }
    
    // Aggiorna la partita con il nuovo status
    const updatedMatch = {
      ...managingMatch,
      status: newStatus,
      isRunning: true,
      lastTimestamp: Date.now()
    };
    
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    
    timer.start();
  };

  const handlePausePeriod = () => {
    if (!managingMatch) return;
    
    timer.pause();
    
    // Aggiorna la partita per indicare che non è più in esecuzione
    const updatedMatch = {
      ...managingMatch,
      isRunning: false,
      lastTimestamp: Date.now()
    };
    
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
  };

  const handleFinishMatchDynamic = (event: React.MouseEvent) => {
    // Salta la conferma se Shift è premuto
    if (!event.shiftKey && !window.confirm('Sei sicuro di voler terminare la partita?')) return;
    
    timer.pause();
    if (managingMatch) {
      const periods = [...(managingMatch.periods || defaultPeriods)];
      
      // Aggiorna il periodo corrente con il tempo finale
      if (periods[currentPeriodIndex]) {
        periods[currentPeriodIndex] = {
          ...periods[currentPeriodIndex],
          duration: timer.time
        };
      }
      
      const updatedMatch = { 
        ...managingMatch, 
        status: 'finished' as const,
        periods,
        currentPeriodIndex,
        isRunning: false,
        lastTimestamp: Date.now()
      };
      setManagingMatch(updatedMatch);
      database.updateMatch(managingMatch.id, updatedMatch);
      loadData();
      setCurrentView('list');
      setEditingItem(null);
      setManagingMatch(null);
      setInitialLineup(null);
      timer.reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {/* Logo */}
              {/* Desktop logo */}
              <img src="/img/logo.png" alt="Logo Pietra Ligure Calcio" className="h-12 w-auto mr-3 hidden sm:block" />
              {/* Mobile logo */}
              <img src="/img/logo.png" alt="Logo Pietra Ligure Calcio" className="h-8 w-auto mr-2 sm:hidden" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">ASD Pietra Ligure Calcio</h1>
                <p className="text-sm text-gray-600">Registro Elettronico</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar backdrop */}
      {isMobile && (
        <div 
          className={`fixed inset-0 bg-black z-30 transition-opacity duration-300 ease-in-out ${
            mobileMenuOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`} 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">           {/* Sidebar Navigation */}
          <aside className={`lg:w-64 lg:block fixed lg:relative top-0 right-0 h-full lg:h-auto z-40 bg-white p-4 w-64 shadow-lg lg:shadow-none transition-transform duration-300 ease-in-out transform ${
            mobileMenuOpen || !isMobile ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {/* User Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-xs text-gray-600">{currentUser.group.name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <nav className="space-y-2">
              {tabs.filter(tab => canAccessTab(tab.id)).map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      // Persist timer state if coming from an active match
                      if (managingMatch) {
                        const now = Date.now();
                        const common: any = { lastTimestamp: now, isRunning: timer.isRunning };
                        if (managingMatch.status === 'first-half') {
                          common.firstHalfDuration = timer.time;
                        } else if (managingMatch.status === 'second-half') {
                          common.secondHalfDuration = timer.time - managingMatch.firstHalfDuration;
                        }
                        const updated = { ...managingMatch, ...common };
                        database.updateMatch(managingMatch.id, updated);
                        loadData();
                      }
                      setActiveTab(tab.id);
                      setCurrentView('list');
                      setEditingItem(null);
                      setManagingMatch(null);
                      setMobileMenuOpen(false);
                      timer.reset();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : ''}`} />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">  {/* Removed conditional margin-left */}
             {/* Page Header */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                {(currentView === 'form' || currentView === 'manage') && (
                  <button
                    onClick={handleBackToList}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    {tabs.find(t => t.id === activeTab)?.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {currentView === 'form' ? 
                      (editingItem ? 'Modifica' : 'Aggiungi nuovo') :
                      currentView === 'manage' ? (
                        <span className="flex items-center gap-2">
                          Gestione partita in corso
                        </span>
                      ) :
                      'Gestisci e visualizza'
                    }
                  </p>
                </div>
              </div>              {/* Pulsanti a destra: export, csv o aggiungi */}
              {currentView === 'list' && (
                activeTab === 'stats' ? (
                  <div className="flex-shrink-0">
                    <ExportStatsButton
                      players={players}
                      matches={matches}
                      trainings={trainings}
                      playerStats={playerStats}
                    />
                  </div>
                ) : (activeTab === 'users' || activeTab === 'groups') ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentView('csv')}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      CSV
                    </button>
                    <button
                      onClick={() => setCurrentView('form')}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Aggiungi {activeTab === 'users' ? 'Utente' : 'Gruppo'}
                    </button>
                  </div>
                ) : canAccessTab(activeTab) ? (
                  activeTab === 'trainings' ? (
                    <div className="flex items-center gap-2">
                      {isMobile && trainings.length > 0 && (
                        <ExportTrainingAttendanceButton trainings={trainings} players={players} />
                      )}
                      <button
                        onClick={() => setCurrentView('form')}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Aggiungi Allenamento
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCurrentView('form')}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Aggiungi {activeTab === 'players' ? 'Giocatore' : 'Partita'}
                    </button>
                  )
                ) : null
              )}
            </div>

            {/* Content */}
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;