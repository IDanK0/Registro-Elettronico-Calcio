import { useState, useEffect } from 'react';
import React from 'react';
import { useTimer } from './hooks/useTimer';
import { useSession } from './hooks/useSession';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Player, Training, Match, MatchPlayer, User, Group, UserWithGroup, MatchPeriod, MatchEvent } from './types';
import { api } from './api';
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

  // Stato di navigazione persistente
  const [activeTab, setActiveTabState] = useLocalStorage<Tab>('activeTab', 'players');
  const [currentView, setCurrentViewState] = useLocalStorage<View>('currentView', 'list');
  const [managingMatchId, setManagingMatchIdState] = useLocalStorage<string | null>('managingMatchId', null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [managingMatch, setManagingMatch] = useState<Match | null>(null);
  const [initialLineup, setInitialLineup] = useState<MatchPlayer[] | null>(null);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [showAmmonitionModal, setShowAmmonitionModal] = useState(false);
  const [showOtherEventsModal, setShowOtherEventsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showReportMatch, setShowReportMatch] = useState<null | Match>(null);

  // Funzioni wrapper per aggiornare lo stato e resettare modali quando necessario
  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    // Reset della vista a 'list' quando si cambia tab (tranne per matches che può rimanere in manage)
    if (tab !== 'matches' || currentView !== 'manage') {
      setCurrentView('list');
    }
    setEditingItem(null);
    setMobileMenuOpen(false);
  };

  const setCurrentView = (view: View) => {
    setCurrentViewState(view);
    if (view === 'list') {
      setEditingItem(null);
      setManagingMatchId(null);
    }
  };

  const setManagingMatchId = (matchId: string | null) => {
    setManagingMatchIdState(matchId);
  };

  // Funzione per resettare completamente la gestione partita
  const resetManagingMatch = () => {
    setManagingMatch(null);
    setManagingMatchId(null);
    setInitialLineup(null);
  };

  // Stato per selezione marcatore
  const [selectedHomeScorer, setSelectedHomeScorer] = useState<string>('');
  const [selectedAwayScorer, setSelectedAwayScorer] = useState<number | ''>('');

  // Stato per errori di gestione partita
  const [manageError, setManageError] = useState<string | null>(null);
  
  // Swipe functionality state
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);
  
  // Minimum swipe distance to trigger sidebar open
  const minSwipeDistance = 50;
  
  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  // Handle touch end - detect swipe
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance; // Swipe from right to left
    const isRightSwipe = distance < -minSwipeDistance; // Swipe from left to right
    
    if (isMobile) {
      // Open sidebar on left swipe (swipe from right to left) when closed
      if (isLeftSwipe && !mobileMenuOpen) {
        setMobileMenuOpen(true);
      }
      // Close sidebar on right swipe (swipe from left to right) when open
      else if (isRightSwipe && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
  };
  
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
  const isMobile = useIsMobile(1280); // Consider screens up to 1280px (xl breakpoint) as mobile to match sidebar behavior
  
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
      api.updateMatch(managingMatch.id, updated).catch(console.error);
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
        api.updateMatch(managingMatch.id, updated).catch(console.error);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [managingMatch, timer.time, timer.isRunning, currentPeriodIndex]);
  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && mobileMenuOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to prevent scrolling but preserve touch events
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scrolling
      return () => {
        // Restore original styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobile, mobileMenuOpen]);

  // Load session on app start
  useEffect(() => {
    if (!currentUser) {
      const savedUser = session.loadSession();
      if (savedUser) {
        // Verifica che l'utente esista ancora nel database
        (async () => {
          try {
            const users = await api.getUsers();
            const existingUser = (users as UserWithGroup[]).find(u => u.id === savedUser.id);
          if (existingUser && existingUser.status === 'active') {
          setCurrentUser(savedUser);
          loadData();
          } else {
            // L'utente non esiste più o è stato disattivato, rimuovi la sessione
            session.clearSession();
          }
          } catch (err) {
            session.clearSession();
          }
        })();
      }
    }
  }, [currentUser]);
  
  // Funzione per ripristinare una partita in gestione al ricaricamento della pagina
  const restoreManagingMatch = (match: Match) => {
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
    
    // Inizializza i periodi se non esistono
    if (!match.periods || match.periods.length === 0) {
      const updatedMatch = { 
        ...matchWithJerseyNumbers, 
        periods: defaultPeriods,
        currentPeriodIndex: 0 
      };
      setManagingMatch(updatedMatch);
      api.updateMatch(match.id, updatedMatch).catch(console.error);
      setCurrentPeriodIndex(0);
    } else {
      setCurrentPeriodIndex(match.currentPeriodIndex || 0);
      // Aggiorna il database con la mappa dei numeri di maglia se necessario
      if (!match.playerJerseyNumbers) {
        api.updateMatch(match.id, matchWithJerseyNumbers).catch(console.error);
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
    }
    };

// ...

const loadData = async () => {
    try {
      const [playersData, trainingsData, matchesDataRaw, usersData, groupsData] = await Promise.all([
        api.getPlayers(),
        api.getTrainings(),
        api.getMatches(),
        api.getUsers(),
        api.getGroups(),
      ]) as [Player[], Training[], any[], UserWithGroup[], Group[]];

      // Convert matches data to maintain compatibility with existing code
      const matchesData = matchesDataRaw.map((match: any) => ({
        ...match,
        lineup: match.lineups?.map((l: any) => ({
          playerId: l.playerId,
          position: l.position,
          jerseyNumber: l.jerseyNumber
        })) || []
      }));

      setPlayers(playersData);
      setTrainings(trainingsData);
      setMatches(matchesData);
      setUsers(usersData);
      setGroups(groupsData);
    } catch (err) {
      console.error('Errore caricamento dati:', err instanceof Error ? err.message : err);
    }
  };

  // Authentication functions
  const handleLogin = async (username: string, password: string, rememberMe: boolean = true) => {
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      const response: any = await api.login(username, password);
      if (response.user) {
        const userWithGroup = {
          ...response.user,
          permissions: ['all'] // Add default permissions
        } as UserWithGroup;
        setCurrentUser(userWithGroup);
        session.saveSession(userWithGroup, rememberMe);
      } else {
        setLoginError('Risposta del server non valida');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error instanceof Error ? error.message : 'Errore durante il login');
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
  const handleUserSubmit = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      if (editingItem) {
        await api.updateUser(editingItem.id, userData);
      } else {
        await api.createUser(userData);
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

  const handleUserDelete = async (userId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo utente?')) {
      try {
        await api.deleteUser(userId);
        loadData();
      } catch (error) {
        alert('Errore durante l\'eliminazione dell\'utente: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
      }
    }
  };

  // Group management functions
  const handleGroupSubmit = async (groupData: Omit<Group, 'id' | 'createdAt'>) => {
    try {
      if (editingItem) {
        await api.updateGroup(editingItem.id, groupData);
      } else {
        await api.createGroup(groupData);
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

  const handleGroupDelete = async (groupId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo gruppo?')) {
      try {
        await api.deleteGroup(groupId);
        loadData();
      } catch (error) {
        alert('Errore durante l\'eliminazione del gruppo: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
      }
    }
  };

  // Player management functions
  const handlePlayerSubmit = async (playerData: Omit<Player, 'id'>) => {
    try {
      if (editingItem) {
        await api.updatePlayer(editingItem.id, playerData);
      } else {
        await api.createPlayer(playerData);
      }
      loadData();
      setCurrentView('list');
      setEditingItem(null);
    } catch (error) {
      alert('Errore durante il salvataggio del giocatore: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

  const handlePlayerEdit = (player: Player) => {
    setEditingItem(player);
    setCurrentView('form');
  };

  const handlePlayerDelete = async (playerId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo giocatore?')) {
      try {
        await api.deletePlayer(playerId);
        loadData();
      } catch (error) {
        alert('Errore durante l\'eliminazione del giocatore: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
      }
    }
  };

  const handleImportPlayers = async (playersData: Omit<Player, 'id'>[]) => {
    try {
      for (const playerData of playersData) {
        await api.createPlayer(playerData);
      }
      loadData();
    } catch (error) {
      throw new Error('Errore durante l\'importazione dei giocatori: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

  // Navigation functions
  const handleBackToList = () => {
    setCurrentView('list');
    setEditingItem(null);
  };

  // Utility functions
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const getPlayerJerseyNumber = (playerId: string): number | null => {
    if (!managingMatch) return null;
    return managingMatch.playerJerseyNumbers?.[playerId] || null;
  };

  const getPlayersOnField = () => {
    if (!managingMatch) return [];
    return managingMatch.lineup.filter(mp => {
      // Check if player is currently on field (not substituted out)
      const hasBeenSubstituted = managingMatch.substitutions.some(sub => sub.playerOut === mp.playerId);
      return !hasBeenSubstituted;
    }).map(mp => 
      players.find(p => p.id === mp.playerId)
    ).filter(Boolean) as Player[];
  };

  const getPlayersOnBench = () => {
    if (!managingMatch) return [];
    // Players in lineup who have been substituted out + players not in starting lineup
    const startingPlayerIds = managingMatch.lineup.map(mp => mp.playerId);
    const playersSubstitutedOut = managingMatch.substitutions.map(sub => sub.playerOut);
    const playersSubstitutedIn = managingMatch.substitutions.map(sub => sub.playerIn);
    
    // Players on bench: those not in starting lineup + those substituted out - those substituted in
    return players.filter(p => 
      (!startingPlayerIds.includes(p.id) || playersSubstitutedOut.includes(p.id)) &&
      !playersSubstitutedIn.includes(p.id)
    );
  };

  // Training management functions
  const handleTrainingSubmit = async (trainingData: Omit<Training, 'id'>) => {
    try {
      if (editingItem) {
        await api.updateTraining(editingItem.id, trainingData);
      } else {
        await api.createTraining(trainingData);
      }
      loadData();
      setCurrentView('list');
      setEditingItem(null);
    } catch (error) {
      alert('Errore durante il salvataggio del training: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

  const handleTrainingEdit = (training: Training) => {
    setEditingItem(training);
    setCurrentView('form');
  };

  const handleTrainingDelete = async (trainingId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo allenamento?')) {
      try {
        await api.deleteTraining(trainingId);
        loadData();
      } catch (error) {
        alert('Errore durante l\'eliminazione dell\'allenamento: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
      }
    }
  };

  // Match management functions
  const handleMatchSubmit = async (matchData: Omit<Match, 'id'>) => {
    try {
      if (editingItem) {
        await api.updateMatch(editingItem.id, matchData);
      } else {
        await api.createMatch(matchData);
      }
      loadData();
      setCurrentView('list');
      setEditingItem(null);
    } catch (error) {
      alert('Errore durante il salvataggio della partita: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

  const handleMatchEdit = (match: Match) => {
    setEditingItem(match);
    setCurrentView('form');
  };

  const handleMatchDelete = async (matchId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa partita?')) {
      try {
        await api.deleteMatch(matchId);
        loadData();
      } catch (error) {
        alert('Errore durante l\'eliminazione della partita: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
      }
    }
  };

  const handleMatchManage = (match: Match) => {
    setManagingMatch(match);
    setCurrentView('manage');
  };

  const handleSubstitution = (playerId: string, substituteId: string) => {
    // Implement substitution logic
    console.log('Substitution:', playerId, substituteId);
  };

  // Player stats and tabs configuration
  const playerStats = players; // Simplified for now

  const tabs = [
    { id: 'players', name: 'Giocatori', icon: Users, permission: 'view_players' },
    { id: 'trainings', name: 'Allenamenti', icon: Dumbbell, permission: 'view_trainings' },
    { id: 'matches', name: 'Partite', icon: Target, permission: 'view_matches' },
    { id: 'stats', name: 'Statistiche', icon: BarChart3, permission: 'view_stats' },
    { id: 'users', name: 'Utenti', icon: Shield, permission: 'manage_users' },
    { id: 'groups', name: 'Gruppi', icon: UserCog, permission: 'manage_groups' },
  ];

  // Permission checking function
  const canAccessTab = (tabId: string) => {
    // For now, allow access to all tabs. TODO: implement proper permission checking
    // In future, check if currentUser has permission for the specific tabId
    return tabId !== null && currentUser !== null;
  };

  // Import functions
  const handleImportGroups = async (groupsData: Omit<Group, 'id'>[]) => {
    try {
      for (const groupData of groupsData) {
        await api.createGroup(groupData);
      }
      loadData();
    } catch (error) {
      throw new Error('Errore durante l\'importazione dei gruppi: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

  const handleImportUsers = async (usersData: Omit<User, 'id'>[]) => {
    try {
      for (const userData of usersData) {
        await api.createUser(userData);
      }
      loadData();
    } catch (error) {
      throw new Error('Errore durante l\'importazione degli utenti: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };
  
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
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
          description: `Goal di #${getPlayerJerseyNumber(scorerId) || '?'} ${players.find(p => p.id === scorerId)?.lastName || ''} (nostro)`,
          teamType: 'own' as const
        }
      ]
    };
    setManagingMatch(updatedMatch);
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
    
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
          description: `Goal avversario #${jerseyNumber}`,
          teamType: 'opponent' as const
        }
      ]
    };
    setManagingMatch(updatedMatch);
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
    
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
    
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
    
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
    api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
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
      api.updateMatch(managingMatch.id, updatedMatch).catch(console.error);
      loadData();
      setCurrentView('list');
      setEditingItem(null);
      resetManagingMatch();
      timer.reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8">
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
              className="xl:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-8">           {/* Sidebar Navigation */}
          <aside className={`xl:w-64 xl:block fixed xl:relative top-0 right-0 h-full xl:h-auto z-40 bg-white p-4 w-64 shadow-lg xl:shadow-none transition-transform duration-300 ease-in-out transform rounded-lg xl:rounded-l-lg ${
            mobileMenuOpen || !isMobile ? 'translate-x-0' : 'translate-x-full'
          }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
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
                        api.updateMatch(managingMatch.id, updated).catch(console.error);
                        loadData();
                      }
                      setActiveTab(tab.id as Tab);
                      setCurrentView('list');
                      setEditingItem(null);
                      resetManagingMatch();
                      setMobileMenuOpen(false);
                      timer.reset();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : ''}`} />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main 
            className="flex-1"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
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
