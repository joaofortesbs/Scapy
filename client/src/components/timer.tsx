import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@shared/schema";
import { formatTimer, calculateTimeDifference } from "@/lib/timer-utils";
import { TimerPersistence, type TimerData } from "@/lib/timer-persistence";
import { authenticatedFetch } from '@/lib/auth-utils';

interface TimerProps {
  user: User | null;
}

export default function Timer({ user }: TimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timerData, setTimerData] = useState<TimerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Atualizar tempo a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Carregar e sincronizar cronômetro quando usuário muda
  useEffect(() => {
    if (!user?.id) {
      setTimerData(null);
      setIsLoading(false);
      return;
    }

    const loadTimerData = async () => {
      try {
        console.log(`🔍 [Timer] Carregando cronômetro para usuário ${user.id}`);

        // 1. PRIMEIRO: Carregar do localStorage (fonte primária)
        const localTimer = TimerPersistence.loadTimer(user.id.toString());
        if (localTimer) {
          setTimerData(localTimer);
          console.log(`💿 [Timer] Cronômetro carregado do localStorage: ${localTimer.startDate}`);

          // Atualizar dados do usuário para sincronização
          const updatedUser = {
            ...user,
            startDate: localTimer.startDate
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // 2. SEGUNDO: Sincronizar com API em background (não bloquear UI)
        setTimeout(async () => {
          try {
            const syncedTimer = await TimerPersistence.syncWithAPI(user.id.toString());
            if (syncedTimer && (!localTimer || syncedTimer.startDate !== localTimer.startDate)) {
              setTimerData(syncedTimer);
              console.log(`🌐 [Timer] Cronômetro atualizado da API: ${syncedTimer.startDate}`);

              // Atualizar localStorage com dados da API se diferentes
              const updatedUser = {
                ...user,
                startDate: syncedTimer.startDate
              };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          } catch (syncError) {
            console.warn('⚠️ [Timer] Erro na sincronização (não crítico):', syncError);
          }
        }, 100);

        setIsLoading(false);
      } catch (error) {
        console.error('❌ [Timer] Erro ao carregar cronômetro:', error);
        setIsLoading(false);
      }
    };

    loadTimerData();
  }, [user?.id]);

  // Escutar eventos de atualização de cronômetro
  useEffect(() => {
    const handleTimerUpdate = (event: CustomEvent) => {
      const { userId, startDate } = event.detail || {};

      if (user?.id && userId === user.id.toString() && startDate) {
        console.log(`🔄 [Timer] Cronômetro atualizado via evento: ${startDate}`);
        const newTimer = TimerPersistence.loadTimer(user.id.toString());
        if (newTimer) {
          setTimerData(newTimer);
        }
      }
    };

    window.addEventListener('timerUpdated', handleTimerUpdate as EventListener);
    window.addEventListener('timerStarted', handleTimerUpdate as EventListener);

    return () => {
      window.removeEventListener('timerUpdated', handleTimerUpdate as EventListener);
      window.removeEventListener('timerStarted', handleTimerUpdate as EventListener);
    };
  }, [user?.id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-0">
          Carregando cronômetro...
        </p>
        <div className="timer-display" data-testid="timer-display">
          <span data-testid="timer-hours">00</span>:
          <span data-testid="timer-minutes">00</span>:
          <span data-testid="timer-seconds">00</span>
        </div>
      </div>
    );
  }

  // Determinar startDate de forma robusta
  const startDate = timerData?.startDate || user?.startDate;

  // Safety check para dados válidos
  if (!startDate) {
    return (
      <Card className="p-6 text-center">
        <CardContent>
          <p className="text-muted-foreground">Cronômetro não iniciado</p>
        </CardContent>
      </Card>
    );
  }

  const timeDiff = calculateTimeDifference(startDate, currentTime);
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