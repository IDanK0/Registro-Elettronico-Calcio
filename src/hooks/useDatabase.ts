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
        database.run("CREATE TABLE IF NOT EXISTS match_events_tmp (id TEXT PRIMARY KEY, matchId TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('goal', 'yellow-card', 'red-card', 'second-yellow-card', 'blue-card', 'expulsion', 'warning', 'substitution', 'foul', 'corner', 'offside', 'free-kick', 'penalty', 'throw-in', 'injury')), minute INTEGER NOT NULL, second INTEGER, playerId TEXT NOT NULL, description TEXT, reason TEXT, teamType TEXT CHECK (teamType IN ('own', 'opponent')), FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE, FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE)");
        database.run("INSERT INTO match_events_tmp (id, matchId, type, minute, second, playerId, description) SELECT id, matchId, type, minute, second, playerId, description FROM match_events");
        database.run("DROP TABLE match_events");
        database.run("ALTER TABLE match_events_tmp RENAME TO match_events");
      } catch (e) {
        // Se fallisce, probabilmente la tabella è già aggiornata
      }      // Migrazione: aggiungi la colonna 'lastTimestamp' a matches se non esiste
      try {
        database.run("ALTER TABLE matches ADD COLUMN lastTimestamp INTEGER");
      } catch (e) {
        // ignore if exists
      }      // Migrazione: aggiungi la colonna 'isRunning' a matches se non esiste
      try {
        database.run("ALTER TABLE matches ADD COLUMN isRunning BOOLEAN DEFAULT 0");
      } catch (e) {
        // ignore
      }

      // Migrazione: aggiungi colonna currentPeriodIndex a matches se non esiste
      try {
        database.run("ALTER TABLE matches ADD COLUMN currentPeriodIndex INTEGER DEFAULT 0");
      } catch (e) {
        // ignore if exists
      }

      // Migrazione: aggiungi colonna playerJerseyNumbers a matches se non esiste
      try {
        database.run("ALTER TABLE matches ADD COLUMN playerJerseyNumbers TEXT");
      } catch (e) {
        // ignore if exists
      }

      // Migrazione: crea tabella match_periods se non esiste
      try {
        database.run(`
          CREATE TABLE IF NOT EXISTS match_periods (
            id TEXT PRIMARY KEY,
            matchId TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('regular', 'extra', 'interval')),
            label TEXT NOT NULL,
            duration INTEGER NOT NULL DEFAULT 0,
            isFinished BOOLEAN NOT NULL DEFAULT 0,
            periodIndex INTEGER NOT NULL,
            FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
          )
        `);

        // Migrazione: converti le partite esistenti al nuovo formato con periodi
        const matchesStmt = database.prepare('SELECT id, firstHalfDuration, secondHalfDuration FROM matches');
        while (matchesStmt.step()) {
          const match = matchesStmt.getAsObject();
          const matchId = match.id as string;
          const firstHalfDuration = match.firstHalfDuration as number || 0;
          const secondHalfDuration = match.secondHalfDuration as number || 0;
          
          // Controlla se i periodi esistono già per questa partita
          const checkStmt = database.prepare('SELECT COUNT(*) as count FROM match_periods WHERE matchId = ?');
          checkStmt.bind([matchId]);
          checkStmt.step();
          const existingPeriods = checkStmt.getAsObject();
          const count = existingPeriods.count as number;
          checkStmt.free();
          
          if (count === 0) {
            // Aggiungi i due periodi di default basati sui tempi esistenti
            const firstPeriodId = `${matchId}_period_0`;
            const secondPeriodId = `${matchId}_period_1`;
            
            database.run(
              'INSERT INTO match_periods (id, matchId, type, label, duration, isFinished, periodIndex) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [firstPeriodId, matchId, 'regular', '1° Tempo', firstHalfDuration, firstHalfDuration > 0 ? 1 : 0, 0]
            );
            
            database.run(
              'INSERT INTO match_periods (id, matchId, type, label, duration, isFinished, periodIndex) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [secondPeriodId, matchId, 'regular', '2° Tempo', secondHalfDuration, secondHalfDuration > 0 ? 1 : 0, 1]
            );
          }        }
        matchesStmt.free();
      } catch (e) {
        // ignore if migration already done
      }

      // Migrazione: aggiorna constraint CHECK per supportare 'interval' nei periodi
      try {
        // Ricrea la tabella con il nuovo constraint
        database.run(`
          CREATE TABLE IF NOT EXISTS match_periods_new (
            id TEXT PRIMARY KEY,
            matchId TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('regular', 'extra', 'interval')),
            label TEXT NOT NULL,
            duration INTEGER NOT NULL DEFAULT 0,
            isFinished BOOLEAN NOT NULL DEFAULT 0,
            periodIndex INTEGER NOT NULL,
            FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
          )
        `);
        
        // Copia i dati esistenti
        database.run(`
          INSERT INTO match_periods_new (id, matchId, type, label, duration, isFinished, periodIndex)
          SELECT id, matchId, type, label, duration, isFinished, periodIndex FROM match_periods
        `);
        
        // Elimina la vecchia tabella e rinomina quella nuova
        database.run("DROP TABLE IF EXISTS match_periods");
        database.run("ALTER TABLE match_periods_new RENAME TO match_periods");
      } catch (e) {
        // ignore if migration already done
      }// Migrazione: crea tabelle per gestione utenti se non esistono
      try {
        database.run(`
          CREATE TABLE IF NOT EXISTS groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            icon TEXT DEFAULT 'Users',
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
          )        `);

        // Inserisci gruppo amministratore di default se non esiste
        database.run(`
          INSERT OR IGNORE INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView)
          VALUES ('admin', 'Amministratori', 'Gruppo con tutti i permessi', 1, 1, 1, 1)
        `);

        // Inserisci gruppi di base se non esistono
        database.run(`
          INSERT OR IGNORE INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView)
          VALUES ('allenatore', 'Allenatore', 'Gestione completa squadra e partite', 1, 1, 1, 1)
        `);

        database.run(`
          INSERT OR IGNORE INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView)
          VALUES ('dirigente', 'Dirigente', 'Gestione amministrativa e visualizzazione', 0, 1, 1, 1)
        `);

        database.run(`
          INSERT OR IGNORE INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView)
          VALUES ('massaggiatore', 'Massaggiatore', 'Solo visualizzazione risultati e statistiche', 0, 0, 1, 1)
        `);        // Inserisci utente admin di default se non esiste
        database.run(`
          INSERT OR IGNORE INTO users (id, firstName, lastName, status, expirationDate, groupId, username, password, email, phone, matricola)
          VALUES ('admin', 'Admin', 'System', 'active', '2030-12-31', 'admin', 'admin', 'admin123', 'admin@system.com', '000', 'ADMIN001')
        `);
      } catch (e) {
        console.log('User tables migration already applied or failed:', e);
      }      // Migrazione: aggiungi la colonna 'icon' ai gruppi se non esiste
      try {
        database.run("ALTER TABLE groups ADD COLUMN icon TEXT DEFAULT 'Users'");        // Aggiorna le icone dei gruppi predefiniti con icone più appropriate
        database.run("UPDATE groups SET icon = 'Shield' WHERE id = 'admin'");
        database.run("UPDATE groups SET icon = 'Trophy' WHERE id = 'allenatore'");
        database.run("UPDATE groups SET icon = 'Briefcase' WHERE id = 'dirigente'");
        database.run("UPDATE groups SET icon = 'Stethoscope' WHERE id = 'massaggiatore'");
      } catch (e) {
        // ignore if exists
      }

      // Migrazione: aggiungi campi contatto ai giocatori
      try {
        database.run("ALTER TABLE players ADD COLUMN phone TEXT");
        database.run("ALTER TABLE players ADD COLUMN email TEXT");
        database.run("ALTER TABLE players ADD COLUMN parentName TEXT");
        database.run("ALTER TABLE players ADD COLUMN parentPhone TEXT");
        database.run("ALTER TABLE players ADD COLUMN parentEmail TEXT");
      } catch (e) {
        // ignore if exists
      }

      // Migrazione: rimuovi position e jerseyNumber dai giocatori (se esistono)
      try {
        database.run(`
          CREATE TABLE IF NOT EXISTS players_new (
            id TEXT PRIMARY KEY,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            birthDate TEXT NOT NULL,
            licenseNumber TEXT NOT NULL,
            isActive BOOLEAN NOT NULL DEFAULT 1,
            phone TEXT,
            email TEXT,
            parentName TEXT,
            parentPhone TEXT,
            parentEmail TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        database.run("INSERT INTO players_new (id, firstName, lastName, birthDate, licenseNumber, isActive, phone, email, parentName, parentPhone, parentEmail, createdAt) SELECT id, firstName, lastName, birthDate, licenseNumber, isActive, phone, email, parentName, parentPhone, parentEmail, createdAt FROM players");
        database.run("DROP TABLE players");
        database.run("ALTER TABLE players_new RENAME TO players");
      } catch (e) {
        // ignore if migration already done
      }

      // Migrazione: crea tabella documenti giocatori
      try {
        database.run(`
          CREATE TABLE IF NOT EXISTS player_documents (
            id TEXT PRIMARY KEY,
            playerId TEXT NOT NULL,
            fileName TEXT NOT NULL,
            mimeType TEXT NOT NULL,
            data TEXT NOT NULL,
            uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
          )
        `);
      } catch (e) {
        // ignore if exists
      }      // Migrazione: aggiungi position e jerseyNumber alle formazioni
      try {
        database.run("ALTER TABLE match_lineups ADD COLUMN position TEXT");
        database.run("ALTER TABLE match_lineups ADD COLUMN jerseyNumber INTEGER");
      } catch (e) {
        // ignore if exists
      }

      // Migrazione: aggiungi nuovi campi alle partite
      try {
        database.run("ALTER TABLE matches ADD COLUMN time TEXT DEFAULT '15:00'");
        database.run("ALTER TABLE matches ADD COLUMN location TEXT");
        database.run("ALTER TABLE matches ADD COLUMN field TEXT");
      } catch (e) {
        // ignore if exists
      }

      // Migrazione: crea tabelle per staff partita
      try {
        database.run(`
          CREATE TABLE IF NOT EXISTS match_coaches (
            id TEXT PRIMARY KEY,
            matchId TEXT NOT NULL,
            userId TEXT NOT NULL,
            FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        database.run(`
          CREATE TABLE IF NOT EXISTS match_managers (
            id TEXT PRIMARY KEY,
            matchId TEXT NOT NULL,
            userId TEXT NOT NULL,
            FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
      } catch (e) {
        // ignore if exists
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
        licenseNumber TEXT NOT NULL,
        isActive BOOLEAN NOT NULL DEFAULT 1,
        phone TEXT,
        email TEXT,
        parentName TEXT,
        parentPhone TEXT,
        parentEmail TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabella documenti giocatori
    database.run(`
      CREATE TABLE IF NOT EXISTS player_documents (
        id TEXT PRIMARY KEY,
        playerId TEXT NOT NULL,
        fileName TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        data TEXT NOT NULL,
        uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
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
    `);    // Tabella formazioni con posizione e numero maglia per partita
    database.run(`
      CREATE TABLE IF NOT EXISTS match_lineups (
        id TEXT PRIMARY KEY,
        matchId TEXT NOT NULL,
        playerId TEXT NOT NULL,
        position TEXT NOT NULL,
        jerseyNumber INTEGER NOT NULL,
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
        type TEXT NOT NULL CHECK (type IN ('goal', 'yellow-card', 'red-card', 'second-yellow-card', 'blue-card', 'expulsion', 'warning', 'substitution', 'foul', 'corner', 'offside', 'free-kick', 'penalty', 'throw-in', 'injury')),
        minute INTEGER NOT NULL,
        second INTEGER,
        playerId TEXT NOT NULL,
        description TEXT,
        reason TEXT,
        teamType TEXT CHECK (teamType IN ('own', 'opponent')),
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
    `);    // Inserisci gruppo amministratore di default se non esiste
    database.run(`
      INSERT OR IGNORE INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView)
      VALUES ('admin', 'Amministratori', 'Gruppo con tutti i permessi', 1, 1, 1, 1)
    `);

    // Inserisci gruppi di base se non esistono
    database.run(`
      INSERT OR IGNORE INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView)
      VALUES ('allenatore', 'Allenatore', 'Gestione completa squadra e partite', 1, 1, 1, 1)
    `);

    database.run(`
      INSERT OR IGNORE INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView)
      VALUES ('dirigente', 'Dirigente', 'Gestione amministrativa e visualizzazione', 0, 1, 1, 1)
    `);

    database.run(`
      INSERT OR IGNORE INTO groups (id, name, description, teamManagement, matchManagement, resultsView, statisticsView)
      VALUES ('massaggiatore', 'Massaggiatore', 'Solo visualizzazione risultati e statistiche', 0, 0, 1, 1)
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
    
    const stmt = db.prepare('SELECT * FROM players ORDER BY lastName, firstName');
    const players: Player[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      
      // Carica documenti per questo giocatore
      const documentsStmt = db.prepare('SELECT * FROM player_documents WHERE playerId = ?');
      documentsStmt.bind([row.id]);
      const documents: any[] = [];
      while (documentsStmt.step()) {
        const docRow = documentsStmt.getAsObject();
        documents.push({
          id: docRow.id,
          fileName: docRow.fileName,
          mimeType: docRow.mimeType,
          data: docRow.data,
          uploadDate: docRow.uploadDate
        });
      }
      documentsStmt.free();
      
      players.push({
        id: row.id as string,
        firstName: row.firstName as string,
        lastName: row.lastName as string,
        birthDate: row.birthDate as string,
        licenseNumber: row.licenseNumber as string,
        isActive: Boolean(row.isActive),
        phone: row.phone as string || '',
        email: row.email as string || '',
        parentName: row.parentName as string || '',
        parentPhone: row.parentPhone as string || '',
        parentEmail: row.parentEmail as string || '',
        documents: documents
      });
    }
    
    stmt.free();
    return players;
  };
  const addPlayer = (player: Omit<Player, 'id'>) => {
    if (!db) return;
    
    const id = Date.now().toString();
    db.run(
      'INSERT INTO players (id, firstName, lastName, birthDate, licenseNumber, isActive, phone, email, parentName, parentPhone, parentEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, player.firstName, player.lastName, player.birthDate, player.licenseNumber, player.isActive ? 1 : 0, player.phone || null, player.email || null, player.parentName || null, player.parentPhone || null, player.parentEmail || null]
    );
    
    // Inserisci documenti se presenti
    if (player.documents && player.documents.length > 0) {
      player.documents.forEach(doc => {
        const docId = `${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        db.run(
          'INSERT INTO player_documents (id, playerId, fileName, mimeType, data) VALUES (?, ?, ?, ?, ?)',
          [docId, id, doc.fileName, doc.mimeType, doc.data]
        );
      });
    }
    
    saveDatabase();
    return id;
  };

  const updatePlayer = (id: string, player: Omit<Player, 'id'>) => {
    if (!db) return;
    
    db.run(
      'UPDATE players SET firstName = ?, lastName = ?, birthDate = ?, licenseNumber = ?, isActive = ?, phone = ?, email = ?, parentName = ?, parentPhone = ?, parentEmail = ? WHERE id = ?',
      [player.firstName, player.lastName, player.birthDate, player.licenseNumber, player.isActive ? 1 : 0, player.phone || null, player.email || null, player.parentName || null, player.parentPhone || null, player.parentEmail || null, id]
    );
    
    // Aggiorna documenti - rimuovi vecchi e inserisci nuovi
    db.run('DELETE FROM player_documents WHERE playerId = ?', [id]);
    if (player.documents && player.documents.length > 0) {
      player.documents.forEach(doc => {
        const docId = `${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        db.run(
          'INSERT INTO player_documents (id, playerId, fileName, mimeType, data) VALUES (?, ?, ?, ?, ?)',
          [docId, id, doc.fileName, doc.mimeType, doc.data]
        );
      });
    }
    
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
        // Ottieni formazione con posizione e numero maglia
      const lineupStmt = db.prepare('SELECT playerId, position, jerseyNumber FROM match_lineups WHERE matchId = ?');
      lineupStmt.bind([matchId]);
      const lineup: any[] = [];
      while (lineupStmt.step()) {
        const lineupRow = lineupStmt.getAsObject();
        lineup.push({
          playerId: lineupRow.playerId as string,
          position: lineupRow.position as string || '',
          jerseyNumber: lineupRow.jerseyNumber as number || 0
        });
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
          description: eventRow.description,
          reason: eventRow.reason, // Load the reason field from DB
          teamType: eventRow.teamType // Load the teamType field from DB
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
      
      // Ottieni allenatori
      const coachesStmt = db.prepare('SELECT userId FROM match_coaches WHERE matchId = ?');
      coachesStmt.bind([matchId]);
      const coaches: string[] = [];
      while (coachesStmt.step()) {
        const row = coachesStmt.getAsObject();
        coaches.push(row.userId as string);
      }
      coachesStmt.free();
      
      // Ottieni dirigenti
      const managersStmt = db.prepare('SELECT userId FROM match_managers WHERE matchId = ?');      managersStmt.bind([matchId]);
      const managers: string[] = [];
      while (managersStmt.step()) {
        const row = managersStmt.getAsObject();
        managers.push(row.userId as string);
      }
      managersStmt.free();
      
      // Ottieni periodi
      const periodsStmt = db.prepare('SELECT * FROM match_periods WHERE matchId = ? ORDER BY periodIndex');
      periodsStmt.bind([matchId]);
      const periods: any[] = [];
      while (periodsStmt.step()) {
        const periodRow = periodsStmt.getAsObject();        periods.push({
          type: periodRow.type as 'regular' | 'extra' | 'interval',
          label: periodRow.label as string,
          duration: periodRow.duration as number,
          isFinished: Boolean(periodRow.isFinished)
        });
      }
      periodsStmt.free();
      
      // Se non ci sono periodi, creane di default
      const finalPeriods = periods.length > 0 ? periods : [
        { type: 'regular', label: '1° Tempo', duration: row.firstHalfDuration as number || 0, isFinished: (row.firstHalfDuration as number || 0) > 0 },
        { type: 'regular', label: '2° Tempo', duration: row.secondHalfDuration as number || 0, isFinished: (row.secondHalfDuration as number || 0) > 0 }
      ];
      
      matches.push({
        id: row.id as string,
        date: row.date as string,
        time: row.time as string || '15:00',
        opponent: row.opponent as string,
        homeAway: row.homeAway as 'home' | 'away',
        location: row.location as string || '',
        field: row.field as string || '',
        coaches,
        managers,
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
        periods: finalPeriods,
        currentPeriodIndex: row.currentPeriodIndex as number || 0,
        playerJerseyNumbers: row.playerJerseyNumbers ? JSON.parse(row.playerJerseyNumbers as string) : {},
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
      'INSERT INTO matches (id, date, time, opponent, homeAway, location, field, status, startTime, firstHalfDuration, secondHalfDuration, homeScore, awayScore, lastTimestamp, isRunning, currentPeriodIndex, playerJerseyNumbers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, match.date, match.time, match.opponent, match.homeAway, match.location || null, match.field || null, match.status, match.startTime || null, match.firstHalfDuration, match.secondHalfDuration, match.homeScore, match.awayScore, (match as any).lastTimestamp || null, (match as any).isRunning ? 1 : 0, (match as any).currentPeriodIndex || 0, JSON.stringify(match.playerJerseyNumbers || {})]
    );
      // Inserisci formazione con posizione e numero maglia
    match.lineup.forEach(matchPlayer => {
      const lineupId = `${id}_${matchPlayer.playerId}`;
      db.run('INSERT INTO match_lineups (id, matchId, playerId, position, jerseyNumber) VALUES (?, ?, ?, ?, ?)', [lineupId, id, matchPlayer.playerId, matchPlayer.position, matchPlayer.jerseyNumber]);
    });
    
    // Inserisci allenatori
    if (Array.isArray(match.coaches)) {
      match.coaches.forEach(userId => {
        const coachId = `${id}_coach_${userId}`;
        db.run('INSERT INTO match_coaches (id, matchId, userId) VALUES (?, ?, ?)', [coachId, id, userId]);
      });
    }
    
    // Inserisci dirigenti
    if (Array.isArray(match.managers)) {
      match.managers.forEach(userId => {
        const managerId = `${id}_manager_${userId}`;
        db.run('INSERT INTO match_managers (id, matchId, userId) VALUES (?, ?, ?)', [managerId, id, userId]);
      });
    }
    
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
          'INSERT INTO match_events (id, matchId, type, minute, second, playerId, description, reason, teamType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [event.id, id, event.type, event.minute, event.second ?? null, event.playerId, event.description || null, event.reason || null, event.teamType || null]
        );
      });
    }
    
    // Inserisci periodi
    if (Array.isArray((match as any).periods)) {
      (match as any).periods.forEach((period: any, index: number) => {
        const periodId = `${id}_period_${index}`;
        db.run(
          'INSERT INTO match_periods (id, matchId, type, label, duration, isFinished, periodIndex) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [periodId, id, period.type, period.label, period.duration, period.isFinished ? 1 : 0, index]
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
      'UPDATE matches SET date = ?, time = ?, opponent = ?, homeAway = ?, location = ?, field = ?, status = ?, startTime = ?, firstHalfDuration = ?, secondHalfDuration = ?, homeScore = ?, awayScore = ?, lastTimestamp = ?, isRunning = ?, currentPeriodIndex = ?, playerJerseyNumbers = ? WHERE id = ?',
      [match.date, match.time, match.opponent, match.homeAway, match.location || null, match.field || null, match.status, match.startTime || null, match.firstHalfDuration, match.secondHalfDuration, match.homeScore, match.awayScore, (match as any).lastTimestamp || null, (match as any).isRunning ? 1 : 0, (match as any).currentPeriodIndex || 0, JSON.stringify(match.playerJerseyNumbers || {}), id]
    );
      // Aggiorna formazione
    db.run('DELETE FROM match_lineups WHERE matchId = ?', [id]);
    match.lineup.forEach(matchPlayer => {
      const lineupId = `${id}_${matchPlayer.playerId}`;
      db.run('INSERT INTO match_lineups (id, matchId, playerId, position, jerseyNumber) VALUES (?, ?, ?, ?, ?)', [lineupId, id, matchPlayer.playerId, matchPlayer.position, matchPlayer.jerseyNumber]);
    });
    
    // Aggiorna allenatori
    db.run('DELETE FROM match_coaches WHERE matchId = ?', [id]);
    if (Array.isArray(match.coaches)) {
      match.coaches.forEach(userId => {
        const coachId = `${id}_coach_${userId}`;
        db.run('INSERT INTO match_coaches (id, matchId, userId) VALUES (?, ?, ?)', [coachId, id, userId]);
      });
    }
    
    // Aggiorna dirigenti
    db.run('DELETE FROM match_managers WHERE matchId = ?', [id]);
    if (Array.isArray(match.managers)) {
      match.managers.forEach(userId => {
        const managerId = `${id}_manager_${userId}`;
        db.run('INSERT INTO match_managers (id, matchId, userId) VALUES (?, ?, ?)', [managerId, id, userId]);
      });
    }
    
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
        'INSERT INTO match_events (id, matchId, type, minute, second, playerId, description, reason, teamType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [event.id, id, event.type, event.minute, event.second ?? null, event.playerId, event.description || null, event.reason || null, event.teamType || null]
      );
    });
      // Aggiorna numeri maglia avversari
    db.run('DELETE FROM match_opponent_lineup WHERE matchId = ?', [id]);
    if (Array.isArray(match.opponentLineup)) {
      match.opponentLineup.forEach(jerseyNumber => {
        db.run('INSERT INTO match_opponent_lineup (matchId, jerseyNumber) VALUES (?, ?)', [id, jerseyNumber]);
      });
    }
    
    // Aggiorna periodi
    db.run('DELETE FROM match_periods WHERE matchId = ?', [id]);
    if (Array.isArray((match as any).periods)) {
      (match as any).periods.forEach((period: any, index: number) => {
        const periodId = `${id}_period_${index}`;
        db.run(
          'INSERT INTO match_periods (id, matchId, type, label, duration, isFinished, periodIndex) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [periodId, id, period.type, period.label, period.duration, period.isFinished ? 1 : 0, index]
        );
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
        icon: row.icon as string || 'Users',
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
      'INSERT INTO groups (id, name, description, icon, teamManagement, matchManagement, resultsView, statisticsView) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, group.name, group.description || '', group.icon || 'Users', group.permissions.teamManagement ? 1 : 0, group.permissions.matchManagement ? 1 : 0, group.permissions.resultsView ? 1 : 0, group.permissions.statisticsView ? 1 : 0]
    );
    saveDatabase();
    return id;
  };
  const updateGroup = (id: string, group: Omit<Group, 'id' | 'createdAt'>) => {
    if (!db) return;
    
    db.run(
      'UPDATE groups SET name = ?, description = ?, icon = ?, teamManagement = ?, matchManagement = ?, resultsView = ?, statisticsView = ? WHERE id = ?',
      [group.name, group.description || '', group.icon || 'Users', group.permissions.teamManagement ? 1 : 0, group.permissions.matchManagement ? 1 : 0, group.permissions.resultsView ? 1 : 0, group.permissions.statisticsView ? 1 : 0, id]
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
    saveDatabase();  };

  // Funzioni per gli utenti
  const getUsers = (): UserWithGroup[] => {
    if (!db) return [];
    
    const stmt = db.prepare(`
      SELECT u.*, g.name as groupName, g.description as groupDescription, g.icon as groupIcon,
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
        phone: row.phone as string,        matricola: row.matricola as string,
        createdAt: row.createdAt as string,
        group: {
          id: row.groupId as string,
          name: row.groupName as string,
          description: row.groupDescription as string || '',
          icon: row.groupIcon as string || 'Users',
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
      SELECT u.*, g.name as groupName, g.description as groupDescription, g.icon as groupIcon,
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
        createdAt: row.createdAt as string,        group: {
          id: row.groupId as string,
          name: row.groupName as string,
          description: row.groupDescription as string || '',
          icon: row.groupIcon as string || 'Users',
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