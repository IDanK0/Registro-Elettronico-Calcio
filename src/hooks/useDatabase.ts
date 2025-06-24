import { useState, useEffect } from 'react';
import initSqlJs, { Database } from 'sql.js';
import { Player, Training, Match } from '../types';

export function useDatabase() {
  const [db, setDb] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setIsLoading(true);
      
      // Inizializza SQL.js
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      // Prova a caricare il database esistente dal localStorage
      const savedDb = localStorage.getItem('football_registry_db');
      let database: Database;

      if (savedDb) {
        // Carica database esistente
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        database = new SQL.Database(uint8Array);
      } else {
        // Crea nuovo database
        database = new SQL.Database();
        await createTables(database);
      }

      // Migrazione: aggiungi la colonna 'second' a match_events se non esiste
      try {
        database.run("ALTER TABLE match_events ADD COLUMN second INTEGER");
      } catch (e) {
        // La colonna esiste già, ignora l'errore
      }

      // Migrazione: aggiungi la colonna 'second' a substitutions se non esiste
      try {
        database.run("ALTER TABLE substitutions ADD COLUMN second INTEGER");
      } catch (e) {
        // La colonna esiste già, ignora l'errore
      }

      setDb(database);
      setError(null);
    } catch (err) {
      console.error('Errore inizializzazione database:', err);
      setError('Errore durante l\'inizializzazione del database');
    } finally {
      setIsLoading(false);
    }
  };

  const createTables = async (database: Database) => {
    // Tabella giocatori
    database.run(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        birthDate TEXT NOT NULL,
        position TEXT NOT NULL,
        jerseyNumber INTEGER NOT NULL,
        licenseNumber TEXT NOT NULL,
        isActive BOOLEAN NOT NULL DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabella allenamenti
    database.run(`
      CREATE TABLE IF NOT EXISTS trainings (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabella presenze allenamenti
    database.run(`
      CREATE TABLE IF NOT EXISTS training_attendances (
        id TEXT PRIMARY KEY,
        trainingId TEXT NOT NULL,
        playerId TEXT NOT NULL,
        isPresent BOOLEAN NOT NULL,
        FOREIGN KEY (trainingId) REFERENCES trainings(id) ON DELETE CASCADE,
        FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
      )
    `);

    // Tabella partite
    database.run(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        opponent TEXT NOT NULL,
        homeAway TEXT NOT NULL CHECK (homeAway IN ('home', 'away')),
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'first-half', 'half-time', 'second-half', 'finished')),
        startTime INTEGER,
        firstHalfDuration INTEGER DEFAULT 0,
        secondHalfDuration INTEGER DEFAULT 0,
        homeScore INTEGER DEFAULT 0,
        awayScore INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabella formazioni
    database.run(`
      CREATE TABLE IF NOT EXISTS match_lineups (
        id TEXT PRIMARY KEY,
        matchId TEXT NOT NULL,
        playerId TEXT NOT NULL,
        FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
      )
    `);

    // Tabella sostituzioni
    database.run(`
      CREATE TABLE IF NOT EXISTS substitutions (
        id TEXT PRIMARY KEY,
        matchId TEXT NOT NULL,
        minute INTEGER NOT NULL,
        second INTEGER,
        playerOut TEXT NOT NULL,
        playerIn TEXT NOT NULL,
        FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (playerOut) REFERENCES players(id) ON DELETE CASCADE,
        FOREIGN KEY (playerIn) REFERENCES players(id) ON DELETE CASCADE
      )
    `);

    // Tabella eventi partita
    database.run(`
      CREATE TABLE IF NOT EXISTS match_events (
        id TEXT PRIMARY KEY,
        matchId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('goal', 'yellow-card', 'red-card', 'substitution')),
        minute INTEGER NOT NULL,
        second INTEGER,
        playerId TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
      )
    `);

    // Tabella formazioni avversarie
    database.run(`
      CREATE TABLE IF NOT EXISTS match_opponent_lineup (
        id TEXT PRIMARY KEY,
        matchId TEXT NOT NULL,
        jerseyNumber INTEGER NOT NULL,
        FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
      )
    `);
  };

  const saveDatabase = () => {
    if (db) {
      const data = db.export();
      const buffer = Array.from(data);
      localStorage.setItem('football_registry_db', JSON.stringify(buffer));
    }
  };

  // Funzioni per i giocatori
  const getPlayers = (): Player[] => {
    if (!db) return [];
    
    const stmt = db.prepare('SELECT * FROM players ORDER BY jerseyNumber');
    const players: Player[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      players.push({
        id: row.id as string,
        firstName: row.firstName as string,
        lastName: row.lastName as string,
        birthDate: row.birthDate as string,
        position: row.position as string,
        jerseyNumber: row.jerseyNumber as number,
        licenseNumber: row.licenseNumber as string,
        isActive: Boolean(row.isActive)
      });
    }
    
    stmt.free();
    return players;
  };

  const addPlayer = (player: Omit<Player, 'id'>) => {
    if (!db) return;
    
    const id = Date.now().toString();
    db.run(
      'INSERT INTO players (id, firstName, lastName, birthDate, position, jerseyNumber, licenseNumber, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, player.firstName, player.lastName, player.birthDate, player.position, player.jerseyNumber, player.licenseNumber, player.isActive ? 1 : 0]
    );
    saveDatabase();
    return id;
  };

  const updatePlayer = (id: string, player: Omit<Player, 'id'>) => {
    if (!db) return;
    
    db.run(
      'UPDATE players SET firstName = ?, lastName = ?, birthDate = ?, position = ?, jerseyNumber = ?, licenseNumber = ?, isActive = ? WHERE id = ?',
      [player.firstName, player.lastName, player.birthDate, player.position, player.jerseyNumber, player.licenseNumber, player.isActive ? 1 : 0, id]
    );
    saveDatabase();
  };

  const deletePlayer = (id: string) => {
    if (!db) return;
    
    db.run('DELETE FROM players WHERE id = ?', [id]);
    saveDatabase();
  };

  // Funzioni per gli allenamenti
  const getTrainings = (): Training[] => {
    if (!db) return [];
    
    const stmt = db.prepare('SELECT * FROM trainings ORDER BY date DESC, time DESC');
    const trainings: Training[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const trainingId = row.id as string;
      
      // Ottieni le presenze per questo allenamento
      const attendanceStmt = db.prepare('SELECT playerId, isPresent FROM training_attendances WHERE trainingId = ?');
      attendanceStmt.bind([trainingId]);
      
      const attendances: Record<string, boolean> = {};
      while (attendanceStmt.step()) {
        const attendanceRow = attendanceStmt.getAsObject();
        attendances[attendanceRow.playerId as string] = Boolean(attendanceRow.isPresent);
      }
      attendanceStmt.free();
      
      trainings.push({
        id: trainingId,
        date: row.date as string,
        time: row.time as string,
        attendances
      });
    }
    
    stmt.free();
    return trainings;
  };

  const addTraining = (training: Omit<Training, 'id'>) => {
    if (!db) return;
    
    const id = Date.now().toString();
    
    // Inserisci allenamento
    db.run('INSERT INTO trainings (id, date, time) VALUES (?, ?, ?)', [id, training.date, training.time]);
    
    // Inserisci presenze
    Object.entries(training.attendances).forEach(([playerId, isPresent]) => {
      const attendanceId = `${id}_${playerId}`;
      db.run(
        'INSERT INTO training_attendances (id, trainingId, playerId, isPresent) VALUES (?, ?, ?, ?)',
        [attendanceId, id, playerId, isPresent ? 1 : 0]
      );
    });
    
    saveDatabase();
    return id;
  };

  const updateTraining = (id: string, training: Omit<Training, 'id'>) => {
    if (!db) return;
    
    // Aggiorna allenamento
    db.run('UPDATE trainings SET date = ?, time = ? WHERE id = ?', [training.date, training.time, id]);
    
    // Elimina vecchie presenze
    db.run('DELETE FROM training_attendances WHERE trainingId = ?', [id]);
    
    // Inserisci nuove presenze
    Object.entries(training.attendances).forEach(([playerId, isPresent]) => {
      const attendanceId = `${id}_${playerId}`;
      db.run(
        'INSERT INTO training_attendances (id, trainingId, playerId, isPresent) VALUES (?, ?, ?, ?)',
        [attendanceId, id, playerId, isPresent ? 1 : 0]
      );
    });
    
    saveDatabase();
  };

  const deleteTraining = (id: string) => {
    if (!db) return;
    
    db.run('DELETE FROM trainings WHERE id = ?', [id]);
    saveDatabase();
  };

  // Funzioni per le partite
  const getMatches = (): Match[] => {
    if (!db) return [];
    
    const stmt = db.prepare('SELECT * FROM matches ORDER BY date DESC');
    const matches: Match[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const matchId = row.id as string;
      
      // Ottieni formazione
      const lineupStmt = db.prepare('SELECT playerId FROM match_lineups WHERE matchId = ?');
      lineupStmt.bind([matchId]);
      const lineup: string[] = [];
      while (lineupStmt.step()) {
        const lineupRow = lineupStmt.getAsObject();
        lineup.push(lineupRow.playerId as string);
      }
      lineupStmt.free();
      
      // Ottieni sostituzioni
      const subsStmt = db.prepare('SELECT * FROM substitutions WHERE matchId = ?');
      subsStmt.bind([matchId]);
      const substitutions: any[] = [];
      while (subsStmt.step()) {
        const subRow = subsStmt.getAsObject();
        substitutions.push({
          id: subRow.id,
          minute: subRow.minute,
          second: subRow.second, // Carica anche il campo second
          playerOut: subRow.playerOut,
          playerIn: subRow.playerIn
        });
      }
      subsStmt.free();
      
      // Ottieni eventi
      const eventsStmt = db.prepare('SELECT * FROM match_events WHERE matchId = ?');
      eventsStmt.bind([matchId]);
      const events: any[] = [];
      while (eventsStmt.step()) {
        const eventRow = eventsStmt.getAsObject();
        events.push({
          id: eventRow.id,
          type: eventRow.type,
          minute: eventRow.minute,
          second: eventRow.second, // Load the second field from DB
          playerId: eventRow.playerId,
          description: eventRow.description
        });
      }
      eventsStmt.free();
      
      // Ottieni numeri maglia avversari
      const opponentLineupStmt = db.prepare('SELECT jerseyNumber FROM match_opponent_lineup WHERE matchId = ?');
      opponentLineupStmt.bind([matchId]);
      const opponentLineup: number[] = [];
      while (opponentLineupStmt.step()) {
        const row = opponentLineupStmt.getAsObject();
        opponentLineup.push(row.jerseyNumber as number);
      }
      opponentLineupStmt.free();
      
      matches.push({
        id: row.id as string,
        date: row.date as string,
        opponent: row.opponent as string,
        homeAway: row.homeAway as 'home' | 'away',
        status: row.status as Match['status'],
        startTime: row.startTime as number | undefined,
        firstHalfDuration: row.firstHalfDuration as number,
        secondHalfDuration: row.secondHalfDuration as number,
        homeScore: row.homeScore as number,
        awayScore: row.awayScore as number,
        lineup,
        opponentLineup,
        substitutions,
        events
      });
    }
    
    stmt.free();
    return matches;
  };

  const addMatch = (match: Omit<Match, 'id'>) => {
    if (!db) return;
    
    const id = Date.now().toString();
    
    // Inserisci partita
    db.run(
      'INSERT INTO matches (id, date, opponent, homeAway, status, startTime, firstHalfDuration, secondHalfDuration, homeScore, awayScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, match.date, match.opponent, match.homeAway, match.status, match.startTime || null, match.firstHalfDuration, match.secondHalfDuration, match.homeScore, match.awayScore]
    );
    
    // Inserisci formazione
    match.lineup.forEach(playerId => {
      const lineupId = `${id}_${playerId}`;
      db.run('INSERT INTO match_lineups (id, matchId, playerId) VALUES (?, ?, ?)', [lineupId, id, playerId]);
    });
    
    // Inserisci numeri maglia avversari
    if (Array.isArray(match.opponentLineup)) {
      match.opponentLineup.forEach(jerseyNumber => {
        db.run('INSERT INTO match_opponent_lineup (matchId, jerseyNumber) VALUES (?, ?)', [id, jerseyNumber]);
      });
    }
    
    // Inserisci eventi goal
    if (Array.isArray(match.events)) {
      match.events.forEach(event => {
        db.run(
          'INSERT INTO match_events (id, matchId, type, minute, second, playerId, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [event.id, id, event.type, event.minute, event.second ?? null, event.playerId, event.description || null]
        );
      });
    }
    
    saveDatabase();
    return id;
  };

  const updateMatch = (id: string, match: Omit<Match, 'id'>) => {
    if (!db) return;
    
    // Aggiorna partita
    db.run(
      'UPDATE matches SET date = ?, opponent = ?, homeAway = ?, status = ?, startTime = ?, firstHalfDuration = ?, secondHalfDuration = ?, homeScore = ?, awayScore = ? WHERE id = ?',
      [match.date, match.opponent, match.homeAway, match.status, match.startTime || null, match.firstHalfDuration, match.secondHalfDuration, match.homeScore, match.awayScore, id]
    );
    
    // Aggiorna formazione
    db.run('DELETE FROM match_lineups WHERE matchId = ?', [id]);
    match.lineup.forEach(playerId => {
      const lineupId = `${id}_${playerId}`;
      db.run('INSERT INTO match_lineups (id, matchId, playerId) VALUES (?, ?, ?)', [lineupId, id, playerId]);
    });
    
    // Aggiorna sostituzioni
    db.run('DELETE FROM substitutions WHERE matchId = ?', [id]);
    match.substitutions.forEach(sub => {
      db.run(
        'INSERT INTO substitutions (id, matchId, minute, second, playerOut, playerIn) VALUES (?, ?, ?, ?, ?, ?)',
        [sub.id, id, sub.minute, sub.second ?? null, sub.playerOut, sub.playerIn]
      );
    });
    
    // Aggiorna eventi goal
    db.run('DELETE FROM match_events WHERE matchId = ?', [id]);
    match.events.forEach(event => {
      db.run(
        'INSERT INTO match_events (id, matchId, type, minute, second, playerId, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [event.id, id, event.type, event.minute, event.second ?? null, event.playerId, event.description || null]
      );
    });
    
    // Aggiorna numeri maglia avversari
    db.run('DELETE FROM match_opponent_lineup WHERE matchId = ?', [id]);
    if (Array.isArray(match.opponentLineup)) {
      match.opponentLineup.forEach(jerseyNumber => {
        db.run('INSERT INTO match_opponent_lineup (matchId, jerseyNumber) VALUES (?, ?)', [id, jerseyNumber]);
      });
    }
    
    saveDatabase();
  };

  const deleteMatch = (id: string) => {
    if (!db) return;
    
    db.run('DELETE FROM matches WHERE id = ?', [id]);
    saveDatabase();
  };

  return {
    isLoading,
    error,
    // Players
    getPlayers,
    addPlayer,
    updatePlayer,
    deletePlayer,
    // Trainings
    getTrainings,
    addTraining,
    updateTraining,
    deleteTraining,
    // Matches
    getMatches,
    addMatch,
    updateMatch,
    deleteMatch,
    // Utility
    saveDatabase
  };
}