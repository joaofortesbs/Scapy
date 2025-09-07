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
import { ScapyIcon } from "@/components/ui/scapy-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatTimer, calculateTimeDifference } from "@/lib/timer-utils";
import DesafioPlanoBeamEstar from "@/components/desafio-plano-bem-estar";
import DesafioDuplaDinamica from "@/components/desafio-dupla-dinamica";
import AnaliseEvolucaoMental from "@/components/analise-evolucao-mental";
import FraseDoDia from "@/components/frase-do-dia";
import { DailyGoals } from "@/components/daily-goals";
import AIAssistant from "@/components/ai-assistant";
import ParticlesBackground from "@/components/particles-background";
import type { User, WeeklyProgress } from "@shared/schema";
import { supabase } from "@/lib/supabaseClient";

// Header Component
function Header() {
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

        <div className="gradient-border w-12 h-12" data-testid="profile-container">
          <div className="gradient-border-inner flex items-center justify-center">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user&backgroundColor=000515"
              alt="Profile Picture"
              className="w-10 h-10 rounded-full object-cover"
              data-testid="profile-image"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

// Weekly Tracker Component
interface WeeklyTrackerProps {
  weeklyProgress?: WeeklyProgress;
}

function WeeklyTracker({ weeklyProgress }: WeeklyTrackerProps) {
  const queryClient = useQueryClient();
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

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
            className={`day-circle ${
              weeklyProgress?.dayCompleted[index] ? 'completed' : ''
            }`}
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
  startTime: string | null;
}

function Timer({ startTime }: TimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    console.log("Timer component - startTime:", startTime);
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate time difference with proper error handling
  const timeDiff = calculateTimeDifference(startTime, currentTime);
  console.log("Timer calculation - timeDiff:", timeDiff, "startTime:", startTime);

  if (!startTime || timeDiff.totalSeconds === 0) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Cronômetro não iniciado
        </p>
        <div className="timer-display">
          00:00:00
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-0">
        Você está livre da pornografia há:
      </p>
      <div className="timer-display" data-testid="timer-display">
        <span data-testid="timer-hours">{String(timeDiff.hours).padStart(2, '0')}</span>:
        <span data-testid="timer-minutes">{String(timeDiff.minutes).padStart(2, '0')}</span>:
        <span data-testid="timer-seconds">{String(timeDiff.seconds).padStart(2, '0')}</span>
      </div>

      {timeDiff.days > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-primary">
            {timeDiff.days} {timeDiff.days === 1 ? 'DIA' : 'DIAS'} LIMPO{timeDiff.days > 1 ? 'S' : ''}
          </div>
        </div>
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
interface JourneyStartProps {
  onStartJourney: () => void;
  onStartTimer: () => void;
}

function JourneyStart({ onStartJourney, onStartTimer }: JourneyStartProps) {
  const handleClick = () => {
    onStartJourney();
    onStartTimer();
  };

  return (
    <div className="flex items-start justify-center mt-8 min-h-[60vh]">
      <div
        className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
        onClick={handleClick}
        data-testid="journey-start-image"
      >
        <img
          src="/Imagem-inicio-jornada-painel.webp"
          alt="Comece sua jornada agora - Bloqueador avançado de apps e sites"
          className="w-[770px] h-[527px] object-contain mx-auto"
          loading="eager"
          fetchpriority="high"
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
  const [hasStartedJourney, setHasStartedJourney] = useState(() => {
    const storedValue = localStorage.getItem('hasStartedJourney');
    return storedValue === 'true';
  });
  const [timerStartTime, setTimerStartTime] = useState<string | null>(null);
  const [isLoadingTimer, setIsLoadingTimer] = useState(false);

  const { data: timerData, isLoading: isLoadingTimerQuery, refetch: refetchTimer } = useQuery({
    queryKey: ['timer', user?.id],
    queryFn: async () => {
      console.log("Starting timer query...");
      console.log("User from props:", user);
      
      if (!user?.id) {
        console.log("No authenticated user found");
        return null;
      }

      console.log("Fetching timer for user:", user.id);

      const { data, error } = await supabase
        .from('timer')
        .select('start_time, created_at, id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("Error fetching timer:", error);
        return null;
      }

      console.log("Timer data fetched:", data);
      
      if (data && data.length > 0) {
        return {
          start_time: data[0].start_time,
          created_at: data[0].created_at,
          id: data[0].id
        };
      }
      
      return null;
    },
    enabled: true, // Always enabled to check for existing timers
    refetchInterval: 5000, // Refetch every 5 seconds to check for updates
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    console.log("useEffect - timerData changed:", timerData);
    
    if (timerData && timerData.start_time) {
      console.log("Setting timer start time:", timerData.start_time);
      setTimerStartTime(timerData.start_time);
      
      if (!hasStartedJourney) {
        console.log("Journey not started, setting to true");
        setHasStartedJourney(true);
        localStorage.setItem('hasStartedJourney', 'true');
      }
    } else if (timerData === null && hasStartedJourney) {
      // If no timer data but journey was started, reset the timer
      console.log("No timer data found, resetting timer");
      setTimerStartTime(null);
    }
  }, [timerData, hasStartedJourney]);

  const startTimerMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log("Starting timer mutation...");
        
        if (!user?.id) {
          throw new Error("User must be authenticated to start timer");
        }

        console.log("Starting timer for user:", user.id);
        setIsLoadingTimer(true);

        // Check if timer already exists
        const { data: existingTimer, error: fetchError } = await supabase
          .from('timer')
          .select('start_time, id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error("Error fetching existing timer:", fetchError);
          throw fetchError;
        }

        if (existingTimer && existingTimer.length > 0) {
          console.log("Timer already exists:", existingTimer[0]);
          return existingTimer[0].start_time;
        }

        // Create new timer
        const startTime = new Date().toISOString();
        console.log("Creating new timer with start_time:", startTime);
        
        const { data, error } = await supabase
          .from('timer')
          .insert([{ 
            user_id: user.id, 
            start_time: startTime 
          }])
          .select('start_time, id')
          .single();

        if (error) {
          console.error("Error creating timer:", error);
          throw error;
        }

        console.log("Timer created successfully:", data);
        return data.start_time;
      } catch (error) {
        console.error("Error in startTimerMutation:", error);
        setIsLoadingTimer(false);
        throw error;
      }
    },
    onSuccess: (startTime) => {
      console.log("Timer started successfully:", startTime);
      setTimerStartTime(startTime);
      setHasStartedJourney(true);
      localStorage.setItem('hasStartedJourney', 'true');
      setIsLoadingTimer(false);
      
      // Refetch timer data after short delay
      setTimeout(() => {
        refetchTimer();
      }, 500);
    },
    onError: (error) => {
      console.error("Timer start failed:", error);
      setIsLoadingTimer(false);
      alert(`Erro ao iniciar cronômetro: ${error.message}`);
    }
  });

  const handleStartJourney = () => {
    setHasStartedJourney(true);
    localStorage.setItem('hasStartedJourney', 'true');
  };

  const handleStartTimer = () => {
    startTimerMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden">
      <ParticlesBackground isDarkTheme={true} className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <Header />

        <main className="flex-1 px-4 pb-48">
          <div className="space-y-6">
            {/* Conditionally show WeeklyTracker */}
            {hasStartedJourney && <WeeklyTracker weeklyProgress={weeklyProgress} />}

            <section className="text-center">
              {!hasStartedJourney ? (
                <JourneyStart 
                  onStartJourney={handleStartJourney}
                  onStartTimer={handleStartTimer}
                />
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
                  {isLoadingTimer || isLoadingTimerQuery ? (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        {isLoadingTimer ? "Iniciando cronômetro..." : "Carregando cronômetro..."}
                      </p>
                      <div className="timer-display">
                        00:00:00
                      </div>
                    </div>
                  ) : (
                    <Timer startTime={timerStartTime} />
                  )}
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