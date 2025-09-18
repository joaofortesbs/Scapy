// Sistema de autenticação centralizado para o Scapy
export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'user_data';

  // Salvar dados do usuário e token após login
  static saveUserData(token: string, userData: any): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData)); // Compatibilidade
      console.log('🔐 [AuthService] Dados do usuário salvos com sucesso');
    } catch (error) {
      console.error('❌ [AuthService] Erro ao salvar dados:', error);
    }
  }

  // Obter o token JWT
  static getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('❌ [AuthService] Erro ao obter token:', error);
      return null;
    }
  }

  // Obter dados do usuário
  static getCurrentUser(): any | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      if (userData) {
        return JSON.parse(userData);
      }
      
      // Fallback para compatibilidade
      const fallbackUser = localStorage.getItem('user');
      return fallbackUser ? JSON.parse(fallbackUser) : null;
    } catch (error) {
      console.error('❌ [AuthService] Erro ao obter usuário:', error);
      return null;
    }
  }

  // Verificar se está autenticado
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Fazer requisição autenticada
  static async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Configurar headers de autorização para requisições
  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Fazer logout
  static logout(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem('user'); // Compatibilidade
      console.log('🚪 [AuthService] Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ [AuthService] Erro no logout:', error);
    }
  }

  // Renovar token se necessário
  static async refreshToken(): Promise<boolean> {
    try {
      const response = await this.authenticatedFetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        this.saveUserData(data.token, data.user);
        return true;
      }
    } catch (error) {
      console.error('❌ [AuthService] Erro ao renovar token:', error);
    }
    
    return false;
  }
}

// Função auxiliar para requisições autenticadas (compatibilidade)
export const authenticatedApiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return AuthService.authenticatedFetch(url, options);
};

// Hook para verificar autenticação
export const useAuth = () => {
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getCurrentUser();
  const token = AuthService.getToken();

  return {
    isAuthenticated,
    user,
    token,
    logout: AuthService.logout,
    getAuthHeaders: AuthService.getAuthHeaders,
  };
};