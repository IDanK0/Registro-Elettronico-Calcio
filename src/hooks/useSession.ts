import { useLocalStorage } from './useLocalStorage';
import { UserWithGroup } from '../types';

const SESSION_KEY = 'registro_elettronico_session';

export interface SessionData {
  user: UserWithGroup;
  timestamp: number;
  expiresAt: number;
}

export function useSession() {
  const [sessionData, setSessionData] = useLocalStorage<SessionData | null>(SESSION_KEY, null);

  const saveSession = (user: UserWithGroup, rememberMe: boolean = true) => {
    const now = Date.now();
    // La sessione dura 30 giorni se "ricordami" è attivo, altrimenti 1 giorno
    const expirationTime = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    const session: SessionData = {
      user,
      timestamp: now,
      expiresAt: now + expirationTime
    };
    
    setSessionData(session);
  };

  const loadSession = (): UserWithGroup | null => {
    if (!sessionData) {
      return null;
    }

    const now = Date.now();
    
    // Controlla se la sessione è scaduta
    if (now > sessionData.expiresAt) {
      clearSession();
      return null;
    }

    // Controlla se l'utente è ancora valido (non scaduto)
    const userExpiration = new Date(sessionData.user.expirationDate);
    if (userExpiration < new Date()) {
      clearSession();
      return null;
    }

    return sessionData.user;
  };

  const clearSession = () => {
    setSessionData(null);
  };

  const isSessionValid = (): boolean => {
    if (!sessionData) return false;
    
    const now = Date.now();
    return now <= sessionData.expiresAt;
  };

  return {
    saveSession,
    loadSession,
    clearSession,
    isSessionValid,
    sessionData
  };
}
