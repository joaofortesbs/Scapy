import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateTimeDifference } from "@/lib/timer-utils";
import CameraShame from "@/components/camera-shame";

interface PanicPageProps {
  user?: any;
}

interface CalculatedTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function PanicPage({ user }: PanicPageProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Duplicata exata do componente Timer
  const TimerDuplicate = () => {
    if (!user || !user.startDate) {
      return (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Dados do usuário não disponíveis
          </p>
          <div className="timer-display">
            00:00:00
          </div>
        </div>
      );
    }

    const startDate = user.startDate || new Date().toISOString();
    const timeDiff = calculateTimeDifference(startDate, currentTime);
    const hasCompletedOneDay = timeDiff.days > 0;

    return (
      <div className="text-center">
        {!hasCompletedOneDay ? (
          // Timer original para menos de 24 horas
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
          // Design para 1+ dias
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
  };

  return (
    <div 
      className="min-h-screen bg-background text-foreground relative animate-fade-in"
      style={{ 
        background: 'linear-gradient(180deg, #000515 0%, #001122 100%)',
        animation: 'fadeIn 0.6s ease-out'
      }}
    >
      {/* Botão de voltar */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 transition-all duration-300"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center justify-start min-h-screen px-6 pt-20 pb-8 space-y-8">
        {/* Título */}
        <h1 
          className="text-3xl md:text-4xl font-bold text-white text-center leading-tight"
          data-testid="panic-title"
        >
          Relembre o porque você começou essa jornada
        </h1>

        {/* Duplicata do cronômetro */}
        <div className="w-full max-w-md">
          <TimerDuplicate />
        </div>

        {/* Componente Câmera da Vergonha */}
        <div className="w-full max-w-md">
          <CameraShame />
        </div>
      </div>

      {/* Estilos para animação */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
}