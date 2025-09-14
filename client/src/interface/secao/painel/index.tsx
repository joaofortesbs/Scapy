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

// Timer Component otimizado
interface TimerProps {
  user: User | undefined;
  onUserUpdate?: (updatedUser: any) => void;
}

function Timer({ user, onUserUpdate }: TimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isStarting, setIsStarting] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const [hasActiveTimer, setHasActiveTimer] = useState(false); // Estado para controlar se o timer está ativo
  const [hasJourneyStarted, setHasJourneyStarted] = useState(false); // Estado para controlar se a jornada começou

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

  // Verificar status do timer na inicialização com retry automático
  useEffect(() => {
    if (user?.id) {
      checkTimerStatus();

      // Verificar novamente após 2 segundos para garantir consistência
      const retryTimer = setTimeout(() => {
        checkTimerStatus();
      }, 2000);

      return () => clearTimeout(retryTimer);
    }
  }, [user?.id]);

  const checkTimerStatus = async () => {
    if (!user?.id) return;

    try {
      console.log(`🔍 [Frontend Timer] Verificando status do timer para usuário ${user.id}`);

      const response = await fetch(`/api/timer/status/${user.id}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`📊 [Frontend Timer] Status recebido:`, data);

        setHasActiveTimer(data.hasActiveTimer);
        setHasJourneyStarted(data.hasJourneyStarted);

        if (data.hasActiveTimer && data.startDate) {
          const updatedUser = { ...user, startDate: data.startDate };
          setLocalUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));

          console.log(`✅ [Frontend Timer] Timer recuperado: ${data.startDate}`);

          if (onUserUpdate) {
            onUserUpdate(updatedUser);
          }
        } else if (!data.hasActiveTimer) {
          console.log(`ℹ️ [Frontend Timer] Nenhum timer ativo encontrado para usuário ${user.id}`);
        }
      } else {
        console.error('❌ [Frontend Timer] Erro na resposta:', data);
      }
    } catch (error) {
      console.error('❌ [Frontend Timer] Erro ao verificar status do timer:', error);
    }
  };


  const handleStartTimer = async () => {
    if (!user?.id || isStarting) return;

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
        setLocalUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setHasActiveTimer(true); // Atualizar estado do timer
        setHasJourneyStarted(true); // Marcar jornada como iniciada

        if (onUserUpdate) {
          onUserUpdate(data.user);
        }

        console.log('✅ Cronômetro iniciado com sucesso!');
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
  const [, setLocation] = useLocation();

  // Avatar state otimizado
  const [daysProgress, setDaysProgress] = useState(0);
  const [currentAvatar, setCurrentAvatar] = useState(getCurrentAvatar(0));

  // Check timer status e verificação de primeira visita otimizado
  useEffect(() => {
    const checkUserJourneyStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 [PainelInterface] Verificando se usuário já passou da tela inicial...');

        // 1. Verificação prioritária: localStorage (mais rápida)
        const localJourneyStarted = localStorage.getItem('scapy_journey_started');
        const userJourneyKey = `scapy_user_journey_${user.id}`;
        const userSpecificJourney = localStorage.getItem(userJourneyKey);

        if (localJourneyStarted === 'true' || userSpecificJourney === 'true') {
          console.log('✅ [PainelInterface] Jornada já iniciada (localStorage)');
          setHasStartedJourney(true);
          setIsLoading(false);
          return;
        }

        // 2. Verificação no Supabase - múltiplas fontes de evidência
        const [timerResponse, moodResponse, weeklyMoodResponse] = await Promise.all([
          fetch(`/api/timer/status/${user.id}`),
          fetch(`/api/today-mood/${user.id}`),
          fetch(`/api/weekly-mood/${user.id}`)
        ]);

        const timerData = await timerResponse.json();
        const moodData = await moodResponse.json();
        const weeklyMoodData = await weeklyMoodResponse.json();

        // Verificar evidências de uso anterior
        const hasActiveTimer = timerData?.hasActiveTimer || false;
        const hasJourneyStarted = timerData?.hasJourneyStarted || false;
        const hasMoodRegistered = moodData && moodData.mood;
        const hasWeeklyMoods = weeklyMoodData && weeklyMoodData.moodByDay &&
                               weeklyMoodData.moodByDay.some((mood: any) => mood !== null);

        console.log('🔍 [PainelInterface] Evidências encontradas:', {
          hasActiveTimer,
          hasJourneyStarted,
          hasMoodRegistered: !!hasMoodRegistered,
          hasWeeklyMoods,
          userId: user.id
        });

        // Se encontrou qualquer evidência, usuário já passou da tela inicial
        const hasStarted = hasActiveTimer || hasJourneyStarted || hasMoodRegistered || hasWeeklyMoods;

        if (hasStarted) {
          console.log('✅ [PainelInterface] Evidência de uso anterior encontrada - saltando tela inicial');
          setHasStartedJourney(true);
          // Salvar evidência no localStorage para futuras sessões
          localStorage.setItem('scapy_journey_started', 'true');
          localStorage.setItem(userJourneyKey, 'true');
        } else {
          console.log('❌ [PainelInterface] Nenhuma evidência encontrada - mostrar tela inicial');
          setHasStartedJourney(false);
        }

        // Atualizar dados do timer se ativo
        if (hasActiveTimer && timerData.startDate) {
          setLocalUser(prev => prev ? { ...prev, startDate: timerData.startDate } : prev);
        }

      } catch (error) {
        console.error('❌ [PainelInterface] Erro ao verificar status da jornada:', error);
        // Fallback: verificar localStorage
        const localJourneyStarted = localStorage.getItem('scapy_journey_started');
        const userJourneyKey = `scapy_user_journey_${user.id}`;
        const userSpecificJourney = localStorage.getItem(userJourneyKey);

        if (localJourneyStarted === 'true' || userSpecificJourney === 'true') {
          setHasStartedJourney(true);
        } else {
          setHasStartedJourney(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkUserJourneyStatus();
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

  const handleStartJourney = async () => {
    console.log('🚀 [PainelInterface] Iniciando jornada para usuário:', user?.id);
    setHasStartedJourney(true);

    try {
      if (user?.id) {
        // Marcar imediatamente no localStorage (múltiplas chaves para redundância)
        localStorage.setItem('scapy_journey_started', 'true');
        localStorage.setItem(`scapy_user_journey_${user.id}`, 'true');
        localStorage.setItem(`scapy_journey_timestamp_${user.id}`, new Date().toISOString());

        console.log('✅ [PainelInterface] Jornada marcada no localStorage');

        // Marcar jornada como iniciada no Supabase
        const journeyResponse = await fetch('/api/journey/mark-started', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        if (journeyResponse.ok) {
          console.log('✅ [PainelInterface] Jornada marcada no Supabase com sucesso');
        } else {
          console.warn('⚠️ [PainelInterface] Erro ao marcar jornada no Supabase, mas localStorage já salvo');
        }
      }
    } catch (error) {
      console.error('❌ [PainelInterface] Erro ao marcar início da jornada:', error);
      // Não reverter a UI - o localStorage já foi definido para UX
    }
  };

  const handleUserUpdate = useCallback((updatedUser: any) => {
    console.log('🔄 [PainelInterface] Atualizando dados do usuário:', updatedUser?.id);
    setLocalUser(updatedUser);
    setHasStartedJourney(true);

    // Marcar jornada como iniciada com múltiplas chaves
    if (updatedUser?.id) {
      localStorage.setItem('scapy_journey_started', 'true');
      localStorage.setItem(`scapy_user_journey_${updatedUser.id}`, 'true');
      localStorage.setItem(`scapy_journey_timestamp_${updatedUser.id}`, new Date().toISOString());
      console.log('✅ [PainelInterface] Jornada marcada após atualização do usuário');
    }

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
                      startDate={localUser?.startDate}
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