// ============================================
// SISTEMA SUPER ROBUSTO PARA IMAGEM DE PERFIL
// Sistema de persistência ultra-resiliente
// ============================================

import { useState, useEffect } from 'react';

interface User {
  id?: string;
  username?: string;
  full_name?: string;
  fullName?: string;
  profileImage?: string;
}

interface ProfileImageData {
  imageBase64: string;
  timestamp: number;
  userId: string;
  version: string;
  lastModified: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
  };
  fileInfo?: {
    size: number;
    type: string;
    originalName?: string;
  };
}

export function useProfileImage(user: User | undefined | null) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Função para salvar imagem com sistema super robusto
  const saveImageToLocalStorage = (base64Data: string, fileInfo?: { size: number; type: string; originalName?: string }) => {
    if (!user?.id) {
      console.error('❌ [ProfileImage] Usuário inválido para salvar imagem');
      return false;
    }

    try {
      const timestamp = Date.now();
      
      const robustImageData: ProfileImageData = {
        imageBase64: base64Data,
        timestamp,
        userId: user.id.toString(),
        version: '2.0',
        lastModified: new Date().toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        },
        fileInfo
      };

      // Salvar em múltiplas chaves para máxima redundância
      const primaryKey = `scapy_profile_image_${user.id}`;
      const legacyKey = `profileImage_${user.id}`; // Compatibilidade
      
      localStorage.setItem(primaryKey, JSON.stringify(robustImageData));
      localStorage.setItem(legacyKey, base64Data); // Chave de compatibilidade
      
      // Backup por data
      const dateKey = new Date().toISOString().split('T')[0];
      const backupKey = `scapy_profile_backup_${user.id}_${dateKey}`;
      localStorage.setItem(backupKey, JSON.stringify(robustImageData));
      
      // Atualizar dados do usuário também
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.profileImage = base64Data;
        userData.lastImageUpdate = new Date().toISOString();
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      setImageUrl(base64Data);
      
      console.log(`💾 [ProfileImage] Imagem salva com sucesso para usuário ${user.id} (${fileInfo ? (fileInfo.size / 1024).toFixed(2) + 'KB' : 'N/A'})`);
      
      // Disparar evento customizado para sincronização
      const profileImageEvent = new CustomEvent('profileImageUpdated', {
        detail: {
          userId: user.id,
          timestamp,
          imageSize: fileInfo?.size || 0,
          imageType: fileInfo?.type || 'unknown'
        }
      });
      window.dispatchEvent(profileImageEvent);
      
      return true;
      
    } catch (error) {
      console.error('❌ [ProfileImage] Erro ao salvar imagem:', error);
      return false;
    }
  };

  // Função para carregar imagem com sistema super robusto
  const loadProfileImageRobust = () => {
    if (!user?.id) {
      setImageUrl('');
      return;
    }

    setIsLoading(true);
    
    try {
      const seedName = user.full_name || user.fullName || user.username || 'user';
      const defaultImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seedName)}&backgroundColor=000515`;
      
      console.log(`🔍 [ProfileImage] Carregando imagem para usuário ${user.id}`);
      
      // Tentar carregar da chave robusta primeiro
      const primaryKey = `scapy_profile_image_${user.id}`;
      const robustData = localStorage.getItem(primaryKey);
      
      if (robustData) {
        const parsed: ProfileImageData = JSON.parse(robustData);
        if (parsed.imageBase64 && parsed.imageBase64.startsWith('data:')) {
          console.log(`📖 [ProfileImage] Imagem carregada (versão robusta) - ${(parsed.fileInfo?.size || 0 / 1024).toFixed(2)}KB`);
          setImageUrl(parsed.imageBase64);
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback para chave de compatibilidade
      const legacyKey = `profileImage_${user.id}`;
      const legacyData = localStorage.getItem(legacyKey);
      
      if (legacyData && legacyData.startsWith('data:')) {
        console.log(`📖 [ProfileImage] Imagem carregada (modo compatibilidade)`);
        setImageUrl(legacyData);
        setIsLoading(false);
        
        // Migrar para formato robusto
        saveImageToLocalStorage(legacyData);
        return;
      }
      
      // Fallback para dados do usuário
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.profileImage && userData.profileImage.startsWith('data:')) {
          console.log(`📖 [ProfileImage] Imagem encontrada nos dados do usuário`);
          setImageUrl(userData.profileImage);
          setIsLoading(false);
          
          // Migrar para formato robusto
          saveImageToLocalStorage(userData.profileImage);
          return;
        }
      }
      
      // Avatar padrão
      console.log(`⚠️ [ProfileImage] Nenhuma imagem encontrada, usando avatar padrão`);
      setImageUrl(defaultImage);
      
    } catch (error) {
      console.error('❌ [ProfileImage] Erro ao carregar imagem:', error);
      const seedName = user.full_name || user.fullName || user.username || 'user';
      const defaultImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seedName)}&backgroundColor=000515`;
      setImageUrl(defaultImage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileImageRobust();
  }, [user?.id, user?.profileImage]);

  // Escutar mudanças do localStorage de outras abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `scapy_profile_image_${user?.id}` || e.key === `profileImage_${user?.id}`) {
        console.log('🔄 [ProfileImage] Detectada mudança em outra aba, recarregando imagem...');
        loadProfileImageRobust();
      }
    };

    // Listener para eventos customizados (mesma aba)
    const handleCustomImageChange = () => {
      loadProfileImageRobust();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileImageUpdated', handleCustomImageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileImageUpdated', handleCustomImageChange);
    };
  }, [user?.id]);

  return { imageUrl, isLoading, saveImageToLocalStorage };
}