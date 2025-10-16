
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
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div className="w-full max-w-2xl space-y-8">
            {/* Título */}
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-primary">
                Seu momento atual
              </h1>
            </div>

            {/* Card de Progresso */}
            <Card className="backdrop-blur-sm bg-background/5 border-primary/20 rounded-3xl shadow-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Imagem de Perfil Circular */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg">
                      <img
                        src={imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.fullName || user?.full_name || 'user')}&backgroundColor=000515`}
                        alt="Perfil"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Barra de Progresso e Informações */}
                  <div className="flex-1 space-y-3">
                    {/* Informações do Avatar Atual */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/80 font-medium">
                        {currentAvatar.title}
                      </span>
                      {nextAvatar && (
                        <span className="text-primary/80 font-medium">
                          Próximo: {nextAvatar.title}
                        </span>
                      )}
                    </div>

                    {/* Container da Barra de Progresso com Números */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {/* Número de dias atual */}
                        <div className="flex-shrink-0">
                          <span className="text-lg font-bold text-primary">
                            {progressInDays}
                          </span>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="flex-1">
                          <Progress 
                            value={progressPercentage} 
                            className="h-3 bg-secondary/30 border border-primary/20"
                          />
                        </div>

                        {/* Número de dias do próximo avatar */}
                        <div className="flex-shrink-0">
                          <span className="text-lg font-bold text-primary/60">
                            {nextAvatarDays}
                          </span>
                        </div>
                      </div>

                      {/* Texto de progresso */}
                      <div className="text-center">
                        {nextAvatar ? (
                          <p className="text-xs text-foreground/60">
                            Faltam {nextAvatarDays - progressInDays} {nextAvatarDays - progressInDays === 1 ? 'dia' : 'dias'} para evoluir
                          </p>
                        ) : (
                          <p className="text-xs text-primary">
                            Você alcançou o avatar máximo! 🎉
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avatar Atual - Grande */}
            <div className="flex justify-center">
              <div className="text-center space-y-4">
                <img
                  src={currentAvatar.image}
                  alt={currentAvatar.title}
                  className="w-64 h-64 md:w-80 md:h-80 object-contain mx-auto transition-all duration-500 hover:scale-105 rounded-xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentAvatar.seed}&backgroundColor=000515`;
                  }}
                />
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-primary">
                    {currentAvatar.title}
                  </h2>
                  <p className="text-sm text-foreground/60">
                    {progressInDays} {progressInDays === 1 ? 'dia' : 'dias'} de jornada
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
