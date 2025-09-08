import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Progress } from '@/components/ui/progress';
import QuadroDosSonhos from '@/components/QuadroDosSonhos';
import ParticlesBackground from '@/components/particles-background';

export default function MelhorVersao() {
  // Para novos usuários, começamos com 0% - pode ser conectado com dados reais depois
  const evolutionPercentage = 25; // Exemplo: 25% = primeira fase (Consciência) completa

  // Definir as 4 fases da evolução
  const fases = ['Consciência', 'Controle', 'Consistência', 'Liberdade'];
  
  // Calcular qual fase atual baseada na porcentagem
  const faseAtual = Math.floor(evolutionPercentage / 25);
  const progressoNaFase = (evolutionPercentage % 25) * 4; // Converte para progresso de 0-100% na fase atual

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Fundo com partículas igual ao painel */}
      <ParticlesBackground isDarkTheme={true} className="fixed inset-0 z-0" />
      
      <div className="relative z-10">
        {/* Header com botão voltar */}
        <div className="flex items-center p-4 border-b border-border">
          <Link href="/dashboard">
            <button className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          </Link>
          <div className="w-16"></div> {/* Spacer para centralizar o título */}
        </div>

        {/* Container da Barra de Progresso */}
        <div className="p-4 mb-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-primary mb-2">
              Você já está {evolutionPercentage}% na sua jornada de evolução
            </h2>
            <p className="text-sm text-muted-foreground">
              Continue evoluindo e alcance sua melhor versão
            </p>
          </div>

          {/* Barra de progresso dividida em 4 partes */}
          <div className="relative">
            <Progress 
              value={evolutionPercentage} 
              className="h-6 bg-secondary/30 border border-border"
            />
            
            {/* Labels das fases */}
            <div className="flex justify-between mt-3 px-1">
              {fases.map((fase, index) => {
                const isCompleted = evolutionPercentage > (index * 25);
                const isCurrent = faseAtual === index;
                
                return (
                  <div key={fase} className="flex flex-col items-center">
                    <div 
                      className={`w-3 h-3 rounded-full border-2 mb-1 ${
                        isCompleted 
                          ? 'bg-primary border-primary' 
                          : isCurrent 
                          ? 'bg-primary/50 border-primary' 
                          : 'bg-secondary border-border'
                      }`}
                    />
                    <span 
                      className={`text-xs font-medium text-center ${
                        isCompleted || isCurrent 
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {fase}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Setas entre as fases */}
            <div className="absolute top-7 left-0 right-0 flex justify-between px-6">
              {fases.slice(0, -1).map((_, index) => (
                <span key={index} className="text-muted-foreground text-sm">→</span>
              ))}
            </div>
          </div>
        </div>

        {/* Container do Quadro dos Sonhos */}
        <div className="px-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-center mb-2">
              Quadro dos Sonhos
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Adicione imagens que representam seus objetivos e sonhos
            </p>
          </div>
          
          <QuadroDosSonhos />
        </div>
      </div>
    </div>
  );
}