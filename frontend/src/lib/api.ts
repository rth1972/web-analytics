const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Try localStorage first
  try {
    const token = localStorage.getItem('auth-token');
    if (token) return token;
  } catch {}

  // Fallback: read from cookie
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith('auth-token=')) {
        const token = trimmed.substring('auth-token='.length);
        // Sync back to localStorage for next time
        try { localStorage.setItem('auth-token', token); } catch {}
        return token;
      }
    }
  } catch {}

  return null;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('[api] No auth token found');
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    console.warn('[api] 401 received, clearing token and redirecting to login');
    try { localStorage.removeItem('auth-token'); } catch {}
    document.cookie = 'auth-token=; path=/; max-age=0';
    window.location.href = '/login';
  }

  return res;
}

export const api = {
  get:    (path: string) => apiFetch(path),
  post:   (path: string, body: unknown) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
};

export { API_URL };
