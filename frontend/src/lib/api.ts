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
    let message = `API Error ${status}`;
    if (typeof data?.detail === 'string') {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join(', ');
    }
    
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
  const isFormData = options?.body instanceof FormData || options?.body instanceof URLSearchParams;
  
  const headers: HeadersInit = {
    ...options?.headers,
  };
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  
  // Only set Content-Type to JSON if we are not sending FormData/URLSearchParams
  if (!isFormData && !headers['Content-Type' as keyof HeadersInit]) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

// ---------------------------------------------------------------------------
// Typed convenience methods
// ---------------------------------------------------------------------------

export function apiGet<T>(path: string, options?: RequestInit): Promise<T> {
  return api<T>(path, { method: 'GET', ...options });
}

export function apiPost<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
  const isFormData = body instanceof FormData || body instanceof URLSearchParams;
  return api<T>(path, {
    method: 'POST',
    body: isFormData ? (body as BodyInit) : JSON.stringify(body),
    ...options,
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
