
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";
import ParticlesBackground from "@/components/particles-background";

export default function Ranking() {
  const [, setLocation] = useLocation();

  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };

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
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <Trophy className="w-20 h-20 text-primary" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              Seu momento atual
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
