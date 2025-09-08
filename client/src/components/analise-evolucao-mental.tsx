
import { Brain, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function AnaliseEvolucaoMental() {
  // Para novos usuários, começamos com 0%
  const evolutionPercentage = 0;

  return (
    <section className="mb-6">
      {/* Card externo com bordas arredondadas menores e altura muito maior */}
      <Card className="border-border rounded-3xl p-12" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}>
        <CardContent className="p-0 space-y-6">
          {/* Card original de Evolução Mental com largura aumentada */}
          <Card className="border-border rounded-full evolucao-mental-card-natural-3d w-full" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}>
            <CardContent className="p-6 px-8">
              <div className="flex items-center space-x-6">
                {/* Ícone de cérebro no canto esquerdo */}
                <div className="flex-shrink-0">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                
                {/* Texto "Evolução Mental" */}
                <div className="flex-shrink-0">
                  <span className="text-sm font-medium text-foreground">Evolução Mental</span>
                </div>
                
                {/* Barra de progresso */}
                <div className="flex-1 mx-4">
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

          {/* Checklist com ícones de Plus */}
          <div className="space-y-3 px-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Desenvolva hábitos saudáveis diários</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Fortaleça sua disciplina mental</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Conquiste maior autocontrole</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
