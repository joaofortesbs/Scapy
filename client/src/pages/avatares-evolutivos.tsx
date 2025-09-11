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
  const [progressInDays, setProgressInDays] = useState<number>(0); // Assuming user has a progress in days

  // Simulate fetching user progress
  useEffect(() => {
    // In a real application, you would fetch this from an API or context
    const simulatedProgress = 50; // Example: user has progressed 50 days
    setProgressInDays(simulatedProgress);
  }, []);

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

  const isCardActive = (daysRequired: number): boolean => {
    return progressInDays >= daysRequired;
  };

  const isCurrentCard = (daysRequired: number, nextDaysRequired?: number): boolean => {
    if (nextDaysRequired === undefined) {
      return progressInDays >= daysRequired;
    }
    return progressInDays >= daysRequired && progressInDays < nextDaysRequired;
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
              {/* This indicator needs to be dynamically positioned based on progressInDays */}
              <div 
                className="absolute top-0 w-4 h-4 bg-primary rounded-full transform -translate-x-1.5 shadow-lg shadow-primary/50 transition-all duration-500"
                style={{ 
                  top: `${(progressInDays / 300) * 100}%` // Example calculation, needs adjustment based on total days and card distribution
                }}
              >
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
                      <span className="text-sm font-semibold">0 DIAS</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 - Guerreiro da Tribo */}
              <Card
                className="border-border/30 bg-background/5 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 246, 255, 0.1) 0%, rgba(0, 5, 21, 0.8) 100%)',
                  borderColor: 'rgba(0, 246, 255, 0.3)'
                }}
                data-testid="avatar-card-2"
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Título no topo */}
                    <h3 className="text-xl font-bold text-foreground">Guerreiro da Tribo</h3>

                    {/* Imagem do avatar */}
                    <div className="relative">
                      <img
                        src="/avatar-guerreiro-tribo-novo.webp"
                        alt="Guerreiro da Tribo"
                        className="w-48 h-48 rounded-xl object-cover"
                        style={{ aspectRatio: '1 / 1' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://api.dicebear.com/7.x/adventurer/svg?seed=warrior&backgroundColor=000515";
                        }}
                        data-testid="warrior-avatar"
                      />
                    </div>

                    {/* Tag de dias */}
                    <div className="bg-primary/20 text-primary px-4 py-2 rounded-full border border-primary/30">
                      <span className="text-sm font-semibold">3 DIAS</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 - Guardião da Espada */}
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
                    <h3 className="text-xl font-bold text-foreground/60">Guardião da Espada</h3>

                    <div className="relative">
                      <img
                        src="/avatar-guardião-espada.webp"
                        alt="Guardião da Espada"
                        className="w-48 h-48 rounded-xl object-cover opacity-60"
                        style={{ aspectRatio: '1 / 1' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://api.dicebear.com/7.x/adventurer/svg?seed=guardian&backgroundColor=000515";
                        }}
                        data-testid="guardian-avatar"
                      />
                    </div>

                    <div className="bg-border/5 text-foreground/20 px-4 py-2 rounded-full border border-border/10">
                      <span className="text-sm font-semibold">7 DIAS</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4 - Samurai da Disciplina */}
              <Card
                className="border-border/20 bg-background/3 backdrop-blur-sm rounded-2xl shadow-lg opacity-40 hover:opacity-50 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 5, 21, 0.4) 100%)',
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}
                data-testid="avatar-card-4"
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <h3 className="text-xl font-bold text-foreground/60">Samurai da Disciplina</h3>

                    <div className="relative">
                      <img
                        src="/avatar-samurai-disciplina.webp"
                        alt="Samurai da Disciplina"
                        className="w-48 h-48 rounded-xl object-cover opacity-60"
                        style={{ aspectRatio: '1 / 1' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://api.dicebear.com/7.x/adventurer/svg?seed=samurai&backgroundColor=000515";
                        }}
                        data-testid="samurai-avatar"
                      />
                    </div>

                    <div className="bg-border/5 text-foreground/20 px-4 py-2 rounded-full border border-border/10">
                      <span className="text-sm font-semibold">15 DIAS</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cards 5-12 with dynamic system */}
              {[
                { id: 5, title: "Viking da Coragem", days: 30, nextDays: 50, image: "/avatar-viking-coragem.webp", seed: "viking", size: "w-48 h-48" },
                { id: 6, title: "Cavaleiro da Resistência", days: 50, nextDays: 75, image: "/avatar-cavaleiro-resistencia.webp", seed: "knight", size: "w-48 h-48" },
                { id: 7, title: "Soldado da Vitória", days: 75, nextDays: 100, image: "/avatar-soldado-vitoria.webp", seed: "soldier", size: "w-48 h-48" },
                { id: 8, title: "Guerreiro do Futuro", days: 100, nextDays: 130, image: "/avatar-guerreiro-futuro.webp", seed: "future", size: "w-48 h-48" },
                { id: 9, title: "Rei dos Relâmpagos", days: 130, nextDays: 165, image: "/avatar-soldado-relampago.webp", seed: "lightning", size: "w-48 h-48" },
                { id: 10, title: "Super Arcanjo", days: 165, nextDays: 200, image: "/avatar-super-arcanjo.webp", seed: "archangel", size: "w-48 h-48" },
                { id: 11, title: "Prateado da Coragem", days: 200, nextDays: 300, image: "/avatar-prateado-coragem.webp", seed: "silver", size: "w-48 h-48" },
                { id: 12, title: "Titã Cósmico", days: 300, nextDays: undefined, image: "/avatar-titan-cosmico.webp", seed: "titan", size: "w-48 h-48" }
              ].map((avatar) => (
                <Card
                  key={avatar.id}
                  className={`backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] ${
                    isCurrentCard(avatar.days, avatar.nextDays)
                      ? 'bg-background/5 border-primary/30'
                      : isCardActive(avatar.days)
                        ? 'bg-background/3 border-green-500/30'
                        : 'bg-background/1 border-border/10 opacity-40 hover:opacity-50'
                  }`}
                  style={{
                    background: isCurrentCard(avatar.days, avatar.nextDays)
                      ? 'linear-gradient(135deg, rgba(0, 246, 255, 0.1) 0%, rgba(0, 5, 21, 0.8) 100%)'
                      : isCardActive(avatar.days)
                        ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(0, 5, 21, 0.8) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 5, 21, 0.4) 100%)',
                    borderColor: isCurrentCard(avatar.days, avatar.nextDays)
                      ? 'rgba(0, 246, 255, 0.3)'
                      : isCardActive(avatar.days)
                        ? 'rgba(0, 255, 0, 0.3)'
                        : 'rgba(255, 255, 255, 0.08)'
                  }}
                  data-testid={`avatar-card-${avatar.id}`}
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <h3 className={`text-xl font-bold ${
                        isCurrentCard(avatar.days, avatar.nextDays) ? 'text-foreground' :
                        isCardActive(avatar.days) ? 'text-green-400' : 'text-foreground/60'
                      }`}>
                        {avatar.title}
                      </h3>

                      <div className="relative">
                        <img
                          src={avatar.image}
                          alt={avatar.title}
                          className={`${avatar.size} rounded-xl object-contain ${
                            isCurrentCard(avatar.days, avatar.nextDays) ? '' :
                            isCardActive(avatar.days) ? 'opacity-100' : 'opacity-60'
                          }`}
                          style={{ aspectRatio: '1 / 1' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatar.seed}&backgroundColor=000515`;
                          }}
                          data-testid={`${avatar.seed}-avatar`}
                        />

                        {isCardActive(avatar.days) && !isCurrentCard(avatar.days, avatar.nextDays) && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        )}
                      </div>

                      <div className={`px-4 py-2 rounded-full border ${
                        isCurrentCard(avatar.days, avatar.nextDays) ? 'bg-primary/20 text-primary border-primary/30' :
                        isCardActive(avatar.days) ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        'bg-border/5 text-foreground/20 border-border/10'
                      }`}>
                        <span className="text-sm font-semibold">{avatar.days} DIAS</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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