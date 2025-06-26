import { Clock, Users, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';
import { Training, Player } from '../types';
import { ExportTrainingAttendanceButton } from './ExportTrainingAttendanceButton';

interface TrainingListProps {
  trainings: Training[];
  players: Player[];
  onEdit: (training: Training) => void;
  onDelete: (trainingId: string) => void;
}

export function TrainingList({ trainings, players, onEdit, onDelete }: TrainingListProps) {
  const isMobile = useIsMobile();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const sortedTrainings = [...trainings].sort((a, b) => 
    new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
  );

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Export button - only show when there are trainings */}
        {sortedTrainings.length > 0 && (
          <div className="flex justify-end">
            <ExportTrainingAttendanceButton trainings={trainings} players={players} />
          </div>
        )}
        
        {sortedTrainings.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nessun allenamento registrato</p>
            <p className="text-gray-400">Aggiungi il primo allenamento per iniziare</p>
          </div>
        ) : (
          sortedTrainings.map(training => {
            const presentCount = Object.values(training.attendances).filter(v => v).length;
            const totalCount = Object.keys(training.attendances).length;
            const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
            return (
              <div key={training.id} className="bg-white rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{formatDate(training.date)}</h3>
                    <p className="text-sm text-gray-600">{training.time}</p>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {presentCount}/{totalCount} ({attendanceRate}%)
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => onEdit(training)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => onDelete(training.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export button - only show when there are trainings */}
      {sortedTrainings.length > 0 && (
        <div className="flex justify-end">
          <ExportTrainingAttendanceButton trainings={trainings} players={players} />
        </div>
      )}
      
      {sortedTrainings.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nessun allenamento registrato</p>
          <p className="text-gray-400">Aggiungi il primo allenamento per iniziare</p>
        </div>
      ) : (
        sortedTrainings.map(training => {
          const presentPlayers = Object.entries(training.attendances)
            .filter(([_, isPresent]) => isPresent)
            .map(([playerId]) => getPlayerById(playerId))
            .filter(Boolean);
          
          const absentPlayers = Object.entries(training.attendances)
            .filter(([_, isPresent]) => !isPresent)
            .map(([playerId]) => getPlayerById(playerId))
            .filter(Boolean);

          const totalPlayers = Object.keys(training.attendances).length;
          const attendanceRate = totalPlayers > 0 ? (presentPlayers.length / totalPlayers) * 100 : 0;

          return (
            <div key={training.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {formatDate(training.date)}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {training.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(training)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Modifica allenamento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(training.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Elimina allenamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Partecipazione: {presentPlayers.length}/{totalPlayers}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {attendanceRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                      <UserCheck className="w-4 h-4" />
                      Presenti ({presentPlayers.length})
                    </h4>
                    <div className="space-y-1">
                      {presentPlayers.map(player => (
                        <div key={player?.id} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                            {player?.firstName?.charAt(0)}{player?.lastName?.charAt(0)}
                          </span>
                          {player?.firstName} {player?.lastName}
                        </div>
                      ))}
                    </div>
                  </div>

                  {absentPlayers.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                        <UserX className="w-4 h-4" />
                        Assenti ({absentPlayers.length})
                      </h4>
                      <div className="space-y-1">
                        {absentPlayers.map(player => (
                          <div key={player?.id} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-500">
                              {player?.firstName?.charAt(0)}{player?.lastName?.charAt(0)}
                            </span>
                            {player?.firstName} {player?.lastName}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}