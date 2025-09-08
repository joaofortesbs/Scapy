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
 * A file upload component that renders as a button for direct file uploads.
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
      // Get upload parameters (presigned URL)
      const uploadParams = await onGetUploadParameters();
      
      // Upload file directly to object storage
      const uploadResponse = await fetch(uploadParams.url, {
        method: uploadParams.method,
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      // Call completion callback with the upload URL
      if (onComplete) {
        onComplete({ uploadURL: uploadParams.url });
      }

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploading(false);
      // Clear the input so the same file can be uploaded again if needed
      event.target.value = '';
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
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
      ) : (
        children
      )}
    </Button>
  );
}