import { UserWithGroup } from '../types';
import { Edit2, Trash2, Mail, Phone, User as UserIcon, Shield, Clock } from 'lucide-react';

interface UserListProps {
  users: UserWithGroup[];
  onEdit: (user: UserWithGroup) => void;
  onDelete: (userId: string) => void;
}

export function UserList({ users, onEdit, onDelete }: UserListProps) {
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

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">Nessun utente trovato</h3>
        <p className="text-gray-600">Inizia creando il primo utente.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contatti
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gruppo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scadenza
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username} • {user.matricola}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {user.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {user.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {user.group.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.entries(user.group.permissions)
                      .filter(([, value]) => value)
                      .map(([key]) => {
                        switch (key) {
                          case 'teamManagement': return 'Gestione Squadra';
                          case 'matchManagement': return 'Gestione Partite';
                          case 'resultsView': return 'Visualizzazione Risultati';
                          case 'statisticsView': return 'Visualizzazione Statistiche';
                          default: return key;
                        }
                      })
                      .join(', ')}
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
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
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
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
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
    </div>
  );
}
