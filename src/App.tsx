import { useState, useEffect } from 'react';
import { useDatabase } from './hooks/useDatabase';
import { useTimer } from './hooks/useTimer';
import { useSession } from './hooks/useSession';
import { Player, Training, Match, MatchPlayer, Substitution, User, Group, UserWithGroup, Permission } from './types';
import { usePlayerStats } from './hooks/usePlayerStats';
import { PlayerForm } from './components/PlayerForm';
import { PlayerList } from './components/PlayerList';
import { TrainingForm } from './components/TrainingForm';
import { TrainingList } from './components/TrainingList';
import { MatchForm } from './components/MatchForm';
import { MatchList } from './components/MatchList';
import { MatchTimer } from './components/MatchTimer';
import { SubstitutionModal } from './components/SubstitutionModal';
import { StatsOverview } from './components/StatsOverview';
import { GoalCounter } from './components/GoalCounter';
import { LoginForm } from './components/LoginForm';
import { UserForm } from './components/UserForm';
import { UserList } from './components/UserList';
import { GroupForm } from './components/GroupForm';
import { GroupList } from './components/GroupList';
import { CSVManager } from './components/CSVManager';
import { 
  Users, 
  Dumbbell, 
  Target, 
  BarChart3, 
  Plus, 
  ArrowLeft,
  Menu,
  X,
  ArrowLeftRight,
  Loader2,
  AlertTriangle,
  Square,
  Trash2,
  Ban,
  Shield,
  UserCog,
  LogOut,
  FileText
} from 'lucide-react';
import { AmmonitionModal } from './components/AmmonitionModal';
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

  // Auto-save timer state to DB on each tick when running
  useEffect(() => {
    if (currentView === 'manage' && managingMatch && timer.isRunning) {
      const now = Date.now();
      // compute durations
      let fhd = managingMatch.firstHalfDuration;
      let shd = managingMatch.secondHalfDuration;
      if (managingMatch.status === 'first-half') {
        fhd = timer.time;
      } else if (managingMatch.status === 'second-half') {
        shd = timer.time - managingMatch.firstHalfDuration;
      }
      const updated: any = {
        ...managingMatch,
        firstHalfDuration: fhd,
        secondHalfDuration: shd,
        isRunning: true,
        lastTimestamp: now
      };
      setManagingMatch(updated);
      database.updateMatch(managingMatch.id, updated);
      // no need to reload all data here
    }
  }, [timer.time]);

  // Persist timer state on page unload or navigation
  useEffect(() => {
    const handler = () => {
      if (managingMatch) {
        const now = Date.now();
        let fhd = managingMatch.firstHalfDuration;
        let shd = managingMatch.secondHalfDuration;
        if (managingMatch.status === 'first-half') {
          fhd = timer.time;
        } else if (managingMatch.status === 'second-half') {
          shd = timer.time - managingMatch.firstHalfDuration;
        }
        const updated: any = {
          ...managingMatch,
          firstHalfDuration: fhd,
          secondHalfDuration: shd,
          isRunning: timer.isRunning,
          lastTimestamp: now
        };
        database.updateMatch(managingMatch.id, updated);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [managingMatch, timer.time, timer.isRunning]);
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
    };

    if (editingItem) {
      database.updateMatch(editingItem.id, newMatch);
    } else {
      database.addMatch(newMatch);
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
    setManagingMatch(match);
    setInitialLineup(match.lineup);
    setCurrentView('manage');
    // Restore timer based on match status and lastTimestamp
    const now = Date.now();
    const computeTime = (base: number) => {
      if (match.isRunning && match.lastTimestamp) {
        const elapsed = Math.floor((now - match.lastTimestamp) / 1000);
        return base + elapsed;
      }
      return base;
    };
    if (match.status === 'first-half') {
      const secs = computeTime(match.firstHalfDuration);
      timer.resetTo(secs);
      if (match.isRunning) timer.start(); else timer.pause();
    } else if (match.status === 'half-time') {
      timer.resetTo(match.firstHalfDuration);
      timer.pause();
    } else if (match.status === 'second-half') {
      const base = match.firstHalfDuration + match.secondHalfDuration;
      const secs = computeTime(base);
      timer.resetTo(secs);
      if (match.isRunning) timer.start(); else timer.pause();
    } else {
      timer.reset();
    }
  };

  // Continue first half if ended by mistake
  const handleContinueFirstHalf = () => {
    if (!managingMatch) return;
    // Set status back to first-half
    const now = Date.now();
    const updatedMatch: any = {
      ...managingMatch,
      status: 'first-half',
      isRunning: true,
      lastTimestamp: now
    };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    loadData();
    // Reset timer to stored firstHalfDuration and start
    timer.resetTo(managingMatch.firstHalfDuration);
    timer.start();
  };

  // Match timer functions
  const updateMatchStatus = (status: Match['status']) => {
    if (!managingMatch) return;

    const updatedMatch = { ...managingMatch, status };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    loadData();
  };

  const handleMatchStart = () => {
    if (managingMatch) {
      const now = Date.now();
      const newStatus = managingMatch.status === 'scheduled' ? 'first-half' : managingMatch.status;
      const updatedMatch: any = {
        ...managingMatch,
        status: newStatus,
        isRunning: true,
        lastTimestamp: now
      };
      setManagingMatch(updatedMatch);
      database.updateMatch(managingMatch.id, updatedMatch);
      loadData();
    }
    timer.start();
  };

  const handleMatchPause = () => {
    // Pause timer and persist current time to database
    timer.pause();
    if (managingMatch) {
      const common: any = { lastTimestamp: Date.now(), isRunning: false };
      if (managingMatch.status === 'first-half') {
        common.firstHalfDuration = timer.time;
      } else if (managingMatch.status === 'second-half') {
        common.secondHalfDuration = timer.time - managingMatch.firstHalfDuration;
      }
      const updatedMatch = { ...managingMatch, ...common };
      setManagingMatch(updatedMatch);
      database.updateMatch(managingMatch.id, updatedMatch);
      loadData();
    }
  };

  const handleEndFirstHalf = () => {
    timer.pause();
    if (managingMatch) {
      const updatedMatch = { 
        ...managingMatch, 
        status: 'half-time' as const,
        firstHalfDuration: timer.time 
      };
      setManagingMatch(updatedMatch);
      database.updateMatch(managingMatch.id, updatedMatch);
      loadData();
    }
  };

  const handleStartSecondHalf = () => {
    updateMatchStatus('second-half');
    timer.start();
  };

  const handleFinishMatch = () => {
    if (!window.confirm('Sei sicuro di voler terminare la partita?')) return;
    timer.pause();
    if (managingMatch) {
      const updatedMatch = { 
        ...managingMatch, 
        status: 'finished' as const,
        secondHalfDuration: timer.time - (managingMatch.firstHalfDuration || 0)
      };
      setManagingMatch(updatedMatch);
      database.updateMatch(managingMatch.id, updatedMatch);
      loadData();
      setCurrentView('list');
      setManagingMatch(null);
      timer.reset();
    }
  };

  // Substitution functions
  const handleSubstitution = (playerOutId: string, playerInId: string) => {
    if (!managingMatch) return;

    const nowSeconds = timer.time;
    const substitution: Substitution = {
      id: generateId(),
      minute: Math.floor(nowSeconds / 60),
      second: nowSeconds % 60,
      playerOut: playerOutId,
      playerIn: playerInId
    };    const updatedLineup = managingMatch.lineup.map(matchPlayer => 
      matchPlayer.playerId === playerOutId ? { ...matchPlayer, playerId: playerInId } : matchPlayer
    );

    const updatedMatch = {
      ...managingMatch,
      lineup: updatedLineup,
      substitutions: [...managingMatch.substitutions, substitution]
    };

    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
    loadData();
  };
  const getPlayersOnField = () => {
    if (!managingMatch) return [];
    return managingMatch.lineup.map(matchPlayer => players.find(p => p.id === matchPlayer.playerId)).filter(Boolean) as Player[];
  };

  const getPlayersOnBench = () => {
    if (!managingMatch) return [];
    const activePlayerIds = players.filter(p => p.isActive).map(p => p.id);
    const onFieldIds = managingMatch.lineup.map(mp => mp.playerId);
    return players.filter(p => activePlayerIds.includes(p.id) && !onFieldIds.includes(p.id));
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
      case 'groups':
        return currentUser.group.id === 'admin'; // Only admin can manage users and groups
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
      }
    } else {
      const player = players.find(p => p.id === playerId);
      switch (type) {
        case 'yellow-card': description = `Giallo a ${player ? player.lastName : ''}`; break;
        case 'second-yellow-card': description = `Secondo giallo a ${player ? player.lastName : ''}`; break;
        case 'red-card': description = `Rosso a ${player ? player.lastName : ''}`; break;
        case 'blue-card': description = `Blu a ${player ? player.lastName : ''}`; break;
        case 'expulsion': description = `Espulsione ${player ? player.lastName : ''}`; break;
        case 'warning': description = `Richiamo a ${player ? player.lastName : ''}`; break;
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
      return (
        <div className="space-y-6">
          {manageError && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold">
              {manageError}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-bold text-gray-800">
              Gestione Partita vs {managingMatch.opponent}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSubstitutionModal(true)}
                disabled={managingMatch.status === 'scheduled' || managingMatch.status === 'finished'}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Sostituzione
              </button>
              <button
                onClick={() => setShowAmmonitionModal(true)}
                disabled={managingMatch.status === 'scheduled' || managingMatch.status === 'finished'}
                className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Ammonizione
              </button>
            </div>
          </div>

          <MatchTimer
            time={timer.time}
            isRunning={timer.isRunning}
            status={managingMatch.status}
            onStart={handleMatchStart}
            onPause={handleMatchPause}
            onEndFirstHalf={handleEndFirstHalf}
            onStartSecondHalf={handleStartSecondHalf}
            onFinish={handleFinishMatch}
            onContinueFirstHalf={handleContinueFirstHalf}
            formatTime={timer.formatTime}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">In campo</h3>
              <div className="bg-white rounded-xl shadow p-4 mb-4 min-h-[60px]">
                {getPlayersOnField().length === 0 ? (
                  <span className="text-gray-400">Nessun giocatore in campo</span>
                ) : (                <ul className="space-y-1">
                    {managingMatch.lineup.map(matchPlayer => {
                      const player = players.find(p => p.id === matchPlayer.playerId);
                      if (!player) return null;
                      return (
                        <li key={player.id} className="flex items-center gap-2">
                          <span className="font-bold text-blue-700">#{matchPlayer.jerseyNumber}</span>
                          <span>{player.firstName} {player.lastName}</span>
                          <span className="text-xs text-gray-500">{matchPlayer.position}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">In panchina</h3>
              <div className="bg-white rounded-xl shadow p-4 mb-4 min-h-[60px]">
                {getPlayersOnBench().length === 0 ? (
                  <span className="text-gray-400">Nessun giocatore in panchina</span>                ) : (
                  <ul className="space-y-1">
                    {getPlayersOnBench().map(player => (
                      <li key={player.id} className="flex items-center gap-2">
                        <span className="font-bold text-green-700">{player.firstName.charAt(0)}{player.lastName.charAt(0)}</span>
                        <span>{player.firstName} {player.lastName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <GoalCounter
                teamName={"Nostra Squadra"}
                score={managingMatch.homeAway === 'home' ? managingMatch.homeScore : managingMatch.awayScore}
                onIncrement={handleHomeGoal}
                onDecrement={handleHomeGoalRemove}
                disabled={managingMatch.status === 'scheduled' || managingMatch.status === 'finished' || !selectedHomeScorer}
              />
              <select
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={selectedHomeScorer}
                onChange={e => setSelectedHomeScorer(e.target.value)}
                disabled={managingMatch.status === 'scheduled' || managingMatch.status === 'finished'}
                required
              >                <option value="">Seleziona marcatore</option>
                {managingMatch.lineup.map(matchPlayer => {
                  const player = players.find(p => p.id === matchPlayer.playerId);
                  if (!player) return null;
                  return (
                    <option key={player.id} value={player.id}>#{matchPlayer.jerseyNumber} - {player.firstName} {player.lastName}</option>
                  );
                })}
              </select>
            </div>
            <div>
              <GoalCounter
                teamName={managingMatch.opponent}
                score={managingMatch.homeAway === 'home' ? managingMatch.awayScore : managingMatch.homeScore}
                onIncrement={handleAwayGoal}
                onDecrement={handleAwayGoalRemove}
                disabled={managingMatch.status === 'scheduled' || managingMatch.status === 'finished' || !selectedAwayScorer}
              />
              <select
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={selectedAwayScorer}
                onChange={e => setSelectedAwayScorer(Number(e.target.value))}
                disabled={managingMatch.status === 'scheduled' || managingMatch.status === 'finished'}
                required
              >
                <option value="">Seleziona maglia avversaria</option>
                {managingMatch.opponentLineup.map(num => (
                  <option key={num} value={num}>#{num}</option>
                ))}
              </select>
            </div>
          </div>

          {managingMatch.events.filter(e => e.type === 'goal').length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cronologia Goal</h3>
              <div className="space-y-3">
                {managingMatch.events
                  .filter(e => e.type === 'goal')
                  .sort((a, b) => {
                    if (b.minute !== a.minute) return b.minute - a.minute;
                    return (b.second || 0) - (a.second || 0);
                  })
                  .map(goal => (
                    <div
                      key={goal.id}
                      className={`flex items-center gap-4 p-3 rounded-lg group relative ${goal.description?.includes('avversario') ? 'bg-red-50' : 'bg-green-50'}`}
                    >
                      <span className={`text-sm font-bold ${goal.description?.includes('avversario') ? 'text-red-600' : 'text-green-600'}`}>{goal.minute}{goal.second !== undefined ? `:${goal.second.toString().padStart(2, '0')}` : ''}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800">{goal.description}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveEvent(goal.id)}
                        className="ml-auto p-1 text-red-500 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2"
                        title="Rimuovi goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Cronologia Ammonizioni */}
          {managingMatch.events.filter(e => e.type === 'yellow-card' || e.type === 'red-card' || e.type === 'second-yellow-card' || e.type === 'blue-card' || e.type === 'expulsion' || e.type === 'warning').length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cronologia Ammonizioni</h3>
              <div className="space-y-3">
                {managingMatch.events
                  .filter(e => ['yellow-card','red-card','second-yellow-card','blue-card','expulsion','warning'].includes(e.type))
                  .sort((a, b) => {
                    if (b.minute !== a.minute) return b.minute - a.minute;
                    return (b.second || 0) - (a.second || 0);
                  })
                  .map(ev => (
                    <div key={ev.id} className={`flex items-center gap-4 p-3 rounded-lg group relative ${ev.type === 'yellow-card' ? 'bg-yellow-50' : ev.type === 'red-card' ? 'bg-red-50' : ev.type === 'second-yellow-card' ? 'bg-orange-50' : ev.type === 'blue-card' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <span className={`text-sm font-bold ${ev.type === 'yellow-card' ? 'text-yellow-600' : ev.type === 'red-card' ? 'text-red-600' : ev.type === 'second-yellow-card' ? 'text-orange-600' : ev.type === 'blue-card' ? 'text-blue-600' : 'text-gray-600'}`}>{ev.minute}{ev.second !== undefined ? `:${ev.second.toString().padStart(2, '0')}` : ''}</span>
                      <div className="flex items-center gap-2">
                        {ev.type === 'yellow-card' && <Square className="w-5 h-5 text-yellow-500" />}
                        {ev.type === 'red-card' && <Square className="w-5 h-5 text-red-600" />}
                        {ev.type === 'second-yellow-card' && <Square className="w-5 h-5 text-orange-500" />}
                        {ev.type === 'blue-card' && <Square className="w-5 h-5 text-blue-600" />}
                        {ev.type === 'expulsion' && <Ban className="w-5 h-5 text-gray-700" />}
                        {ev.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                        <span className="text-gray-800">{ev.description}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveEvent(ev.id)}
                        className="ml-auto p-1 text-red-500 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2"
                        title="Rimuovi ammonizione"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Cronologia Sostituzioni */}
          {managingMatch.substitutions.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sostituzioni</h3>
              <div className="space-y-3">
                {managingMatch.substitutions
                  .slice()
                  .sort((a, b) => {
                    if (b.minute !== a.minute) return b.minute - a.minute;
                    return (b.second || 0) - (a.second || 0);
                  })
                  .map(sub => {
                    const playerOut = players.find(p => p.id === sub.playerOut);
                    const playerIn = players.find(p => p.id === sub.playerIn);
                    return (
                      <div key={sub.id} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg group relative">
                        <span className="text-sm font-bold text-blue-600">{sub.minute}{sub.second !== undefined ? `:${sub.second.toString().padStart(2, '0')}` : ''}</span>                        <div className="flex items-center gap-2">
                          <span className="text-red-600">
                            {playerOut?.firstName} {playerOut?.lastName}
                          </span>
                          <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                          <span className="text-green-600">
                            {playerIn?.firstName} {playerIn?.lastName}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveSubstitution(sub.id)}
                          className="ml-auto p-1 text-red-500 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2"
                          title="Rimuovi sostituzione"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <SubstitutionModal
            isOpen={showSubstitutionModal}
            onClose={() => setShowSubstitutionModal(false)}
            playersOnField={getPlayersOnField()}
            playersOnBench={getPlayersOnBench()}
            onSubstitute={handleSubstitution}
            currentMinute={Math.floor(timer.time / 60)}
          />

          <AmmonitionModal
            isOpen={showAmmonitionModal}
            onClose={() => setShowAmmonitionModal(false)}
            playersOnField={getPlayersOnField()}
            opponentLineup={managingMatch.opponentLineup}
            onAmmonition={handleAmmonition}
            currentMinute={Math.floor(timer.time / 60)}
          />
        </div>
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
          description: `Goal di ${players.find(p => p.id === scorerId)?.lastName || ''} (nostro)`
        }
      ]
    };
    setManagingMatch(updatedMatch);
    database.updateMatch(managingMatch.id, updatedMatch);
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
    loadData();
  };

  const handleHomeGoalRemove = () => {
    if (!managingMatch) return;
    
    // Controlla il punteggio corretto basato su dove giochiamo
    const ourCurrentScore = managingMatch.homeAway === 'home' ? managingMatch.homeScore : managingMatch.awayScore;
    if (ourCurrentScore <= 0) return;
    
    const events = [...managingMatch.events];
    const lastGoalIndex = findLastIndex(events, e => e.type === 'goal' && e.description?.includes('(nostro)'));
    if (lastGoalIndex !== -1) {
      events.splice(lastGoalIndex, 1);
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
    const lastGoalIndex = findLastIndex(events, e => e.type === 'goal' && e.description?.includes('avversario'));
    if (lastGoalIndex !== -1) {
      events.splice(lastGoalIndex, 1);
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
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 bg-black opacity-50 z-30" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">           {/* Sidebar Navigation */}
          <aside className={`lg:w-64 ${mobileMenuOpen ? 'block fixed top-0 left-0 h-full z-40 bg-white p-4' : 'hidden lg:block'}`}>
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
          <main className={`flex-1 ${isMobile && mobileMenuOpen ? 'ml-64' : ''}`}>  {/* apply margin-left only on mobile when sidebar is open */}
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
                      currentView === 'manage' ? 'Gestione partita in corso' :
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
                  <button
                    onClick={() => setCurrentView('form')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi {activeTab === 'players' ? 'Giocatore' : activeTab === 'trainings' ? 'Allenamento' : 'Partita'}
                  </button>
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