/**
 * Utilitário para gerenciar autenticação e requisições com JWT
 */

import { apiRequest } from './queryClient';

// Função para verificar se o usuário está autenticado
export const isAuthenticated = (): boolean => {
  try {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    const isAuth = localStorage.getItem('isAuthenticated');

    if (!token || !user || isAuth !== 'true') {
      console.log('🔐 [Auth] Dados de autenticação incompletos');
      return false;
    }

    // Verificar se o token não expirou (implementação básica)
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      if (tokenData.exp && tokenData.exp < currentTime) {
        console.log('🔐 [Auth] Token expirado');
        logout();
        return false;
      }
    } catch (tokenError) {
      console.warn('⚠️ [Auth] Erro ao validar token, assumindo válido');
    }

    return true;
  } catch (error) {
    console.error('❌ [Auth] Erro ao verificar autenticação:', error);
    return false;
  }
};

// Função para fazer requisições autenticadas
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Adicionar token JWT se disponível
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 [Auth] Token adicionado à requisição');
  } else {
    console.warn('⚠️ [Auth] Nenhum token encontrado para a requisição');
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, requestOptions);

    // Se não autorizado, limpar dados de autenticação
    if (response.status === 401) {
      console.log('🔐 [Auth] Token inválido (401), limpando dados');
      logout();
      return response;
    }

    return response;
  } catch (error) {
    console.error('❌ [Auth] Erro na requisição autenticada:', error);
    throw error;
  }
};

// Função para logout
export const logout = (): void => {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');

    // Limpar outros dados da sessão se necessário
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('scapy_') || 
      key.startsWith('timer_') ||
      key.startsWith('mood_')
    );

    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('🚪 [Auth] Logout realizado com sucesso');

    // Não redirecionar automaticamente, deixar o App.tsx lidar com isso
  } catch (error) {
    console.error('❌ [Auth] Erro no logout:', error);
  }
};