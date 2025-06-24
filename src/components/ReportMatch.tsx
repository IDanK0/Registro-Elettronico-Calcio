import React from 'react';
import { Match, Player } from '../types';

interface ReportMatchProps {
  match: Match;
  players: Player[];
  onClose: () => void;
}

export function ReportMatch({ match, players, onClose }: ReportMatchProps) {
  // Trova i giocatori titolari
  const lineupPlayers = players.filter(p => match.lineup.includes(p.id));

  // Eventi
  const goals = match.events.filter(e => e.type === 'goal');
  const cards = match.events.filter(e => [
    'yellow-card','red-card','second-yellow-card','blue-card','expulsion','warning'
  ].includes(e.type));
  const substitutions = match.substitutions;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative overflow-y-auto max-h-[90vh] border-4 border-blue-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-3xl font-bold transition-colors">&times;</button>
        <h2 className="text-3xl font-extrabold text-blue-700 mb-2 flex items-center gap-2">
          <span className="text-2xl font-bold">⚽</span>
          Report Partita
        </h2>
        <div className="mb-4 text-gray-600 flex flex-wrap gap-6">
          <div>
            <span className="font-semibold">Data:</span> {match.date} <br />
            <span className="font-semibold">Avversario:</span> {match.opponent} <br />
            <span className="font-semibold">Tipo:</span> {match.homeAway === 'home' ? 'Casa' : 'Trasferta'}
          </div>
          <div className="bg-blue-50 rounded-xl px-6 py-2 flex flex-col items-center shadow-sm border border-blue-200">
            <span className="text-xs text-gray-500 font-semibold">Risultato finale</span>
            <span className="text-2xl font-bold text-blue-700 mt-1">{match.homeAway === 'home' ? match.homeScore : match.awayScore} - {match.homeAway === 'home' ? match.awayScore : match.homeScore}</span>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1 border-gray-200 flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-blue-100 rounded-full"></span>
            Formazione Titolare
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            {lineupPlayers.map(p => (
              <li key={p.id} className="flex items-center gap-2 text-blue-900">
                <span className="inline-block w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">{p.jerseyNumber}</span>
                <span>{p.firstName} {p.lastName} <span className="text-xs text-gray-500">({p.position})</span></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1 border-gray-200 flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-green-100 rounded-full"></span>
              Goal
            </h3>
            {goals.length === 0 ? <p className="text-gray-400 text-sm">Nessun goal</p> : (
              <ul className="space-y-2">
                {goals.map(g => {
                  const isOpponent = g.description?.includes('avversario');
                  return (
                    <li key={g.id} className={`flex items-center gap-2 p-2 rounded-lg group ${isOpponent ? 'bg-red-50' : 'bg-green-50'}`}>
                      <span className={`text-sm font-bold min-w-[40px] ${isOpponent ? 'text-red-600' : 'text-green-600'}`}>{g.minute}{g.second !== undefined ? `:${g.second.toString().padStart(2, '0')}` : ''}</span>
                      <span className="text-gray-800">{g.description}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1 border-gray-200 flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-yellow-100 rounded-full"></span>
              Ammonizioni / Espulsioni
            </h3>
            {cards.length === 0 ? <p className="text-gray-400 text-sm">Nessuna</p> : (
              <ul className="space-y-2">
                {cards.map(c => (
                  <li key={c.id} className={`flex items-center gap-2 p-2 rounded-lg ${c.type === 'yellow-card' ? 'bg-yellow-50' : c.type === 'red-card' ? 'bg-red-50' : c.type === 'second-yellow-card' ? 'bg-orange-50' : c.type === 'blue-card' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <span className={`text-sm font-bold ${c.type === 'yellow-card' ? 'text-yellow-600' : c.type === 'red-card' ? 'text-red-600' : c.type === 'second-yellow-card' ? 'text-orange-600' : c.type === 'blue-card' ? 'text-blue-600' : 'text-gray-600'}`}>{c.minute}{c.second !== undefined ? `:${c.second.toString().padStart(2, '0')}` : ''}</span>
                    <span className="text-gray-800">{c.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 border-b pb-1 border-gray-200 flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-blue-200 rounded-full"></span>
            Sostituzioni
          </h3>
          {substitutions.length === 0 ? <p className="text-gray-400 text-sm">Nessuna</p> : (
            <ul className="space-y-2">
              {substitutions.map(s => {
                const out = players.find(p => p.id === s.playerOut);
                const inP = players.find(p => p.id === s.playerIn);
                return (
                  <li key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                    <span className="text-sm font-bold text-blue-700 min-w-[40px]">{s.minute}{s.second !== undefined ? `:${s.second.toString().padStart(2, '0')}` : ''}</span>
                    <span className="text-red-700">Esce {out ? `${out.jerseyNumber} ${out.lastName}` : s.playerOut}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-700">Entra {inP ? `${inP.jerseyNumber} ${inP.lastName}` : s.playerIn}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="mt-8 text-right">
          <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow font-semibold text-lg transition-colors">Chiudi</button>
        </div>
      </div>
    </div>
  );
}
