import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

interface WeeklyProgress {
  dayCompleted: boolean[];
  currentStreak?: number;
  bestStreak?: number;
}

interface WeeklyMoodTracking {
  userId: string;
  weekStart: Date;
  mondayMood: string | null;
  tuesdayMood: string | null;
  wednesdayMood: string | null;
  thursdayMood: string | null;
  fridayMood: string | null;
  saturdayMood: string | null;
  sundayMood: string | null;
}

interface User {
  id: number;
  email: string;
  fullName: string;
}

interface WeeklyTrackerProps {
  weeklyProgress?: WeeklyProgress;
}

export default function WeeklyTracker({ weeklyProgress }: WeeklyTrackerProps) {
  const queryClient = useQueryClient();
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"] });

  const { data: weeklyMoodTracking } = useQuery<WeeklyMoodTracking>({
    queryKey: ["/api/weekly-mood-tracking", user?.id],
    enabled: !!user?.id,
  });

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

  const updateMoodMutation = useMutation({
    mutationFn: async ({ dayIndex, mood }: { dayIndex: number; mood: string }) => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const payload = {
        userId: user?.id.toString() || "",
        weekStart: startOfWeek.toISOString(),
        [dayNames[dayIndex] + "Mood"]: mood,
      };

      return apiRequest("POST", "/api/weekly-mood-tracking", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-mood-tracking"] });
    },
  });

  useEffect(() => {
    if (weeklyMoodTracking) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date();
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const currentWeekStart = new Date(weeklyMoodTracking.weekStart);
      currentWeekStart.setHours(0, 0, 0, 0);

      if (currentWeekStart.getTime() === startOfWeek.getTime()) {
        const moods = [
          weeklyMoodTracking.sundayMood,
          weeklyMoodTracking.mondayMood,
          weeklyMoodTracking.tuesdayMood,
          weeklyMoodTracking.wednesdayMood,
          weeklyMoodTracking.thursdayMood,
          weeklyMoodTracking.fridayMood,
          weeklyMoodTracking.saturdayMood,
        ];
        setCurrentMood(moods[dayOfWeek]);
      } else {
        // Reset moods if it's a new week
        setCurrentMood(null);
        setSelectedDayIndex(null);
      }
    }
  }, [weeklyMoodTracking]);

  const handleDayClick = (dayIndex: number) => {
    if (!weeklyProgress) return;

    const updatedDays = [...weeklyProgress.dayCompleted];
    updatedDays[dayIndex] = !updatedDays[dayIndex];

    updateProgressMutation.mutate(updatedDays);
  };

  const handleMoodSelect = (dayIndex: number, mood: string) => {
    setSelectedDayIndex(dayIndex);
    updateMoodMutation.mutate({ dayIndex, mood });
  };

  const getDayMoodStyle = (dayIndex: number) => {
    if (!weeklyMoodTracking) return {};

    const moods = [
      weeklyMoodTracking.sundayMood,
      weeklyMoodTracking.mondayMood,
      weeklyMoodTracking.tuesdayMood,
      weeklyMoodTracking.wednesdayMood,
      weeklyMoodTracking.thursdayMood,
      weeklyMoodTracking.fridayMood,
      weeklyMoodTracking.saturdayMood,
    ];
    const mood = moods[dayIndex];

    switch (mood) {
      case 'Medo':
        return { backgroundColor: 'red', borderWidth: '2px', borderStyle: 'solid', borderColor: 'red' };
      case 'Estável':
        return { backgroundColor: 'yellow', borderWidth: '2px', borderStyle: 'solid', borderColor: 'yellow' };
      case 'Feliz':
        return { backgroundColor: 'green', borderWidth: '2px', borderStyle: 'solid', borderColor: 'green' };
      default:
        return {};
    }
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
            onClick={() => {
              handleDayClick(index);
              handleMoodSelect(index, 'Estável'); // Default mood for testing
            }}
            title={`${dayNames[index]} - ${weeklyProgress?.dayCompleted[index] ? 'Concluído' : 'Pendente'}`}
            data-testid={`day-circle-${index}`}
            disabled={updateProgressMutation.isPending || updateMoodMutation.isPending}
            style={getDayMoodStyle(index)}
          >
            {day}
          </button>
        ))}
      </div>

      {updateProgressMutation.isPending && (
        <div className="text-center mt-2 text-sm text-muted-foreground">
          Atualizando progresso...
        </div>
      )}
      {updateMoodMutation.isPending && (
        <div className="text-center mt-2 text-sm text-muted-foreground">
          Atualizando humor...
        </div>
      )}
    </section>
  );
}