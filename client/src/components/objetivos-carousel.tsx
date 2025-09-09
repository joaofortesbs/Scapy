
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Target, Check } from 'lucide-react';

interface Objetivo {
  id: string;
  texto: string;
  concluido: boolean;
}

export default function ObjetivosCarousel() {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Carregar objetivos do localStorage
  useEffect(() => {
    const loadObjetivos = () => {
      try {
        const savedObjetivos = localStorage.getItem('userObjetivos');
        if (savedObjetivos) {
          const parsedObjetivos = JSON.parse(savedObjetivos);
          setObjetivos(parsedObjetivos);
          setIsVisible(parsedObjetivos.length > 0);
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Erro ao carregar objetivos:', error);
        setIsVisible(false);
      }
    };

    // Carregar objetivos inicialmente
    loadObjetivos();

    // Listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userObjetivos') {
        loadObjetivos();
      }
    };

    // Listener customizado para atualizações dentro da mesma aba
    const handleCustomStorageChange = () => {
      loadObjetivos();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('objetivosUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('objetivosUpdated', handleCustomStorageChange);
    };
  }, []);

  // Se não há objetivos, não renderizar o componente
  if (!isVisible || objetivos.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md mt-6" data-testid="objetivos-carousel">
      <div className="mb-3 flex items-center space-x-2 px-2">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-white">Seus Objetivos</h3>
      </div>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {objetivos.map((objetivo) => (
            <CarouselItem key={objetivo.id} className="pl-2 md:pl-4 basis-4/5">
              <Card 
                className={`border-2 rounded-3xl transition-all duration-300 ${
                  objetivo.concluido 
                    ? 'bg-green-500/10 border-green-500/50 backdrop-blur-md' 
                    : 'bg-blue-500/10 border-blue-500/30 backdrop-blur-md hover:bg-blue-500/20'
                }`}
                style={{ backgroundColor: 'rgba(0, 5, 21, 0.8)' }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Checkbox visual */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      objetivo.concluido
                        ? 'bg-green-500 border-green-500'
                        : 'border-blue-400'
                    }`}>
                      {objetivo.concluido && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Texto do objetivo */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-relaxed ${
                        objetivo.concluido
                          ? 'line-through text-green-200/80'
                          : 'text-white'
                      }`}>
                        {objetivo.texto}
                      </p>
                    </div>
                  </div>

                  {/* Indicador de status */}
                  <div className={`mt-3 text-xs font-medium ${
                    objetivo.concluido 
                      ? 'text-green-400' 
                      : 'text-blue-400'
                  }`}>
                    {objetivo.concluido ? '✅ Concluído' : '🎯 Em andamento'}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Botões de navegação só aparecem se há mais de um objetivo */}
        {objetivos.length > 1 && (
          <>
            <CarouselPrevious className="left-0 bg-white/10 border-white/20 hover:bg-white/20 text-white" />
            <CarouselNext className="right-0 bg-white/10 border-white/20 hover:bg-white/20 text-white" />
          </>
        )}
      </Carousel>

      {/* Contador de objetivos */}
      <div className="mt-3 text-center">
        <p className="text-xs text-white/70">
          {objetivos.filter(obj => obj.concluido).length} de {objetivos.length} objetivos concluídos
        </p>
        
        {/* Barra de progresso */}
        <div className="mt-2 w-full bg-white/20 rounded-full h-1">
          <div
            className="bg-gradient-to-r from-blue-400 to-green-400 h-1 rounded-full transition-all duration-500"
            style={{
              width: `${(objetivos.filter(obj => obj.concluido).length / objetivos.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}
