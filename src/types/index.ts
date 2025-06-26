export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  licenseNumber: string;
  isActive: boolean;
  // Contact information
  phone?: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  // Document attachments
  documents?: PlayerDocument[];
}

export interface PlayerDocument {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadDate: string;
  data: string; // Base64 encoded file data
}

export interface Training {
  id: string;
  date: string;
  time: string;
  attendances: Record<string, boolean>; // playerId -> isPresent
}

export interface MatchPeriod {
  type: 'regular' | 'extra' | 'interval';
  label: string;
  duration: number;
}

export interface Match {
  id: string;
  date: string;
  time: string; // Added time field
  opponent: string;
  homeAway: 'home' | 'away';
  location?: string; // Added location field (for away matches)
  field?: string; // Added field field (for away matches)
  coaches: string[]; // Array of user IDs for coaches
  managers: string[]; // Array of user IDs for managers
  status: 'scheduled' | 'first-half' | 'half-time' | 'second-half' | 'finished';
  startTime?: number;
  firstHalfDuration: number;
  secondHalfDuration: number;
  homeScore: number;
  awayScore: number;
  lineup: MatchPlayer[]; // Updated to include position and jersey number per match
  opponentLineup: number[]; // numeri maglia avversari
  substitutions: Substitution[];
  events: MatchEvent[];
  // Timestamp (ms) when timer was last persisted (to compute elapsed time when returning)
  lastTimestamp?: number;
  isRunning?: boolean;
  // Nuova struttura per periodi dinamici
  periods: MatchPeriod[];
  currentPeriodIndex: number;
  // Mappa per tenere traccia dei numeri di maglia assegnati ai giocatori
  playerJerseyNumbers?: Record<string, number>; // playerId -> jerseyNumber
  // Statistiche dettagliate della partita
  possessionHome?: number;
  possessionAway?: number;
  totalShotsHome?: number;
  totalShotsAway?: number;
  shotsOnTargetHome?: number;
  shotsOnTargetAway?: number;
  foulsCommittedHome?: number;
  foulsCommittedAway?: number;
  cornersHome?: number;
  cornersAway?: number;
  offsideHome?: number;
  offsideAway?: number;
}

export interface MatchPlayer {
  playerId: string;
  position: string;
  jerseyNumber: number;
}

export interface Substitution {
  id: string;
  minute: number;
  second?: number;
  playerOut: string;
  playerIn: string;
  playerOutJerseyNumber?: number; // Numero di maglia del giocatore che esce
  playerInJerseyNumber?: number; // Numero di maglia del giocatore che entra
  periodIndex?: number; // Indice del periodo in cui è avvenuta la sostituzione
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow-card' | 'red-card' | 'second-yellow-card' | 'blue-card' | 'expulsion' | 'warning' | 'substitution' | 'foul' | 'corner' | 'offside' | 'free-kick' | 'penalty' | 'throw-in' | 'injury';
  minute: number;
  second?: number;
  playerId: string;
  description?: string;
  periodIndex?: number; // Indice del periodo in cui è avvenuto l'evento
  // Campi aggiuntivi per eventi specifici
  reason?: string; // Per falli, infortuni, ecc.
  teamType?: 'own' | 'opponent'; // Per distinguere tra eventi della propria squadra e avversari
}

export interface PlayerStats {
  playerId: string;
  matchesPlayed: number;
  goals: number;
  yellowCards: number;
  redCards: number;
  trainingAttendance: number;
  totalTrainings: number;
}

// User Management Types
export interface Permission {
  teamManagement: boolean;
  matchManagement: boolean;
  resultsView: boolean;
  statisticsView: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  permissions: Permission;
  createdAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive';
  expirationDate: string;
  groupId: string;
  username: string;
  password: string; // In production, this should be hashed
  email: string;
  phone: string;
  matricola: string;
  createdAt: string;
}

export interface UserWithGroup extends User {
  group: Group;
}