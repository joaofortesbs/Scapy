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

// Weekly Tracker Component
interface WeeklyTrackerProps {
  weeklyProgress?: WeeklyProgress;
  currentMood?: string | null; // Current user mood
}

function WeeklyTracker({ weeklyProgress, currentMood }: WeeklyTrackerProps) {
  const queryClient = useQueryClient();
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  // Get mood data from weekly mood tracking for each day
  const getDayMoodStyle = (dayIndex: number) => {
    // Check if we have weekly mood data
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Only apply mood styling to the current day if user has selected a mood today
    if (dayIndex === currentDay && currentMood) {
      switch (currentMood.toLowerCase()) {
        case 'medo':
          return { 
            backgroundColor: '#ef4444', 
            borderWidth: '2px', 
            borderStyle: 'solid', 
            borderColor: '#ef4444',
            color: 'white'
          };
        case 'estável':
          return { 
            backgroundColor: '#eab308', 
            borderWidth: '2px', 
            borderStyle: 'solid', 
            borderColor: '#eab308',
            color: 'black'
          };
        case 'feliz':
          return { 
            backgroundColor: '#22c55e', 
            borderWidth: '2px', 
            borderStyle: 'solid', 
            borderColor: '#22c55e',
            color: 'white'
          };
        default:
          return {};
      }
    }
    return {};
  };

  // Dynamically determine classes based on completion status
  const getDayClasses = (index: number) => {
    return `day-circle ${weeklyProgress?.dayCompleted[index] ? 'completed' : ''}`;
  };

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

  return (
    <section className="mb-8">
      <div className="flex justify-center space-x-2">
        {weekDays.map((day, index) => (
          <button
            key={index}
            className={getDayClasses(index)}
            style={getDayMoodStyle(index)}
            onClick={() => handleDayClick(index)}
            title={`${dayNames[index]} - ${weeklyProgress?.dayCompleted[index] ? 'Concluído' : 'Pendente'}`}
            data-testid={`day-circle-${index}`}
            disabled={updateProgressMutation.isPending}
          >
            {day}
          </button>
        ))}
      </div>

      {updateProgressMutation.isPending && (
        <div className="text-center mt-2 text-sm text-muted-foreground">
          Atualizando...
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

  // Update local user when prop changes
  useEffect(() => {
    setLocalUser(user);
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

        console.log('Cronômetro iniciado com sucesso!');
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
    alert("Botão de pânico ativado! Esta funcionalidade estará disponível em breve.");
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

// --- New components and logic for mood tracking ---

// Interface for user mood data, assuming it will be stored per day
interface UserMood {
  date: string;
  mood: string | null; // 'Medo', 'Estável', 'Feliz', or null
}

// Custom hook to manage and persist user mood data
function useUserMoodTracker() {
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0); // To track the current day of the week

  useEffect(() => {
    // Reset mood at the start of a new week (e.g., Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
    setCurrentDayIndex(dayOfWeek);

    // Load persisted mood for the current day
    const savedMood = localStorage.getItem(`mood_${today.toDateString()}`);
    if (savedMood) {
      setCurrentMood(JSON.parse(savedMood));
    }

    // Set up interval to check for week reset (optional, could also be done on app load)
    const interval = setInterval(() => {
      const checkDate = new Date();
      if (checkDate.getDay() === 0) { // If it's Sunday
        localStorage.removeItem(`mood_${checkDate.toDateString()}`); // Clear today's mood
        setCurrentMood(null); // Reset current mood in state
      }
    }, 1000 * 60 * 60 * 24); // Check once a day

    return () => clearInterval(interval);
  }, []);

  const updateMood = (mood: string) => {
    const today = new Date();
    localStorage.setItem(`mood_${today.toDateString()}`, JSON.stringify(mood));
    setCurrentMood(mood);
    console.log(`🎭 Mood atualizado no tracker: ${mood} para ${today.toDateString()}`);
    
    // Force re-render by updating state
    setTimeout(() => {
      setCurrentMood(mood);
    }, 100);
  };

  return { currentMood, currentDayIndex, updateMood };
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
  const queryClient = useQueryClient(); // Import queryClient here
  const { currentMood, currentDayIndex, updateMood } = useUserMoodTracker(); // Use the custom hook

  // Fetch and update mood data from API on component mount or when user changes
  useEffect(() => {
    const fetchWeeklyMood = async () => {
      if (!user?.id) return;

      try {
        // Assuming an endpoint to get the current week's mood data
        const response = await fetch(`/api/weekly-mood/${user.id}`);
        const data = await response.json();

        if (response.ok && data.moods) {
          // Find the mood for the current day
          const today = new Date();
          const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
          const moodForToday = data.moods.find((m: UserMood) => m.date === todayString);
          if (moodForToday && moodForToday.mood) {
            // Update local state if mood is found
            updateMood(moodForToday.mood);
          }
        }
      } catch (error) {
        console.error('Error fetching weekly mood:', error);
      }
    };

    fetchWeeklyMood();
  }, [user?.id, updateMood]); // Re-fetch if user changes

  // Effect to handle mood updates from AIAssistant
  useEffect(() => {
    const handleAIAssistantMoodUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.mood) {
        updateMood(customEvent.detail.mood); // Update local state and persist
      }
    };

    const handleMoodUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.mood) {
        console.log(`🔄 Evento de atualização de humor recebido: ${customEvent.detail.mood}`);
        updateMood(customEvent.detail.mood);
      }
    };

    window.addEventListener('aiAssistantMoodSelected', handleAIAssistantMoodUpdate);
    window.addEventListener('moodUpdated', handleMoodUpdate);

    return () => {
      window.removeEventListener('aiAssistantMoodSelected', handleAIAssistantMoodUpdate);
      window.removeEventListener('moodUpdated', handleMoodUpdate);
    };
  }, [updateMood]); // Depend on updateMood

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

  // Handle AI Assistant mood selection and update backend/state
  const handleAiAssistantMoodSelection = async (mood: string) => {
    if (!user?.id) return;

    try {
      console.log(`🎯 Processando seleção de humor: ${mood}`);
      
      // Update local state immediately for instant feedback
      updateMood(mood.toLowerCase());
      
      // Update backend
      const response = await fetch('/api/save-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, date: new Date().toISOString().split('T')[0], mood: mood.toLowerCase() }),
      });

      if (response.ok) {
        console.log(`✅ Humor salvo no backend: ${mood}`);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('tasksUpdated'));
        window.dispatchEvent(new CustomEvent('moodUpdated', { detail: { mood: mood.toLowerCase() } }));

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/weekly-mood'] });
      } else {
        console.error('Failed to save mood:', await response.text());
      }
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  };


  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden">
      <ParticlesBackground isDarkTheme={true} className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <Header user={user} />

        <main className="flex-1 px-4 pb-48">
          <div className="space-y-6">
            {/* Conditionally show WeeklyTracker */}
            {hasStartedJourney && <WeeklyTracker
              weeklyProgress={weeklyProgress}
              currentMood={currentMood} // Pass the current mood
            />}

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
            <AIAssistant onMoodSelected={handleAiAssistantMoodSelection} />
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

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50" style={{ backgroundColor: '#000515' }}>
        <PanicButton />
        <BottomNavigation
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
      </div>
    </div>
  );
}