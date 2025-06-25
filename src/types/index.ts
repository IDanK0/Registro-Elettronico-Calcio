export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  position: string;
  jerseyNumber: number;
  licenseNumber: string;
  isActive: boolean;
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
  lineup: string[]; // player IDs
  opponentLineup: number[]; // numeri maglia avversari
  substitutions: Substitution[];
  events: MatchEvent[];
  // Timestamp (ms) when timer was last persisted (to compute elapsed time when returning)
  lastTimestamp?: number;
  isRunning?: boolean;
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