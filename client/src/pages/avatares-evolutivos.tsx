import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import ParticlesBackground from "@/components/particles-background";

interface User {
  id: number;
  email: string;
  fullName: string;
}

export default function AvatareEsEvolutivos(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();

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

  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#000515' }}>
      <ParticlesBackground isDarkTheme={true} className="fixed inset-0 z-0" />
      <div className="relative z-10">
        {/* Header com botão de voltar */}
      <div className="flex items-center justify-between p-6 border-b border-border/20">
        <Button
          variant="ghost"
          onClick={handleBackToDashboard}
          className="text-foreground hover:text-primary transition-colors p-2"
          data-testid="back-button"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1"></div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-6 py-12">
        {/* Título principal */}
        <div className="text-center mb-16">
          <h1 
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            style={{ 
              background: 'linear-gradient(135deg, #00F6FF 0%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            data-testid="main-title"
          >
            Olhe seus próximos troféus campeão!
          </h1>
        </div>

        {/* Linha evolutiva */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Barra de progresso vertical */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-border/30 rounded-full">
              {/* Indicador de progresso atual */}
              <div className="absolute top-0 w-4 h-4 bg-primary rounded-full transform -translate-x-1.5 shadow-lg shadow-primary/50">
                <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Cards evolutivos */}
            <div className="space-y-12 ml-20">
              {/* Card 1 - Homem das Cavernas (Atual) */}
              <Card 
                className="border-border/30 bg-background/5 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 246, 255, 0.1) 0%, rgba(0, 5, 21, 0.8) 100%)',
                  borderColor: 'rgba(0, 246, 255, 0.3)'
                }}
                data-testid="avatar-card-1"
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Título no topo */}
                    <h3 className="text-xl font-bold text-foreground">Homem das Cavernas</h3>
                    
                    {/* Imagem do avatar */}
                    <div className="relative">
                      <img
                        src="/caveman-avatar.png"
                        alt="Homem das Cavernas"
                        className="w-48 h-48 rounded-xl object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://api.dicebear.com/7.x/adventurer/svg?seed=caveman&backgroundColor=000515";
                        }}
                        data-testid="caveman-avatar"
                      />
                    </div>

                    {/* Tag de dias */}
                    <div className="bg-primary/20 text-primary px-4 py-2 rounded-full border border-primary/30">
                      <span className="text-sm font-semibold">3 DIAS</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 - Próximo nível (Bloqueado) */}
              <Card 
                className="border-border/20 bg-background/3 backdrop-blur-sm rounded-2xl shadow-lg opacity-60 hover:opacity-70 transition-opacity duration-300"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 5, 21, 0.6) 100%)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
                data-testid="avatar-card-2"
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Título placeholder */}
                    <div className="h-6 bg-border/20 rounded w-48 animate-pulse"></div>
                    
                    {/* Placeholder para imagem */}
                    <div className="w-32 h-32 rounded-xl border-2 border-border/30 bg-background/10 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-border/30 animate-pulse"></div>
                    </div>

                    {/* Tag de bloqueado */}
                    <div className="bg-border/10 text-foreground/30 px-4 py-2 rounded-full border border-border/20">
                      <span className="text-sm font-semibold">Bloqueado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 - Futuro distante (Bloqueado) */}
              <Card 
                className="border-border/20 bg-background/3 backdrop-blur-sm rounded-2xl shadow-lg opacity-40 hover:opacity-50 transition-opacity duration-300"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 5, 21, 0.4) 100%)',
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}
                data-testid="avatar-card-3"
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Título placeholder */}
                    <div className="h-6 bg-border/15 rounded w-40 animate-pulse"></div>
                    
                    {/* Placeholder para imagem */}
                    <div className="w-32 h-32 rounded-xl border-2 border-border/20 bg-background/5 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-border/20 animate-pulse"></div>
                    </div>

                    {/* Tag de em breve */}
                    <div className="bg-border/5 text-foreground/20 px-4 py-2 rounded-full border border-border/10">
                      <span className="text-sm font-semibold">Em breve</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer motivacional */}
        <div className="text-center mt-16">
          <p className="text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Cada dia de disciplina é um passo em direção à sua evolução. Continue sua jornada e desbloqueie novos avatares que representam seu crescimento pessoal!
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}