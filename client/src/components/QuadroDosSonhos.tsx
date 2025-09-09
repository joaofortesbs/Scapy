import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function QuadroDosSonhos() {
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null]);

  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImages = [...images];
        newImages[index] = e.target?.result as string;
        setImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const cardRotations = [
    '-rotate-12', // 30° para esquerda
    'rotate-12', // 45° para direita
    '-rotate-6', // leve inclinação para esquerda
    'rotate-6'   // leve inclinação para direita
  ];

  const cardColors = [
    'bg-gradient-to-br from-teal-100 to-emerald-200',
    'bg-gradient-to-br from-blue-100 to-cyan-200', 
    'bg-gradient-to-br from-yellow-100 to-orange-200',
    'bg-gradient-to-br from-green-100 to-emerald-200'
  ];

  return (
    <div className="w-full flex items-center justify-center py-4">
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