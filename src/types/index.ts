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

export interface Match {
  id: string;
  date: string;
  opponent: string;
  homeAway: 'home' | 'away';
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
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow-card' | 'red-card' | 'second-yellow-card' | 'blue-card' | 'expulsion' | 'warning' | 'substitution';
  minute: number;
  second?: number;
  playerId: string;
  description?: string;
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