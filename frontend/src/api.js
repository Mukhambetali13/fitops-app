const TOKEN_KEY = "fitops_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch("/api" + path, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error("не авторизован");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "ошибка запроса");
  return data;
}

export const api = {
  login: (password) => request("/login", { method: "POST", body: JSON.stringify({ password }) }),
  today: () => request("/today"),
  roster: () => request("/roster"),
  getSettings: () => request("/settings"),
  putSettings: (body) => request("/settings", { method: "PUT", body: JSON.stringify(body) }),
  getWeights: () => request("/weights"),
  addWeight: (date, weight) => request("/weights", { method: "POST", body: JSON.stringify({ date, weight }) }),
  getChecklist: (date) => request("/checklist?date=" + date),
  addChecklistItem: (date, text) => request("/checklist", { method: "POST", body: JSON.stringify({ date, text }) }),
  toggleChecklistItem: (id, done) => request(`/checklist/${id}`, { method: "PATCH", body: JSON.stringify({ done }) }),
  deleteChecklistItem: (id) => request(`/checklist/${id}`, { method: "DELETE" }),
  getSmoking: () => request("/smoking"),
  startQuit: () => request("/smoking/start", { method: "POST" }),
  logRelapse: () => request("/smoking/relapse", { method: "POST" }),
  logCraving: (intensity) => request("/smoking/craving", { method: "POST", body: JSON.stringify({ intensity }) }),
  putSmokingSettings: (body) => request("/smoking/settings", { method: "PUT", body: JSON.stringify(body) }),
  analyzeFood: (body) => request("/nutrition/analyze", { method: "POST", body: JSON.stringify(body) }),
  getTodayFood: () => request("/nutrition/today"),
  logFood: (body) => request("/nutrition/log", { method: "POST", body: JSON.stringify(body) }),
  deleteFoodLog: (id) => request(`/nutrition/log/${id}`, { method: "DELETE" }),
  getWorkoutAdvice: (exerciseName, question) => request("/workout/advice", { method: "POST", body: JSON.stringify({ exerciseName, question }) }),
};
