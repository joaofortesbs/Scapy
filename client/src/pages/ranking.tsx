
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import ParticlesBackground from "@/components/particles-background";
import { useState, useEffect } from "react";
import { getCurrentAvatar, getNextAvatar, calculateProgressInDays } from "@/utils/avatar-system";
import { useProfileImage } from "@/hooks/useProfileImage";

interface User {
  id: number;
  email: string;
  fullName?: string;
  full_name?: string;
  startDate: string;
  profileImage?: string;
}

export default function Ranking() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [progressInDays, setProgressInDays] = useState(0);
  const { imageUrl } = useProfileImage(user);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.startDate) {
      const days = calculateProgressInDays(user.startDate);
      setProgressInDays(days);
    }
  }, [user]);

  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };

  const currentAvatar = getCurrentAvatar(progressInDays);
  const nextAvatar = getNextAvatar(progressInDays);
  
  // Calcular a porcentagem de progresso até o próximo avatar
  const calculateProgressPercentage = () => {
    if (!nextAvatar) return 100;
    
    const previousAvatarDays = currentAvatar.days;
    const nextAvatarDays = nextAvatar.days;
    const range = nextAvatarDays - previousAvatarDays;
    const progress = progressInDays - previousAvatarDays;
    
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const progressPercentage = calculateProgressPercentage();
  const nextAvatarDays = nextAvatar ? nextAvatar.days : currentAvatar.days;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#000515' }}>
      <ParticlesBackground isDarkTheme={true} className="fixed inset-0 z-0" />
      
      <div className="relative z-10">
        {/* Botão de voltar */}
        <div className="absolute top-6 left-6 z-20">
          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            className="text-foreground hover:text-primary transition-all duration-300 p-3 rounded-full hover:bg-primary/10"
            data-testid="back-button"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        {/* Conteúdo principal */}
        <div className="px-6 pt-20">
          <div className="w-full max-w-2xl mx-auto space-y-4">
            {/* Título com degradê */}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent animate-gradient">
                Seu momento atual
              </h1>
            </div>

            {/* Card de Progresso Sofisticado */}
            <div className="relative group">
              {/* Brilho externo animado */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-2xl opacity-30 group-hover:opacity-50 blur-lg transition-all duration-500 animate-pulse"></div>
              
              <Card className="relative backdrop-blur-xl bg-gradient-to-br from-background/10 via-background/5 to-background/10 border border-primary/30 rounded-2xl shadow-[0_0_50px_rgba(0,246,255,0.15)] overflow-hidden hover:shadow-[0_0_80px_rgba(0,246,255,0.25)] transition-all duration-500">
                {/* Gradiente sutil de fundo */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 pointer-events-none"></div>
                
                {/* Linha de brilho superior */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"></div>
                
                <CardContent className="relative p-6">
                  <div className="flex items-center gap-5">
                    {/* Imagem de Perfil com efeito de brilho */}
                    <div className="flex-shrink-0 relative">
                      <div className="absolute -inset-1 bg-gradient-to-br from-primary to-cyan-400 rounded-full opacity-40 blur-md group-hover:opacity-60 transition-opacity duration-300"></div>
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_20px_rgba(0,246,255,0.3)] ring-1 ring-primary/20">
                        <img
                          src={imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.fullName || user?.full_name || 'user')}&backgroundColor=000515`}
                          alt="Perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Container da Barra de Progresso com Números */}
                    <div className="flex-1 flex items-center gap-4">
                      {/* Número de dias atual */}
                      <div className="flex-shrink-0">
                        <span className="text-xl font-bold bg-gradient-to-br from-primary to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,246,255,0.5)]">
                          {progressInDays}
                        </span>
                      </div>

                      {/* Barra de Progresso com efeitos */}
                      <div className="flex-1 relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-cyan-400/20 rounded-full blur-sm"></div>
                        <Progress 
                          value={progressPercentage} 
                          className="relative h-3.5 bg-gradient-to-br from-secondary/40 to-secondary/20 border border-primary/30 shadow-inner"
                        />
                      </div>

                      {/* Número de dias do próximo avatar */}
                      <div className="flex-shrink-0">
                        <span className="text-xl font-bold bg-gradient-to-br from-primary/60 to-cyan-300/60 bg-clip-text text-transparent">
                          {nextAvatarDays}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
