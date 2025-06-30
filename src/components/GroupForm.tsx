import { useState, useEffect } from 'react';
import { Group } from '../types';
import { 
  Shield, 
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

interface GroupFormProps {
  group?: Group;
  onSubmit: (groupData: Omit<Group, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function GroupForm({ group, onSubmit, onCancel }: GroupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Users',
    permissions: {
      teamManagement: false,
      matchManagement: false,
      resultsView: false,
      statisticsView: false,
      userManagement: false,
      groupManagement: false
    }
  });
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        icon: group.icon || 'Users',
        permissions: { ...group.permissions }
      });
    }
  }, [group]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [name]: checkbox.checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const permissionLabels = {
    teamManagement: 'Gestione Squadra',
    matchManagement: 'Gestione Partite',
    resultsView: 'Visualizzazione Risultati',
    statisticsView: 'Visualizzazione Statistiche',
    userManagement: 'Gestione Utenti',
    groupManagement: 'Gestione Gruppi'
  };
  const permissionDescriptions = {
    teamManagement: 'Permette di aggiungere, modificare ed eliminare giocatori e staff',
    matchManagement: 'Permette di creare, modificare ed eliminare partite e allenamenti',
    resultsView: 'Permette di visualizzare i risultati delle partite',
    statisticsView: 'Permette di visualizzare le statistiche dei giocatori e della squadra',
    userManagement: 'Permette di gestire gli utenti del sistema',
    groupManagement: 'Permette di gestire i gruppi e i loro permessi'
  };

  // Catalogo icone disponibili
  const availableIcons = [
    { name: 'Shield', component: Shield, label: 'Scudo' },
    { name: 'Users', component: Users, label: 'Utenti' },
    { name: 'Crown', component: Crown, label: 'Corona' },
    { name: 'UserCheck', component: UserCheck, label: 'Utente Verificato' },
    { name: 'Settings', component: Settings, label: 'Impostazioni' },
    { name: 'Star', component: Star, label: 'Stella' },
    { name: 'Award', component: Award, label: 'Premio' },
    { name: 'Target', component: Target, label: 'Obiettivo' },
    { name: 'Trophy', component: Trophy, label: 'Trofeo' },
    { name: 'Briefcase', component: Briefcase, label: 'Valigetta' },
    { name: 'UserCog', component: UserCog, label: 'Configurazione Utente' },
    { name: 'Zap', component: Zap, label: 'Fulmine' },
    { name: 'Heart', component: Heart, label: 'Cuore' },
    { name: 'Eye', component: Eye, label: 'Occhio' },
    { name: 'Lock', component: Lock, label: 'Lucchetto' },
    { name: 'Key', component: Key, label: 'Chiave' },
    { name: 'Calendar', component: Calendar, label: 'Calendario' },
    { name: 'Flag', component: Flag, label: 'Bandiera' },
    { name: 'Camera', component: Camera, label: 'Telecamera' },
    { name: 'Lightbulb', component: Lightbulb, label: 'Lampadina' },
    { name: 'Headphones', component: Headphones, label: 'Cuffie' },
    { name: 'Stethoscope', component: Stethoscope, label: 'Stetoscopio' },
    { name: 'Clipboard', component: Clipboard, label: 'Blocco Note' },
    { name: 'FileText', component: FileText, label: 'Documento' },
    { name: 'UserPlus', component: UserPlus, label: 'Aggiungi Utente' },
    { name: 'Database', component: Database, label: 'Database' },
    { name: 'Globe', component: Globe, label: 'Globo' },
    { name: 'Layers', component: Layers, label: 'Livelli' }
  ];

  const getIconComponent = (iconName: string) => {
    const icon = availableIcons.find(i => i.name === iconName);
    return icon ? icon.component : Users;
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {group ? 'Modifica Gruppo' : 'Nuovo Gruppo'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Gruppo*
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrizione
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descrizione opzionale del gruppo..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Icona Gruppo
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2 p-4 border border-gray-300 rounded-md max-h-48 overflow-y-auto">
            {availableIcons.map((icon) => {
              const IconComponent = icon.component;
              const isSelected = formData.icon === icon.name;
              return (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon: icon.name }))}
                  className={`p-3 rounded-lg border-2 transition-all hover:bg-gray-50 flex flex-col items-center justify-center gap-1 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 text-gray-600'
                  }`}
                  title={icon.label}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-xs font-medium truncate w-full text-center">{icon.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span>Icona selezionata:</span>
            {(() => {
              const SelectedIcon = getIconComponent(formData.icon);
              return <SelectedIcon className="w-4 h-4" />;
            })()}
            <span className="font-medium">{availableIcons.find(i => i.name === formData.icon)?.label}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Permessi
          </label>
          <div className="space-y-4">
            {Object.entries(permissionLabels).map(([key, label]) => (
              <div key={key} className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    name={key}
                    checked={formData.permissions[key as keyof typeof formData.permissions]}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-900">
                    {label}
                  </label>
                  <p className="text-sm text-gray-500">
                    {permissionDescriptions[key as keyof typeof permissionDescriptions]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {group ? 'Aggiorna' : 'Crea'} Gruppo
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
