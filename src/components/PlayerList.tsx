import { Player } from '../types';
import { Edit2, Trash2, User, ShieldCheck, ShieldOff, ChevronDown, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import useIsMobile from '../hooks/useIsMobile';

interface PlayerListProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (playerId: string) => void;
}

export function PlayerList({ players, onEdit, onDelete }: PlayerListProps) {
  const [sortBy, setSortBy] = useState('lastName');
  const [filterStatus, setFilterStatus] = useState('all');
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
        case 'jerseyNumber':
          return a.jerseyNumber - b.jerseyNumber;
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
          <div key={player.id} className="bg-white rounded-xl shadow-md p-4 flex justify-between items-center">
            <div>
              <div className="text-base font-semibold text-gray-900">{player.firstName} {player.lastName}</div>
              <div className="text-sm text-gray-500">#{player.jerseyNumber} &bull; {player.position} &bull; {calculateAge(player.birthDate)} anni</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onEdit(player)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Modifica">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(player.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Elimina">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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
        </div>

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
                <option value="jerseyNumber">Ordina per N. Maglia</option>
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
                  <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">N. Maglia</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ruolo</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-lg text-gray-900 font-bold">{player.jerseyNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{player.position}</div>
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