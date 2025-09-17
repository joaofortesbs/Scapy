import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@shared/schema";
import { formatTimer, calculateTimeDifference } from "@/lib/timer-utils";
import { TimerPersistence, type TimerData } from "@/lib/timer-persistence";
import { AuthService } from "@/lib/auth";

interface TimerProps {
  user: User | null;
  onUserUpdate?: (updatedUser: User) => void; // Adicionado para atualizar o usuário pai
  setError: (message: string) => void; // Adicionado para gerenciar erros
  setSuccess: (message: string) => void; // Adicionado para gerenciar sucessos
}

export default function Timer({ user, onUserUpdate, setError, setSuccess }: TimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timerData, setTimerData] = useState<TimerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

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

  // Função para iniciar cronômetro
  const handleStartTimer = async () => {
    if (!user?.id || isStarting) return;

    setIsStarting(true);
    try {
      console.log(`🚀 [Timer] Iniciando cronômetro para usuário ${user.id}`);

      // Fazer requisição autenticada para iniciar cronômetro
      const response = await AuthService.authenticatedFetch('/api/timer/start', {
        method: 'POST',
        body: JSON.stringify({}) // Corpo vazio, userId vem do JWT
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao iniciar cronômetro');
      }

      const data = await response.json();

      if (data.timerStarted && data.startDate) {
        // Salvar no sistema de persistência local
        TimerPersistence.saveTimer(user.id.toString(), data.startDate);

        // Atualizar estado do componente
        const newTimer: TimerData = {
          userId: user.id.toString(),
          startDate: data.startDate,
          createdAt: data.startDate,
          isActive: true,
          timestamp: Date.now(),
          version: '1.0.0',
          source: 'api-start'
        };

        setTimerData(newTimer);

        // Disparar evento para outros componentes
        window.dispatchEvent(new CustomEvent('timerStarted', {
          detail: {
            userId: user.id.toString(),
            startDate: data.startDate,
            timestamp: Date.now()
          }
        }));

        console.log(`✅ [Timer] Cronômetro iniciado com sucesso: ${data.startDate}`);
        setSuccess('🚀 Cronômetro iniciado com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      }

    } catch (error) {
      console.error('❌ [Timer] Erro ao iniciar cronômetro:', error);
      // Mostrar erro para o usuário (você pode adicionar um toast aqui)
      setError(`Erro ao iniciar cronômetro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsStarting(false);
    }
  };

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

  // Se não há cronômetro ativo, mostrar botão para iniciar
  if (!startDate) {
    return (
      <Card className="p-6 text-center">
        <CardContent>
          <p className="text-muted-foreground mb-4">Cronômetro não iniciado</p>
          <button
            onClick={handleStartTimer}
            disabled={isStarting}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? '⏳ Iniciando...' : '🚀 INICIAR CRONÔMETRO'}
          </button>
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