
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DesafioDuplaDinamica() {
  const handleChallengeClick = () => {
    alert("Desafio dupla dinâmica - Em desenvolvimento");
  };

  return (
    <section className="mb-8 relative">
      <div className="w-1/2 relative">
        {/* Ícone de dupla no topo do card */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[30%] z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center border-4" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)', borderColor: 'rgba(0, 5, 21, 0.73)' }}>
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
        </div>

        <Card 
          className="border-border cursor-pointer hover:bg-primary/5 transition-colors duration-200 rounded-3xl pt-6" 
          style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}
          onClick={handleChallengeClick}
          data-testid="dupla-dinamica-challenge-card"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-center min-h-[60px]">
              {/* Conteúdo do card pode ser adicionado aqui futuramente */}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
