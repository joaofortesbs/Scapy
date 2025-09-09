
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateTimeDifference } from "@/lib/timer-utils";
import CameraShame from "../components/camera-shame";
import type { User } from "@shared/schema";

interface PanicPageProps {
  user?: User;
}

interface CalculatedTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function PanicPage({ user: propUser }: PanicPageProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<User | null>(propUser || null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from localStorage and API
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // First try to get from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('👤 Usuário carregado do localStorage:', parsedUser);
        }

        // If we have a user ID, fetch fresh data from API
        const userToCheck = propUser || (storedUser ? JSON.parse(storedUser) : null);
        if (userToCheck?.id) {
          try {
            const response = await fetch(`/api/timer/status/${userToCheck.id}`);
            const data = await response.json();

            if (response.ok && data.hasActiveTimer) {
              const updatedUser = {
                ...userToCheck,
                startDate: data.startDate
              };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              console.log('🔄 Dados do usuário atualizados da API:', updatedUser);
            }
          } catch (error) {
            console.error('❌ Erro ao buscar dados do timer:', error);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados do usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [propUser]);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Timer component that mirrors exactly the main timer logic
  const TimerDuplicate = () => {
    if (isLoading) {
      return (
        <div className="text-xs text-white font-mono">
          00:00:00
        </div>
      );
    }

    if (!user || !user.startDate) {
      return (
        <div className="text-xs text-white font-mono">
          00:00:00
        </div>
      );
    }

    const startDate = user.startDate || new Date().toISOString();
    const timeDiff = calculateTimeDifference(startDate, currentTime);
    const hasCompletedOneDay = timeDiff.days > 0;

    return (
      <div className="text-center">
        {!hasCompletedOneDay ? (
          // Timer compacto para menos de 24 horas
          <div className="text-xs text-white font-mono font-bold" data-testid="timer-display">
            <span data-testid="timer-hours">{String(timeDiff.hours).padStart(2, '0')}</span>:
            <span data-testid="timer-minutes">{String(timeDiff.minutes).padStart(2, '0')}</span>:
            <span data-testid="timer-seconds">{String(timeDiff.seconds).padStart(2, '0')}</span>
          </div>
        ) : (
          // Design compacto para 1+ dias com texto de liberdade
          <div className="flex items-center justify-center gap-2" data-testid="days-display">
            <div className="text-sm font-bold text-white">
              {timeDiff.days} {timeDiff.days === 1 ? 'DIA' : 'DIAS'}
            </div>
            <div className="text-sm font-bold text-white">
              DE LIBERDADE!
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-background text-foreground relative animate-fade-in"
      style={{ 
        background: 'linear-gradient(180deg, #000515 0%, #001122 100%)',
        animation: 'fadeIn 0.6s ease-out'
      }}
    >
      <div className="flex flex-col items-center justify-start min-h-screen px-6 pt-8 pb-8">
        {/* Header com botão de voltar e título */}
        <div className="w-full flex items-center justify-between mb-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 transition-all duration-300"
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          
          <h1 
            className="text-xl md:text-2xl font-bold text-white text-center leading-tight flex-1 mr-10"
            data-testid="panic-title"
          >
            Relembre o porque você<br />começou essa jornada!
          </h1>
        </div>

        {/* Container para Câmera da Vergonha e Card Sobreposto */}
        <div className="w-full max-w-md relative" style={{ marginTop: '15px' }}>
          {/* Componente Câmera da Vergonha */}
          <CameraShame autoActivate={true} />
          
          {/* Novo card retangular sobreposto - 50% dentro, 50% fora */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 w-3/5"
            style={{ 
              bottom: '-25px', // 50% para fora do card de câmera
              zIndex: 10 
            }}
          >
            <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 rounded-full p-3 shadow-lg border border-white/20 ai-assistant-card-natural-3d backdrop-blur-md" style={{ height: '50px', backgroundColor: 'rgba(0, 5, 21, 0.8)' }}>
              <div className="text-center text-white h-full flex items-center justify-center">
                <TimerDuplicate />
              </div>
            </div>
          </div>
        </div>

        {/* Espaçamento para compensar o card sobreposto */}
        <div 
          className="w-full max-w-md" 
          style={{ marginTop: '45px' }}
        >
          {/* Espaço vazio para manter layout */}
        </div>
      </div>

      {/* Estilos para animação */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out;
          }
        `
      }} />
    </div>
  );
}
