import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { uploadURL: string }) => void;
  buttonClassName?: string;
  children: ReactNode;
  disabled?: boolean;
  accept?: string;
}

/**
 * A file upload component that uploads files directly to object storage
 * using presigned URLs.
 */
export function ObjectUploader({
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  disabled = false,
  accept = "image/*"
}: ObjectUploaderProps) {
  const [uploading, setUploading] = useState(false);

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
      console.log('📤 Obtendo URL de upload...');
      
      // Get presigned URL from backend
      const { url: uploadURL } = await onGetUploadParameters();
      
      console.log('✅ URL de upload obtida');
      console.log('📤 Fazendo upload da imagem...');

      // Upload file directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload da imagem');
      }

      // Extract the public URL from the presigned URL (remove query parameters)
      const publicURL = uploadURL.split('?')[0];
      
      console.log('✅ Upload concluído! URL pública:', publicURL);

      // Call completion callback with the public URL
      if (onComplete) {
        onComplete({ uploadURL: publicURL });
      }

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
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
          <span>Enviando...</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
