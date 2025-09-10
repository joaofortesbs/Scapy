import { useState, useEffect } from "react";
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
        <div className="gradient-border w-12 h-12" data-testid="empty-circle-container">
          <div className="gradient-border-inner flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
        </div>

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

// Sistema de persistência semanal com localStorage
class WeeklyMoodStorage {
  private static readonly STORAGE_KEY = 'scapy_weekly_moods';
  private static readonly VERSION_KEY = 'scapy_mood_version';
  private static readonly CURRENT_VERSION = '1.0.0';

  // Salvar humor semanal no localStorage
  static saveWeeklyMood(userId: string, weeklyMood: WeeklyMood): void {
    try {
      const weekKey = this.getWeekKey(new Date());
      const storageData = this.getStorageData();
      
      if (!storageData[userId]) {
        storageData[userId] = {};
      }
      
      storageData[userId][weekKey] = weeklyMood;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
      
      console.log(`💾 Humor semanal salvo para usuário ${userId}, semana: ${weekKey}`);
    } catch (error) {
      console.error('Erro ao salvar humor semanal:', error);
    }
  }

  // Carregar humor semanal do localStorage
  static loadWeeklyMood(userId: string): WeeklyMood | null {
    try {
      const weekKey = this.getWeekKey(new Date());
      const storageData = this.getStorageData();
      
      return storageData[userId]?.[weekKey] || null;
    } catch (error) {
      console.error('Erro ao carregar humor semanal:', error);
      return null;
    }
  }

  // Limpar dados de semanas antigas (manter apenas últimas 4 semanas)
  static cleanOldWeeks(): void {
    try {
      const storageData = this.getStorageData();
      const currentDate = new Date();
      const weeksToKeep = 4;
      
      Object.keys(storageData).forEach(userId => {
        const userWeeks = storageData[userId];
        const weekKeys = Object.keys(userWeeks);
        
        // Ordenar semanas por data e manter apenas as mais recentes
        const sortedWeeks = weekKeys
          .map(key => ({ key, date: this.getDateFromWeekKey(key) }))
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, weeksToKeep);
        
        // Remover semanas antigas
        const newUserWeeks: any = {};
        sortedWeeks.forEach(({ key }) => {
          newUserWeeks[key] = userWeeks[key];
        });
        
        storageData[userId] = newUserWeeks;
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Erro ao limpar semanas antigas:', error);
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
    return startOfWeek.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private static getDateFromWeekKey(weekKey: string): Date {
    return new Date(weekKey);
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
  
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  // Carregar humor semanal
  useEffect(() => {
    const loadWeeklyMood = async () => {
      if (!user?.id) return;

      setIsLoadingMood(true);
      
      try {
        console.log(`🔍 Carregando humor semanal para usuário ${user.id}`);
        
        // Buscar dados da API
        const response = await apiRequest('GET', `/api/weekly-mood/${user.id}`);
        const apiMood = await response.json() as WeeklyMood;
        
        console.log(`🌐 Humor semanal recebido da API:`, apiMood);
        
        setWeeklyMood(apiMood);
        
        // Salvar no localStorage para persistência
        WeeklyMoodStorage.saveWeeklyMood(user.id.toString(), apiMood);
        
      } catch (error) {
        console.error('❌ Erro ao carregar humor semanal:', error);
        setWeeklyMood({ userId: user.id.toString(), weekStart: '', weekEnd: '', moodByDay: new Array(7).fill(null) });
      } finally {
        setIsLoadingMood(false);
      }
    };

    loadWeeklyMood();
  }, [user?.id]);

  // Sistema de sincronização ultra-rápida e persistente
  useEffect(() => {
    const handleMoodUpdated = async (event: any) => {
      if (!user?.id) return;
      
      console.log('🔔 Evento moodUpdated recebido:', event.detail);
      
      // Se temos dados específicos do evento, usar sincronização imediata
      if (event.detail && event.detail.userId === user.id.toString()) {
        const { mood, dayOfWeek, date } = event.detail;
        
        // Atualizar estado local imediatamente
        setWeeklyMood(prevMood => {
          const newMoodByDay = [...(prevMood?.moodByDay || new Array(7).fill(null))];
          newMoodByDay[dayOfWeek] = mood;
          
          const updatedMood = {
            userId: user.id.toString(),
            weekStart: prevMood?.weekStart || '',
            weekEnd: prevMood?.weekEnd || '',
            moodByDay: newMoodByDay
          };
          
          // Salvar imediatamente no localStorage
          WeeklyMoodStorage.saveWeeklyMood(user.id.toString(), updatedMood);
          
          console.log('⚡ Sincronização imediata aplicada:', updatedMood);
          return updatedMood;
        });
      }
      
      // Depois buscar dados atualizados da API para confirmar
      setTimeout(async () => {
        try {
          const response = await apiRequest('GET', `/api/weekly-mood/${user.id}`);
          const apiMood = await response.json() as WeeklyMood;
          setWeeklyMood(apiMood);
          WeeklyMoodStorage.saveWeeklyMood(user.id.toString(), apiMood);
          console.log('✅ Dados confirmados da API:', apiMood);
        } catch (error) {
          console.error('❌ Erro ao confirmar dados da API:', error);
        }
      }, 100);
    };

    // Escutar eventos personalizados
    window.addEventListener('moodUpdated', handleMoodUpdated);
    window.addEventListener('tasksUpdated', handleMoodUpdated);
    
    return () => {
      window.removeEventListener('moodUpdated', handleMoodUpdated);
      window.removeEventListener('tasksUpdated', handleMoodUpdated);
    };
  }, [user?.id]);

  // Sistema de recuperação ultra-persistente do localStorage
  useEffect(() => {
    if (!user?.id) return;
    
    const loadPersistentMoods = () => {
      try {
        // Carregar todos os humores salvos
        const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
        const userMoods = allMoods[user.id.toString()] || {};
        
        // Calcular semana atual
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Mapear humores da semana
        const moodByDay = new Array(7).fill(null);
        
        for (let i = 0; i < 7; i++) {
          const dayDate = new Date(startOfWeek);
          dayDate.setDate(startOfWeek.getDate() + i);
          const dayKey = dayDate.toISOString().split('T')[0];
          
          if (userMoods[dayKey]) {
            moodByDay[i] = userMoods[dayKey];
          }
        }
        
        // Se encontramos humores, criar objeto de humor semanal
        const hasAnyMood = moodByDay.some(mood => mood !== null);
        if (hasAnyMood) {
          const persistentMood: WeeklyMood = {
            userId: user.id.toString(),
            weekStart: startOfWeek.toISOString(),
            weekEnd: new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
            moodByDay
          };
          
          setWeeklyMood(persistentMood);
          console.log('💿 Humores recuperados do localStorage:', persistentMood);
        }
      } catch (error) {
        console.error('❌ Erro ao recuperar humores persistentes:', error);
      }
    };

    // Carregar imediatamente
    loadPersistentMoods();
  }, [user?.id]);

  // Limpeza periódica de semanas antigas (a cada acesso)
  useEffect(() => {
    WeeklyMoodStorage.cleanOldWeeks();
  }, []);

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
function PanicButton() {
  const handlePanicClick = () => {
    // Animação suave para transição
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
      window.location.href = '/panic';
    }, 300);
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
  };

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
                  {/* Conditionally show caveman avatar */}
                  <div className="floating-avatar mb-6">
                    <img
                      src="/caveman-avatar.png"
                      alt="Avatar Caveman"
                      className="w-80 h-80 object-contain mx-auto"
                      onError={(e) => {
                        e.currentTarget.src = "https://api.dicebear.com/7.x/adventurer/svg?seed=caveman&backgroundColor=000515";
                      }}
                      data-testid="avatar-image"
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
        <PanicButton />
        <BottomNavigation
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
      </div>
    </div>
  );
}