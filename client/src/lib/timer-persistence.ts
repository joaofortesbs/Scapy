// Sistema de persistência de cronômetros similar ao de humor
// Salva primariamente no localStorage e usa API como backup/sincronização

export interface TimerData {
  userId: string;
  startDate: string;
  createdAt: string;
  isActive: boolean;
  timestamp: number;
  version: string;
  source: string;
}

export class TimerPersistence {
  private static readonly STORAGE_KEY = 'scapy_timers_v1';
  private static readonly CURRENT_VERSION = '1.0.0';
  private static cache = new Map<string, TimerData>();

  /**
   * Salva cronômetro no localStorage (fonte primária)
   */
  static saveTimer(userId: string, startDate: string): boolean {
    try {
      const timerData: TimerData = {
        userId: userId.toString(),
        startDate: startDate,
        createdAt: startDate,
        isActive: true,
        timestamp: Date.now(),
        version: this.CURRENT_VERSION,
        source: 'timer-persistence'
      };

      // 1. Salvar no cache para acesso rápido
      this.cache.set(userId, timerData);

      // 2. Salvar cronômetro individual (chave principal)
      const individualKey = `scapy_timer_${userId}`;
      localStorage.setItem(individualKey, JSON.stringify(timerData));

      // 3. Salvar no registro geral de cronômetros (backup)
      const allTimers = this.getStorageData();
      allTimers[userId] = timerData;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allTimers));

      // 4. Salvar backup com timestamp
      const backupKey = `scapy_timer_backup_${userId}_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(timerData));

      // 5. Salvar estado da sessão
      const sessionData = {
        lastTimerUpdate: Date.now(),
        activeUserId: userId,
        startDate: startDate
      };
      localStorage.setItem('scapy_timer_session', JSON.stringify(sessionData));

      console.log(`💾 [TimerPersistence] Cronômetro salvo para usuário ${userId}: ${startDate}`);
      return true;
    } catch (error) {
      console.error('❌ [TimerPersistence] Erro ao salvar cronômetro:', error);
      return false;
    }
  }

  /**
   * Carrega cronômetro do localStorage (fonte primária)
   */
  static loadTimer(userId: string): TimerData | null {
    try {
      // 1. Verificar cache primeiro
      if (this.cache.has(userId)) {
        const cached = this.cache.get(userId);
        if (cached && cached.isActive) {
          return cached;
        }
      }

      // 2. Carregar chave individual primeiro
      const individualKey = `scapy_timer_${userId}`;
      const savedTimer = localStorage.getItem(individualKey);

      if (savedTimer) {
        try {
          const timerData = JSON.parse(savedTimer) as TimerData;
          
          // Verificar se cronômetro é válido e ativo
          if (timerData.isActive && timerData.startDate) {
            // Adicionar ao cache
            this.cache.set(userId, timerData);
            console.log(`💿 [TimerPersistence] Cronômetro carregado do localStorage para ${userId}: ${timerData.startDate}`);
            return timerData;
          }
        } catch (parseError) {
          console.error('❌ [TimerPersistence] Erro ao parsear cronômetro individual:', parseError);
          localStorage.removeItem(individualKey);
        }
      }

      // 3. Fallback: carregar do registro geral
      const allTimers = this.getStorageData();
      const userTimer = allTimers[userId];

      if (userTimer && userTimer.isActive) {
        // Sincronizar de volta para chave individual
        localStorage.setItem(individualKey, JSON.stringify(userTimer));
        this.cache.set(userId, userTimer);
        console.log(`💿 [TimerPersistence] Cronômetro recuperado do sistema geral para ${userId}`);
        return userTimer;
      }

      console.log(`📋 [TimerPersistence] Nenhum cronômetro ativo encontrado para usuário ${userId}`);
      return null;
    } catch (error) {
      console.error('❌ [TimerPersistence] Erro ao carregar cronômetro:', error);
      return null;
    }
  }

  /**
   * Remove cronômetro (quando usuário reseta)
   */
  static removeTimer(userId: string): boolean {
    try {
      // 1. Remover do cache
      this.cache.delete(userId);

      // 2. Remover chave individual
      const individualKey = `scapy_timer_${userId}`;
      localStorage.removeItem(individualKey);

      // 3. Remover do registro geral
      const allTimers = this.getStorageData();
      delete allTimers[userId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allTimers));

      // 4. Limpar sessão se era deste usuário
      const sessionData = localStorage.getItem('scapy_timer_session');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (session.activeUserId === userId) {
            localStorage.removeItem('scapy_timer_session');
          }
        } catch {
          // Ignorar erro de parse
        }
      }

      console.log(`🗑️ [TimerPersistence] Cronômetro removido para usuário ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ [TimerPersistence] Erro ao remover cronômetro:', error);
      return false;
    }
  }

  /**
   * Limpa cronômetros antigos (mais de 30 dias inativos)
   */
  static cleanup(): void {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const allTimers = this.getStorageData();
      let cleanupCount = 0;

      Object.keys(allTimers).forEach(userId => {
        const timer = allTimers[userId];
        if (timer.timestamp < thirtyDaysAgo && !timer.isActive) {
          delete allTimers[userId];
          cleanupCount++;
          
          // Remover também chave individual
          const individualKey = `scapy_timer_${userId}`;
          localStorage.removeItem(individualKey);
        }
      });

      if (cleanupCount > 0) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allTimers));
        console.log(`🧹 [TimerPersistence] Limpeza concluída: ${cleanupCount} cronômetros antigos removidos`);
      }
    } catch (error) {
      console.error('❌ [TimerPersistence] Erro na limpeza:', error);
    }
  }

  /**
   * Sincroniza com API (backup/verificação)
   */
  static async syncWithAPI(userId: string): Promise<TimerData | null> {
    try {
      const { AuthService } = await import('@/lib/auth');
      const response = await AuthService.authenticatedFetch(`/api/timer/status/${userId}`);
      if (!response.ok) {
        console.warn('⚠️ [TimerPersistence] API não disponível, usando localStorage');
        return this.loadTimer(userId);
      }

      const apiData = await response.json();
      
      if (apiData.hasActiveTimer && apiData.startDate) {
        const apiTimer: TimerData = {
          userId: userId.toString(),
          startDate: apiData.startDate,
          createdAt: apiData.startDate,
          isActive: true,
          timestamp: Date.now(),
          version: this.CURRENT_VERSION,
          source: 'api-sync'
        };

        // Comparar com dados locais
        const localTimer = this.loadTimer(userId);
        
        if (!localTimer || new Date(apiTimer.startDate).getTime() !== new Date(localTimer.startDate).getTime()) {
          // API tem dados diferentes, sincronizar
          this.saveTimer(userId, apiTimer.startDate);
          console.log(`🌐 [TimerPersistence] Cronômetro sincronizado da API para ${userId}`);
          return apiTimer;
        } else {
          // Dados locais estão corretos
          console.log(`✅ [TimerPersistence] Dados locais já sincronizados para ${userId}`);
          return localTimer;
        }
      } else {
        // API não tem cronômetro ativo, verificar se temos local
        const localTimer = this.loadTimer(userId);
        if (localTimer) {
          console.log(`📍 [TimerPersistence] Usando cronômetro local (API sem dados) para ${userId}`);
          return localTimer;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ [TimerPersistence] Erro na sincronização:', error);
      // Fallback para dados locais
      return this.loadTimer(userId);
    }
  }

  /**
   * Obtém dados do storage
   */
  private static getStorageData(): Record<string, TimerData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Obtém todos os cronômetros ativos
   */
  static getAllActiveTimers(): TimerData[] {
    try {
      const allTimers = this.getStorageData();
      return Object.values(allTimers).filter(timer => timer.isActive);
    } catch {
      return [];
    }
  }
}

// Disparar eventos para sincronização com outros componentes
export function dispatchTimerEvent(eventType: string, detail: any) {
  window.dispatchEvent(new CustomEvent(eventType, { detail }));
}