import { api } from "./api";
import { Player, Training, Match, Group, User } from "./types";

/**
 * Lightweight proxy that exposes the same method names previously offered by
 * `useDatabase`.  Each method simply forwards the call to the new backend API
 * client.  This lets the existing UI keep calling `database.*` while we finish
 * migrating the rest of the codebase.
 */
export const database = {
  /* Loading / error flags kept for compatibility with legacy checks. */
  isLoading: false,
  error: null as string | null,

  // ----------------- Players -----------------
  getPlayers: () => api.getPlayers(),
  addPlayer: (data: Omit<Player, "id">) => void api.createPlayer(data).catch(console.error),
  updatePlayer: (id: string, data: Omit<Player, "id">) => void api.updatePlayer(id, data).catch(console.error),
  deletePlayer: (id: string) => void api.deletePlayer(id).catch(console.error),

  // ----------------- Trainings -----------------
  getTrainings: () => api.getTrainings(),
  addTraining: (data: Omit<Training, "id">) => void api.createTraining(data).catch(console.error),
  updateTraining: (id: string, data: Omit<Training, "id">) => void api.updateTraining(id, data).catch(console.error),
  deleteTraining: (id: string) => void api.deleteTraining(id).catch(console.error),

  // ----------------- Matches -----------------
  getMatches: () => api.getMatches(),
  addMatch: (data: Omit<Match, "id">) => void api.createMatch(data).catch(console.error),
  updateMatch: (id: string, data: Omit<Match, "id">) => void api.updateMatch(id, data).catch(console.error),
  deleteMatch: (id: string) => void api.deleteMatch(id).catch(console.error),

  // ----------------- Groups -----------------
  getGroups: () => api.getGroups(),
  addGroup: (data: Omit<Group, "id" | "createdAt">) => void api.createGroup(data).catch(console.error),
  updateGroup: (id: string, data: Omit<Group, "id" | "createdAt">) => void api.updateGroup(id, data).catch(console.error),
  deleteGroup: (id: string) => void api.deleteGroup(id).catch(console.error),

  // ----------------- Users -----------------
  getUsers: () => api.getUsers(),
  addUser: (data: Omit<User, "id" | "createdAt">) => void api.createUser(data).catch(console.error),
  updateUser: (id: string, data: Omit<User, "id" | "createdAt">) => void api.updateUser(id, data).catch(console.error),
  deleteUser: (id: string) => void api.deleteUser(id).catch(console.error),

  // ----------------- Auth -----------------
  authenticateUser: async (username: string, password: string) => {
    try {
      return await api.login(username, password);
    } catch {
      return null;
    }
  },
};
