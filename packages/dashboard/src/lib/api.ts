import { getCsrfToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function tryRefresh(): Promise<boolean> {
  const csrfToken = getCsrfToken();
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
  });

  return res.ok;
}

async function fetchAPI<T>(path: string, options?: RequestInit, retried = false): Promise<T> {
  const method = (options?.method || "GET").toUpperCase();
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers as Record<string, string>),
  };

  if (["POST", "PATCH", "PUT", "DELETE"].includes(method) && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !retried) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return fetchAPI<T>(path, options, true);
    }
  }

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new Error("Unauthorised");
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.error || body.message || "";
    } catch {
      // no parseable body
    }
    throw new Error(detail ? `API error: ${res.status} ${detail}` : `API error: ${res.status}`);
  }
  return res.json();
}

export function getWebSocketURL(path: string): string {
  const base = API_BASE.replace(/^http/, "ws");
  return `${base}${path}`;
}

export const api = {
  auth: {
    wsTicket: (siteId: string) =>
      fetchAPI<{ ticket: string; expiresInSeconds: number }>("/api/auth/ws-ticket", {
        method: "POST",
        body: JSON.stringify({ siteId }),
      }),
  },
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
