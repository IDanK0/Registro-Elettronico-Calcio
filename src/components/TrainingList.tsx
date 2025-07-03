import { Clock, Users, Edit2, Trash2, UserCheck, UserX, Calendar } from 'lucide-react';
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
        {/* Training Cards */}
        {sortedTrainings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nessun allenamento registrato</p>
            <p className="text-gray-400">Aggiungi il primo allenamento per iniziare</p>
          </div>
        ) : (
          sortedTrainings.map(training => {
            const presentCount = training.attendance.filter(att => att.isPresent).length;
            const totalCount = training.attendance.length;
            const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
            
            // Get present and absent players for details
            const presentPlayers = training.attendance
              .filter(att => att.isPresent)
              .map(att => getPlayerById(att.playerId))
              .filter(Boolean);
            
            const absentPlayers = training.attendance
              .filter(att => !att.isPresent)
              .map(att => getPlayerById(att.playerId))
              .filter(Boolean);

            return (
              <div key={training.id} className="bg-white rounded-xl shadow-md p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{formatDate(training.date)}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {training.time}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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

                {/* Attendance Stats */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Partecipazione
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{presentCount}/{totalCount}</span>
                      <span className={`text-sm font-bold ${attendanceRate >= 70 ? 'text-green-600' : attendanceRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {attendanceRate}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        attendanceRate >= 70 ? 'bg-green-500' : 
                        attendanceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                </div>

                {/* Present/Absent Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Presenti</span>
                    </div>
                    <span className="font-bold text-green-900">{presentCount}</span>
                  </div>
                  
                  {absentPlayers.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <UserX className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-800">Assenti</span>
                      </div>
                      <span className="font-bold text-red-900">{absentPlayers.length}</span>
                    </div>
                  )}
                </div>

                {/* Player details - collapsible */}
                {(presentPlayers.length > 0 || absentPlayers.length > 0) && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Dettagli partecipanti
                    </summary>
                    <div className="mt-3 space-y-3">
                      {presentPlayers.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-green-700 mb-2 uppercase tracking-wide">Presenti</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {presentPlayers.map(player => (
                              <div key={player?.id} className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-700">
                                  {player?.firstName?.charAt(0)}{player?.lastName?.charAt(0)}
                                </span>
                                <span className="truncate">{player?.firstName} {player?.lastName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {absentPlayers.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-red-700 mb-2 uppercase tracking-wide">Assenti</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {absentPlayers.map(player => (
                              <div key={player?.id} className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-xs font-medium text-red-700">
                                  {player?.firstName?.charAt(0)}{player?.lastName?.charAt(0)}
                                </span>
                                <span className="truncate">{player?.firstName} {player?.lastName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                )}
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
          const presentPlayers = training.attendance
            .filter(att => att.isPresent)
            .map(att => getPlayerById(att.playerId))
            .filter(Boolean);
          
          const absentPlayers = training.attendance
            .filter(att => !att.isPresent)
            .map(att => getPlayerById(att.playerId))
            .filter(Boolean);

          const totalPlayers = training.attendance.length;
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