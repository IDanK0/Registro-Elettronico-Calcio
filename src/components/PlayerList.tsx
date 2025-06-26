import { Player } from '../types';
import { Edit2, Trash2, User, ShieldCheck, ShieldOff, ChevronDown, Filter, Phone, Mail, UserPlus, Download, FileText, Upload, Eye } from 'lucide-react';
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
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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
                <button
                  onClick={() => {
                    setSelectedPlayer(player);
                    setShowDetailsModal(true);
                  }}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  title="Visualizza dettagli"
                >
                  <Eye className="w-4 h-4" />
                </button>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Età</th>
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
                      <div className="text-sm text-gray-800">{calculateAge(player.birthDate)} anni</div>
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
                          onClick={() => {
                            setSelectedPlayer(player);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Visualizza dettagli"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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

      {/* Modal Dettagli Giocatore */}
      {showDetailsModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <User className="w-7 h-7 text-blue-600" />
                  Dettagli Giocatore
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPlayer(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Informazioni Personali */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Informazioni Personali
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                      <div className="text-gray-900 font-medium">{selectedPlayer.firstName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Cognome</label>
                      <div className="text-gray-900 font-medium">{selectedPlayer.lastName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Data di Nascita</label>
                      <div className="text-gray-900">{new Date(selectedPlayer.birthDate).toLocaleDateString('it-IT')}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Età</label>
                      <div className="text-gray-900">{calculateAge(selectedPlayer.birthDate)} anni</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Numero Licenza</label>
                      <div className="text-gray-900 font-mono">#{selectedPlayer.licenseNumber}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Stato</label>
                      <div>
                        {selectedPlayer.isActive ? (
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contatti */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-green-600" />
                    Contatti
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Telefono</label>
                      <div className="text-gray-900">{selectedPlayer.phone || 'Non specificato'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                      <div className="text-gray-900">{selectedPlayer.email || 'Non specificato'}</div>
                    </div>
                  </div>
                </div>

                {/* Informazioni Genitore */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                    Informazioni Genitore
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Nome Genitore</label>
                      <div className="text-gray-900">{selectedPlayer.parentName || 'Non specificato'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Telefono Genitore</label>
                      <div className="text-gray-900">{selectedPlayer.parentPhone || 'Non specificato'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email Genitore</label>
                      <div className="text-gray-900">{selectedPlayer.parentEmail || 'Non specificato'}</div>
                    </div>
                  </div>
                </div>

                {/* Documenti */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Documenti Allegati
                  </h4>
                  {selectedPlayer.documents && selectedPlayer.documents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPlayer.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">{doc.fileName}</span>
                            <span className="text-xs text-gray-500">({doc.mimeType})</span>
                          </div>
                          <button
                            onClick={() => downloadDocument(doc)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Scarica
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Nessun documento allegato</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}