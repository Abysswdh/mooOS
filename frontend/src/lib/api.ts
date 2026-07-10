// =============================================================================
// MooOS v2 — Centralized API Client (Convention #1)
// =============================================================================
// This is the ONLY file that calls fetch(). No other file should import fetch
// or hardcode API URLs. Verify with: grep -r "fetch(" src/ | grep -v api.ts
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    const message =
      (data?.detail as string) || `API Error ${status}`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

export async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ---------------------------------------------------------------------------
// Typed convenience methods
// ---------------------------------------------------------------------------

export function apiGet<T>(path: string): Promise<T> {
  return api<T>(path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function apiDelete<T = void>(path: string): Promise<T> {
  return api<T>(path, { method: 'DELETE' });
}
