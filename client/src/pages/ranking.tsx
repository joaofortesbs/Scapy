
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

            {/* Card de Progresso Ultra Moderno */}
            <Card className="relative backdrop-blur-xl bg-gradient-to-br from-background/5 via-primary/3 to-background/5 border-0 rounded-full shadow-2xl overflow-hidden group transition-all duration-700 hover:scale-[1.02]">
              {/* Camadas de fundo animadas */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-cyan-500/5 to-primary/5 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer" />
              
              {/* Borda externa brilhante */}
              <div className="absolute inset-[-2px] rounded-full bg-gradient-to-r from-primary/40 via-cyan-400/40 to-primary/40 opacity-60 blur-md" />
              <div className="absolute inset-[-1px] rounded-full bg-gradient-to-r from-primary/60 via-cyan-500/60 to-primary/60 opacity-40 blur-sm group-hover:opacity-70 transition-opacity duration-500" />
              
              {/* Partículas flutuantes */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full blur-sm animate-float-slow" />
                <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-cyan-400/30 rounded-full blur-sm animate-float-medium" />
                <div className="absolute bottom-1/3 left-1/2 w-2.5 h-2.5 bg-primary/20 rounded-full blur-sm animate-float-fast" />
              </div>
              
              <CardContent className="relative p-5 bg-gradient-to-br from-background/40 via-background/30 to-background/40 backdrop-blur-sm rounded-full">
                <div className="flex items-center gap-5">
                  {/* Imagem de Perfil Ultra Moderna */}
                  <div className="flex-shrink-0 relative group/avatar">
                    {/* Anel externo rotativo */}
                    <div className="absolute inset-[-8px] rounded-full bg-gradient-to-tr from-primary via-cyan-400 to-primary opacity-60 blur-lg animate-spin-slow" />
                    <div className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-primary/50 via-transparent to-cyan-400/50 animate-reverse-spin" />
                    
                    {/* Container da imagem */}
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-[3px] border-primary/50 shadow-2xl shadow-primary/40 ring-4 ring-primary/20 ring-offset-4 ring-offset-background/30 transition-all duration-500 group-hover/avatar:scale-110 group-hover/avatar:ring-primary/40">
                      <img
                        src={imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.fullName || user?.full_name || 'user')}&backgroundColor=000515`}
                        alt="Perfil"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                      />
                      {/* Overlay de brilho */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500" />
                    </div>
                    
                    {/* Efeito de pulso */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover/avatar:opacity-30" />
                  </div>

                  {/* Container da Barra de Progresso Ultra Moderna */}
                  <div className="flex-1 flex items-center gap-4">
                    {/* Número de dias atual com design futurista */}
                    <div className="flex-shrink-0 relative group/number">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-cyan-400/40 blur-xl rounded-full scale-150 opacity-60 group-hover/number:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 bg-primary/30 blur-md rounded-full animate-pulse" />
                      <span className="relative text-2xl font-black bg-gradient-to-br from-primary via-cyan-300 to-primary bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(0,246,255,0.5)] transition-all duration-300 group-hover/number:scale-110 inline-block">
                        {progressInDays}
                      </span>
                    </div>

                    {/* Barra de Progresso Futurista */}
                    <div className="flex-1 relative h-4 group/progress">
                      {/* Trilho da barra */}
                      <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 via-secondary/20 to-secondary/10 rounded-full border border-primary/20 shadow-inner" />
                      
                      {/* Glow externo */}
                      <div className="absolute inset-[-2px] bg-gradient-to-r from-primary/20 via-cyan-400/30 to-primary/20 rounded-full blur-md opacity-60 group-hover/progress:opacity-100 transition-opacity duration-500" />
                      
                      {/* Barra de progresso */}
                      <div className="relative h-full rounded-full overflow-hidden">
                        <Progress 
                          value={progressPercentage} 
                          className="h-full bg-transparent [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:via-cyan-400 [&>div]:to-primary [&>div]:shadow-[0_0_20px_rgba(0,246,255,0.6)] [&>div]:animate-shimmer-progress"
                        />
                        {/* Efeito de scanning */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan opacity-40" />
                      </div>
                    </div>

                    {/* Número do próximo avatar futurista */}
                    <div className="flex-shrink-0 relative group/next">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-cyan-400/20 blur-lg rounded-full scale-150 opacity-40 group-hover/next:opacity-70 transition-opacity duration-300" />
                      <span className="relative text-2xl font-black bg-gradient-to-br from-primary/70 via-cyan-300/60 to-primary/50 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,246,255,0.3)] transition-all duration-300 group-hover/next:scale-110 inline-block">
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
