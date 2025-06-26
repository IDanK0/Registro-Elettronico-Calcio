import { useState, useEffect } from 'react';
import initSqlJs, { Database } from 'sql.js';
import { Player, Training, Match, User, Group, UserWithGroup } from '../types';

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

      // Migrazione: aggiorna il CHECK della colonna 'type' in match_events per supportare tutti i tipi
      try {
        database.run("CREATE TABLE IF NOT EXISTS match_events_tmp (id TEXT PRIMARY KEY, matchId TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('goal', 'yellow-card', 'red-card', 'second-yellow-card', 'blue-card', 'expulsion', 'warning', 'substitution')), minute INTEGER NOT NULL, second INTEGER, playerId TEXT NOT NULL, description TEXT, FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE, FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE)");
        database.run("INSERT INTO match_events_tmp SELECT * FROM match_events");
        database.run("DROP TABLE match_events");
        database.run("ALTER TABLE match_events_tmp RENAME TO match_events");
      } catch (e) {
        // Se fallisce, probabilmente la tabella è già aggiornata
      }      // Migrazione: aggiungi la colonna 'lastTimestamp' a matches se non esiste
      try {
        database.run("ALTER TABLE matches ADD COLUMN lastTimestamp INTEGER");
      } catch (e) {
        // ignore if exists
      }

      // Migrazione: aggiungi la colonna 'isRunning' a matches se non esiste
      try {
        database.run("ALTER TABLE matches ADD COLUMN isRunning BOOLEAN DEFAULT 0");
      } catch (e) {
        // ignore
      }

      // Migrazione: crea tabelle per gestione utenti se non esistono
      try {
        database.run(`
          CREATE TABLE IF NOT EXISTS groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            teamManagement BOOLEAN NOT NULL DEFAULT 0,
            matchManagement BOOLEAN NOT NULL DEFAULT 0,
            resultsView BOOLEAN NOT NULL DEFAULT 0,
            statisticsView BOOLEAN NOT NULL DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        database.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
            expirationDate TEXT NOT NULL,
            groupId TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            matricola TEXT NOT NULL UNIQUE,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE RESTRICT
          )
        `);

        // Inserisci gruppo amministratore di default se non esiste
        database.run(`
          INSERT OR IGNORE INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView)
          VALUES ('admin', 'Amministratori', 'Gruppo con tutti i permessi', 1, 1, 1, 1)
        `);

        // Inserisci utente admin di default se non esiste
        database.run(`
          INSERT OR IGNORE INTO users (id, firstName, lastName, status, expirationDate, groupId, username, password, email, phone, matricola)
          VALUES ('admin', 'Admin', 'System', 'active', '2030-12-31', 'admin', 'admin', 'admin123', 'admin@system.com', '000', 'ADMIN001')
        `);
      } catch (e) {
        console.log('User tables migration already applied or failed:', e);
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
        lastTimestamp INTEGER,
        isRunning BOOLEAN DEFAULT 0,
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
        type TEXT NOT NULL CHECK (type IN ('goal', 'yellow-card', 'red-card', 'second-yellow-card', 'blue-card', 'expulsion', 'warning', 'substitution')),
        minute INTEGER NOT NULL,
        second INTEGER,
        playerId TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
      )    `);

    // Tabella formazioni avversarie
    database.run(`
      CREATE TABLE IF NOT EXISTS match_opponent_lineup (
        id TEXT PRIMARY KEY,
        matchId TEXT NOT NULL,
        jerseyNumber INTEGER NOT NULL,
        FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
      )
    `);

    // Tabella gruppi utenti
    database.run(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        teamManagement BOOLEAN NOT NULL DEFAULT 0,
        matchManagement BOOLEAN NOT NULL DEFAULT 0,
        resultsView BOOLEAN NOT NULL DEFAULT 0,
        statisticsView BOOLEAN NOT NULL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabella utenti
    database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
        expirationDate TEXT NOT NULL,
        groupId TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        matricola TEXT NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE RESTRICT
      )
    `);

    // Inserisci gruppo amministratore di default se non esiste
    database.run(`
      INSERT OR IGNORE INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView)
      VALUES ('admin', 'Amministratori', 'Gruppo con tutti i permessi', 1, 1, 1, 1)
    `);

    // Inserisci utente admin di default se non esiste
    database.run(`
      INSERT OR IGNORE INTO users (id, firstName, lastName, status, expirationDate, groupId, username, password, email, phone, matricola)
      VALUES ('admin', 'Admin', 'System', 'active', '2030-12-31', 'admin', 'admin', 'admin123', 'admin@system.com', '000', 'ADMIN001')
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
    
    const stmt = db.prepare('SELECT * FROM matches ORDER BY date');
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
        events,
        lastTimestamp: row.lastTimestamp as number | undefined,
        isRunning: !!row.isRunning,
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
      'INSERT INTO matches (id, date, opponent, homeAway, status, startTime, firstHalfDuration, secondHalfDuration, homeScore, awayScore, lastTimestamp, isRunning) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, match.date, match.opponent, match.homeAway, match.status, match.startTime || null, match.firstHalfDuration, match.secondHalfDuration, match.homeScore, match.awayScore, match.lastTimestamp || null, match.isRunning ? 1 : 0]
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
      'UPDATE matches SET date = ?, opponent = ?, homeAway = ?, status = ?, startTime = ?, firstHalfDuration = ?, secondHalfDuration = ?, homeScore = ?, awayScore = ?, lastTimestamp = ?, isRunning = ? WHERE id = ?',
      [match.date, match.opponent, match.homeAway, match.status, match.startTime || null, match.firstHalfDuration, match.secondHalfDuration, match.homeScore, match.awayScore, (match as any).lastTimestamp || null, (match as any).isRunning ? 1 : 0, id]
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

  // Funzioni per i gruppi
  const getGroups = (): Group[] => {
    if (!db) return [];
    
    const stmt = db.prepare('SELECT * FROM groups ORDER BY name');
    const groups: Group[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      groups.push({
        id: row.id as string,
        name: row.name as string,
        description: row.description as string || '',
        permissions: {
          teamManagement: Boolean(row.teamManagement),
          matchManagement: Boolean(row.matchManagement),
          resultsView: Boolean(row.resultsView),
          statisticsView: Boolean(row.statisticsView)
        },
        createdAt: row.createdAt as string
      });
    }
    
    stmt.free();
    return groups;
  };

  const addGroup = (group: Omit<Group, 'id' | 'createdAt'>) => {
    if (!db) return;
    
    const id = Date.now().toString();
    db.run(
      'INSERT INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, group.name, group.description || '', group.permissions.teamManagement ? 1 : 0, group.permissions.matchManagement ? 1 : 0, group.permissions.resultsView ? 1 : 0, group.permissions.statisticsView ? 1 : 0]
    );
    saveDatabase();
    return id;
  };

  const updateGroup = (id: string, group: Omit<Group, 'id' | 'createdAt'>) => {
    if (!db) return;
    
    db.run(
      'UPDATE groups SET name = ?, description = ?, teamManagement = ?, matchManagement = ?, resultsView = ?, statisticsView = ? WHERE id = ?',
      [group.name, group.description || '', group.permissions.teamManagement ? 1 : 0, group.permissions.matchManagement ? 1 : 0, group.permissions.resultsView ? 1 : 0, group.permissions.statisticsView ? 1 : 0, id]
    );
    saveDatabase();
  };

  const deleteGroup = (id: string) => {
    if (!db) return;
    
    // Verifica che non ci siano utenti associati a questo gruppo
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE groupId = ?');
    stmt.bind([id]);
    stmt.step();
    const count = stmt.getAsObject().count as number;
    stmt.free();
    
    if (count > 0) {
      throw new Error('Impossibile eliminare il gruppo: ci sono utenti associati');
    }
    
    db.run('DELETE FROM groups WHERE id = ?', [id]);
    saveDatabase();
  };

  // Funzioni per gli utenti
  const getUsers = (): UserWithGroup[] => {
    if (!db) return [];
    
    const stmt = db.prepare(`
      SELECT u.*, g.name as groupName, g.description as groupDescription,
             g.teamManagement, g.matchManagement, g.resultsView, g.statisticsView,
             g.createdAt as groupCreatedAt
      FROM users u 
      JOIN groups g ON u.groupId = g.id 
      ORDER BY u.lastName, u.firstName
    `);
    const users: UserWithGroup[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      users.push({
        id: row.id as string,
        firstName: row.firstName as string,
        lastName: row.lastName as string,
        status: row.status as 'active' | 'inactive',
        expirationDate: row.expirationDate as string,
        groupId: row.groupId as string,
        username: row.username as string,
        password: row.password as string,
        email: row.email as string,
        phone: row.phone as string,
        matricola: row.matricola as string,
        createdAt: row.createdAt as string,
        group: {
          id: row.groupId as string,
          name: row.groupName as string,
          description: row.groupDescription as string || '',
          permissions: {
            teamManagement: Boolean(row.teamManagement),
            matchManagement: Boolean(row.matchManagement),
            resultsView: Boolean(row.resultsView),
            statisticsView: Boolean(row.statisticsView)
          },
          createdAt: row.groupCreatedAt as string
        }
      });
    }
    
    stmt.free();
    return users;
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    if (!db) return;
    
    const id = Date.now().toString();
    db.run(
      'INSERT INTO users (id, firstName, lastName, status, expirationDate, groupId, username, password, email, phone, matricola) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user.firstName, user.lastName, user.status, user.expirationDate, user.groupId, user.username, user.password, user.email, user.phone, user.matricola]
    );
    saveDatabase();
    return id;
  };

  const updateUser = (id: string, user: Omit<User, 'id' | 'createdAt'>) => {
    if (!db) return;
    
    db.run(
      'UPDATE users SET firstName = ?, lastName = ?, status = ?, expirationDate = ?, groupId = ?, username = ?, password = ?, email = ?, phone = ?, matricola = ? WHERE id = ?',
      [user.firstName, user.lastName, user.status, user.expirationDate, user.groupId, user.username, user.password, user.email, user.phone, user.matricola, id]
    );
    saveDatabase();
  };

  const deleteUser = (id: string) => {
    if (!db) return;
    
    db.run('DELETE FROM users WHERE id = ?', [id]);
    saveDatabase();
  };

  const authenticateUser = (username: string, password: string): UserWithGroup | null => {
    if (!db) return null;
    
    const stmt = db.prepare(`
      SELECT u.*, g.name as groupName, g.description as groupDescription,
             g.teamManagement, g.matchManagement, g.resultsView, g.statisticsView,
             g.createdAt as groupCreatedAt
      FROM users u 
      JOIN groups g ON u.groupId = g.id 
      WHERE u.username = ? AND u.password = ? AND u.status = 'active'
    `);
    
    stmt.bind([username, password]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const user: UserWithGroup = {
        id: row.id as string,
        firstName: row.firstName as string,
        lastName: row.lastName as string,
        status: row.status as 'active' | 'inactive',
        expirationDate: row.expirationDate as string,
        groupId: row.groupId as string,
        username: row.username as string,
        password: row.password as string,
        email: row.email as string,
        phone: row.phone as string,
        matricola: row.matricola as string,
        createdAt: row.createdAt as string,
        group: {
          id: row.groupId as string,
          name: row.groupName as string,
          description: row.groupDescription as string || '',
          permissions: {
            teamManagement: Boolean(row.teamManagement),
            matchManagement: Boolean(row.matchManagement),
            resultsView: Boolean(row.resultsView),
            statisticsView: Boolean(row.statisticsView)
          },
          createdAt: row.groupCreatedAt as string
        }
      };
      
      stmt.free();
      
      // Verifica scadenza
      const now = new Date();
      const expiration = new Date(user.expirationDate);
      if (expiration < now) {
        return null;
      }
      
      return user;
    }
    
    stmt.free();
    return null;
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
    // Groups
    getGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    // Users
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    authenticateUser,
    // Utility
    saveDatabase
  };
}