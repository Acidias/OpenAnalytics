const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("oa_token");
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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
      fetchAPI(`/api/sites/${siteId}/analytics/overview${params ? `?${params}` : ""}`),
    pages: (siteId: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/analytics/pages${params ? `?${params}` : ""}`),
    sessions: (siteId: string, params?: string) =>
      fetchAPI(`/api/sites/${siteId}/analytics/sessions${params ? `?${params}` : ""}`),
    session: (siteId: string, sid: string) =>
      fetchAPI(`/api/sites/${siteId}/analytics/sessions/${sid}`),
    events: (siteId: string) =>
      fetchAPI(`/api/sites/${siteId}/analytics/events`),
    event: (siteId: string, name: string) =>
      fetchAPI(`/api/sites/${siteId}/analytics/events/${name}`),
    sources: (siteId: string) =>
      fetchAPI(`/api/sites/${siteId}/analytics/sources`),
    geo: (siteId: string) =>
      fetchAPI(`/api/sites/${siteId}/analytics/geo`),
    devices: (siteId: string) =>
      fetchAPI(`/api/sites/${siteId}/analytics/devices`),
    live: (siteId: string) =>
      fetchAPI(`/api/sites/${siteId}/analytics/live`),
  },
  funnels: {
    list: (siteId: string) =>
      fetchAPI(`/api/sites/${siteId}/funnels`),
    get: (siteId: string, fid: string) =>
      fetchAPI(`/api/sites/${siteId}/funnels/${fid}`),
    create: (siteId: string, data: Record<string, unknown>) =>
      fetchAPI(`/api/sites/${siteId}/funnels`, { method: "POST", body: JSON.stringify(data) }),
  },
  goals: {
    list: (siteId: string) =>
      fetchAPI(`/api/sites/${siteId}/goals`),
    create: (siteId: string, data: Record<string, unknown>) =>
      fetchAPI(`/api/sites/${siteId}/goals`, { method: "POST", body: JSON.stringify(data) }),
  },
};
