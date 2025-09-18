
/**
 * Utilitário para gerenciar autenticação e requisições com JWT
 */

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });
}

export function clearAuthData(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
