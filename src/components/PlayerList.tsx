import React from 'react';
import { Player } from '../types';
import { Edit2, Trash2, User, Calendar, MapPin, Hash, CreditCard } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (playerId: string) => void;
}

export function PlayerList({ players, onEdit, onDelete }: PlayerListProps) {
  const activeplayers = players.filter(p => p.isActive);
  const inactivePlayers = players.filter(p => !p.isActive);

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

  const PlayerCard = ({ player }: { player: Player }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">#{player.jerseyNumber}</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">
                {player.firstName} {player.lastName}
              </h3>
              <p className="text-sm text-gray-600">{player.position}</p>
            </div>
          </div>
          <div className="flex gap-2">
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
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{calculateAge(player.birthDate)} anni</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CreditCard className="w-4 h-4" />
            <span>#{player.licenseNumber}</span>
          </div>
        </div>
      </div>
      {!player.isActive && (
        <div className="bg-gray-100 px-6 py-2">
          <span className="text-xs text-gray-600 font-medium">INATTIVO</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {activeplayers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            Giocatori Attivi ({activeplayers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeplayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      {inactivePlayers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Giocatori Inattivi ({inactivePlayers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactivePlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      {players.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nessun giocatore registrato</p>
          <p className="text-gray-400">Aggiungi il primo giocatore per iniziare</p>
        </div>
      )}
    </div>
  );
}