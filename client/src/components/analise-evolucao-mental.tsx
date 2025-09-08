
import { Brain, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

export default function AnaliseEvolucaoMental() {
  // Para novos usuários, começamos com 0%
  const evolutionPercentage = 0;

  return (
    <section className="mb-6">
      <Link href="/melhor-versao">
        <Card className="border-border rounded-full evolucao-mental-card-natural-3d cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: 'rgba(0, 5, 21, 0.73)' }}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              {/* Ícone de cérebro no canto esquerdo */}
              <div className="flex-shrink-0">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              
              {/* Texto "Evolução Mental" */}
              <div className="flex-shrink-0">
                <span className="text-sm font-medium text-foreground">Evolução Mental</span>
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
      </Link>
      
      {/* Checklist com ícones de + */}
      <div className="mt-4 space-y-3 ml-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">Adicionar quadro dos sonhos</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">Adicionar objetivos</span>
        </div>
      </div>
    </section>
  );
}
