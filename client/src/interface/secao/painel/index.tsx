import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bot,
  BookOpen,
  Home,
  BarChart3,
  Users,
  Target,
  Plus
} from "lucide-react";
import { useLocation } from "wouter";
import { ScapyIcon } from "@/components/ui/scapy-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  formatTimer,
  calculateTimeDifference
} from "@/lib/timer-utils";
import DesafioPlanoBeamEstar from "@/components/desafio-plano-bem-estar";
import DesafioDuplaDinamica from "@/components/desafio-dupla-dinamica";
import AnaliseEvolucaoMental from "@/components/analise-evolucao-mental";
import FraseDoDia from "@/components/frase-do-dia";
import { DailyGoals } from "@/components/daily-goals";
import AIAssistant from "@/components/ai-assistant";
import ParticlesBackground from "@/components/particles-background";
import PanicPage from "@/pages/panic-page";
import EvolutionaryAvatar from "@/components/evolutionary-avatar";
import { getCurrentAvatar, calculateProgressInDays } from "@/utils/avatar-system";
import type { User, WeeklyProgress } from "@shared/schema";

// Header Component
interface HeaderInternalProps {
  user?: User;
}

function Header({ user }: HeaderInternalProps) {
  const [, setLocation] = useLocation();

  const handleProfileClick = () => {
    setLocation('/perfil-usuario');
  };

  return (
    <header className="p-4 flex items-center justify-between">
      <div className="w-34 h-34">
        <img
          src="/logo-scapy.png"
          alt="Logo Scapy"
          className="w-32 h-16 object-contain"
          onError={(e) => {
            e.currentTarget.src = "https://api.dicebear.com/7.x/shapes/svg?seed=scapy&backgroundColor=00F6FF&shape1Color=000515";
          }}
          data-testid="logo-scapy"
        />
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => setLocation('/avatares-evolutivos')}
          className="gradient-border w-12 h-12 hover:scale-105 transition-transform cursor-pointer"
          data-testid="avatares-evolutivos-button"
        >
          <div className="gradient-border-inner flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
        </button>

        <button
          onClick={handleProfileClick}
          className="gradient-border w-12 h-12 hover:scale-105 transition-transform cursor-pointer"
          data-testid="profile-container"
        >
          <div className="gradient-border-inner flex items-center justify-center">
            <img
              src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}&backgroundColor=000515`}
              alt="Profile Picture"
              className="w-10 h-10 rounded-full object-cover"
              data-testid="profile-image"
            />
          </div>
        </button>
      </div>
    </header>
  );
}

// Interface para dados de humor semanal
interface WeeklyMood {
  userId: string;
  weekStart: string;
  weekEnd: string;
  moodByDay: (string | null)[]; // [domingo, segunda, terça, quarta, quinta, sexta, sábado]
}

// ============================================
// SISTEMA ULTRA-ROBUSTO DE PERSISTÊNCIA DE HUMOR SEMANAL
// Sistema de múltiplos backups, validação avançada e recuperação automática
// ============================================

interface WeeklyMoodRobustData {
  weeklyMood: WeeklyMood;
  timestamp: number;
  version: string;
  lastModified: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
  };
  checksums: {
    userId: string;
    weekKey: string;
    moodCount: number;
  };
}

class WeeklyMoodStorage {
  private static readonly STORAGE_KEY = 'scapy_weekly_moods_v2';
  private static readonly BACKUP_KEY = 'scapy_weekly_moods_backup';
  private static readonly INDIVIDUAL_KEY = 'scapy_individual_moods';
  private static readonly VERSION_KEY = 'scapy_mood_version';
  private static readonly CURRENT_VERSION = '2.0.0';
  private static readonly MAX_WEEKS_TO_KEEP = 12; // 3 meses

  // Salvar humor semanal com sistema ultra-robusto
  static saveWeeklyMood(userId: string, weeklyMood: WeeklyMood): boolean {
    return this.saveWeeklyMoodInternal(userId, weeklyMood, true);
  }

  // Salvar sem disparar eventos (para evitar loops)
  static saveWeeklyMoodSilently(userId: string, weeklyMood: WeeklyMood): boolean {
    return this.saveWeeklyMoodInternal(userId, weeklyMood, false);
  }

  // Método interno de salvamento
  private static saveWeeklyMoodInternal(userId: string, weeklyMood: WeeklyMood, dispatchEvents: boolean): boolean {
    try {
      const timestamp = Date.now();
      const weekKey = this.getWeekKey(new Date());

      const robustData: WeeklyMoodRobustData = {
        weeklyMood,
        timestamp,
        version: this.CURRENT_VERSION,
        lastModified: new Date().toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        },
        checksums: {
          userId,
          weekKey,
          moodCount: weeklyMood.moodByDay.filter(mood => mood !== null).length
        }
      };

      // 1. Salvar dados principais
      const storageData = this.getStorageData();
      if (!storageData[userId]) {
        storageData[userId] = {};
      }
      storageData[userId][weekKey] = robustData;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));

      // 2. Backup em chave separada
      const backupData = this.getBackupData();
      if (!backupData[userId]) {
        backupData[userId] = {};
      }
      backupData[userId][weekKey] = robustData;
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupData));

      // 3. Backup individual por usuário
      const individualKey = `${this.INDIVIDUAL_KEY}_${userId}_${weekKey}`;
      localStorage.setItem(individualKey, JSON.stringify(robustData));

      // 4. Salvar versão para compatibilidade
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);

      // 5. Salvar cada humor individual também
      this.saveIndividualMoods(userId, weeklyMood);

      console.log(`💾 [WeeklyMoodStorage] Humor semanal salvo ${dispatchEvents ? 'com eventos' : 'silenciosamente'} para usuário ${userId}, semana: ${weekKey} (${robustData.checksums.moodCount} humores)`);

      // 6. Disparar evento de sincronização APENAS se solicitado
      if (dispatchEvents) {
        const syncEvent = new CustomEvent('weeklyMoodSaved', {
          detail: {
            userId,
            weekKey,
            weeklyMood,
            timestamp
          }
        });
        window.dispatchEvent(syncEvent);
      }

      return true;
    } catch (error) {
      console.error('❌ [WeeklyMoodStorage] Erro ao salvar humor semanal:', error);
      return false;
    }
  }

  // Salvar humores individuais para máxima redundância
  private static saveIndividualMoods(userId: string, weeklyMood: WeeklyMood): void {
    try {
      const startOfWeek = new Date(weeklyMood.weekStart);

      weeklyMood.moodByDay.forEach((mood, dayIndex) => {
        if (mood) {
          const dayDate = new Date(startOfWeek);
          dayDate.setDate(startOfWeek.getDate() + dayIndex);
          const dayKey = dayDate.toISOString().split('T')[0];

          const moodData = {
            userId,
            mood,
            date: dayKey,
            dayOfWeek: dayIndex,
            timestamp: Date.now(),
            version: this.CURRENT_VERSION
          };

          localStorage.setItem(`scapy_daily_mood_${userId}_${dayKey}`, JSON.stringify(moodData));
        }
      });
    } catch (error) {
      console.error('❌ [WeeklyMoodStorage] Erro ao salvar humores individuais:', error);
    }
  }

  // Carregar humor semanal com sistema de fallback
  static loadWeeklyMood(userId: string): WeeklyMood | null {
    try {
      const weekKey = this.getWeekKey(new Date());

      // 1. Tentar carregar dados principais
      let robustData = this.loadFromPrimary(userId, weekKey);

      // 2. Fallback para backup
      if (!robustData) {
        console.log('🔄 [WeeklyMoodStorage] Tentando carregar backup...');
        robustData = this.loadFromBackup(userId, weekKey);
      }

      // 3. Fallback para chave individual
      if (!robustData) {
        console.log('🔄 [WeeklyMoodStorage] Tentando carregar dados individuais...');
        robustData = this.loadFromIndividual(userId, weekKey);
      }

      // 4. Fallback para reconstituição a partir de humores diários
      if (!robustData) {
        console.log('🔄 [WeeklyMoodStorage] Tentando reconstituir a partir de humores diários...');
        return this.reconstructFromDailyMoods(userId);
      }

      if (robustData) {
        // Validar integridade dos dados
        if (this.validateMoodData(robustData)) {
          console.log(`📖 [WeeklyMoodStorage] Humor semanal carregado com sucesso para usuário ${userId}`);
          return robustData.weeklyMood;
        } else {
          console.warn('⚠️ [WeeklyMoodStorage] Dados corrompidos detectados, tentando recuperação...');
          return this.reconstructFromDailyMoods(userId);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ [WeeklyMoodStorage] Erro ao carregar humor semanal:', error);
      return null;
    }
  }

  // Validar integridade dos dados
  private static validateMoodData(robustData: WeeklyMoodRobustData): boolean {
    try {
      // Verificar estrutura básica
      if (!robustData.weeklyMood || !robustData.checksums) {
        return false;
      }

      // Verificar array de humores
      if (!Array.isArray(robustData.weeklyMood.moodByDay) || robustData.weeklyMood.moodByDay.length !== 7) {
        return false;
      }

      // Verificar contagem de humores
      const actualMoodCount = robustData.weeklyMood.moodByDay.filter(mood => mood !== null).length;
      if (actualMoodCount !== robustData.checksums.moodCount) {
        console.warn(`⚠️ [WeeklyMoodStorage] Divergência na contagem: esperado ${robustData.checksums.moodCount}, encontrado ${actualMoodCount}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ [WeeklyMoodStorage] Erro na validação:', error);
      return false;
    }
  }

  // Reconstituir dados a partir de humores diários
  private static reconstructFromDailyMoods(userId: string): WeeklyMood | null {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const moodByDay = new Array(7).fill(null);

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const dayKey = dayDate.toISOString().split('T')[0];

        const dailyMoodData = localStorage.getItem(`scapy_daily_mood_${userId}_${dayKey}`);
        if (dailyMoodData) {
          try {
            const parsed = JSON.parse(dailyMoodData);
            moodByDay[i] = parsed.mood;
          } catch (error) {
            console.warn(`⚠️ [WeeklyMoodStorage] Erro ao parsear humor do dia ${dayKey}:`, error);
          }
        }
      }

      const hasAnyMood = moodByDay.some(mood => mood !== null);
      if (hasAnyMood) {
        const reconstructedMood: WeeklyMood = {
          userId,
          weekStart: startOfWeek.toISOString(),
          weekEnd: endOfWeek.toISOString(),
          moodByDay
        };

        console.log('🔧 [WeeklyMoodStorage] Dados reconstituídos com sucesso:', reconstructedMood);

        // Salvar dados reconstituídos
        this.saveWeeklyMood(userId, reconstructedMood);

        return reconstructedMood;
      }

      return null;
    } catch (error) {
      console.error('❌ [WeeklyMoodStorage] Erro na reconstituição:', error);
      return null;
    }
  }

  // Carregar dados principais
  private static loadFromPrimary(userId: string, weekKey: string): WeeklyMoodRobustData | null {
    try {
      const storageData = this.getStorageData();
      return storageData[userId]?.[weekKey] || null;
    } catch (error) {
      console.error('❌ [WeeklyMoodStorage] Erro ao carregar dados principais:', error);
      return null;
    }
  }

  // Carregar dados de backup
  private static loadFromBackup(userId: string, weekKey: string): WeeklyMoodRobustData | null {
    try {
      const backupData = this.getBackupData();
      return backupData[userId]?.[weekKey] || null;
    } catch (error) {
      console.error('❌ [WeeklyMoodStorage] Erro ao carregar backup:', error);
      return null;
    }
  }

  // Carregar dados individuais
  private static loadFromIndividual(userId: string, weekKey: string): WeeklyMoodRobustData | null {
    try {
      const individualKey = `${this.INDIVIDUAL_KEY}_${userId}_${weekKey}`;
      const data = localStorage.getItem(individualKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ [WeeklyMoodStorage] Erro ao carregar dados individuais:', error);
      return null;
    }
  }

  // Limpar dados antigos mas preservar histórico extenso
  static cleanOldWeeks(): void {
    try {
      const storageData = this.getStorageData();
      const backupData = this.getBackupData();
      const currentDate = new Date();

      Object.keys(storageData).forEach(userId => {
        const userWeeks = storageData[userId];
        const weekKeys = Object.keys(userWeeks);

        // Ordenar semanas por data e manter as mais recentes
        const sortedWeeks = weekKeys
          .map(key => ({ key, date: this.getDateFromWeekKey(key) }))
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, this.MAX_WEEKS_TO_KEEP);

        // Manter dados principais
        const newUserWeeks: any = {};
        sortedWeeks.forEach(({ key }) => {
          newUserWeeks[key] = userWeeks[key];
        });
        storageData[userId] = newUserWeeks;

        // Fazer o mesmo para backup
        if (backupData[userId]) {
          const backupUserWeeks: any = {};
          sortedWeeks.forEach(({ key }) => {
            if (backupData[userId][key]) {
              backupUserWeeks[key] = backupData[userId][key];
            }
          });
          backupData[userId] = backupUserWeeks;
        }
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupData));

      console.log(`🧹 [WeeklyMoodStorage] Limpeza concluída, mantendo ${this.MAX_WEEKS_TO_KEEP} semanas`);
    } catch (error) {
      console.error('❌ [WeeklyMoodStorage] Erro ao limpar semanas antigas:', error);
    }
  }

  private static getStorageData(): any {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private static getBackupData(): any {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private static getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private static getDateFromWeekKey(weekKey: string): Date {
    return new Date(weekKey);
  }

  // Método para sincronização cross-tab
  static setupCrossTabSync(): void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith(this.STORAGE_KEY) || e.key.startsWith(this.BACKUP_KEY))) {
        console.log('🔄 [WeeklyMoodStorage] Detectada mudança cross-tab, disparando evento...');
        const syncEvent = new CustomEvent('weeklyMoodCrossTabSync', {
          detail: {
            key: e.key,
            newValue: e.newValue,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(syncEvent);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    console.log('🚀 [WeeklyMoodStorage] Sincronização cross-tab ativada');
  }
}

// Weekly Tracker Component
interface WeeklyTrackerProps {
  weeklyProgress?: WeeklyProgress;
  user?: User;
}

function WeeklyTracker({ weeklyProgress, user }: WeeklyTrackerProps) {
  const queryClient = useQueryClient();
  const [weeklyMood, setWeeklyMood] = useState<WeeklyMood | null>(null);
  const [isLoadingMood, setIsLoadingMood] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  // Carregar humor semanal com merge inteligente
  const loadWeeklyMood = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log(`🔍 [WeeklyTracker] Carregando humor semanal para usuário ${user.id}`);

      // Carregar dados locais primeiro
      let localMood = WeeklyMoodStorage.loadWeeklyMood(user.id.toString());
      if (localMood) {
        console.log(`💿 [WeeklyTracker] Humor carregado do localStorage:`, localMood);
        setWeeklyMood(localMood);
      }

      // Buscar dados da API
      const response = await apiRequest('GET', `/api/weekly-mood/${user.id}`);
      const apiMood = await response.json() as WeeklyMood;
      console.log(`🌐 [WeeklyTracker] Humor semanal recebido da API:`, apiMood);

      // === MERGE INTELIGENTE: NÃO SOBRESCREVER DADOS VÁLIDOS ===
      const apiMoodCount = apiMood.moodByDay.filter(mood => mood !== null).length;
      const localMoodCount = localMood ? localMood.moodByDay.filter(mood => mood !== null).length : 0;

      console.log(`📊 [WeeklyTracker] Contagem - API: ${apiMoodCount}, Local: ${localMoodCount}`);

      if (apiMoodCount === 0 && localMoodCount > 0) {
        // Se API está vazia mas temos dados locais, manter os locais
        console.log(`🚫 [WeeklyTracker] API vazia, mantendo dados locais existentes`);
        return; // Não sobrescrever
      } else if (apiMoodCount > 0 && localMood) {
        // Fazer merge: combinar dados da API com dados locais
        const mergedMoodByDay = [...apiMood.moodByDay];

        // Preencher gaps da API com dados locais
        for (let i = 0; i < 7; i++) {
          if (mergedMoodByDay[i] === null && localMood.moodByDay[i] !== null) {
            mergedMoodByDay[i] = localMood.moodByDay[i];
            console.log(`🔄 [WeeklyTracker] Preenchendo dia ${i} com humor local: ${localMood.moodByDay[i]}`);
          }
        }

        const mergedMood: WeeklyMood = {
          ...apiMood,
          moodByDay: mergedMoodByDay
        };

        console.log(`🤝 [WeeklyTracker] Dados merged:`, mergedMood);
        setWeeklyMood(mergedMood);
        WeeklyMoodStorage.saveWeeklyMood(user.id.toString(), mergedMood);
      } else if (apiMoodCount > 0) {
        // Se só a API tem dados, usar os da API
        console.log(`🌐 [WeeklyTracker] Usando dados da API`);
        setWeeklyMood(apiMood);
        WeeklyMoodStorage.saveWeeklyMood(user.id.toString(), apiMood);
      }

    } catch (error) {
      console.error('❌ [WeeklyTracker] Erro ao carregar humor:', error);
      // Em caso de erro na API, manter dados locais se existirem
    }
  }, [user?.id]);

  // Inicialização ao montar componente
  useEffect(() => {
    if (user?.id && !isInitialized) {
      setIsInitialized(true);
      setIsLoadingMood(true);
      loadWeeklyMood().finally(() => setIsLoadingMood(false));
    }
  }, [user?.id]);

  // ============================================
  // SISTEMA DE SINCRONIZAÇÃO (CORRIGIDO)
  // ============================================
  useEffect(() => {
    if (!user?.id || !isInitialized) return;

    const handleMoodUpdated = (event: any) => {
      if (!event.detail || event.detail.userId !== user.id.toString()) return;

      const mood = event.detail.mood;
      if (!mood) return; // Ignorar eventos sem humor

      const dayOfWeek = event.detail.dayOfWeek ?? new Date().getDay();

      console.log(`🔔 [WeeklyTracker] Evento moodUpdated: humor "${mood}" para dia ${dayOfWeek}`);

      setWeeklyMood(prevMood => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const newMoodByDay = [...(prevMood?.moodByDay || new Array(7).fill(null))];
        newMoodByDay[dayOfWeek] = mood;

        const updatedMood: WeeklyMood = {
          userId: user.id.toString(),
          weekStart: startOfWeek.toISOString(),
          weekEnd: endOfWeek.toISOString(),
          moodByDay: newMoodByDay
        };

        // Salvar SEM disparar novos eventos E sincronizar com formato da API
        WeeklyMoodStorage.saveWeeklyMoodSilently(user.id.toString(), updatedMood);

        // BONUS: Salvar também no formato individual para compatibilidade total
        const todayKey = new Date().toISOString().split('T')[0];
        const moodData = {
          userId: user.id.toString(),
          mood: mood,
          date: todayKey,
          timestamp: Date.now(),
          source: 'weekly-tracker'
        };
        localStorage.setItem(`scapy_mood_${user.id}_${todayKey}`, JSON.stringify(moodData));
        localStorage.setItem(`scapy_daily_mood_${user.id}_${todayKey}`, JSON.stringify(moodData));

        console.log('⚡ [WeeklyTracker] Estado atualizado e sincronizado:', updatedMood);

        return updatedMood;
      });

      // Buscar dados atualizados da API após delay
      setTimeout(() => {
        loadWeeklyMood();
      }, 2000);
    };

    const handleCrossTabSync = (event: any) => {
      console.log('🔄 [WeeklyTracker] Sincronização cross-tab detectada');
      const updatedMood = WeeklyMoodStorage.loadWeeklyMood(user.id.toString());
      if (updatedMood) {
        setWeeklyMood(updatedMood);
      }
    };

    // Adicionar listeners
    window.addEventListener('moodUpdated', handleMoodUpdated);
    window.addEventListener('weeklyMoodUpdated', handleMoodUpdated);
    window.addEventListener('weeklyMoodCrossTabSync', handleCrossTabSync);

    return () => {
      window.removeEventListener('moodUpdated', handleMoodUpdated);
      window.removeEventListener('weeklyMoodUpdated', handleMoodUpdated);
      window.removeEventListener('weeklyMoodCrossTabSync', handleCrossTabSync);
    };
  }, [user?.id, isInitialized, loadWeeklyMood]);

  // Sistema de recuperação do localStorage
  const loadPersistentMoods = () => {
    if (!user?.id) return;

    try {
      // Primeiro tentar o sistema robusto
      const robustMood = WeeklyMoodStorage.loadWeeklyMood(user.id.toString());
      if (robustMood) {
        setWeeklyMood(robustMood);
        console.log('💿 [WeeklyTracker] Humor carregado do sistema robusto:', robustMood);
        return;
      }

      // Fallback para sistema antigo
      const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
      const userMoods = allMoods[user.id.toString()] || {};

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const moodByDay = new Array(7).fill(null);

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const dayKey = dayDate.toISOString().split('T')[0];

        if (userMoods[dayKey]) {
          moodByDay[i] = userMoods[dayKey];
        }
      }

      const hasAnyMood = moodByDay.some(mood => mood !== null);
      if (hasAnyMood) {
        const persistentMood: WeeklyMood = {
          userId: user.id.toString(),
          weekStart: startOfWeek.toISOString(),
          weekEnd: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          moodByDay
        };

        setWeeklyMood(persistentMood);
        console.log('💿 [WeeklyTracker] Humor recuperado do sistema antigo:', persistentMood);
      }
    } catch (error) {
      console.error('❌ [WeeklyTracker] Erro ao recuperar humores:', error);
    }
  };

  // Inicialização dos sistemas robustos
  useEffect(() => {
    if (user?.id && !isInitialized) {
      WeeklyMoodStorage.cleanOldWeeks();
      WeeklyMoodStorage.setupCrossTabSync();
      loadPersistentMoods();
      console.log('🚀 [WeeklyTracker] Sistemas inicializados');
    }
  }, [user?.id, isInitialized]);

  const updateProgressMutation = useMutation({
    mutationFn: async (updatedDays: boolean[]) => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      return apiRequest("POST", "/api/weekly-progress", {
        weekStart: startOfWeek.toISOString(),
        dayCompleted: updatedDays,
        currentStreak: weeklyProgress?.currentStreak || 0,
        bestStreak: weeklyProgress?.bestStreak || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-progress"] });
    },
  });

  const handleDayClick = (dayIndex: number) => {
    if (!weeklyProgress) return;

    const updatedDays = [...weeklyProgress.dayCompleted];
    updatedDays[dayIndex] = !updatedDays[dayIndex];

    updateProgressMutation.mutate(updatedDays);
  };

  // Função para determinar classes CSS baseadas no humor e status de conclusão
  const getDayClasses = (dayIndex: number): string => {
    const baseClass = 'day-circle';
    const isCompleted = weeklyProgress?.dayCompleted[dayIndex];
    const dayMood = weeklyMood?.moodByDay?.[dayIndex];

    let classes = [baseClass];

    // Se o dia está concluído, usar a classe completed (verde padrão)
    if (isCompleted) {
      classes.push('completed');
    }
    // Caso contrário, aplicar estilo baseado no humor se existir
    else if (dayMood) {
      // Normalizar humor removendo acentos para comparação
      const normalizedMood = dayMood.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove acentos

      switch (normalizedMood) {
        case 'medo':
          classes.push('mood-medo');
          break;
        case 'estavel':
          classes.push('mood-estavel');
          break;
        case 'feliz':
          classes.push('mood-feliz');
          break;
      }
    }

    return classes.join(' ');
  };

  // Função para determinar o título do botão
  const getDayTitle = (dayIndex: number): string => {
    const dayName = dayNames[dayIndex];
    const isCompleted = weeklyProgress?.dayCompleted[dayIndex];
    const dayMood = weeklyMood?.moodByDay?.[dayIndex];

    let title = `${dayName} - `;

    if (isCompleted) {
      title += 'Concluído';
    } else {
      title += 'Pendente';
    }

    if (dayMood) {
      // Normalizar humor removendo acentos para mapeamento
      const normalizedMood = dayMood.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove acentos

      const moodLabels: { [key: string]: string } = {
        'medo': 'Medo',
        'estavel': 'Estável',
        'feliz': 'Feliz'
      };

      const label = moodLabels[normalizedMood] || dayMood;
      title += ` | Humor: ${label}`;
    }

    return title;
  };

  return (
    <section className="mb-8">
      <div className="flex justify-center space-x-2">
        {weekDays.map((day, index) => (
          <button
            key={index}
            className={getDayClasses(index)}
            onClick={() => handleDayClick(index)}
            title={getDayTitle(index)}
            data-testid={`day-circle-${index}`}
            disabled={updateProgressMutation.isPending || isLoadingMood}
          >
            {day}
          </button>
        ))}
      </div>

      {(updateProgressMutation.isPending || isLoadingMood) && (
        <div className="text-center mt-2 text-xs text-muted-foreground">
          {isLoadingMood ? 'Carregando humores...' : 'Atualizando...'}
        </div>
      )}

    </section>
  );
}

// Timer Component
interface TimerProps {
  user: User | undefined;
  onUserUpdate?: (updatedUser: any) => void;
}

function Timer({ user, onUserUpdate }: TimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isStarting, setIsStarting] = useState(false);
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update local user when prop changes and sync with localStorage
  useEffect(() => {
    setLocalUser(user);
    // Sync with localStorage whenever user data changes
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('🔄 Dados do usuário sincronizados no localStorage:', user);
    }
  }, [user]);

  const handleStartTimer = async () => {
    if (!user?.id) return;

    setIsStarting(true);

    try {
      const response = await fetch('/api/timer/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local user state
        setLocalUser(data.user);

        // Update localStorage for user data only
        localStorage.setItem('user', JSON.stringify(data.user));

        // Update parent component if callback provided
        if (onUserUpdate) {
          onUserUpdate(data.user);
        }

        console.log('✅ Cronômetro iniciado com sucesso! Dados sincronizados:', data.user);
      } else {
        console.error('Erro ao iniciar cronômetro:', data.message);
        alert('Erro ao iniciar cronômetro: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao iniciar cronômetro:', error);
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setIsStarting(false);
    }
  };

  // Check if user has startDate - now we rely on database data
  const userWithTimer = localUser && localUser.startDate;

  if (!localUser) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Carregando dados do usuário...
        </p>
        <div className="timer-display">
          00:00:00
        </div>
      </div>
    );
  }

  if (!userWithTimer) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Pronto para começar sua jornada livre da pornografia?
        </p>
        <button
          onClick={handleStartTimer}
          disabled={isStarting}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg disabled:opacity-50"
          data-testid="start-timer-button"
        >
          {isStarting ? 'Iniciando...' : '🚀 INICIAR CRONÔMETRO'}
        </button>
      </div>
    );
  }

  // Calculate progressive time from user's actual start date
  const startDate = localUser.startDate || new Date().toISOString();
  const timeDiff = calculateTimeDifference(startDate, currentTime);

  // Check if user has completed at least 1 full day (24 hours)
  const hasCompletedOneDay = timeDiff.days > 0;

  return (
    <div className="text-center">
      {!hasCompletedOneDay ? (
        // Original timer display for less than 24 hours
        <>
          <p className="text-sm text-muted-foreground mb-0">
            Você está livre da pornografia há:
          </p>
          <div className="timer-display" data-testid="timer-display">
            <span data-testid="timer-hours">{String(timeDiff.hours).padStart(2, '0')}</span>:
            <span data-testid="timer-minutes">{String(timeDiff.minutes).padStart(2, '0')}</span>:
            <span data-testid="timer-seconds">{String(timeDiff.seconds).padStart(2, '0')}</span>
          </div>
        </>
      ) : (
        // New design for 1+ days
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Você está livre da pornografia há:
          </p>
          <div className="text-7xl font-bold text-primary mb-4" data-testid="days-display">
            {timeDiff.days} {timeDiff.days === 1 ? 'DIA' : 'DIAS'}
          </div>

          {/* Rectangular component with rounded borders containing the time */}
          <div className="ai-assistant-card-natural-3d border border-border rounded-full p-2 px-3 inline-block" style={{ backgroundColor: '#000515' }}>
            <div className="text-lg font-mono text-primary font-semibold" data-testid="time-component">
              {String(timeDiff.hours).padStart(2, '0')}h {String(timeDiff.minutes).padStart(2, '0')}m {String(timeDiff.seconds).padStart(2, '0')}s
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Panic Button Component
interface PanicButtonProps {
  onPanicClick: () => void;
}

function PanicButton({ onPanicClick }: PanicButtonProps) {
  const handlePanicClick = () => {
    // Animação suave para transição
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0.8';

    setTimeout(() => {
      onPanicClick();
      document.body.style.opacity = '1';
    }, 150);
  };

  return (
    <div className="p-4 pb-2">
      <Button
        onClick={handlePanicClick}
        className="w-full panic-button text-white border-0 h-14 rounded-full transition-all duration-300 shadow-lg font-bold text-lg"
        data-testid="panic-button"
      >
        🚨 BOTÃO DE PÂNICO
      </Button>
    </div>
  );
}

// Bottom Navigation Component
interface BottomNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

function BottomNavigation({
  activeSection,
  onSectionChange
}: BottomNavigationProps) {
  const navItems = [
    { id: 'scapy-ia', label: 'Scapy IA', icon: Bot, inactive: true },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen, inactive: true },
    { id: 'painel', label: 'Painel', icon: Home, inactive: false },
    { id: 'desempenho', label: 'Desempenho', icon: BarChart3, inactive: true },
    { id: 'comunidade', label: 'Comunidade', icon: Users, inactive: true },
  ];

  return (
    <nav className="bg-transparent">
      <div className="flex justify-center space-x-4 py-3">
        {navItems.map(({ id, label, icon: Icon, inactive }) => (
          <button
            key={id}
            className={`nav-item transition-colors ${
              id === 'painel' ? 'active' : inactive ? 'inactive' : ''
            }`}
            onClick={() => onSectionChange(id)}
            data-testid={`nav-${id}`}
          >
            <div className="w-10 h-10 bg-secondary/20 flex items-center justify-center">
              <Icon className="w-6 h-6 font-extrabold" />
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
}

// Journey Start Component
function JourneyStart({ onStartJourney }: { onStartJourney: () => void }) {
  return (
    <div className="flex items-start justify-center mt-8 min-h-[60vh]">
      <div
        className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
        onClick={onStartJourney}
        data-testid="journey-start-image"
      >
        <img
          src="/Imagem-inicio-jornada-painel.webp"
          alt="Comece sua jornada agora - Bloqueador avançado de apps e sites"
          className="w-[770px] h-[527px] object-contain mx-auto"
          loading="eager"
          fetchPriority="high"
          width={600}
          height={450}
          onError={(e) => {
            console.error("Erro ao carregar imagem:", e);
            e.currentTarget.src = "/Imagem-inicio-jornada-painel.png";
          }}
        />
      </div>
    </div>
  );
}

// Main Panel Interface Component
interface PainelInterfaceProps {
  user?: User;
  weeklyProgress?: WeeklyProgress;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function PainelInterface({
  user,
  weeklyProgress,
  activeSection,
  onSectionChange
}: PainelInterfaceProps) {
  // Journey state - check if user has started their journey from database
  const [hasStartedJourney, setHasStartedJourney] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const [isLoading, setIsLoading] = useState(true);
  const [timerStartDate, setTimerStartDate] = useState<string | null>(null);
  const [showPanicPage, setShowPanicPage] = useState(false);
  const [, setLocation] = useLocation();

  // Check timer status from database when user loads
  useEffect(() => {
    const checkTimerStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/timer/status/${user.id}`);
        const data = await response.json();

        if (response.ok) {
          setHasStartedJourney(data.hasActiveTimer);
          if (data.hasActiveTimer && data.startDate) {
            setTimerStartDate(data.startDate);
            // Update local user with timer start date
            setLocalUser(prev => prev ? { ...prev, startDate: data.startDate } : prev);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do timer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkTimerStatus();
  }, [user?.id]);

  // Update local user when prop changes
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const handleStartJourney = async () => {
    setHasStartedJourney(true);
  };

  const handleUserUpdate = (updatedUser: any) => {
    setLocalUser(updatedUser);
    setHasStartedJourney(true);
    setTimerStartDate(updatedUser.startDate);
    
    // Force avatar update
    if (updatedUser.startDate) {
      const days = calculateProgressInDays(updatedUser.startDate);
      setDaysProgress(days);
      const avatar = getCurrentAvatar(days);
      setCurrentAvatar(avatar);
      console.log(`🎯 [PainelInterface] Avatar forçado para atualização: ${avatar.title} (${days} dias)`);
    }
  };

  const handlePanicClick = () => {
    setShowPanicPage(true);
  };

  const handleBackFromPanic = () => {
    setShowPanicPage(false);
  };

  // If should show panic page, render only that
  if (showPanicPage) {
    return <PanicPage user={localUser} onBackFromPanic={handleBackFromPanic} />;
  }

  // Calculate days for avatar progression with real-time updates
  const [daysProgress, setDaysProgress] = useState(0);
  const [currentAvatar, setCurrentAvatar] = useState(getCurrentAvatar(0));

  // Update days progress in real-time
  useEffect(() => {
    const updateProgress = () => {
      if (localUser?.startDate) {
        const days = calculateProgressInDays(localUser.startDate);
        setDaysProgress(days);
        const avatar = getCurrentAvatar(days);
        setCurrentAvatar(avatar);
        console.log(`🎯 [PainelInterface] Avatar atualizado: ${avatar.title} para ${days} dias`);
      }
    };

    // Update immediately
    updateProgress();

    // Update every second for real-time sync
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [localUser?.startDate]);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden">
      <ParticlesBackground isDarkTheme={true} className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <Header user={user} />

        <main className="flex-1 px-4 pb-48">
          <div className="space-y-6">
            {/* Conditionally show WeeklyTracker */}
            {hasStartedJourney && <WeeklyTracker weeklyProgress={weeklyProgress} user={localUser} />}

            <section className="text-center">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Verificando status do cronômetro...
                  </p>
                </div>
              ) : !hasStartedJourney ? (
                <JourneyStart onStartJourney={handleStartJourney} />
              ) : (
                <>
                  {/* Avatar evolutivo com sincronização em tempo real */}
                  <div 
                    className="floating-avatar mb-6 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    onClick={() => setLocation('/avatares-evolutivos')}
                    data-testid="evolutionary-avatar-clickable"
                  >
                    <EvolutionaryAvatar
                      startDate={localUser?.startDate}
                      size="large"
                      showTitle={false}
                      showProgress={false}
                      className="transition-all duration-500"
                    />
                  </div>

                  {/* Conditionally show Timer */}
                  <Timer user={localUser} onUserUpdate={handleUserUpdate} />
                </>
              )}
            </section>
          </div>

          {/* These components always show regardless of journey state */}
          <div className="mt-6">
            <AIAssistant />
          </div>

          <div className="mt-6 flex flex-col space-y-6">
            <AnaliseEvolucaoMental />

            <FraseDoDia />

            <div className="challenge-cards-container mt-8">
              <DesafioPlanoBeamEstar />
              <DesafioDuplaDinamica />
            </div>

            <div className="daily-goals-section">
              <DailyGoals />
            </div>
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 backdrop-blur-md bg-black/30 border-t border-white/10">
        <PanicButton onPanicClick={handlePanicClick} />
        <BottomNavigation
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
      </div>
    </div>
  );
}