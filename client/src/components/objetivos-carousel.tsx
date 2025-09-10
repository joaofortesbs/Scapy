import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface Objetivo {
  id: string;
  texto: string;
  concluido: boolean;
}

export default function ObjetivosCarousel() {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Plugin de autoplay para carrossel automático
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: false })
  );

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
    <div className="w-full max-w-md mt-6 flex flex-col items-center" data-testid="objetivos-carousel">
      <div className="mb-3 flex justify-center px-2">
        <h3 className="text-lg font-semibold text-white text-center">Você prometeu...</h3>
      </div>

      <div className="w-full flex justify-center">
        <Carousel
        plugins={[autoplayPlugin.current]}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="flex justify-center">
          {objetivos.map((objetivo) => (
            <CarouselItem key={objetivo.id} className="basis-4/5 flex justify-center">
              <div className="w-full flex justify-center">
                <Card 
                  className="border-2 rounded-3xl transition-all duration-300 ai-assistant-card-natural-3d border-border backdrop-blur-md w-full max-w-xs"
                  style={{ backgroundColor: '#000515' }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center">
                      {/* Texto do objetivo centralizado */}
                      <p className="text-sm font-medium leading-relaxed text-white text-center">
                        {objetivo.texto}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}