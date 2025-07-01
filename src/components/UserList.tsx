import { UserWithGroup } from '../types';
import { 
  Edit2, 
  Trash2, 
  User as UserIcon, 
  Shield, 
  Clock, 
  ChevronDown, 
  Filter, 
  Eye,
  Users,
  Crown,
  UserCheck,
  Settings,
  Star,
  Award,
  Target,
  Trophy,
  Briefcase,
  UserCog,
  Zap,
  Heart,
  Lock,
  Key,
  Calendar,
  Flag,
  Camera,
  Lightbulb,
  Headphones,
  Stethoscope,
  Clipboard,
  FileText,
  UserPlus,
  Database,
  Globe,
  Layers,
  Phone,
  Mail
} from 'lucide-react';
import { useState, useMemo } from 'react';
import useIsMobile from '../hooks/useIsMobile';

interface UserListProps {
  users: UserWithGroup[];
  onEdit: (user: UserWithGroup) => void;
  onDelete: (userId: string) => void;
}

export function UserList({ users, onEdit, onDelete }: UserListProps) {
  const [sortBy, setSortBy] = useState('lastName');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserWithGroup | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const isMobile = useIsMobile();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const isExpired = (expirationDate: string) => {
    return new Date(expirationDate) < new Date();
  };
  const getStatusBadge = (user: UserWithGroup) => {
    if (user.status === 'inactive') {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Disattivo</span>;
    }
    if (isExpired(user.expirationDate)) {
      return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Scaduto</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Attivo</span>;
  };

  const getGroupIcon = (iconName?: string) => {
    const iconMap: Record<string, any> = {
      Shield, Users, Crown, UserCheck, Settings, Star, Award, Target, 
      Trophy, Briefcase, UserCog, Zap, Heart, Eye, Lock, Key, 
      Calendar, Flag, Camera, Lightbulb, Headphones, Stethoscope, 
      Clipboard, FileText, UserPlus, Database, Globe, Layers
    };
    return iconMap[iconName || 'Users'] || Users;
  };

  const processedUsers = useMemo(() => {
    let filtered = users;
    if (filterStatus === 'active') {
      filtered = users.filter(u => u.status === 'active' && !isExpired(u.expirationDate));
    } else if (filterStatus === 'inactive') {
      filtered = users.filter(u => u.status === 'inactive' || isExpired(u.expirationDate));
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'firstName':
          return a.firstName.localeCompare(b.firstName);
        case 'username':
          return a.username.localeCompare(b.username);
        case 'group':
          return a.group.name.localeCompare(b.group.name);
        case 'expirationDate':
          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        case 'lastName':
        default:
          return a.lastName.localeCompare(b.lastName);
      }
    });
  }, [users, sortBy, filterStatus]);

  // Mobile view: render cards
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-4">
            <UserIcon className="w-7 h-7 text-blue-600" />
            <span>Gestione Utenti</span>
          </h2>
          
          {/* Filters */}
          <div className="space-y-3">
            <div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="lastName">Ordina per Cognome</option>
                <option value="firstName">Ordina per Nome</option>
                <option value="username">Ordina per Username</option>
                <option value="group">Ordina per Gruppo</option>
                <option value="expirationDate">Ordina per Scadenza</option>
              </select>
            </div>
            <div className="flex rounded-md shadow-sm border border-gray-300">
              <button 
                onClick={() => setFilterStatus('all')} 
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md transition-colors ${
                  filterStatus === 'all' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tutti
              </button>
              <button 
                onClick={() => setFilterStatus('active')} 
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-r border-gray-300 ${
                  filterStatus === 'active' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Attivi
              </button>
              <button 
                onClick={() => setFilterStatus('inactive')} 
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md transition-colors ${
                  filterStatus === 'inactive' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Inattivi
              </button>
            </div>
          </div>
        </div>

        {/* User Cards */}
        {processedUsers.map(user => (
          <div key={user.id} className="bg-white rounded-xl shadow-md p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="text-sm text-gray-600 mt-1">
                  @{user.username} • {user.matricola}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowDetailsModal(true);
                  }}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  title="Visualizza dettagli"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => onEdit(user)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Modifica">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(user.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Elimina">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Group info */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const GroupIcon = getGroupIcon(user.group.icon);
                  return <GroupIcon className="w-4 h-4 text-blue-500" />;
                })()}
                <span className="text-sm font-medium text-gray-700">{user.group.name}</span>
              </div>
            </div>

            {/* Status and expiration */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {getStatusBadge(user)}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span className={isExpired(user.expirationDate) ? 'text-red-600 font-medium' : ''}>
                  {formatDate(user.expirationDate)}
                </span>
              </div>
            </div>

            {/* Contact info */}
            {(user.phone || user.email) && (
              <div className="border-t pt-3 mt-3 space-y-1">
                {user.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {user.phone}
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {user.email}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {processedUsers.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nessun utente trovato</p>
            <p className="text-gray-400">Modifica i filtri per vedere più risultati</p>
          </div>
        )}

        {/* Modal Dettagli Utente */}
        {showDetailsModal && selectedUser && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              // Chiudi il modal se si clicca sul backdrop
              if (e.target === e.currentTarget) {
                setShowDetailsModal(false);
                setSelectedUser(null);
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <UserIcon className="w-7 h-7 text-blue-600" />
                    Dettagli Utente
                  </h3>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedUser(null);
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
                      <UserIcon className="w-5 h-5 text-blue-600" />
                      Informazioni Personali
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                        <div className="text-gray-900 font-medium">{selectedUser.firstName}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Cognome</label>
                        <div className="text-gray-900 font-medium">{selectedUser.lastName}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
                        <div className="text-gray-900 font-mono">@{selectedUser.username}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Matricola</label>
                        <div className="text-gray-900 font-mono">{selectedUser.matricola}</div>
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
                        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                        <div className="text-gray-900">{selectedUser.email}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Telefono</label>
                        <div className="text-gray-900">{selectedUser.phone}</div>
                      </div>
                    </div>
                  </div>

                  {/* Gruppo e Permessi */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      {(() => {
                        const GroupIcon = getGroupIcon(selectedUser.group.icon);
                        return <GroupIcon className="w-5 h-5 text-blue-600" />;
                      })()}
                      Gruppo e Permessi
                    </h4>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Gruppo</label>
                      <div className="text-gray-900 font-medium flex items-center gap-2">
                        {(() => {
                          const GroupIcon = getGroupIcon(selectedUser.group.icon);
                          return <GroupIcon className="w-4 h-4 text-blue-500" />;
                        })()}
                        {selectedUser.group.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Permessi</label>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(selectedUser.group.permissions).map(([key, value]) => (
                          <div key={key} className={`flex items-center gap-2 p-2 rounded ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm">
                              {key === 'teamManagement' && 'Gestione Squadra'}
                              {key === 'matchManagement' && 'Gestione Partite'}
                              {key === 'resultsView' && 'Visualizzazione Risultati'}
                              {key === 'statisticsView' && 'Visualizzazione Statistiche'}
                              {key === 'userManagement' && 'Gestione Utenti'}
                              {key === 'groupManagement' && 'Gestione Gruppi'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stato e Scadenza */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      Stato Account
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Stato</label>
                        <div>{getStatusBadge(selectedUser)}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Data Scadenza</label>
                        <div className={`font-medium ${isExpired(selectedUser.expirationDate) ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDate(selectedUser.expirationDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Nessun utente trovato</h3>
          <p className="text-gray-600">Inizia creando il primo utente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <UserIcon className="w-8 h-8 text-blue-600" />
            <span>Gestione Utenti</span>
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
                <option value="username">Ordina per Username</option>
                <option value="group">Ordina per Gruppo</option>
                <option value="expirationDate">Ordina per Scadenza</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex rounded-md shadow-sm border border-gray-300">
              <button 
                onClick={() => setFilterStatus('all')} 
                className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${
                  filterStatus === 'all' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tutti
              </button>
              <button 
                onClick={() => setFilterStatus('active')} 
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-r border-gray-300 ${
                  filterStatus === 'active' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Attivi
              </button>
              <button 
                onClick={() => setFilterStatus('inactive')} 
                className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${
                  filterStatus === 'inactive' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Inattivi
              </button>
            </div>
          </div>
        </div>

        {processedUsers.length > 0 ? (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Utente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Gruppo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Scadenza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username} • {user.matricola}
                        </div>
                      </div>
                    </td>                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {(() => {
                          const GroupIcon = getGroupIcon(user.group.icon);
                          return <GroupIcon className="w-4 h-4 mr-2 text-blue-500" />;
                        })()}
                        <span className="text-sm font-medium text-gray-900">
                          {user.group.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className={isExpired(user.expirationDate) ? 'text-red-600 font-medium' : ''}>
                          {formatDate(user.expirationDate)}
                        </span>
                      </div>
                    </td>                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Visualizza dettagli"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Modifica utente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Sei sicuro di voler eliminare l'utente ${user.firstName} ${user.lastName}?`)) {
                              onDelete(user.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Elimina utente"
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
            <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nessun utente corrisponde ai filtri selezionati</p>
            <p className="text-gray-400">Modifica i filtri per vedere più risultati</p>
          </div>        )}
      </div>

      {/* Modal Dettagli Utente */}
      {showDetailsModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Chiudi il modal se si clicca sul backdrop
            if (e.target === e.currentTarget) {
              setShowDetailsModal(false);
              setSelectedUser(null);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <UserIcon className="w-7 h-7 text-blue-600" />
                  Dettagli Utente
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
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
                    <UserIcon className="w-5 h-5 text-blue-600" />
                    Informazioni Personali
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                      <div className="text-gray-900 font-medium">{selectedUser.firstName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Cognome</label>
                      <div className="text-gray-900 font-medium">{selectedUser.lastName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
                      <div className="text-gray-900 font-mono">@{selectedUser.username}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Matricola</label>
                      <div className="text-gray-900 font-mono">{selectedUser.matricola}</div>
                    </div>
                  </div>
                </div>

                {/* Contatti */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contatti
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                      <div className="text-gray-900">{selectedUser.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Telefono</label>
                      <div className="text-gray-900">{selectedUser.phone}</div>
                    </div>
                  </div>
                </div>

                {/* Gruppo e Permessi */}                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    {(() => {
                      const GroupIcon = getGroupIcon(selectedUser.group.icon);
                      return <GroupIcon className="w-5 h-5 text-blue-600" />;
                    })()}
                    Gruppo e Permessi
                  </h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Gruppo</label>
                    <div className="text-gray-900 font-medium flex items-center gap-2">
                      {(() => {
                        const GroupIcon = getGroupIcon(selectedUser.group.icon);
                        return <GroupIcon className="w-4 h-4 text-blue-500" />;
                      })()}
                      {selectedUser.group.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Permessi</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(selectedUser.group.permissions).map(([key, value]) => (
                        <div key={key} className={`flex items-center gap-2 p-2 rounded ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm">
                            {key === 'teamManagement' && 'Gestione Squadra'}
                            {key === 'matchManagement' && 'Gestione Partite'}
                            {key === 'resultsView' && 'Visualizzazione Risultati'}
                            {key === 'statisticsView' && 'Visualizzazione Statistiche'}
                            {key === 'userManagement' && 'Gestione Utenti'}
                            {key === 'groupManagement' && 'Gestione Gruppi'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stato e Scadenza */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Stato Account
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Stato</label>
                      <div>{getStatusBadge(selectedUser)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Data Scadenza</label>
                      <div className={`font-medium ${isExpired(selectedUser.expirationDate) ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(selectedUser.expirationDate)}
                      </div>
                    </div>
                  </div>                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
