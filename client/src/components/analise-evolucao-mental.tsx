
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function AnaliseEvolucaoMental() {
  // Para novos usuários, começamos com 0%
  const evolutionPercentage = 0;

  return (
    <section className="mb-6">
      <Card className="border-border rounded-3xl" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Ícone de cérebro no canto esquerdo */}
            <div className="flex-shrink-0">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            
            {/* Texto "Evolução Mental" */}
            <div className="flex-shrink-0">
              <span className="text-sm font-medium text-foreground">Evolução Mental</span>
            </div>
            
            {/* Barra de progresso */}
            <div className="flex-1 mx-3">
              <Progress 
                value={evolutionPercentage} 
                className="h-2 bg-secondary/30"
              />
            </div>
            
            {/* Porcentagem */}
            <div className="flex-shrink-0">
              <span className="text-sm font-medium text-primary">{evolutionPercentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
