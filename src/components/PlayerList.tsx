import { Player } from '../types';
import { Edit2, Trash2, User, ShieldCheck, ShieldOff, ChevronDown, Filter, Phone, Mail, UserPlus, Download, FileText, Upload } from 'lucide-react';
import { useState, useMemo } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import { exportPlayersToCSV, parsePlayersFromCSV, generatePlayersCSVTemplate } from '../utils/csvUtils';

interface PlayerListProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (playerId: string) => void;
  onImportPlayers: (players: Omit<Player, 'id'>[]) => void;
}

export function PlayerList({ players, onEdit, onDelete, onImportPlayers }: PlayerListProps) {
  const [sortBy, setSortBy] = useState('lastName');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCSVMenu, setShowCSVMenu] = useState(false);
  const [importMessage, setImportMessage] = useState<string>('');
  const isMobile = useIsMobile();

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const downloadDocument = (doc: any) => {
    const link = document.createElement('a');
    link.href = `data:${doc.mimeType};base64,${doc.data}`;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedPlayers = parsePlayersFromCSV(text);
      onImportPlayers(parsedPlayers);
      setImportMessage(`${parsedPlayers.length} giocatori importati con successo`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Errore durante l\'importazione');
    }

    // Reset file input
    event.target.value = '';

    // Clear message after 5 seconds
    setTimeout(() => {
      setImportMessage('');
    }, 5000);
  };

  const processedPlayers = useMemo(() => {
    let filtered = players;
    if (filterStatus === 'active') {
      filtered = players.filter(p => p.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = players.filter(p => !p.isActive);
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'firstName':
          return a.firstName.localeCompare(b.firstName);
        case 'age':
          return calculateAge(a.birthDate) - calculateAge(b.birthDate);
        case 'lastName':
        default:
          return a.lastName.localeCompare(b.lastName);
      }
    });
  }, [players, sortBy, filterStatus]);

  // Mobile view: render cards
  if (isMobile) {
    return (
      <div className="space-y-4">
        {processedPlayers.map(player => (
          <div key={player.id} className="bg-white rounded-xl shadow-md p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-base font-semibold text-gray-900">{player.firstName} {player.lastName}</div>
                <div className="text-sm text-gray-500">Tessera: {player.licenseNumber} • {calculateAge(player.birthDate)} anni</div>
              </div>
              <div className="flex items-center gap-2">
                {player.documents && player.documents.length > 0 && (
                  <button
                    onClick={() => downloadDocument(player.documents![0])}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Documenti disponibili"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => onEdit(player)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Modifica">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(player.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Elimina">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Contact info */}
            {(player.phone || player.email) && (
              <div className="border-t pt-3 space-y-1">
                {player.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{player.phone}</span>
                  </div>
                )}
                {player.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{player.email}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Parent info */}
            {player.parentName && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <UserPlus className="w-4 h-4" />
                  <span className="font-medium">Genitore: {player.parentName}</span>
                </div>
                <div className="pl-6 space-y-1">
                  {player.parentPhone && (
                    <div className="text-xs text-gray-500">{player.parentPhone}</div>
                  )}
                  {player.parentEmail && (
                    <div className="text-xs text-gray-500">{player.parentEmail}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            <span>Elenco Giocatori</span>
          </h2>
          
          {/* CSV Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowCSVMenu(!showCSVMenu)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              {showCSVMenu && (
                <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border z-50 min-w-[180px]">
                  <button 
                    onClick={() => {
                      exportPlayersToCSV(players);
                      setShowCSVMenu(false);
                    }} 
                    className="w-full px-4 py-2 hover:bg-blue-50 text-blue-700 text-left flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> 
                    Esporta Giocatori
                  </button>
                  <button 
                    onClick={() => {
                      generatePlayersCSVTemplate();
                      setShowCSVMenu(false);
                    }} 
                    className="w-full px-4 py-2 hover:bg-gray-50 text-gray-700 text-left flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> 
                    Template CSV
                  </button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileImport}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="players-csv-input"
                    />
                    <label
                      htmlFor="players-csv-input"
                      className="w-full px-4 py-2 hover:bg-green-50 text-green-700 text-left flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Importa Giocatori
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Import message */}
        {importMessage && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">{importMessage}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-4 bg-gray-50 p-4 rounded-lg flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <select 
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none block w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="lastName">Ordina per Cognome</option>
                <option value="firstName">Ordina per Nome</option>
                <option value="age">Ordina per Età</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex rounded-md shadow-sm border border-gray-300">
              <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${filterStatus === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Tutti</button>
              <button onClick={() => setFilterStatus('active')} className={`px-4 py-2 text-sm font-medium transition-colors border-l border-r border-gray-300 ${filterStatus === 'active' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Attivi</button>
              <button onClick={() => setFilterStatus('inactive')} className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${filterStatus === 'inactive' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Inattivi</button>
            </div>
          </div>
        </div>
        
        {processedPlayers.length > 0 ? (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Giocatore</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Contatti</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Genitore</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Età</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Documenti</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Stato</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Azioni</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedPlayers.map((player, index) => (
                  <tr key={player.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-11 w-11 bg-blue-100 rounded-full flex items-center justify-center ring-2 ring-blue-200">
                          <span className="text-blue-700 font-bold text-base">{player.firstName.charAt(0)}{player.lastName.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{player.firstName} {player.lastName}</div>
                          <div className="text-xs text-gray-500">Licenza: #{player.licenseNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {player.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{player.phone}</span>
                          </div>
                        )}
                        {player.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-32" title={player.email}>{player.email}</span>
                          </div>
                        )}
                        {!player.phone && !player.email && (
                          <span className="text-xs text-gray-400">Nessun contatto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {player.parentName ? (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-900">{player.parentName}</div>
                          {player.parentPhone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{player.parentPhone}</span>
                            </div>
                          )}
                          {player.parentEmail && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-32" title={player.parentEmail}>{player.parentEmail}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Non specificato</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{calculateAge(player.birthDate)} anni</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {player.documents && player.documents.length > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => downloadDocument(player.documents![0])}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title={`${player.documents.length} documento/i disponibile/i`}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-gray-500">({player.documents.length})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Nessuno</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {player.isActive ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          Attivo
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 items-center gap-1.5">
                          <ShieldOff className="w-4 h-4" />
                          Inattivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(player)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Modifica giocatore"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(player.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Elimina giocatore"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nessun giocatore registrato</p>
            <p className="text-gray-400">Aggiungi il primo giocatore per iniziare</p>
          </div>
        )}
      </div>
    </div>
  );
}