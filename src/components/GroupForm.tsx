import { useState, useEffect } from 'react';
import { Group } from '../types';

interface GroupFormProps {
  group?: Group;
  onSubmit: (groupData: Omit<Group, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function GroupForm({ group, onSubmit, onCancel }: GroupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      teamManagement: false,
      matchManagement: false,
      resultsView: false,
      statisticsView: false
    }
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
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
    statisticsView: 'Visualizzazione Statistiche'
  };

  const permissionDescriptions = {
    teamManagement: 'Permette di aggiungere, modificare ed eliminare giocatori e staff',
    matchManagement: 'Permette di creare, modificare ed eliminare partite e allenamenti',
    resultsView: 'Permette di visualizzare i risultati delle partite',
    statisticsView: 'Permette di visualizzare le statistiche dei giocatori e della squadra'
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
