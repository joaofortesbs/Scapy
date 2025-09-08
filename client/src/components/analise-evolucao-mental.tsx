
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function AnaliseEvolucaoMental() {
  // Para novos usuários, começamos com 0%
  const evolutionPercentage = 0;

  return (
    <section className="mb-6">
      {/* Card container principal */}
      <Card className="border-border rounded-3xl ai-assistant-card-natural-3d" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            {/* Título da seção */}
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Evolução Mental</h3>
            </div>
            
            {/* Card interno de progresso */}
            <Card className="border-border rounded-full" style={{ backgroundColor: 'rgba(0, 5, 21, 0.5)' }}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {/* Ícone de cérebro no canto esquerdo */}
                  <div className="flex-shrink-0">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  
                  {/* Texto "Evolução Mental" */}
                  <div className="flex-shrink-0">
                    <span className="text-sm font-medium text-foreground">Progresso</span>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="flex-1 mx-3">
                    <Progress 
                      value={evolutionPercentage} 
                      className="h-2 bg-secondary/30 border border-border"
                    />
                  </div>
                  
                  {/* Porcentagem */}
                  <div className="flex-shrink-0">
                    <span className="text-sm font-medium text-primary">{evolutionPercentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
