import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Progress } from '@/components/ui/progress';
import QuadroDosSonhos from '@/components/QuadroDosSonhos';
import ParticlesBackground from '@/components/particles-background';
import ObjetivosUsuario from "@/components/objetivos-usuario";

export default function MelhorVersao() {
  // Rolar para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

      <div className="relative z-10 pb-20">
        {/* Header com botão voltar - Otimizado para mobile */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <Link href="/dashboard">
            <button className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors p-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          </Link>
        </div>

        {/* Container da Barra de Progresso - Otimizado para mobile */}
        <div className="px-4 py-6 space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-primary leading-tight">
              Você já está {evolutionPercentage}% na sua jornada de evolução
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground px-2">
              Continue evoluindo e alcance sua melhor versão
            </p>
          </div>

          {/* Barra de progresso dividida em 4 partes - Melhorada para mobile */}
          <div className="space-y-4">
            <Progress
              value={evolutionPercentage}
              className="h-4 sm:h-6 bg-secondary/30 border border-border"
            />

            {/* Labels das fases - Layout otimizado para mobile */}
            <div className="grid grid-cols-4 gap-1 px-1">
              {fases.map((fase, index) => {
                const isCompleted = evolutionPercentage > (index * 25);
                const isCurrent = faseAtual === index;

                return (
                  <div key={fase} className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 ${
                        isCompleted
                          ? 'bg-primary border-primary'
                          : isCurrent
                          ? 'bg-primary/50 border-primary'
                          : 'bg-secondary border-border'
                      }`}
                    />
                    <span
                      className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${
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
          </div>
        </div>

        {/* Container do Quadro dos Sonhos - Otimizado para mobile */}
        <div className="px-4">
          {/* Container do componente QuadroDosSonhos com padding ajustado */}
          <div className="w-full">
            <QuadroDosSonhos />
          </div>
          {/* Objetivos do Usuário */}
          <ObjetivosUsuario />

          {/* Seção de Controle de Humor */}
          <section className="mb-8"
            style={{
              marginLeft: '20px'
            }}
          >
          </section>
        </div>
      </div>
    </div>
  );
}