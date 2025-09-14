import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { WeeklyProgress } from "@shared/schema";
import { useState, useEffect } from "react";

interface WeeklyTrackerProps {
  weeklyProgress?: WeeklyProgress;
}

interface User {
  id: number;
  email: string;
  fullName: string;
}

export default function WeeklyTracker({ weeklyProgress }: WeeklyTrackerProps) {
  const queryClient = useQueryClient();
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const [weeklyMoods, setWeeklyMoods] = useState<Record<string, string>>({});
  const [user, setUser] = useState<User | null>(null);
  
  // Carregar dados do usuário e humores da semana
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        loadWeeklyMoods(userData.id);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário no WeeklyTracker:', error);
      }
    }
  }, []);

  // Escutar eventos de atualização de humor
  useEffect(() => {
    const handleMoodUpdate = (event: CustomEvent) => {
      if (user && event.detail?.userId === user.id.toString()) {
        console.log('🔄 [WeeklyTracker] Atualização de humor recebida:', event.detail);
        loadWeeklyMoods(user.id);
      }
    };

    const handleNewDay = (event: CustomEvent) => {
      if (user && event.detail?.userId === user.id) {
        console.log('🌅 [WeeklyTracker] Novo dia detectado, recarregando humores...');
        loadWeeklyMoods(user.id);
      }
    };

    window.addEventListener('moodUpdated', handleMoodUpdate);
    window.addEventListener('weeklyMoodUpdated', handleMoodUpdate);
    window.addEventListener('newDayDetected', handleNewDay);
    
    return () => {
      window.removeEventListener('moodUpdated', handleMoodUpdate);
      window.removeEventListener('weeklyMoodUpdated', handleMoodUpdate);
      window.removeEventListener('newDayDetected', handleNewDay);
    };
  }, [user]);

  const loadWeeklyMoods = (userId: number) => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
      startOfWeek.setHours(0, 0, 0, 0);

      const weekMoods: Record<string, string> = {};

      // Carregar humores de cada dia da semana
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const dateKey = dayDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // Tentar carregar do localStorage individual
        const individualKey = `scapy_mood_${userId}_${dateKey}`;
        const savedMood = localStorage.getItem(individualKey);
        
        if (savedMood) {
          try {
            const moodData = JSON.parse(savedMood);
            if (moodData.mood && moodData.date === dateKey) {
              weekMoods[dateKey] = moodData.mood;
            }
          } catch (error) {
            console.error(`Erro ao parsear humor do dia ${dateKey}:`, error);
          }
        } else {
          // Tentar carregar do sistema geral
          try {
            const allMoods = JSON.parse(localStorage.getItem('scapy_all_moods') || '{}');
            const userMoods = allMoods[userId.toString()] || {};
            if (userMoods[dateKey]) {
              weekMoods[dateKey] = userMoods[dateKey];
            }
          } catch (error) {
            console.error('Erro ao carregar do sistema geral:', error);
          }
        }
      }

      setWeeklyMoods(weekMoods);
      console.log('📅 [WeeklyTracker] Humores carregados:', weekMoods);
    } catch (error) {
      console.error('❌ [WeeklyTracker] Erro ao carregar humores da semana:', error);
    }
  };

  const getDayClasses = (dayIndex: number): string => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
    
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + dayIndex);
    const dateKey = dayDate.toISOString().split('T')[0];
    
    let classes = 'day-circle';
    
    // Adicionar classe de completado se aplicável
    if (weeklyProgress?.dayCompleted[dayIndex]) {
      classes += ' completed';
    }
    
    // Adicionar classe de humor se disponível
    const mood = weeklyMoods[dateKey];
    if (mood) {
      classes += ` mood-${mood}`;
    }
    
    return classes;
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
