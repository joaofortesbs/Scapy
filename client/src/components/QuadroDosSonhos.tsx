import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

export default function QuadroDosSonhos() {
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null]);

  // ============================================
  // SISTEMA DE PERSISTÊNCIA SUPER ROBUSTA PARA QUADRO DOS SONHOS
  // ============================================

  const saveImagesToLocalStorage = (imagesData: (string | null)[]) => {
    try {
      const timestamp = Date.now();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || 'unknown';
      
      const robustData = {
        images: imagesData,
        timestamp,
        userId,
        version: '2.0',
        totalImages: imagesData.filter(img => img !== null).length,
        lastModified: new Date().toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      };
      
      // Salvar em múltiplas chaves para máxima redundância
      localStorage.setItem('scapy_quadro_sonhos', JSON.stringify(robustData));
      localStorage.setItem('quadroDosSonhosImages', JSON.stringify(imagesData)); // Compatibilidade
      
      // Backup específico por usuário e data
      const dateKey = new Date().toISOString().split('T')[0];
      localStorage.setItem(`scapy_sonhos_backup_${userId}_${dateKey}`, JSON.stringify(robustData));
      
      console.log(`💾 [QuadroDosSonhos] ${robustData.totalImages} imagens salvas para usuário ${userId} com timestamp ${timestamp}`);
      
      // Disparar evento de sincronização
      const dreamEvent = new CustomEvent('quadroSonhosUpdated', {
        detail: {
          images: imagesData,
          totalImages: robustData.totalImages,
          userId,
          timestamp,
          action: 'update'
        }
      });
      window.dispatchEvent(dreamEvent);
      
    } catch (error) {
      console.error('❌ [QuadroDosSonhos] Erro ao salvar imagens:', error);
    }
  };

  const loadImagesFromLocalStorage = () => {
    try {
      // Tentar carregar da chave robusta primeiro
      const robustData = localStorage.getItem('scapy_quadro_sonhos');
      if (robustData) {
        const parsed = JSON.parse(robustData);
        if (parsed.images && Array.isArray(parsed.images)) {
          console.log(`📖 [QuadroDosSonhos] ${parsed.totalImages || 0} imagens carregadas (versão robusta)`);
          return parsed.images;
        }
      }
      
      // Fallback para compatibilidade
      const legacyData = localStorage.getItem('quadroDosSonhosImages');
      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        if (Array.isArray(parsed)) {
          const totalImages = parsed.filter(img => img !== null).length;
          console.log(`📖 [QuadroDosSonhos] ${totalImages} imagens carregadas (modo compatibilidade)`);
          return parsed;
        }
      }
    } catch (error) {
      console.error('❌ [QuadroDosSonhos] Erro ao carregar imagens:', error);
    }
    return [null, null, null, null]; // Array padrão
  };

  // Carregar imagens do localStorage ao inicializar
  useEffect(() => {
    const loadedImages = loadImagesFromLocalStorage();
    setImages(loadedImages);
    
    const totalImages = loadedImages.filter(img => img !== null).length;
    console.log(`🚀 [QuadroDosSonhos] Componente inicializado com ${totalImages} imagens`);
  }, []);

  // Salvar imagens no localStorage sempre que mudarem
  useEffect(() => {
    if (images.length > 0) {
      saveImagesToLocalStorage(images);
    }
  }, [images]);

  // Escutar mudanças do localStorage de outras abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'scapy_quadro_sonhos' || e.key === 'quadroDosSonhosImages') {
        console.log('🔄 [QuadroDosSonhos] Detectada mudança em outra aba, sincronizando imagens...');
        const newImages = loadImagesFromLocalStorage();
        setImages(newImages);
      }
    };

    // Listener para eventos customizados (mesma aba)
    const handleCustomImageChange = () => {
      const currentImages = loadImagesFromLocalStorage();
      setImages(currentImages);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('quadroSonhosUpdated', handleCustomImageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('quadroSonhosUpdated', handleCustomImageChange);
    };
  }, []);

  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validação de arquivo
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      if (file.size > maxSize) {
        console.warn(`⚠️ [QuadroDosSonhos] Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: 5MB`);
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        console.warn(`⚠️ [QuadroDosSonhos] Tipo de arquivo não suportado: ${file.type}`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImages = [...images];
        const imageData = e.target?.result as string;
        newImages[index] = imageData;
        setImages(newImages);
        
        console.log(`🖼️ [QuadroDosSonhos] Imagem adicionada na posição ${index + 1}: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
        
        // Disparar evento específico de adição de imagem
        const addImageEvent = new CustomEvent('imagemAdicionada', {
          detail: {
            index,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(addImageEvent);
      };
      
      reader.onerror = (error) => {
        console.error('❌ [QuadroDosSonhos] Erro ao carregar imagem:', error);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const imageRemovida = images[index];
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
    
    console.log(`🗑️ [QuadroDosSonhos] Imagem removida da posição ${index + 1}`);
    
    // Disparar evento específico de remoção de imagem
    const removeImageEvent = new CustomEvent('imagemRemovida', {
      detail: {
        index,
        imagemRemovida,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(removeImageEvent);
  };

  const cardRotations = [
    '-rotate-12', // 30° para esquerda
    'rotate-12', // 45° para direita
    '-rotate-6', // leve inclinação para esquerda
    'rotate-6'   // leve inclinação para direita
  ];

  const cardColors = [
    'bg-gradient-to-br from-teal-100 to-cyan-200',
    'bg-gradient-to-br from-blue-100 to-cyan-200', 
    'bg-gradient-to-br from-purple-100 to-violet-200',
    'bg-gradient-to-br from-green-100 to-emerald-200'
  ];

  return (
    <div className="w-full flex items-center justify-center py-4 mt-6 pl-4">
      {/* Container dos cards - Layout otimizado para mobile */}
      <div className="grid grid-cols-2 gap-1 sm:gap-2 w-full max-w-xs sm:max-w-sm">
        {images.map((image, index) => (
          <div
            key={index}
            className={`
              relative w-32 h-40 sm:w-36 sm:h-44 ${cardRotations[index]} 
              transform-gpu transition-all duration-300 active:scale-95 sm:hover:scale-110 
              shadow-2xl active:shadow-xl sm:hover:shadow-3xl touch-manipulation
            `}
            style={{
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))'
            }}
          >
            {/* Card */}
            <div className={`
              w-full h-full rounded-xl ${cardColors[index]}
              border-3 border-white p-1 flex flex-col items-center justify-center
              relative overflow-hidden
            `}>
              {image ? (
                <>
                  {/* Imagem carregada */}
                  <img
                    src={image}
                    alt={`Sonho ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg sm:rounded-xl opacity-100"
                    style={{ opacity: 1 }}
                  />
                  {/* Botão remover - Design melhorado */}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-gradient-to-br from-red-400 to-red-600 text-white rounded-full p-1 hover:from-red-500 hover:to-red-700 active:scale-90 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation border border-white backdrop-blur-sm group"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                  >
                    <X size={12} className="group-hover:rotate-90 transition-transform duration-200 stroke-2" />
                  </button>
                </>
              ) : (
                <>
                  {/* Área de upload - Otimizada para mobile */}
                  <label 
                    htmlFor={`upload-${index}`}
                    className="cursor-pointer flex flex-col items-center justify-center h-full w-full active:bg-white active:bg-opacity-30 sm:hover:bg-white sm:hover:bg-opacity-30 rounded-lg sm:rounded-xl transition-all touch-manipulation"
                  >
                    <Upload size={24} className="text-gray-500 mb-1 sm:mb-2 sm:w-8 sm:h-8" />
                    <p className="text-gray-600 text-center text-xs sm:text-sm font-medium leading-tight">
                      Toque para<br />adicionar
                    </p>
                  </label>
                  <input
                    id={`upload-${index}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(index, e)}
                    className="hidden"
                  />
                </>
              )}

              {/* Número do card */}
              <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-white bg-opacity-70 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-700">
                {index + 1}
              </div>
            </div>

            {/* Efeito de brilho */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-transparent via-white to-transparent opacity-20 pointer-events-none"></div>
          </div>
        ))}
      </div>
    </div>
  );
}