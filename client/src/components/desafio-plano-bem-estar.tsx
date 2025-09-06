
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DesafioPlanoBeamEstar() {
  const handleChallengeClick = () => {
    alert("Desafio plano bem-estar - Em desenvolvimento");
  };

  return (
    <section className="mb-8 relative challenge-card">
      <div className="relative">
        {/* Ícone de calendário no topo do card */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[30%] z-10">
          <div className="w-12 h-12 rounded-full flex items-center justify-center border-3" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)', borderColor: 'rgba(0, 5, 21, 0.73)' }}>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </div>

        <Card 
          className="border-border cursor-pointer hover:bg-primary/5 transition-colors duration-200 rounded-3xl pt-3" 
          style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}
          onClick={handleChallengeClick}
          data-testid="wellness-challenge-card"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-center min-h-[30px]">
              {/* Conteúdo do card pode ser adicionado aqui futuramente */}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
