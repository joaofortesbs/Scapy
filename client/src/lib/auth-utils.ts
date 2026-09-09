/**
 * Compatibilidade para chamadas existentes que ainda usam o nome auth-utils.
 * A fonte da autenticação agora é o serviço local-first.
 */

import {
  getSessionToken,
  getStoredSession,
  logoutLocalSession,
} from './local-auth';

export const isAuthenticated = (): boolean => getStoredSession() !== null;

export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = getSessionToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Contas locais não recebem JWT falso. A chamada segue sem Authorization e
  // o consumidor decide como tratar uma resposta 401/403.
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Somente uma sessão que possuía token remoto pode ser invalidada por 401.
  // Uma conta local deve continuar renderizada mesmo quando uma API remota
  // exigir autenticação.
  if (response.status === 401 && token) {
    logoutLocalSession();
  }

  return response;
};

export const logout = (): void => {
  logoutLocalSession();
};