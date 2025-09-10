// ============================================
// SISTEMA GLOBAL DE SINCRONIZAÇÃO LOCALSTORAGE
// Sistema super robusto para garantir persistência de dados
// ============================================

export interface LocalStorageData {
  timestamp: number;
  userId?: string;
  version: string;
  lastModified: string;
}

export class LocalStorageManager {
  private static instance: LocalStorageManager;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.initializeGlobalListeners();
  }

  public static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  private initializeGlobalListeners() {
    // Listener global para mudanças no localStorage entre abas
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('scapy_')) {
        console.log(`🔄 [LocalStorageManager] Sincronização detectada: ${e.key}`);
        this.notifyListeners(e.key, e.newValue);
      }
    });

    // Listener para eventos customizados
    const customEvents = [
      'moodUpdated',
      'tasksUpdated', 
      'customGoalsUpdated',
      'objetivosUpdated',
      'quadroSonhosUpdated'
    ];

    customEvents.forEach(eventName => {
      window.addEventListener(eventName, (e: any) => {
        console.log(`🔔 [LocalStorageManager] Evento customizado: ${eventName}`, e.detail);
      });
    });

    console.log('🚀 [LocalStorageManager] Sistema de sincronização global inicializado');
  }

  public saveData<T extends object>(key: string, data: T, options?: { backup?: boolean, userId?: string }): boolean {
    try {
      const timestamp = Date.now();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = options?.userId || user.id || 'unknown';

      const robustData: LocalStorageData & T = {
        ...data,
        timestamp,
        userId: userId.toString(),
        version: '2.0',
        lastModified: new Date().toISOString()
      };

      // Salvar dados principais
      localStorage.setItem(key, JSON.stringify(robustData));

      // Backup opcional por data
      if (options?.backup) {
        const dateKey = new Date().toISOString().split('T')[0];
        const backupKey = `${key}_backup_${userId}_${dateKey}`;
        localStorage.setItem(backupKey, JSON.stringify(robustData));
      }

      console.log(`💾 [LocalStorageManager] Dados salvos: ${key} (usuário: ${userId})`);
      return true;

    } catch (error) {
      console.error(`❌ [LocalStorageManager] Erro ao salvar ${key}:`, error);
      return false;
    }
  }

  public loadData<T>(key: string, fallback?: T): T | null {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        console.log(`📖 [LocalStorageManager] Dados carregados: ${key}`);
        return parsed;
      }
      return fallback || null;
    } catch (error) {
      console.error(`❌ [LocalStorageManager] Erro ao carregar ${key}:`, error);
      return fallback || null;
    }
  }

  public addEventListener(key: string, callback: Function) {
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key)!.push(callback);
  }

  public removeEventListener(key: string, callback: Function) {
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(key: string, newValue: string | null) {
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newValue);
        } catch (error) {
          console.error(`❌ [LocalStorageManager] Erro no callback para ${key}:`, error);
        }
      });
    }
  }

  public getStorageInfo(): object {
    const storageInfo = {
      totalKeys: localStorage.length,
      scapyKeys: 0,
      totalSize: 0,
      keys: [] as string[]
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        storageInfo.keys.push(key);
        if (key.startsWith('scapy_')) {
          storageInfo.scapyKeys++;
        }
        const value = localStorage.getItem(key);
        if (value) {
          storageInfo.totalSize += value.length;
        }
      }
    }

    return storageInfo;
  }

  public clearOldBackups(daysToKeep: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    let removedCount = 0;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.includes('_backup_') && key.includes('scapy_')) {
        const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch && dateMatch[1] < cutoffString) {
          localStorage.removeItem(key);
          removedCount++;
        }
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 [LocalStorageManager] ${removedCount} backups antigos removidos`);
    }
  }
}

// Instância global singleton
export const localStorageManager = LocalStorageManager.getInstance();

// Utilitário para limpar backups antigos automaticamente
export const initializeStorageCleanup = () => {
  // Limpar backups antigos ao inicializar
  localStorageManager.clearOldBackups();
  
  // Configurar limpeza automática diária
  setInterval(() => {
    localStorageManager.clearOldBackups();
  }, 24 * 60 * 60 * 1000); // 24 horas
};