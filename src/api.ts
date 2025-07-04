/*
  Simple API client for the new Express / Prisma backend.
  Uses the browser's fetch(). The base URL is taken from the environment
  variable REACT_APP_API_BASE (e.g. "http://localhost:4000/api") or defaults
  to "/api" when the React app is proxied to the backend (CRA proxy or nginx).
*/

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.REACT_APP_API_BASE ||
  "http://localhost:4000/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  // Handle empty responses (like 204 No Content)
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as any;
  }

  // Check if response has content to parse
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    if (!text) {
      return undefined as any;
    }
    throw new Error(`Expected JSON response but got: ${contentType}`);
  }

  return res.json();
}

// Generic CRUD helpers
function get<T>(path: string) {
  return request<T>(path);
}
function post<T>(path: string, body: any) {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
function put<T>(path: string, body: any) {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
function del(path: string) {
  return request<void>(path, { method: "DELETE" });
}

export const api = {
  // players
  getPlayers: () => get("/players"),
  createPlayer: (data: any) => post("/players", data),
  updatePlayer: (id: string, data: any) => put(`/players/${id}`, data),
  deletePlayer: (id: string) => del(`/players/${id}`),

  // trainings
  getTrainings: () => get("/trainings"),
  createTraining: (data: any) => post("/trainings", data),
  updateTraining: (id: string, data: any) => put(`/trainings/${id}`, data),
  deleteTraining: (id: string) => del(`/trainings/${id}`),

  // matches
  getMatches: () => get("/matches"),
  createMatch: (data: any) => post("/matches", data),
  updateMatch: (id: string, data: any) => put(`/matches/${id}`, data),
  deleteMatch: (id: string) => del(`/matches/${id}`),

  // users
  getUsers: () => get("/users"),
  createUser: (data: any) => post("/users", data),
  updateUser: (id: string, data: any) => put(`/users/${id}`, data),
  deleteUser: (id: string) => del(`/users/${id}`),

  // groups
  getGroups: () => get("/groups"),
  createGroup: (data: any) => post("/groups", data),
  updateGroup: (id: string, data: any) => put(`/groups/${id}`, data),
  deleteGroup: (id: string) => del(`/groups/${id}`),

  // auth
  login: (username: string, password: string) => post("/auth/login", { username, password }),
};
