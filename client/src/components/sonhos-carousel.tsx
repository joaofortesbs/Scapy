import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

export default function SonhosCarousel() {
  const [images, setImages] = useState<(string | null)[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Plugin de autoplay para carrossel automático
  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: false })
  );

  // Carregar imagens do localStorage
  useEffect(() => {
    const loadImages = () => {
      try {
        const savedImages = localStorage.getItem('quadroDosSonhosImages');
        if (savedImages) {
          const parsedImages = JSON.parse(savedImages);
          // Filtrar apenas as imagens que não são null
          const validImages = parsedImages.filter((img: string | null) => img !== null);
          setImages(validImages);
          setIsVisible(validImages.length > 0);
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Erro ao carregar imagens dos sonhos:', error);
        setIsVisible(false);
      }
    };

    // Carregar imagens inicialmente
    loadImages();

    // Listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'quadroDosSonhosImages') {
        loadImages();
      }
    };

    // Listener customizado para atualizações dentro da mesma aba
    const handleCustomStorageChange = () => {
      loadImages();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sonhosUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sonhosUpdated', handleCustomStorageChange);
    };
  }, []);

  // Se não há imagens, não renderizar o componente
  if (!isVisible || images.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md mt-6" data-testid="sonhos-carousel">
      <div className="mb-3 flex justify-center px-2">
        <h3 className="text-lg font-semibold text-white text-center">Seus sonhos...</h3>
      </div>

      <Carousel
        plugins={[autoplayPlugin.current]}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {images.map((image, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 basis-4/5">
              <Card
                className="border-2 rounded-3xl transition-all duration-300 ai-assistant-card-natural-3d border-border backdrop-blur-md"
                style={{ backgroundColor: '#000515' }}
              >
                <CardContent className="p-2">
                  <div className="flex items-center justify-center">
                    {/* Imagem do sonho */}
                    <div className="w-full h-96 sm:h-[26rem] rounded-xl overflow-hidden">
                      <img
                        src={image}
                        alt={`Sonho ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}