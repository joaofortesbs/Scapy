
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

            {/* Card de Progresso Simplificado - Completamente Arredondado */}
            <Card className="relative backdrop-blur-md bg-gradient-to-r from-background/10 via-primary/5 to-background/10 border-primary/30 rounded-full shadow-2xl overflow-hidden group hover:shadow-primary/20 transition-all duration-500">
              {/* Efeito de brilho interno */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Borda de luz animada */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 blur-sm opacity-50" />
              
              <CardContent className="relative p-4">
                <div className="flex items-center gap-4">
                  {/* Imagem de Perfil Circular com efeito de anel */}
                  <div className="flex-shrink-0 relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/40 via-primary/20 to-transparent blur-md animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/40 shadow-lg shadow-primary/30 ring-2 ring-primary/20 ring-offset-2 ring-offset-background/20">
                      <img
                        src={imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.fullName || user?.full_name || 'user')}&backgroundColor=000515`}
                        alt="Perfil"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Container da Barra de Progresso com Números */}
                  <div className="flex-1 flex items-center gap-3">
                    {/* Número de dias atual com efeito de destaque */}
                    <div className="flex-shrink-0 relative">
                      <div className="absolute inset-0 blur-md bg-primary/30 rounded-full" />
                      <span className="relative text-lg font-bold bg-gradient-to-br from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,246,255,0.3)]">
                        {progressInDays}
                      </span>
                    </div>

                    {/* Barra de Progresso com efeitos aprimorados */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 blur-sm bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-full" />
                      <Progress 
                        value={progressPercentage} 
                        className="relative h-3 bg-gradient-to-r from-secondary/20 via-secondary/30 to-secondary/20 border border-primary/30 shadow-inner shadow-primary/20"
                      />
                    </div>

                    {/* Número de dias do próximo avatar com efeito sutil */}
                    <div className="flex-shrink-0">
                      <span className="text-lg font-bold bg-gradient-to-br from-primary/60 via-primary/50 to-primary/40 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,246,255,0.2)]">
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
  );
}
