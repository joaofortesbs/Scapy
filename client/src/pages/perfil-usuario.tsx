import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Camera, Award, TrendingUp } from "lucide-react";

interface ProfileUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastLogin: string;
  profileImage?: string;
}

interface UserProfileProps {
  user: ProfileUser;
  onBack: () => void;
}

export default function PerfilUsuario({ user, onBack }: UserProfileProps) {
  const [profileImage, setProfileImage] = useState<string | null>(user.profileImage || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // TODO: Implementar upload para object storage
    console.log('Upload de imagem:', file);
    
    // Simular upload por enquanto
    setTimeout(() => {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
      setIsUploading(false);
    }, 1000);
  };

  const handleProgressCardClick = () => {
    // Mesmo efeito do card de Assistente IA
    console.log('Visualizar Card de Progresso clicado');
    // TODO: Implementar modal ou expansão do card
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden"
    >
      <div className="relative z-10">
        {/* Header com botão de voltar */}
        <header className="flex items-center justify-between p-4 border-b border-border/20">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
            data-testid="button-voltar-painel"
          >
            <span>←</span>
            <span>Voltar</span>
          </button>
          <h1 className="text-lg font-semibold text-primary">Meu Perfil</h1>
          <div className="w-16"></div> {/* Spacer para centralizar o título */}
        </header>

        <main className="flex-1 px-6 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-center mb-8"
          >
            {/* Imagem de perfil */}
            <div className="relative inline-block mb-4">
              <div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 relative overflow-hidden"
                data-testid="profile-image-container"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-16 h-16 text-primary/60" />
                )}
                
                {/* Overlay para upload */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                
                {/* Input file invisível */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  data-testid="input-upload-profile-image"
                />
              </div>
              
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Nome do usuário */}
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {user.fullName}
            </h2>
            <p className="text-muted-foreground text-sm">
              {user.email}
            </p>
          </motion.div>

          {/* Botão Visualizar Card de Progresso */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6"
          >
            <button
              onClick={handleProgressCardClick}
              className="w-full bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 border border-primary/30 rounded-xl p-4 transition-all duration-200 hover:scale-105"
              data-testid="button-visualizar-card-progresso"
            >
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">
                  Visualizar Card de Progresso
                </span>
              </div>
            </button>
          </motion.div>

          {/* Card Recordes e Scapys */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-card border border-border/20 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Award className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-card-foreground">
                Recordes e Scapys
              </h3>
            </div>

            <div className="space-y-4">
              {/* Recorde atual */}
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                <span className="text-muted-foreground">Recorde Atual:</span>
                <span className="font-bold text-primary">7 dias</span>
              </div>

              {/* Melhor recorde */}
              <div className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
                <span className="text-muted-foreground">Melhor Recorde:</span>
                <span className="font-bold text-secondary">14 dias</span>
              </div>

              {/* Total de Scapys */}
              <div className="flex justify-between items-center p-3 bg-accent/10 rounded-lg">
                <span className="text-muted-foreground">Total Scapys:</span>
                <span className="font-bold text-accent">42 dias</span>
              </div>

              {/* Data de início da jornada */}
              <div className="flex justify-between items-center p-3 bg-muted/10 rounded-lg">
                <span className="text-muted-foreground">Jornada iniciada:</span>
                <span className="font-medium text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}