
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DesafioPlanoBeamEstar() {
  const handleChallengeClick = () => {
    alert("Desafio plano bem-estar - Em desenvolvimento");
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Erro ao carregar imagem do desafio bem-estar');
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    
    // Criar um elemento de fallback
    const parent = target.parentElement;
    if (parent && !parent.querySelector('.fallback-text')) {
      const fallback = document.createElement('div');
      fallback.className = 'fallback-text text-primary text-sm font-semibold';
      fallback.textContent = '7 DIAS';
      parent.appendChild(fallback);
    }
  };

  return (
    <section className="mb-8 relative challenge-card">
      <div className="relative">
        {/* Ícone de calendário no topo do card */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[30%] z-10">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center border-3" 
            style={{ 
              backgroundColor: 'rgba(0, 5, 21, 0.73)', 
              borderColor: 'rgba(0, 5, 21, 0.73)' 
            }}
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </div>

        <Card 
          className="border-border cursor-pointer hover:bg-primary/5 transition-colors duration-200 rounded-3xl pt-6" 
          style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}
          onClick={handleChallengeClick}
          data-testid="wellness-challenge-card"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-center min-h-[84px]">
              <div className="wellness-challenge-container">
                <img 
                  src="/desafio-bem-estar-7dias.png" 
                  alt="7 Dias Desafio Bem-estar" 
                  className="wellness-challenge-image-display"
                  onError={handleImageError}
                  onLoad={() => console.log('Imagem carregada com sucesso')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
