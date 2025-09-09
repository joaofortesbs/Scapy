
import { Brain, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function AnaliseEvolucaoMental() {
  // Para novos usuários, começamos com 0%
  const evolutionPercentage = 0;
  
  // Estados para controlar visibilidade dos itens do checklist
  const [hasQuadroDosSonhos, setHasQuadroDosSonhos] = useState(false);
  const [hasObjetivos, setHasObjetivos] = useState(false);

  // Verificar se existem dados salvos para ocultar os textos
  useEffect(() => {
    const checkQuadroDosSonhos = () => {
      const savedImages = localStorage.getItem('quadroDosSonhosImages');
      if (savedImages) {
        try {
          const parsedImages = JSON.parse(savedImages);
          // Verifica se pelo menos uma imagem foi adicionada
          const hasImages = parsedImages.some((image: string | null) => image !== null);
          setHasQuadroDosSonhos(hasImages);
        } catch (error) {
          console.error('Erro ao verificar quadro dos sonhos:', error);
        }
      }
    };

    const checkObjetivos = () => {
      const savedObjetivos = localStorage.getItem('userObjetivos');
      if (savedObjetivos) {
        try {
          const parsedObjetivos = JSON.parse(savedObjetivos);
          // Verifica se pelo menos um objetivo foi adicionado
          setHasObjetivos(parsedObjetivos.length > 0);
        } catch (error) {
          console.error('Erro ao verificar objetivos:', error);
        }
      }
    };

    // Verificação inicial
    checkQuadroDosSonhos();
    checkObjetivos();

    // Listener para mudanças no localStorage
    const handleStorageChange = () => {
      checkQuadroDosSonhos();
      checkObjetivos();
    };

    // Adicionar listener para mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);

    // Verificar periodicamente (caso a mudança seja na mesma aba)
    const interval = setInterval(() => {
      checkQuadroDosSonhos();
      checkObjetivos();
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
        {!hasQuadroDosSonhos && (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Adicionar quadro dos sonhos</span>
          </div>
        )}
        
        {!hasObjetivos && (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Adicionar objetivos</span>
          </div>
        )}
      </div>
    </section>
  );
}
