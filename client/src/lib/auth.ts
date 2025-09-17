/*
  Este arquivo contém a implementação centralizada do serviço de autenticação (AuthService).
  Ele gerencia tokens JWT, dados do usuário e o estado de autenticação usando o localStorage.
*/

// Interface para definir a estrutura dos dados do usuário.
interface UserData {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  fullName?: string;
}

/**
 * Serviço de autenticação robusto para gerenciar tokens JWT e dados do usuário.
 * Utiliza o localStorage para persistir informações de autenticação.
 */
export class AuthService {
  // Chaves usadas para armazenar token e dados do usuário no localStorage.
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'user_data';

  /**
   * Salva os dados do usuário e o token JWT no localStorage.
   * Também define flags 'isAuthenticated' e 'user' para facilitar a verificação.
   * @param user - Objeto contendo os dados do usuário.
   * @param token - O token JWT obtido após o login.
   */
  static saveUserData(user: UserData, token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ [AuthService] Dados salvos com sucesso');
    } catch (error) {
      console.error('❌ [AuthService] Erro ao salvar dados:', error);
    }
  }

  /**
   * Verifica se o usuário está autenticado com base nas informações no localStorage.
   * Retorna true se o token, os dados do usuário e a flag 'isAuthenticated' estiverem presentes.
   * @returns {boolean} - Verdadeiro se autenticado, falso caso contrário.
   */
  static isAuthenticated(): boolean {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const user = localStorage.getItem(this.USER_KEY);
      const isAuth = localStorage.getItem('isAuthenticated');
      return !!(token && user && isAuth === 'true');
    } catch (error) {
      console.error('❌ [AuthService] Erro na verificação:', error);
      return false;
    }
  }

  /**
   * Obtém os dados do usuário atual do localStorage.
   * Inclui um fallback para o formato de dados antigo e normaliza o nome.
   * @returns {UserData | null} - Os dados do usuário ou null se não encontrados.
   */
  static getCurrentUser(): UserData | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      if (!userData) {
        // Fallback para o formato antigo
        const legacyUser = localStorage.getItem('user');
        if (legacyUser) {
          const user = JSON.parse(legacyUser);
          return {
            ...user,
            full_name: user.full_name || user.fullName || user.username || 'Usuário'
          };
        }
        return null;
      }

      const user = JSON.parse(userData);
      return {
        ...user,
        full_name: user.full_name || user.fullName || user.username || 'Usuário'
      };
    } catch (error) {
      console.error('❌ [AuthService] Erro ao obter usuário:', error);
      return null;
    }
  }

  /**
   * Obtém o token JWT armazenado no localStorage.
   * @returns {string | null} - O token JWT ou null se não encontrado.
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
   * Retorna os headers de autenticação necessários para requisições HTTP.
   * Inclui o token JWT no header 'Authorization'.
   * @returns {Record<string, string>} - Objeto com os headers de autenticação.
   */
  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Realiza o logout do usuário, removendo todas as informações de autenticação
   * do localStorage.
   */
  static logout(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      console.log('✅ [AuthService] Logout realizado');
    } catch (error) {
      console.error('❌ [AuthService] Erro no logout:', error);
    }
  }
}