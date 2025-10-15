import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bot,
  BookOpen,
  Home,
  BarChart3,
  Users,
  Target,
  Trophy,
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
import { authenticatedFetch, isAuthenticated } from '@/lib/auth-utils';

// Cache inteligente para otimização de performance
class PainelCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static readonly DEFAULT_TTL = 30000; // 30 segundos

  static set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
      ttl
    });
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return JSON.parse(JSON.stringify(cached.data));
  }

  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  static clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

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
          onClick={() => setLocation('/ranking')}
          className="hover:scale-110 transition-transform cursor-pointer"
          data-testid="ranking-button"
        >
          <Trophy className="w-7 h-7 text-primary" strokeWidth={2.5} />
        </button>

        <button
          onClick={() => setLocation('/avatares-evolutivos')}
          className="hover:scale-110 transition-transform cursor-pointer"
          data-testid="avatares-evolutivos-button"
        >
          <Target className="w-7 h-7 text-primary" strokeWidth={2.5} />
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
  moodByDay: (string | null)[];
}

// Sistema otimizado de persistência
class OptimizedMoodStorage {
  private static readonly STORAGE_KEY = 'scapy_weekly_moods_v3';
  private static readonly CURRENT_VERSION = '3.0.0';
  private static cache = new Map<string, WeeklyMood>();

  static saveWeeklyMood(userId: string, weeklyMood: WeeklyMood): boolean {
    try {
      const weekKey = this.getWeekKey(new Date());
      const cacheKey = `${userId}_${weekKey}`;

      // Cache primeiro
      this.cache.set(cacheKey, weeklyMood);

      // Persistir no localStorage
      const storageData = this.getStorageData();
      if (!storageData[userId]) {
        storageData[userId] = {};
      }
      storageData[userId][weekKey] = {
        ...weeklyMood,
        timestamp: Date.now(),
        version: this.CURRENT_VERSION
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
      console.log(`💾 [OptimizedMoodStorage] Humor salvo para ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ [OptimizedMoodStorage] Erro ao salvar:', error);
      return false;
    }
  }

  static loadWeeklyMood(userId: string): WeeklyMood | null {
    try {
      const weekKey = this.getWeekKey(new Date());
      const cacheKey = `${userId}_${weekKey}`;

      // Verificar cache primeiro
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey) || null;
      }

      // Carregar do localStorage
      const storageData = this.getStorageData();
      const userData = storageData[userId]?.[weekKey];

      if (userData) {
        const weeklyMood: WeeklyMood = {
          userId: userData.userId,
          weekStart: userData.weekStart,
          weekEnd: userData.weekEnd,
          moodByDay: userData.moodByDay
        };

        // Cachear resultado
        this.cache.set(cacheKey, weeklyMood);
        return weeklyMood;
      }

      return null;
    } catch (error) {
      console.error('❌ [OptimizedMoodStorage] Erro ao carregar:', error);
      return null;
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

  private static getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek.toISOString().split('T')[0];
  }
}

// Weekly Tracker Component otimizado
interface WeeklyTrackerProps {
  weeklyProgress?: WeeklyProgress;
  user?: User;
}

function WeeklyTracker({ weeklyProgress, user }: WeeklyTrackerProps) {
  const queryClient = useQueryClient();
  const [weeklyMood, setWeeklyMood] = useState<WeeklyMood | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  // Carregar humor semanal otimizado com cache
  const loadWeeklyMood = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `weekly_mood_${user.id}`;

    try {
      // 1. Verificar cache primeiro para carregamento instantâneo
      const cachedMood = PainelCache.get(cacheKey);
      if (cachedMood) {
        console.log(`⚡ [WeeklyTracker] Dados do cache carregados instantaneamente`);
        setWeeklyMood(cachedMood);
        setIsLoading(false);
        return;
      }

      // 2. Carregar dados locais primeiro (rápido)
      const localMood = OptimizedMoodStorage.loadWeeklyMood(user.id.toString());
      if (localMood) {
        console.log(`💿 [WeeklyTracker] Humor local carregado`);
        setWeeklyMood(localMood);
        PainelCache.set(cacheKey, localMood, 60000); // Cache por 1 minuto
        setIsLoading(false);
      }

      // 3. Verificar humor de hoje no AIAssistant (sem API)
      const todayKey = new Date().toISOString().split('T')[0];
      const todayMoodKey = `scapy_daily_mood_${user.id}_${todayKey}`;
      const todayMoodData = localStorage.getItem(todayMoodKey);

      if (todayMoodData && localMood) {
        try {
          const moodData = JSON.parse(todayMoodData);
          const today = new Date();
          const dayOfWeek = today.getDay();

          // Atualizar humor semanal com o humor de hoje
          const newMoodByDay = [...localMood.moodByDay];
          newMoodByDay[dayOfWeek] = moodData.mood;

          const updatedMood: WeeklyMood = {
            ...localMood,
            moodByDay: newMoodByDay
          };

          setWeeklyMood(updatedMood);
          OptimizedMoodStorage.saveWeeklyMood(user.id.toString(), updatedMood);
          PainelCache.set(cacheKey, updatedMood, 60000);
        } catch (parseError) {
          console.error('❌ [WeeklyTracker] Erro ao parsear humor de hoje:', parseError);
        }
      }

      // 4. Sincronização com API em background (não bloquear UI)
      setTimeout(async () => {
        try {
          const response = await apiRequest('GET', `/api/weekly-mood/${user.id}`);
          const apiMood = await response.json() as WeeklyMood;

          if (apiMood.moodByDay.some(mood => mood !== null)) {
            setWeeklyMood(prev => {
              const mergedMood = prev ? {
                ...apiMood,
                moodByDay: apiMood.moodByDay.map((mood, index) => 
                  mood || prev.moodByDay[index] || null
                )
              } : apiMood;

              OptimizedMoodStorage.saveWeeklyMood(user.id.toString(), mergedMood);
              PainelCache.set(cacheKey, mergedMood, 60000);
              return mergedMood;
            });
          }
        } catch (error) {
          console.warn('⚠️ [WeeklyTracker] Erro na sincronização background:', error);
        }
      }, 100);

    } catch (error) {
      console.error('❌ [WeeklyTracker] Erro ao carregar humor:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Inicialização única
  useEffect(() => {
    loadWeeklyMood();
  }, [loadWeeklyMood]);

  // Listener para atualizações de humor
  useEffect(() => {
    if (!user?.id) return;

    const handleMoodUpdate = (event: CustomEvent) => {
      const { userId, mood, dayOfWeek, date } = event.detail;

      if (userId !== user.id.toString() || !mood) return;

      console.log(`🔄 [WeeklyTracker] Atualizando humor: ${mood} para o dia ${dayOfWeek || 'atual'}`);

      setWeeklyMood(prevMood => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Determinar o dia da semana correto
        let targetDayOfWeek = dayOfWeek;
        if (targetDayOfWeek === undefined) {
          if (date) {
            targetDayOfWeek = new Date(date).getDay();
          } else {
            targetDayOfWeek = now.getDay();
          }
        }

        const newMoodByDay = [...(prevMood?.moodByDay || new Array(7).fill(null))];
        newMoodByDay[targetDayOfWeek] = mood;

        const updatedMood: WeeklyMood = {
          userId: user.id.toString(),
          weekStart: startOfWeek.toISOString(),
          weekEnd: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          moodByDay: newMoodByDay
        };

        console.log(`💾 [WeeklyTracker] Humor atualizado:`, updatedMood);
        OptimizedMoodStorage.saveWeeklyMood(user.id.toString(), updatedMood);
        return updatedMood;
      });
    };

    // Adicionar mais listeners para capturar todas as atualizações
    const events = ['moodUpdated', 'weeklyMoodUpdated', 'dailyMoodUpdated', 'aiMoodSelected'];

    events.forEach(eventName => {
      window.addEventListener(eventName, handleMoodUpdate as EventListener);
    });

    return () => {
      events.forEach(eventName => {
        window.removeEventListener(eventName, handleMoodUpdate as EventListener);
      });
    };
  }, [user?.id]);

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

  const getDayClasses = (dayIndex: number): string => {
    const baseClass = 'day-circle';
    const isCompleted = weeklyProgress?.dayCompleted[dayIndex];
    const dayMood = weeklyMood?.moodByDay?.[dayIndex];

    let classes = [baseClass];

    // Primeiro verificar se há humor para o dia
    if (dayMood) {
      const normalizedMood = dayMood.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

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

    // Depois verificar se está concluído (para sobrescrever se necessário)
    if (isCompleted) {
      classes.push('completed');
    }

    return classes.join(' ');
  };

  const getDayTitle = (dayIndex: number): string => {
    const dayName = dayNames[dayIndex];
    const isCompleted = weeklyProgress?.dayCompleted[dayIndex];
    const dayMood = weeklyMood?.moodByDay?.[dayIndex];

    let title = `${dayName} - ${isCompleted ? 'Concluído' : 'Pendente'}`;

    if (dayMood) {
      const moodLabels = {
        'medo': 'Medo',
        'estavel': 'Estável',
        'feliz': 'Feliz'
      };
      const normalizedMood = dayMood.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const label = moodLabels[normalizedMood as keyof typeof moodLabels] || dayMood;
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
            disabled={updateProgressMutation.isPending || isLoading}
          >
            {day}
          </button>
        ))}
      </div>

      {(updateProgressMutation.isPending || isLoading) && (
        <div className="text-center mt-2 text-xs text-muted-foreground">
          {isLoading ? 'Carregando humores...' : 'Atualizando...'}
        </div>
      )}
    </section>
  );
}

// Timer Component otimizado
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

  useEffect(() => {
    setLocalUser(user);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const handleStartTimer = async () => {
    if (!user?.id || isStarting) return;

    setIsStarting(true);

    try {
      console.log('🚀 [Timer] Iniciando cronômetro para usuário:', user.id);

      // Otimização: Atualizar UI instantaneamente
      const immediateStartDate = new Date().toISOString();
      const optimisticUser = {
        ...user,
        startDate: immediateStartDate
      };
      
      setLocalUser(optimisticUser);
      localStorage.setItem('user', JSON.stringify(optimisticUser));
      
      if (onUserUpdate) {
        onUserUpdate(optimisticUser);
      }

      // Limpar cache para forçar atualização
      PainelCache.clear(`user_${user.id}`);
      
      // API call em background para sincronização
      const response = await authenticatedFetch(`/api/usuarios/${user.id}/timer/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ [Timer] Cronômetro sincronizado com sucesso!', data);
        
        // Atualizar com data real da API se diferente
        if (data.timerStartDate && data.timerStartDate !== immediateStartDate) {
          const syncedUser = {
            ...user,
            startDate: data.timerStartDate
          };
          
          setLocalUser(syncedUser);
          localStorage.setItem('user', JSON.stringify(syncedUser));

          if (onUserUpdate) {
            onUserUpdate(syncedUser);
          }
        }
      } else {
        console.error('❌ [Timer] Erro ao sincronizar cronômetro:', data.message);
        // Reverter otimização em caso de erro
        setLocalUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('❌ [Timer] Erro de conexão:', error);
      // Reverter otimização em caso de erro
      setLocalUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    } finally {
      setIsStarting(false);
    }
  };

  if (!localUser) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Carregando dados do usuário...
        </p>
        <div className="timer-display">00:00:00</div>
      </div>
    );
  }

  const userWithTimer = localUser && localUser.startDate;

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

  const startDate = localUser.startDate || new Date().toISOString();
  const timeDiff = calculateTimeDifference(startDate, currentTime);
  const hasCompletedOneDay = timeDiff.days > 0;

  return (
    <div className="text-center">
      {!hasCompletedOneDay ? (
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
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Você está livre da pornografia há:
          </p>
          <div className="text-7xl font-bold text-primary mb-4" data-testid="days-display">
            {timeDiff.days} {timeDiff.days === 1 ? 'DIA' : 'DIAS'}
          </div>

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
  const handlePanicClick = useCallback(() => {
    try {
      document.body.style.transition = 'opacity 0.3s ease-out';
      document.body.style.opacity = '0.8';

      setTimeout(() => {
        onPanicClick();
        setTimeout(() => {
          if (document.body) {
            document.body.style.opacity = '1';
          }
        }, 100);
      }, 150);
    } catch (error) {
      console.error('❌ Erro no botão de pânico:', error);
      onPanicClick();
    }
  }, [onPanicClick]);

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

function BottomNavigation({ activeSection, onSectionChange }: BottomNavigationProps) {
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
  const [hasStartedJourney, setHasStartedJourney] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const [isLoading, setIsLoading] = useState(true);
  const [showPanicPage, setShowPanicPage] = useState(false);
  const [hasSeenInitialImage, setHasSeenInitialImage] = useState(false);
  const [, setLocation] = useLocation();

  // Avatar state otimizado
  const [daysProgress, setDaysProgress] = useState(0);
  const [currentAvatar, setCurrentAvatar] = useState(getCurrentAvatar(0));

  // Check timer status otimizado com cache
  useEffect(() => {
    const checkTimerStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      const cacheKey = `timer_status_${user.id}`;

      try {
        // 1. Carregamento instantâneo do cache
        const cachedStatus = PainelCache.get(cacheKey);
        if (cachedStatus) {
          console.log(`⚡ [PainelInterface] Status do cache carregado instantaneamente`);
          setHasStartedJourney(cachedStatus.hasActiveTimer);
          if (cachedStatus.hasActiveTimer && cachedStatus.startDate) {
            setLocalUser(prev => prev ? { ...prev, startDate: cachedStatus.startDate } : prev);
          }
          setIsLoading(false);
        }

        // 2. Verificação local imediata da imagem
        const imageSeenKey = `scapy_initial_image_seen_${user.id}`;
        const hasSeenImage = localStorage.getItem(imageSeenKey) === 'true';
        setHasSeenInitialImage(hasSeenImage);

        // 3. Verificação local do usuário primeiro
        const storedUser = localStorage.getItem('user');
        if (storedUser && !cachedStatus) {
          try {
            const userData = JSON.parse(storedUser);
            // Aceitar tanto timerStartDate (novo) quanto startDate (antigo) para compatibilidade
            const timerDate = userData.timerStartDate || userData.startDate;
            if (timerDate) {
              console.log(`💿 [PainelInterface] Usuário local tem timer ativo:`, timerDate);
              setHasStartedJourney(true);
              // Normalizar para usar startDate internamente no componente
              setLocalUser({ ...userData, startDate: timerDate });
              setIsLoading(false);
              
              // Cache temporário
              PainelCache.set(cacheKey, { 
                hasActiveTimer: true, 
                startDate: timerDate 
              }, 30000);
            }
          } catch (parseError) {
            console.error('❌ Erro ao parsear usuário local:', parseError);
          }
        }

        // 4. Sincronização com API em background
        setTimeout(async () => {
          try {
            const response = await authenticatedFetch(`/api/timer/status/${user.id}`);
            const data = await response.json();

            if (response.ok) {
              // Cache para próximas visitas
              PainelCache.set(cacheKey, {
                hasActiveTimer: data.hasActiveTimer,
                startDate: data.startDate
              }, 30000);

              // Atualizar estado apenas se diferente
              if (data.hasActiveTimer !== hasStartedJourney) {
                setHasStartedJourney(data.hasActiveTimer);
              }
              
              if (data.hasActiveTimer && data.startDate) {
                setLocalUser(prev => {
                  if (prev?.startDate !== data.startDate) {
                    const updatedUser = { ...prev, startDate: data.startDate };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    return updatedUser;
                  }
                  return prev;
                });
              }
            }
          } catch (error) {
            console.warn('⚠️ [PainelInterface] Erro na sincronização background:', error);
          }
        }, 50);

      } catch (error) {
        console.error('❌ [PainelInterface] Erro ao verificar status do timer:', error);
      } finally {
        if (!PainelCache.has(cacheKey)) {
          setIsLoading(false);
        }
      }
    };

    checkTimerStatus();
  }, [user?.id]);

  // Update local user
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  // Update avatar progress otimizado com cache
  useEffect(() => {
    const updateProgress = () => {
      if (localUser?.startDate) {
        const cacheKey = `avatar_progress_${localUser.id}_${localUser.startDate}`;
        
        // Verificar cache primeiro
        const cachedProgress = PainelCache.get(cacheKey);
        if (cachedProgress) {
          setDaysProgress(cachedProgress.days);
          setCurrentAvatar(cachedProgress.avatar);
          return;
        }

        // Calcular e cachear
        const days = calculateProgressInDays(localUser.startDate);
        const avatar = getCurrentAvatar(days);
        
        setDaysProgress(days);
        setCurrentAvatar(avatar);
        
        // Cache por 5 minutos
        PainelCache.set(cacheKey, { days, avatar }, 300000);
      }
    };

    updateProgress();
    
    // Atualizar menos frequentemente para performance
    const interval = setInterval(updateProgress, 300000); // A cada 5 minutos

    return () => clearInterval(interval);
  }, [localUser?.startDate, localUser?.id]);

  const handleStartJourney = () => {
    if (user?.id) {
      // Marcar que o usuário viu e clicou na imagem inicial
      const imageSeenKey = `scapy_initial_image_seen_${user.id}`;
      localStorage.setItem(imageSeenKey, 'true');
      setHasSeenInitialImage(true);
      
      console.log(`🖼️ [PainelInterface] Imagem inicial marcada como vista para usuário ${user.id}`);
      
      // Disparar evento customizado para sincronização
      const imageSeenEvent = new CustomEvent('initialImageSeen', {
        detail: {
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(imageSeenEvent);
    }
    
    setHasStartedJourney(true);
  };

  const handleUserUpdate = useCallback((updatedUser: any) => {
    setLocalUser(updatedUser);
    setHasStartedJourney(true);

    if (updatedUser.startDate) {
      const days = calculateProgressInDays(updatedUser.startDate);
      setDaysProgress(days);
      const avatar = getCurrentAvatar(days);
      setCurrentAvatar(avatar);
    }
  }, []);

  const handlePanicClick = useCallback(() => {
    setShowPanicPage(true);
  }, []);

  const handleBackFromPanic = useCallback(() => {
    setShowPanicPage(false);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation('/login');
    }
  }, [setLocation]);


  if (showPanicPage) {
    return <PanicPage user={localUser} onBackFromPanic={handleBackFromPanic} />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden">
      <ParticlesBackground isDarkTheme={true} className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <Header user={user} />

        <main className="flex-1 px-4 pb-48">
          <div className="space-y-6">
            {hasStartedJourney && <WeeklyTracker weeklyProgress={weeklyProgress} user={localUser} />}

            <section className="text-center">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Verificando status do cronômetro...
                  </p>
                </div>
              ) : !hasStartedJourney && !hasSeenInitialImage ? (
                <JourneyStart onStartJourney={handleStartJourney} />
              ) : hasStartedJourney ? (
                <>
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

                  <Timer user={localUser} onUserUpdate={handleUserUpdate} />
                </>
              ) : (
                // Caso o usuário já tenha visto a imagem mas ainda não iniciou o cronômetro
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🚀</div>
                  <h2 className="text-2xl font-bold text-primary mb-4">
                    Pronto para começar?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Inicie seu cronômetro e comece sua jornada de transformação
                  </p>
                  <Timer user={localUser} onUserUpdate={handleUserUpdate} />
                </div>
              )}
            </section>
          </div>

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