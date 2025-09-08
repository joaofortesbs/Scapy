import { useState, useEffect } from 'react';

import { User as SchemaUser } from '@shared/schema';

interface User {
  id?: string;
  username?: string;
  fullName?: string;
  full_name?: string;
  profileImage?: string;
}

export function useProfileImage(user: User | undefined | null) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProfileImage = () => {
      if (!user) {
        setImageUrl('');
        return;
      }

      // Fallback padrão usando fullName/full_name se disponível
      const seedName = user.fullName || user.full_name || user.username || 'user';
      const defaultImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seedName)}&backgroundColor=000515`;

      try {
        // ========== SISTEMA 100% OFFLINE - SÓ LOCALSTORAGE! ==========
        console.log('🔍 Carregando imagem do localStorage para usuário:', user.id);
        
        // Verificar se temos uma imagem Base64 salva localmente
        const localImageKey = `profileImage_${user.id}`;
        const localImageData = localStorage.getItem(localImageKey);
        
        if (localImageData) {
          console.log('✅ Imagem encontrada no localStorage!');
          setImageUrl(localImageData);
          return;
        }

        // Fallback: verificar dados do usuário no localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Se tem profileImage que começa com "data:" (Base64)
          if (userData.profileImage && userData.profileImage.startsWith('data:')) {
            console.log('✅ Imagem Base64 encontrada nos dados do usuário!');
            setImageUrl(userData.profileImage);
            // Salvar na chave específica também
            localStorage.setItem(localImageKey, userData.profileImage);
            return;
          }
        }

        // Se não encontrou nada, usar avatar padrão
        console.log('⚠️ Nenhuma imagem local encontrada, usando avatar padrão');
        setImageUrl(defaultImage);

      } catch (localStorageError) {
        console.log('⚠️ Erro no localStorage, usando avatar padrão:', localStorageError);
        setImageUrl(defaultImage);
      }
    };

    loadProfileImage();
  }, [user?.id, user?.profileImage, user?.username]);

  // Função para salvar imagem Base64 no localStorage
  const saveImageToLocalStorage = (base64Data: string) => {
    if (user?.id) {
      const localImageKey = `profileImage_${user.id}`;
      localStorage.setItem(localImageKey, base64Data);
      console.log('💾 Imagem salva no localStorage:', localImageKey);
      
      // Atualizar também os dados do usuário
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.profileImage = base64Data;
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('💾 Dados do usuário atualizados com imagem Base64');
      }
      
      // Atualizar imagem imediatamente
      setImageUrl(base64Data);
    }
  };

  return { imageUrl, isLoading, saveImageToLocalStorage };
}