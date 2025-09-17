
// Sistema de autenticação centralizado para gerenciar tokens JWT
export class AuthService {
  private static readonly TOKEN_KEY = 'scapy_auth_token';
  private static readonly USER_KEY = 'user';

  /**
   * Salva o token JWT no localStorage
   */
  static saveToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      console.log('🔐 [AuthService] Token JWT salvo com sucesso');
    } catch (error) {
      console.error('❌ [AuthService] Erro ao salvar token:', error);
    }
  }

  /**
   * Obtém o token JWT do localStorage
   */
  static getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('❌ [AuthService] Erro ao obter token:', error);
      return null;
    }
  }

  /**
   * Remove o token JWT do localStorage
   */
  static removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      console.log('🔐 [AuthService] Token JWT removido');
    } catch (error) {
      console.error('❌ [AuthService] Erro ao remover token:', error);
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && token.length > 0;
  }

  /**
   * Obtém headers de autenticação para requisições
   */
  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) {
      console.warn('⚠️ [AuthService] Token não encontrado para headers');
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Faz requisição autenticada
   */
  static async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = this.getAuthHeaders();
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    };

    console.log(`🌐 [AuthService] Fazendo requisição autenticada para: ${url}`);
    
    const response = await fetch(url, config);
    
    // Se token expirou ou é inválido, limpar dados
    if (response.status === 401) {
      console.warn('⚠️ [AuthService] Token inválido ou expirado, limpando dados');
      this.removeToken();
      localStorage.removeItem(this.USER_KEY);
    }
    
    return response;
  }

  /**
   * Salva dados do usuário após login
   */
  static saveUserData(user: any, token: string): void {
    try {
      this.saveToken(token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      console.log('👤 [AuthService] Dados do usuário salvos:', user.email);
    } catch (error) {
      console.error('❌ [AuthService] Erro ao salvar dados do usuário:', error);
    }
  }

  /**
   * Obtém dados do usuário atual
   */
  static getCurrentUser(): any | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ [AuthService] Erro ao obter dados do usuário:', error);
      return null;
    }
  }

  /**
   * Limpa todos os dados de autenticação
   */
  static clearAuth(): void {
    this.removeToken();
    localStorage.removeItem(this.USER_KEY);
    console.log('🧹 [AuthService] Dados de autenticação limpos');
  }
}
