import { Group } from '../types';
import { 
  Edit2, 
  Trash2, 
  Shield, 
  Users, 
  Check, 
  X,
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
  Eye, 
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
  Layers
} from 'lucide-react';

interface GroupListProps {
  groups: Group[];
  onEdit: (group: Group) => void;
  onDelete: (groupId: string) => void;
}

export function GroupList({ groups, onEdit, onDelete }: GroupListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, any> = {
      Shield, Users, Crown, UserCheck, Settings, Star, Award, Target, 
      Trophy, Briefcase, UserCog, Zap, Heart, Eye, Lock, Key, 
      Calendar, Flag, Camera, Lightbulb, Headphones, Stethoscope, 
      Clipboard, FileText, UserPlus, Database, Globe, Layers
    };
    return iconMap[iconName || 'Users'] || Users;
  };

  const getPermissionIcons = (permissions: Group['permissions']) => {
    const permissionList = [
      { key: 'teamManagement', label: 'Gestione Squadra', value: permissions.teamManagement },
      { key: 'matchManagement', label: 'Gestione Partite', value: permissions.matchManagement },
      { key: 'resultsView', label: 'Visualizzazione Risultati', value: permissions.resultsView },
      { key: 'statisticsView', label: 'Visualizzazione Statistiche', value: permissions.statisticsView }
    ];

    return (
      <div className="flex flex-wrap gap-1">
        {permissionList.map(permission => (
          <span
            key={permission.key}
            className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
              permission.value
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-500'
            }`}
            title={permission.label}
          >
            {permission.value ? (
              <Check className="w-3 h-3 mr-1" />
            ) : (
              <X className="w-3 h-3 mr-1" />
            )}
            {permission.label.split(' ')[0]}
          </span>
        ))}
      </div>
    );
  };

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">Nessun gruppo trovato</h3>
        <p className="text-gray-600">Inizia creando il primo gruppo.</p>
      </div>
    );
  }

  return (    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => {
        const GroupIcon = getIconComponent(group.icon);
        return (
          <div key={group.id} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <GroupIcon className="w-6 h-6 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => onEdit(group)}
                  className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                  title="Modifica gruppo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {group.id !== 'admin' && (
                  <button
                    onClick={() => {
                      if (confirm(`Sei sicuro di voler eliminare il gruppo "${group.name}"?`)) {
                        onDelete(group.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                    title="Elimina gruppo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {group.description && (
              <p className="text-sm text-gray-600 mb-4">{group.description}</p>
            )}

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Permessi:</h4>
              {getPermissionIcons(group.permissions)}
            </div>

            <div className="flex items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
              <Users className="w-3 h-3 mr-1" />
              Creato il {formatDate(group.createdAt)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
