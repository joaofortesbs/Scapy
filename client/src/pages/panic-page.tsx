
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateTimeDifference } from "@/lib/timer-utils";
import CameraShame from "../components/camera-shame";
import ParticlesBackground from "@/components/particles-background";
import ObjetivosCarousel from "@/components/objetivos-carousel";
import SonhosCarousel from "@/components/sonhos-carousel";
import type { User } from "@shared/schema";

interface PanicPageProps {
  user?: User;
  onBackFromPanic?: () => void;
}

interface CalculatedTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function PanicPage({ user: propUser, onBackFromPanic }: PanicPageProps) {
  // ====== TODOS OS HOOKS DECLARADOS NO TOPO - ORDEM FIXA ======
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ====== EFEITO DE INICIALIZAÇÃO - EXECUTADO UMA VEZ ======
  useEffect(() => {
    let isMounted = true;

    const initializeComponent = async () => {
      try {
        console.log('🚀 [PanicPage] Inicializando componente...');
        
        // Primeiro: definir usuário a partir das props ou localStorage
        let userData: User | null = propUser || null;
        
        if (!userData) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              userData = JSON.parse(storedUser);
              console.log('👤 [PanicPage] Usuário carregado do localStorage:', userData);
            } catch (parseError) {
              console.error('❌ [PanicPage] Erro ao parsear dados do usuário:', parseError);
              setError('Erro ao carregar dados do usuário');
            }
          }
        }

        // Segundo: buscar dados com nova persistência de cronômetros
        if (userData?.id) {
          try {
            // Primeiro carregar do localStorage usando TimerPersistence
            const { TimerPersistence } = await import('@/lib/timer-persistence');
            const localTimer = TimerPersistence.loadTimer(userData.id.toString());
            
            if (localTimer && localTimer.startDate) {
              userData = {
                ...userData,
                startDate: new Date(localTimer.startDate)
              };
              console.log('💿 [PanicPage] Cronômetro carregado do localStorage:', localTimer.startDate);
            }

            // Sincronizar com API em background (não bloquear UI)
            setTimeout(async () => {
              try {
                const syncedTimer = await TimerPersistence.syncWithAPI(userData?.id?.toString() || '');
                if (syncedTimer && userData && new Date(syncedTimer.startDate).getTime() !== userData.startDate.getTime()) {
                  const updatedUser = {
                    ...userData!,
                    startDate: new Date(syncedTimer.startDate)
                  };
                  setUser(updatedUser);
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                  console.log('🌐 [PanicPage] Cronômetro atualizado da API:', syncedTimer.startDate);
                }
              } catch (syncError) {
                console.warn('⚠️ [PanicPage] Erro na sincronização (não crítico):', syncError);
              }
            }, 100);
          } catch (timerError) {
            console.warn('⚠️ [PanicPage] Erro no sistema de cronômetros, usando API tradicional:', timerError);
            
            // Fallback para API tradicional
            try {
              const response = await fetch(`/api/timer/status/${userData.id}`);
              if (response.ok) {
                const data = await response.json();
                if (data.hasActiveTimer && data.startDate) {
                  userData = {
                    ...userData!,
                    startDate: new Date(data.startDate)
                  };
                  console.log('🔄 [PanicPage] Dados atualizados da API (fallback):', userData);
                  
                  // Salvar dados atualizados
                  localStorage.setItem('user', JSON.stringify(userData));
                }
              }
            } catch (apiError) {
              console.warn('⚠️ [PanicPage] Erro na API (não crítico):', apiError);
              // Continua com dados locais
            }
          }
        }

        // Terceiro: atualizar estado apenas se componente ainda está montado
        if (isMounted) {
          setUser(userData);
          setIsLoading(false);
          console.log('✅ [PanicPage] Inicialização concluída');
        }

      } catch (initError) {
        console.error('❌ [PanicPage] Erro na inicialização:', initError);
        if (isMounted) {
          setError('Erro ao inicializar página de pânico');
          setIsLoading(false);
        }
      }
    };

    initializeComponent();

    return () => {
      isMounted = false;
    };
  }, [propUser?.id]); // Dependência específica para evitar loops

  // ====== EFEITO DO TIMER - SEPARADO DA INICIALIZAÇÃO ======
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ====== FUNÇÕES AUXILIARES - SEMPRE APÓS OS HOOKS ======
  const getTimeDifference = (): CalculatedTime | null => {
    if (!user?.startDate) return null;
    return calculateTimeDifference(user.startDate, currentTime);
  };

  const TimerDuplicate = () => {
    if (!user?.startDate) {
      return (
        <div className="text-xs text-white font-mono">
          00:00:00
        </div>
      );
    }

    const timeDiff = getTimeDifference();
    if (!timeDiff) return null;

    const hasCompletedOneDay = timeDiff.days > 0;

    return (
      <div className="text-center">
        {!hasCompletedOneDay ? (
          <div className="text-xs text-white font-mono font-bold" data-testid="timer-display">
            <span data-testid="timer-hours">{String(timeDiff.hours).padStart(2, '0')}</span>:
            <span data-testid="timer-minutes">{String(timeDiff.minutes).padStart(2, '0')}</span>:
            <span data-testid="timer-seconds">{String(timeDiff.seconds).padStart(2, '0')}</span>
          </div>
        ) : (
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

  // ====== RENDERIZAÇÃO CONDICIONAL APENAS APÓS HOOKS ======
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  // ====== RENDERIZAÇÃO PRINCIPAL ======
  return (
    <div 
      className="min-h-screen bg-background text-foreground relative animate-fade-in overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #000515 0%, #001122 100%)',
        animation: 'fadeIn 0.6s ease-out'
      }}
    >
      <ParticlesBackground isDarkTheme={true} className="fixed inset-0 z-0" />

      <div className="relative z-10">
        <div className="flex flex-col items-center justify-start min-h-screen px-6 pt-8 pb-8">
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-4">
            {onBackFromPanic ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackFromPanic}
                className="text-white hover:bg-white/10 transition-all duration-300"
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            ) : (
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
            )}

            <h1 
              className="text-xl md:text-2xl font-bold text-white text-center leading-tight flex-1 mr-10"
              data-testid="panic-title"
            >
              Relembre o porque você<br />começou essa jornada!
            </h1>
          </div>

          {/* Container para Câmera e Card */}
          <div className="w-full max-w-md relative" style={{ marginTop: '15px' }}>
            <CameraShame autoActivate={true} />

            <div 
              className="absolute left-1/2 transform -translate-x-1/2 w-3/5"
              style={{ 
                bottom: '-25px',
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

          {/* Carrosseis */}
          <div 
            className="w-full flex flex-col items-center justify-center px-4" 
            style={{ marginTop: '20px' }}
          >
            <div className="w-full flex justify-center items-center">
              <div className="w-full max-w-md flex justify-center">
                <ObjetivosCarousel />
              </div>
            </div>

            <div className="w-full flex justify-center items-center">
              <div className="w-full max-w-md flex justify-center">
                <SonhosCarousel />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Ajuda */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          className="panic-button text-white font-bold py-6 px-12 rounded-full shadow-2xl border-2 border-red-800 transition-all duration-300 transform hover:scale-105"
          onClick={() => alert("Função de ajuda será implementada!")}
        >
          <div className="flex items-center gap-4">
            <Hand className="w-10 h-10 font-bold stroke-2" />
            <span className="text-xl font-bold">AJUDA</span>
          </div>
        </Button>
      </div>

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
