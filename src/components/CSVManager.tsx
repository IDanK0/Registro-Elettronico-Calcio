import { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Group, UserWithGroup } from '../types';
import { 
  exportGroupsToCSV, 
  exportUsersToCSV, 
  parseGroupsFromCSV, 
  parseUsersFromCSV,
  generateGroupsCSVTemplate,
  generateUsersCSVTemplate
} from '../utils/csvUtils';

interface CSVManagerProps {
  groups: Group[];
  users: UserWithGroup[];
  onImportGroups: (groups: Omit<Group, 'id' | 'createdAt'>[]) => void;
  onImportUsers: (users: Omit<import('../types').User, 'id' | 'createdAt'>[]) => void;
}

type ImportStatus = 'idle' | 'success' | 'error';

export function CSVManager({ groups, users, onImportGroups, onImportUsers }: CSVManagerProps) {
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importMessage, setImportMessage] = useState<string>('');

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>, type: 'groups' | 'users') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      
      if (type === 'groups') {
        const parsedGroups = parseGroupsFromCSV(text);
        onImportGroups(parsedGroups);
        setImportStatus('success');
        setImportMessage(`${parsedGroups.length} gruppi importati con successo`);
      } else {
        const parsedUsers = parseUsersFromCSV(text, groups);
        onImportUsers(parsedUsers);
        setImportStatus('success');
        setImportMessage(`${parsedUsers.length} utenti importati con successo`);
      }
    } catch (error) {
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : 'Errore durante l\'importazione');
    }

    // Reset file input
    event.target.value = '';

    // Clear message after 5 seconds
    setTimeout(() => {
      setImportStatus('idle');
      setImportMessage('');
    }, 5000);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Gestione Import/Export CSV</h3>
      
      {/* Status Message */}
      {importStatus !== 'idle' && (
        <div className={`mb-6 p-4 rounded-md flex items-center ${
          importStatus === 'success' 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {importStatus === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {importMessage}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Groups Section */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Gestione Gruppi
          </h4>
          
          <div className="space-y-3">
            <button
              onClick={() => exportGroupsToCSV(groups)}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Esporta Gruppi
            </button>
            
            <button
              onClick={generateGroupsCSVTemplate}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <FileText className="w-4 h-4 mr-2" />
              Scarica Template
            </button>
            
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileImport(e, 'groups')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="groups-csv-input"
              />
              <label
                htmlFor="groups-csv-input"
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importa Gruppi
              </label>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Gestione Utenti
          </h4>
          
          <div className="space-y-3">
            <button
              onClick={() => exportUsersToCSV(users)}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Esporta Utenti
            </button>
            
            <button
              onClick={generateUsersCSVTemplate}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <FileText className="w-4 h-4 mr-2" />
              Scarica Template
            </button>
            
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileImport(e, 'users')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="users-csv-input"
              />
              <label
                htmlFor="users-csv-input"
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importa Utenti
              </label>
            </div>
          </div>
        </div>
      </div>      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Istruzioni:</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Scarica il template per vedere il formato corretto del CSV</li>
          <li>• Per i gruppi: usa "SI" o "NO" per i permessi</li>
          <li>• Per le icone dei gruppi: usa uno dei nomi seguenti: Shield, Users, Crown, UserCheck, Settings, Star, Award, Target, Trophy, Briefcase, UserCog, Zap, Heart, Eye, Lock, Key, Calendar, Flag, Camera, Lightbulb, Headphones, Stethoscope, Clipboard, FileText, UserPlus, Database, Globe, Layers (se lasciato vuoto verrà usata "Users")</li>
          <li>• Per gli utenti: assicurati che i gruppi esistano prima dell'importazione</li>
          <li>• Le date devono essere nel formato DD/MM/YYYY</li>
          <li>• I file devono essere in formato CSV con codifica UTF-8</li>
        </ul>
      </div>
    </div>
  );
}
