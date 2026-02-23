const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const CSRF_COOKIE_NAME = "oa_csrf";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  plan?: string;
  created_at?: string;
}

function readCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

export function getCsrfToken(): string | null {
  return readCookie(CSRF_COOKIE_NAME);
}

export async function logout(): Promise<void> {
  const csrfToken = getCsrfToken();
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
    });
  } catch {
    // Network error should not block local redirect
  }

  window.location.href = "/login";
}

export async function isLoggedIn(): Promise<boolean> {
  const user = await getMe();
  return !!user;
}

export async function login(email: string, password: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Login failed");
  }
  return res.json();
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Registration failed");
  }
  return res.json();
}

async function refreshSession(): Promise<boolean> {
  const csrfToken = getCsrfToken();
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
  });

  return res.ok;
}

export async function getMe(): Promise<AuthUser | null> {
  let res = await fetch(`${API_BASE}/api/auth/me`, {
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (!refreshed) return null;

    res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include",
    });
  }

  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}
