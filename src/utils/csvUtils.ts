import { User, Group, UserWithGroup } from '../types';

// CSV Export functions
export const exportGroupsToCSV = (groups: Group[]): void => {
  const headers = [
    'ID',
    'Nome',
    'Descrizione',
    'Icona',
    'Gestione Squadra',
    'Gestione Partite',
    'Visualizzazione Risultati',
    'Visualizzazione Statistiche',
    'Data Creazione'
  ];

  const csvData = groups.map(group => [
    group.id,
    group.name,
    group.description || '',
    group.icon || 'Users',
    group.permissions.teamManagement ? 'SI' : 'NO',
    group.permissions.matchManagement ? 'SI' : 'NO',
    group.permissions.resultsView ? 'SI' : 'NO',
    group.permissions.statisticsView ? 'SI' : 'NO',
    new Date(group.createdAt).toLocaleDateString('it-IT')
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  downloadCSV(csvContent, 'gruppi.csv');
};

export const exportUsersToCSV = (users: UserWithGroup[]): void => {
  const headers = [
    'ID',
    'Nome',
    'Cognome',
    'Username',
    'Email',
    'Cellulare',
    'Matricola',
    'Stato',
    'Data Scadenza',
    'Gruppo',
    'Data Creazione'
  ];

  const csvData = users.map(user => [
    user.id,
    user.firstName,
    user.lastName,
    user.username,
    user.email,
    user.phone,
    user.matricola,
    user.status === 'active' ? 'Attivo' : 'Disattivo',
    new Date(user.expirationDate).toLocaleDateString('it-IT'),
    user.group.name,
    new Date(user.createdAt).toLocaleDateString('it-IT')
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  downloadCSV(csvContent, 'utenti.csv');
};

// CSV Import functions
export const parseGroupsFromCSV = (csvContent: string): Omit<Group, 'id' | 'createdAt'>[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) throw new Error('Il file CSV deve contenere almeno una riga di intestazione e una di dati');

  const headers = parseCSVLine(lines[0]);
  const expectedHeaders = ['Nome', 'Descrizione', 'Gestione Squadra', 'Gestione Partite', 'Visualizzazione Risultati', 'Visualizzazione Statistiche'];
  
  // Verifica che le intestazioni richieste siano presenti
  const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Intestazioni mancanti nel CSV: ${missingHeaders.join(', ')}`);
  }

  const groups: Omit<Group, 'id' | 'createdAt'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const getColumnValue = (columnName: string) => {
      const index = headers.indexOf(columnName);
      return index >= 0 ? values[index] || '' : '';
    };

    const name = getColumnValue('Nome').trim();
    if (!name) {
      throw new Error(`Riga ${i + 1}: Nome gruppo mancante`);
    }

    const toBool = (value: string) => {
      const normalized = value.toLowerCase().trim();
      return normalized === 'si' || normalized === 'true' || normalized === '1' || normalized === 'vero';
    };

    groups.push({
      name,
      description: getColumnValue('Descrizione').trim(),
      icon: getColumnValue('Icona').trim() || 'Users',
      permissions: {
        teamManagement: toBool(getColumnValue('Gestione Squadra')),
        matchManagement: toBool(getColumnValue('Gestione Partite')),
        resultsView: toBool(getColumnValue('Visualizzazione Risultati')),
        statisticsView: toBool(getColumnValue('Visualizzazione Statistiche'))
      }
    });
  }

  return groups;
};

export const parseUsersFromCSV = (csvContent: string, groups: Group[]): Omit<User, 'id' | 'createdAt'>[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) throw new Error('Il file CSV deve contenere almeno una riga di intestazione e una di dati');

  const headers = parseCSVLine(lines[0]);
  const expectedHeaders = ['Nome', 'Cognome', 'Username', 'Password', 'Email', 'Cellulare', 'Matricola', 'Stato', 'Data Scadenza', 'Gruppo'];
  
  // Verifica che le intestazioni richieste siano presenti
  const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Intestazioni mancanti nel CSV: ${missingHeaders.join(', ')}`);
  }

  const users: Omit<User, 'id' | 'createdAt'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const getColumnValue = (columnName: string) => {
      const index = headers.indexOf(columnName);
      return index >= 0 ? values[index] || '' : '';
    };

    const firstName = getColumnValue('Nome').trim();
    const lastName = getColumnValue('Cognome').trim();
    const username = getColumnValue('Username').trim();
    const password = getColumnValue('Password').trim();
    const email = getColumnValue('Email').trim();
    const phone = getColumnValue('Cellulare').trim();
    const matricola = getColumnValue('Matricola').trim();
    const groupName = getColumnValue('Gruppo').trim();
    const expirationDate = getColumnValue('Data Scadenza').trim();
    const status = getColumnValue('Stato').trim();

    // Validazioni
    if (!firstName || !lastName || !username || !password || !email || !phone || !matricola || !groupName || !expirationDate) {
      throw new Error(`Riga ${i + 1}: Tutti i campi obbligatori devono essere compilati`);
    }

    // Trova il gruppo
    const group = groups.find(g => g.name === groupName);
    if (!group) {
      throw new Error(`Riga ${i + 1}: Gruppo "${groupName}" non trovato`);
    }

    // Valida email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Riga ${i + 1}: Email non valida`);
    }

    // Valida data di scadenza
    const parsedDate = parseDate(expirationDate);
    if (!parsedDate) {
      throw new Error(`Riga ${i + 1}: Data di scadenza non valida. Formato accettato: DD/MM/YYYY`);
    }

    // Valida stato
    const normalizedStatus = status.toLowerCase().trim();
    let userStatus: 'active' | 'inactive' = 'active';
    if (normalizedStatus === 'disattivo' || normalizedStatus === 'inactive' || normalizedStatus === 'no' || normalizedStatus === 'false') {
      userStatus = 'inactive';
    }

    users.push({
      firstName,
      lastName,
      username,
      password,
      email,
      phone,
      matricola,
      status: userStatus,
      expirationDate: parsedDate,
      groupId: group.id
    });
  }

  return users;
};

// Helper functions
const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

const parseDate = (dateString: string): string | null => {
  // Try different date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      let day, month, year;
      
      if (format === formats[1]) { // YYYY-MM-DD
        [, year, month, day] = match;
      } else { // DD/MM/YYYY or DD-MM-YYYY
        [, day, month, year] = match;
      }
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // Validate the date
      if (date.getFullYear() == parseInt(year) && 
          date.getMonth() == parseInt(month) - 1 && 
          date.getDate() == parseInt(day)) {
        return date.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
      }
    }
  }
  
  return null;
};

// CSV Template generators
export const generateGroupsCSVTemplate = (): void => {
  const headers = ['Nome', 'Descrizione', 'Icona', 'Gestione Squadra', 'Gestione Partite', 'Visualizzazione Risultati', 'Visualizzazione Statistiche'];
  const exampleRow = ['Esempio Gruppo', 'Descrizione del gruppo', 'Users', 'SI', 'NO', 'SI', 'SI'];
  
  const csvContent = [headers, exampleRow]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  downloadCSV(csvContent, 'template_gruppi.csv');
};

export const generateUsersCSVTemplate = (): void => {
  const headers = ['Nome', 'Cognome', 'Username', 'Password', 'Email', 'Cellulare', 'Matricola', 'Stato', 'Data Scadenza', 'Gruppo'];
  const exampleRow = ['Mario', 'Rossi', 'mario.rossi', 'password123', 'mario.rossi@email.com', '3331234567', 'MAT001', 'Attivo', '31/12/2025', 'Amministratori'];
  
  const csvContent = [headers, exampleRow]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  downloadCSV(csvContent, 'template_utenti.csv');
};
