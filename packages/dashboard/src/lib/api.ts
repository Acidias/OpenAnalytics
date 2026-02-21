const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  sites: {
    list: () => fetchAPI("/sites"),
    get: (id: string) => fetchAPI(`/sites/${id}`),
    create: (data: Record<string, unknown>) => fetchAPI("/sites", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => fetchAPI(`/sites/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/sites/${id}`, { method: "DELETE" }),
  },
  analytics: {
    overview: (siteId: string, params?: string) => fetchAPI(`/sites/${siteId}/analytics/overview${params ? `?${params}` : ""}`),
    pages: (siteId: string, params?: string) => fetchAPI(`/sites/${siteId}/analytics/pages${params ? `?${params}` : ""}`),
    sessions: (siteId: string, params?: string) => fetchAPI(`/sites/${siteId}/analytics/sessions${params ? `?${params}` : ""}`),
    session: (siteId: string, sid: string) => fetchAPI(`/sites/${siteId}/analytics/sessions/${sid}`),
    events: (siteId: string) => fetchAPI(`/sites/${siteId}/analytics/events`),
    event: (siteId: string, name: string) => fetchAPI(`/sites/${siteId}/analytics/events/${name}`),
    sources: (siteId: string) => fetchAPI(`/sites/${siteId}/analytics/sources`),
    geo: (siteId: string) => fetchAPI(`/sites/${siteId}/analytics/geo`),
    devices: (siteId: string) => fetchAPI(`/sites/${siteId}/analytics/devices`),
    live: (siteId: string) => fetchAPI(`/sites/${siteId}/analytics/live`),
  },
  funnels: {
    list: (siteId: string) => fetchAPI(`/sites/${siteId}/funnels`),
    get: (siteId: string, fid: string) => fetchAPI(`/sites/${siteId}/funnels/${fid}`),
    create: (siteId: string, data: Record<string, unknown>) => fetchAPI(`/sites/${siteId}/funnels`, { method: "POST", body: JSON.stringify(data) }),
  },
  goals: {
    list: (siteId: string) => fetchAPI(`/sites/${siteId}/goals`),
    create: (siteId: string, data: Record<string, unknown>) => fetchAPI(`/sites/${siteId}/goals`, { method: "POST", body: JSON.stringify(data) }),
  },
};
