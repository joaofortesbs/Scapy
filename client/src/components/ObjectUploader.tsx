import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { uploadURL: string }) => void;
  buttonClassName?: string;
  children: ReactNode;
  disabled?: boolean;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  disabled = false,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxFileSize) {
      alert(`Arquivo muito grande. Tamanho máximo: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    // Check file type (only images for profile)
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens.');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      // Get upload parameters
      const uploadParams = await onGetUploadParameters();
      
      // Upload file
      const uploadResponse = await fetch(uploadParams.url, {
        method: uploadParams.method,
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('Falha no upload');
      }

      // Call completion callback
      onComplete?.({
        uploadURL: uploadParams.url.split('?')[0] // Remove query parameters
      });

      // Reset state
      setSelectedFile(null);
      setPreview(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  if (selectedFile && preview) {
    return (
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 rounded-full object-cover"
          />
          <button
            onClick={handleCancel}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            data-testid="button-cancel-upload"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex space-x-2 justify-center">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading}
            data-testid="button-confirm-upload"
          >
            {isUploading ? 'Uploading...' : 'Confirmar'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="file-upload"
        disabled={disabled || isUploading}
      />
      <label htmlFor="file-upload" className={buttonClassName}>
        {children}
      </label>
    </div>
  );
}