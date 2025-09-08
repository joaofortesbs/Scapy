import { useState, useEffect } from 'react';

interface User {
  id?: string;
  username?: string;
  profileImage?: string;
}

export function useProfileImage(user: User | undefined | null) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProfileImage = async () => {
      if (!user) {
        setImageUrl('');
        return;
      }

      // Fallback padrão
      const defaultImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || 'user'}&backgroundColor=000515`;

      // Se não tem profileImage definida, usar padrão
      if (!user.profileImage) {
        setImageUrl(defaultImage);
        return;
      }

      setIsLoading(true);

      try {
        // ========== PRIMEIRO: TENTAR CARREGAR DO SERVIDOR ==========
        const response = await fetch(user.profileImage);
        
        if (response.ok) {
          // Se conseguiu carregar do servidor, usar a URL original
          setImageUrl(user.profileImage);
        } else {
          throw new Error('Servidor não conseguiu carregar a imagem');
        }
      } catch (serverError) {
        console.log('⚠️ Servidor falhou, tentando localStorage...');
        
        try {
          // ========== FALLBACK: CARREGAR DO LOCALSTORAGE ==========
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            
            // Verificar se temos uma imagem salva localmente
            const localImageKey = `profileImage_${user.id}`;
            const localImageData = localStorage.getItem(localImageKey);
            
            if (localImageData) {
              // Se temos dados da imagem no localStorage, usar
              setImageUrl(localImageData);
            } else if (userData.profileImage && userData.profileImage !== user.profileImage) {
              // Se tem uma versão diferente no localStorage, tentar essa
              try {
                const localResponse = await fetch(userData.profileImage);
                if (localResponse.ok) {
                  setImageUrl(userData.profileImage);
                } else {
                  setImageUrl(defaultImage);
                }
              } catch {
                setImageUrl(defaultImage);
              }
            } else {
              setImageUrl(defaultImage);
            }
          } else {
            setImageUrl(defaultImage);
          }
        } catch (localStorageError) {
          console.log('⚠️ localStorage também falhou, usando padrão');
          setImageUrl(defaultImage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileImage();
  }, [user?.id, user?.profileImage, user?.username]);

  // Função para salvar imagem no localStorage
  const saveImageToLocalStorage = (imageData: string) => {
    if (user?.id) {
      const localImageKey = `profileImage_${user.id}`;
      localStorage.setItem(localImageKey, imageData);
    }
  };

  return { imageUrl, isLoading, saveImageToLocalStorage };
}