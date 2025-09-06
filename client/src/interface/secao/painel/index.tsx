import { useState, useEffect } from "react";
import {
  Bot,
  BookOpen,
  Home,
  BarChart3,
  Users,
  Target,
  Plus,
  Sparkles,
  Frown,
  Meh,
  Smile
} from "lucide-react";
import { ScapyIcon } from "@/components/ui/scapy-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatTimer, calculateTimeDifference } from "@/lib/timer-utils";
import DesafioPlanoBeamEstar from "@/components/desafio-plano-bem-estar";
import DesafioDuplaDinamica from "@/components/desafio-dupla-dinamica";
import DailyGoals from "@/components/daily-goals";
import AIAssistant from "@/components/ai-assistant";
import type { User, WeeklyProgress } from "@shared/schema";

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
  user?: User;
}

function Timer({ user }: TimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Carregando...
        </p>
        <div className="timer-display">
          00:00:00
        </div>
      </div>
    );
  }

  const timeDiff = calculateTimeDifference(user.startDate, currentTime);
  const formattedTime = formatTimer(timeDiff);

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
            {timeDiff.days} {timeDiff.days === 1 ? 'DIA' : 'DIAS'} LIMPO
          </div>
        </div>
      )}
    </div>
  );
}

// AI Assistant Component
function AIAssistant() {
  const moodOptions = [
    { id: 'medo', label: 'Medo', icon: Frown, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { id: 'estavel', label: 'Estável', icon: Meh, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { id: 'feliz', label: 'Feliz', icon: Smile, color: 'bg-green-500/20 text-green-400 border-green-500/30' }
  ];

  const handleMoodSelect = (mood: string) => {
    alert(`Você selecionou: ${mood}`);
  };

  return (
    <section className="mb-8">
      <Card className="border-border mb-3 rounded-full" style={{ backgroundColor: '#000515' }}>
        <CardContent className="p-3">
          <div className="flex items-center justify-center space-x-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-base text-foreground font-medium">Como você está se sentindo hoje?</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between space-x-2">
        {moodOptions.map(({ id, label, icon: Icon, color }) => (
          <Button
            key={id}
            variant="outline"
            className={`flex-1 h-12 border ${color} hover:opacity-80 transition-opacity rounded-full`}
            style={{ opacity: 0.73 }}
            onClick={() => handleMoodSelect(label)}
            data-testid={`mood-${id}`}
          >
            <div className="flex items-center space-x-2">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          </Button>
        ))}
      </div>
    </section>
  );
}

// Daily Goals Component
function DailyGoals() {
  const handleAddGoal = () => {
    alert("Adicionar nova meta - Em desenvolvimento");
  };

  return (
    <section className="mb-8 relative">
      <div className="relative">
        {/* Ícone de alvo no topo do card */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Target className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <Card className="border-border pt-8 rounded-3xl" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-2 min-h-[120px]">
              <Button
                variant="ghost"
                className="flex flex-col items-center space-y-3 hover:bg-primary/10 transition-colors p-6"
                onClick={handleAddGoal}
                data-testid="button-add-goal"
              >
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plus className="w-12 h-12 text-primary" />
                </div>
                <span className="text-lg text-muted-foreground text-center font-medium">
                  Adicione suas próprias metas!
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
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
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden">
      <div className="relative z-10">
        <Header />

        <main className="flex-1 px-4 pb-48">
          <div className="space-y-6">
            <WeeklyTracker weeklyProgress={weeklyProgress} />

            <section className="text-center">
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

              <Timer user={user} />
            </section>
          </div>

          <div className="mt-6">
            <AIAssistant />
          </div>

          <div className="mt-6 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
            <div className="flex-1">
              <DesafioPlanoBeamEstar />
            </div>
            <div className="flex-1">
              <DesafioDuplaDinamica />
            </div>
          </div>

          <div className="daily-goals-section">
            <DailyGoals />
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