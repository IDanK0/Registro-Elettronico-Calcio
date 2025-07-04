import React, { useState } from 'react';
import { Training, Player } from '../types';
import { Calendar, Clock, Users, Check, X } from 'lucide-react';

interface TrainingFormProps {
  players: Player[];
  onSubmit: (training: Omit<Training, 'id'>) => void;
  initialData?: Training;
  onCancel?: () => void;
}

export function TrainingForm({ players, onSubmit, initialData, onCancel }: TrainingFormProps) {
  // Compute active players
  const activePlayers = players.filter(p => p.isActive);
  // Default attendances: for new training, mark all present (true)
  const defaultAttendances: Record<string, boolean> = {};
  activePlayers.forEach(p => { defaultAttendances[p.id] = true; });
  
  // Convert initialData.attendance array to attendances object for form compatibility
  const initialAttendances = initialData?.attendance 
    ? initialData.attendance.reduce((acc, att) => {
        acc[att.playerId] = att.isPresent;
        return acc;
      }, {} as Record<string, boolean>)
    : defaultAttendances;
  
  // Initialize form data, using existing attendances or default present
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    time: initialData?.time || '18:00',
    attendances: initialAttendances
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert attendances object to attendance array for backend
    const attendance = Object.entries(formData.attendances).map(([playerId, isPresent]) => ({
      playerId,
      isPresent
    }));
    
    const trainingData: any = {
      date: formData.date,
      time: formData.time,
      attendance,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };
    
    onSubmit(trainingData);
  };

  const toggleAttendance = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      attendances: {
        ...prev.attendances,
        [playerId]: !prev.attendances[playerId]
      }
    }));
  };

  const setAllPresent = () => {
    const allPresent = activePlayers.reduce((acc, player) => {
      acc[player.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setFormData(prev => ({ ...prev, attendances: allPresent }));
  };

  const setAllAbsent = () => {
    const allAbsent = activePlayers.reduce((acc, player) => {
      acc[player.id] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setFormData(prev => ({ ...prev, attendances: allAbsent }));
  };

  const presentCount = Object.values(formData.attendances).filter(Boolean).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Users className="w-5 h-5 text-green-600" />
        {initialData ? 'Modifica Allenamento' : 'Nuovo Allenamento'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Data
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Orario
            </label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Presenze ({presentCount}/{activePlayers.length})
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={setAllPresent}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              >
                Tutti Presenti
              </button>
              <button
                type="button"
                onClick={setAllAbsent}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                Tutti Assenti
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activePlayers.map(player => {
              const isPresent = formData.attendances[player.id] || false;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    isPresent
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleAttendance(player.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{player.firstName.charAt(0)}{player.lastName.charAt(0)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">
                        {player.firstName} {player.lastName}
                      </span>
                      <p className="text-sm text-gray-600">{player.licenseNumber}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isPresent ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {isPresent ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <X className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {initialData ? 'Aggiorna' : 'Salva'} Allenamento
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Annulla
            </button>
          )}
        </div>
      </form>
    </div>
  );
}