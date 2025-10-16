
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

interface RankedUser {
  id: number;
  name: string;
  email: string;
  days: number;
  avatar: string;
  imagemAvatar?: string;
}

export default function Ranking() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [progressInDays, setProgressInDays] = useState(0);
  const [rankingData, setRankingData] = useState<RankedUser[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(true);
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

  // Buscar ranking de usuários do backend
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setIsLoadingRanking(true);
        const response = await fetch('/api/usuarios/ranking');
        const data = await response.json();
        
        if (data.ranking) {
          setRankingData(data.ranking);
          console.log('✅ Ranking carregado:', data.ranking.length, 'usuários');
        }
      } catch (error) {
        console.error('❌ Erro ao buscar ranking:', error);
      } finally {
        setIsLoadingRanking(false);
      }
    };

    fetchRanking();
  }, []);

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
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-white bg-clip-text text-transparent">
                Seu momento atual
              </h1>
            </div>

            {/* Card de Progresso Simplificado - Estilo Evolução Mental */}
            <Card className="border-border rounded-full evolucao-mental-card-natural-3d" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Imagem de Perfil Circular */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30">
                      <img
                        src={imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.fullName || user?.full_name || 'user')}&backgroundColor=000515`}
                        alt="Perfil"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Container da Barra de Progresso com Números */}
                  <div className="flex-1 flex items-center gap-2">
                    {/* Número de dias atual */}
                    <div className="flex-shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {progressInDays}
                      </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="flex-1">
                      <Progress 
                        value={progressPercentage} 
                        className="h-2 bg-secondary/30 border border-border"
                      />
                    </div>

                    {/* Número de dias do próximo avatar */}
                    <div className="flex-shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {nextAvatarDays}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Ranking */}
            <Card className="border-border rounded-3xl evolucao-mental-card-natural-3d mt-6" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-primary mb-6 text-center">Ranking Regional</h2>
                
                {isLoadingRanking ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando ranking...</p>
                  </div>
                ) : rankingData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum usuário no ranking ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rankingData.map((rankedUser, index) => (
                      <Card 
                        key={rankedUser.id} 
                        className="border-border rounded-full evolucao-mental-card-natural-3d" 
                        style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Posição no Ranking com # */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                #{index + 1}
                              </span>
                            </div>

                            {/* Imagem de Perfil */}
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30">
                                <img
                                  src={rankedUser.imagemAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(rankedUser.avatar)}&backgroundColor=000515`}
                                  alt={rankedUser.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>

                            {/* Nome do Usuário */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {rankedUser.name}
                              </p>
                            </div>

                            {/* Barra de Progresso sem números */}
                            <div className="flex-1">
                              <Progress 
                                value={Math.min(100, (rankedUser.days / 365) * 100)} 
                                className="h-2 bg-secondary/30 border border-border"
                              />
                            </div>

                            {/* Dias totais */}
                            <div className="flex-shrink-0">
                              <span className="text-sm font-bold text-primary">
                                {rankedUser.days}d
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
