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
import { AuthService } from "@/lib/auth";
import StartTimerButton from "@/components/start-timer-button";

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

  // Carregar humor semanal otimizado
  const loadWeeklyMood = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log(`🔍 [WeeklyTracker] Carregando humor semanal para usuário ${user.id}`);
      
      // Carregar dados locais primeiro
      const localMood = OptimizedMoodStorage.loadWeeklyMood(user.id.toString());
      if (localMood) {
        console.log(`💿 [WeeklyTracker] Humor local carregado:`, localMood);
        setWeeklyMood(localMood);
      }

      // Verificar humor de hoje no AIAssistant
      const todayKey = new Date().toISOString().split('T')[0];
      const todayMoodKey = `scapy_daily_mood_${user.id}_${todayKey}`;
      const todayMoodData = localStorage.getItem(todayMoodKey);
      
      if (todayMoodData) {
        try {
          const moodData = JSON.parse(todayMoodData);
          const today = new Date();
          const dayOfWeek = today.getDay();
          
          console.log(`🎯 [WeeklyTracker] Humor de hoje encontrado: ${moodData.mood} para o dia ${dayOfWeek}`);
          
          // Atualizar humor semanal com o humor de hoje
          setWeeklyMood(prevMood => {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const newMoodByDay = [...(prevMood?.moodByDay || new Array(7).fill(null))];
            newMoodByDay[dayOfWeek] = moodData.mood;

            const updatedMood: WeeklyMood = {
              userId: user.id.toString(),
              weekStart: startOfWeek.toISOString(),
              weekEnd: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
              moodByDay: newMoodByDay
            };

            OptimizedMoodStorage.saveWeeklyMood(user.id.toString(), updatedMood);
            return updatedMood;
          });
        } catch (parseError) {
          console.error('❌ [WeeklyTracker] Erro ao parsear humor de hoje:', parseError);
        }
      }

      // Buscar da API
      const response = await apiRequest('GET', `/api/weekly-mood/${user.id}`);
      const apiMood = await response.json() as WeeklyMood;

      console.log(`🌐 [WeeklyTracker] Humor da API:`, apiMood);

      // Merge inteligente - priorizar dados locais se mais completos
      if (apiMood.moodByDay.some(mood => mood !== null)) {
        setWeeklyMood(prev => {
          // Se temos dados locais, fazer merge inteligente
          if (prev && prev.moodByDay.some(mood => mood !== null)) {
            const mergedMoodByDay = [...apiMood.moodByDay];
            prev.moodByDay.forEach((mood, index) => {
              if (mood && !mergedMoodByDay[index]) {
                mergedMoodByDay[index] = mood;
              }
            });
            
            const mergedMood = {
              ...apiMood,
              moodByDay: mergedMoodByDay
            };
            
            OptimizedMoodStorage.saveWeeklyMood(user.id.toString(), mergedMood);
            return mergedMood;
          }
          
          // Se não temos dados locais, usar da API
          OptimizedMoodStorage.saveWeeklyMood(user.id.toString(), apiMood);
          return apiMood;
        });
      }

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

// Timer Component otimizado com StartTimerButton integrado
interface TimerProps {
  user: User | undefined;
  onUserUpdate?: (updatedUser: any) => void;
}

function Timer({ user, onUserUpdate }: TimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [localUser, setLocalUser] = useState(user);
  const [timerData, setTimerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Atualizar tempo a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Sincronizar dados do usuário
  useEffect(() => {
    setLocalUser(user);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  // Carregar e verificar cronômetro
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadTimerData = async () => {
      try {
        console.log(`🔍 [Timer] Verificando cronômetro para usuário ${user.id}`);
        
        // 1. Carregar do TimerPersistence primeiro
        const { TimerPersistence } = await import('@/lib/timer-persistence');
        const localTimer = TimerPersistence.loadTimer(user.id.toString());
        
        if (localTimer) {
          setTimerData(localTimer);
          console.log(`💿 [Timer] Cronômetro local encontrado: ${localTimer.startDate}`);
        }

        // 2. Verificar status na API
        const response = await AuthService.authenticatedFetch(`/api/timer/status/${user.id}`);
        if (response.ok) {
          const apiData = await response.json();
          
          if (apiData.hasActiveTimer && apiData.startDate) {
            const apiTimer = {
              userId: user.id.toString(),
              startDate: apiData.startDate,
              isActive: true,
              source: 'api'
            };
            
            // Se API tem dados diferentes dos locais, sincronizar
            if (!localTimer || localTimer.startDate !== apiData.startDate) {
              TimerPersistence.saveTimer(user.id.toString(), apiData.startDate);
              setTimerData(apiTimer);
              console.log(`🌐 [Timer] Cronômetro sincronizado da API: ${apiData.startDate}`);
            }
          }
        }
      } catch (error) {
        console.error('❌ [Timer] Erro ao carregar cronômetro:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimerData();
  }, [user?.id]);

  // Listener para eventos de cronômetro
  useEffect(() => {
    const handleTimerUpdate = async (event: CustomEvent) => {
      const { userId, startDate, source } = event.detail || {};
      
      if (user?.id && userId === user.id.toString() && startDate) {
        console.log(`🔄 [Timer] Cronômetro atualizado via evento (${source}): ${startDate}`);
        
        const newTimerData = {
          userId: userId,
          startDate: startDate,
          isActive: true,
          source: source || 'event'
        };
        
        setTimerData(newTimerData);
        
        // Atualizar dados do usuário se callback fornecido
        if (onUserUpdate) {
          const updatedUser = {
            ...localUser,
            startDate: startDate
          };
          setLocalUser(updatedUser);
          onUserUpdate(updatedUser);
        }
      }
    };

    window.addEventListener('timerStarted', handleTimerUpdate as EventListener);
    window.addEventListener('timerUpdated', handleTimerUpdate as EventListener);
    
    return () => {
      window.removeEventListener('timerStarted', handleTimerUpdate as EventListener);
      window.removeEventListener('timerUpdated', handleTimerUpdate as EventListener);
    };
  }, [user?.id, localUser, onUserUpdate]);

  // Callback para quando StartTimerButton iniciar cronômetro
  const handleTimerStarted = (startDate: string) => {
    console.log(`✅ [Timer] Cronômetro iniciado via StartTimerButton: ${startDate}`);
    
    const newTimerData = {
      userId: user?.id?.toString() || '',
      startDate: startDate,
      isActive: true,
      source: 'start-button'
    };
    
    setTimerData(newTimerData);
    
    if (onUserUpdate) {
      const updatedUser = {
        ...localUser,
        startDate: startDate
      };
      setLocalUser(updatedUser);
      onUserUpdate(updatedUser);
    }
  };

  // Estados de loading
  if (isLoading) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Verificando cronômetro...
        </p>
        <div className="timer-display">00:00:00</div>
      </div>
    );
  }

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

  // Determinar se há cronômetro ativo
  const startDate = timerData?.startDate || localUser?.startDate;
  const hasActiveTimer = !!(startDate && timerData?.isActive !== false);

  // Se não há cronômetro ativo, mostrar StartTimerButton
  if (!hasActiveTimer && user?.id) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Pronto para começar sua jornada livre da pornografia?
        </p>
        <StartTimerButton 
          userId={user.id.toString()}
          onTimerStarted={handleTimerStarted}
        />
      </div>
    );
  }

  if (!startDate) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Faça login para iniciar seu cronômetro
        </p>
      </div>
    );
  }

  // Exibir cronômetro ativo
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
  const [, setLocation] = useLocation();

  // Avatar state otimizado
  const [daysProgress, setDaysProgress] = useState(0);
  const [currentAvatar, setCurrentAvatar] = useState(getCurrentAvatar(0));

  // Check timer status otimizado
  useEffect(() => {
    const checkTimerStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🔍 [PainelInterface] Verificando status do cronômetro para usuário ${user.id}`);
        
        // 1. Primeiro verificar localStorage
        const { TimerPersistence } = await import('@/lib/timer-persistence');
        const localTimer = TimerPersistence.loadTimer(user.id.toString());
        
        if (localTimer && localTimer.isActive) {
          setHasStartedJourney(true);
          setLocalUser(prev => prev ? { ...prev, startDate: localTimer.startDate } : prev);
          console.log(`💿 [PainelInterface] Cronômetro local encontrado: ${localTimer.startDate}`);
        }

        // 2. Verificar com API para sincronização
        const response = await AuthService.authenticatedFetch(`/api/timer/status/${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.hasActiveTimer && data.startDate) {
            setHasStartedJourney(true);
            const startDate = new Date(data.startDate).toISOString();
            
            // Sincronizar se dados são diferentes
            if (!localTimer || localTimer.startDate !== startDate) {
              TimerPersistence.saveTimer(user.id.toString(), startDate);
              console.log(`🌐 [PainelInterface] Cronômetro sincronizado da API: ${startDate}`);
            }
            
            setLocalUser(prev => prev ? { ...prev, startDate: startDate } : prev);
          } else if (!localTimer) {
            // Sem cronômetro em lugar nenhum
            setHasStartedJourney(false);
            console.log(`📋 [PainelInterface] Nenhum cronômetro ativo encontrado`);
          }
        } else {
          console.warn('⚠️ [PainelInterface] API não disponível, usando dados locais');
          // Se API falha mas temos dados locais, usar eles
          if (localTimer && localTimer.isActive) {
            setHasStartedJourney(true);
          }
        }
      } catch (error) {
        console.error('❌ [PainelInterface] Erro ao verificar status do timer:', error);
        
        // Fallback: tentar carregar dados locais
        try {
          const { TimerPersistence } = await import('@/lib/timer-persistence');
          const localTimer = TimerPersistence.loadTimer(user.id.toString());
          if (localTimer && localTimer.isActive) {
            setHasStartedJourney(true);
            setLocalUser(prev => prev ? { ...prev, startDate: localTimer.startDate } : prev);
          }
        } catch (fallbackError) {
          console.error('❌ [PainelInterface] Fallback também falhou:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkTimerStatus();
  }, [user?.id]);

  // Update local user
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  // Update avatar progress otimizado
  useEffect(() => {
    const updateProgress = () => {
      if (localUser?.startDate) {
        const days = calculateProgressInDays(localUser.startDate);
        setDaysProgress(days);
        const avatar = getCurrentAvatar(days);
        setCurrentAvatar(avatar);
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, [localUser?.startDate]);

  const handleStartJourney = () => {
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

  // Listener para eventos globais de cronômetro
  useEffect(() => {
    const handleTimerEvents = (event: CustomEvent) => {
      const { userId, startDate, source } = event.detail || {};
      
      if (user?.id && userId === user.id.toString() && startDate) {
        console.log(`🔄 [PainelInterface] Cronômetro atualizado via evento (${source}): ${startDate}`);
        
        setHasStartedJourney(true);
        setLocalUser(prev => prev ? { ...prev, startDate: startDate } : prev);
        
        // Atualizar avatar
        const days = calculateProgressInDays(startDate);
        setDaysProgress(days);
        const avatar = getCurrentAvatar(days);
        setCurrentAvatar(avatar);
      }
    };

    window.addEventListener('timerStarted', handleTimerEvents as EventListener);
    window.addEventListener('timerUpdated', handleTimerEvents as EventListener);
    
    return () => {
      window.removeEventListener('timerStarted', handleTimerEvents as EventListener);
      window.removeEventListener('timerUpdated', handleTimerEvents as EventListener);
    };
  }, [user?.id]);

  const handlePanicClick = useCallback(() => {
    setShowPanicPage(true);
  }, []);

  const handleBackFromPanic = useCallback(() => {
    setShowPanicPage(false);
  }, []);

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
              ) : !hasStartedJourney ? (
                <JourneyStart onStartJourney={handleStartJourney} />
              ) : (
                <>
                  <div 
                    className="floating-avatar mb-6 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    onClick={() => setLocation('/avatares-evolutivos')}
                    data-testid="evolutionary-avatar-clickable"
                  >
                    <EvolutionaryAvatar
                      startDate={localUser?.startDate ? new Date(localUser.startDate).toISOString() : undefined}
                      size="large"
                      showTitle={false}
                      showProgress={false}
                      className="transition-all duration-500"
                    />
                  </div>

                  <Timer user={localUser} onUserUpdate={handleUserUpdate} />
                </>
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