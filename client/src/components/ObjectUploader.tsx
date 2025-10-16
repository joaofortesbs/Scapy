import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxFileSize?: number;
  onComplete?: (result: { uploadURL: string }) => void;
  buttonClassName?: string;
  children: ReactNode;
  disabled?: boolean;
  accept?: string;
}

/**
 * Componente de upload de imagem que converte para Base64 (Data URL)
 * Funciona completamente offline sem necessidade de Object Storage
 */
export function ObjectUploader({
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  onComplete,
  buttonClassName,
  children,
  disabled = false,
  accept = "image/*"
}: ObjectUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      alert(`A imagem deve ter no máximo ${maxSizeMB}MB.`);
      return;
    }

    // Validate file type if image
    if (accept === "image/*" && !file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    setUploading(true);

    try {
      console.log('🔄 Convertendo imagem para Data URL (Base64)...');
      
      // Convert to Base64 Data URL
      const dataURL = await convertToBase64(file);
      
      console.log('✅ Imagem convertida com sucesso!');
      console.log('📏 Tamanho do Data URL:', dataURL.length, 'caracteres');

      // Call completion callback with the Data URL
      if (onComplete) {
        onComplete({ uploadURL: dataURL });
      }

    } catch (error) {
      console.error('Erro ao converter imagem:', error);
      alert('Erro ao processar imagem. Tente novamente.');
    } finally {
      setUploading(false);
      // Clear the input so the same file can be uploaded again if needed
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      handleFileSelect(e as any);
    };
    input.click();
  };

  return (
    <Button 
      onClick={handleClick} 
      className={buttonClassName}
      disabled={disabled || uploading}
    >
      {uploading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          <span>Processando...</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
