const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("oa_token");
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("oa_token");
    window.location.href = "/login";
    throw new Error("Unauthorised");
  }

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function getWebSocketURL(path: string): string {
  const base = API_BASE.replace(/^http/, "ws");
  return `${base}${path}`;
}

export const api = {
  sites: {
    list: () => fetchAPI<{ sites: unknown[] }>("/api/sites"),
    get: (id: string) => fetchAPI(`/api/sites/${id}`),
    create: (data: Record<string, unknown>) =>
      fetchAPI("/api/sites", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      fetchAPI(`/api/sites/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchAPI(`/api/sites/${id}`, { method: "DELETE" }),
  },
  analytics: {
    overview: (siteId: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/overview${params ? `?${params}` : ""}`),
    timeseries: (siteId: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/timeseries${params ? `?${params}` : ""}`),
    pages: (siteId: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/pages${params ? `?${params}` : ""}`),
    sessions: (siteId: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/sessions${params ? `?${params}` : ""}`),
    session: (siteId: string, sid: string) =>
      fetchAPI(`/api/sites/${siteId}/sessions/${sid}`),
    events: (siteId: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/events${params ? `?${params}` : ""}`),
    event: (siteId: string, name: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/events/${name}${params ? `?${params}` : ""}`),
    sources: (siteId: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/referrers${params ? `?${params}` : ""}`),
    geo: (siteId: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/geo${params ? `?${params}` : ""}`),
    devices: (siteId: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/devices${params ? `?${params}` : ""}`),
    live: (siteId: string) =>
      fetchAPI(`/api/sites/${siteId}/live`),
    liveRecent: (siteId: string) =>
      fetchAPI<{ events: unknown[] }>(`/api/sites/${siteId}/live/recent`),
  },
  funnels: {
    list: (siteId: string) =>
      fetchAPI(`/api/sites/${siteId}/funnels`),
    get: (siteId: string, fid: string) =>
      fetchAPI(`/api/sites/${siteId}/funnels/${fid}`),
    create: (siteId: string, data: Record<string, unknown>) =>
      fetchAPI(`/api/sites/${siteId}/funnels`, { method: "POST", body: JSON.stringify(data) }),
    delete: (siteId: string, fid: string) =>
      fetchAPI(`/api/sites/${siteId}/funnels/${fid}`, { method: "DELETE" }),
  },
  goals: {
    list: (siteId: string) =>
      fetchAPI(`/api/sites/${siteId}/goals`),
    create: (siteId: string, data: Record<string, unknown>) =>
      fetchAPI(`/api/sites/${siteId}/goals`, { method: "POST", body: JSON.stringify(data) }),
    delete: (siteId: string, gid: string) =>
      fetchAPI(`/api/sites/${siteId}/goals/${gid}`, { method: "DELETE" }),
  },
  rules: {
    create: (siteId: string, data: Record<string, unknown>) =>
      fetchAPI(`/api/sites/${siteId}/rules`, { method: "POST", body: JSON.stringify(data) }),
    delete: (siteId: string, rid: string) =>
      fetchAPI(`/api/sites/${siteId}/rules/${rid}`, { method: "DELETE" }),
  },
  ai: {
    suggest: (siteId: string, data: { description?: string; crawl?: boolean }) =>
      fetchAPI(`/api/sites/${siteId}/ai/suggest`, { method: "POST", body: JSON.stringify(data) }),
  },
};
