import { useState, useRef, useEffect } from "react"; // Added useEffect import
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Eye, Trophy, RefreshCw, User, BarChart3 } from "lucide-react"; // Added User and BarChart3
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface PerfilUsuarioProps {
  user?: {
    id: string;
    username: string;
    full_name?: string; // Adjusted to match potential Supabase naming
    profileImage?: string;
  };
  onUserUpdate?: (updatedUser: any) => void;
}

export default function PerfilUsuario({ user, onUserUpdate }: PerfilUsuarioProps) {
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [progressCardVisible, setProgressCardVisible] = useState(false);
  const [quizData, setQuizData] = useState<any>(null); // State to hold quiz data
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch quiz data when the component mounts or user changes
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('quiz_contextualizacao') // Assuming this is the table name
          .select('*')
          .eq('user_id', user.id)
          .single(); // Fetch a single record

        if (error && error.message !== 'Result is not a single record') { // Handle case where no record exists
            console.error('Error fetching quiz data:', error);
            setQuizData(null); // Ensure quizData is null if there's an error or no data
        } else {
            setQuizData(data);
        }
      } catch (error) {
        console.error('Unexpected error fetching quiz data:', error);
        setQuizData(null);
      }
    };

    fetchQuizData();
  }, [user?.id]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploading(true);

    try {
      // Fazer upload da imagem para o Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Atualizar o perfil do usuário usando API do servidor
      const response = await fetch('/api/users/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          profileImage: publicUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil no servidor');
      }

      // Atualizar estado local e notificar componente pai
      const updatedUser = { ...user, profileImage: publicUrl };
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      alert('Foto de perfil atualizada com sucesso!');

    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Erro ao atualizar foto de perfil. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleProgressCardClick = () => {
    setProgressCardVisible(!progressCardVisible);
  };

  // Function to refazer quiz
  const handleRefazerQuiz = async () => {
    if (!user?.id) return;

    const confirmRefazer = confirm(
      'Tem certeza que deseja refazer o Quiz de Personalização? Suas respostas anteriores serão substituídas.'
    );

    if (!confirmRefazer) return;

    try {
      // If quiz doesn't exist, create a new one
      if (!quizData) {
        const response = await fetch('/api/quiz/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            userFullName: user.fullName || user.full_name || 'Usuário'
          }),
        });

        if (response.ok) {
          setLocation('/quiz-personalizacao');
        } else {
          alert('Erro ao inicializar o quiz. Tente novamente.');
        }
      } else {
        // Reset the existing quiz
        const response = await fetch('/api/quiz/reset', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        if (response.ok) {
          setLocation('/quiz-personalizacao');
        } else {
          alert('Erro ao resetar o quiz. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro ao processar quiz:', error);
      alert('Erro ao processar o quiz. Tente novamente.');
    }
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
        <header className="p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/dashboard')}
            className="w-10 h-10"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-xl font-semibold text-primary">Perfil</h1>

          <div className="w-10 h-10" /> {/* Spacer */}
        </header>

        <main className="flex-1 px-4 pb-8">
          <div className="space-y-8">
            {/* Seção da imagem de perfil */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-center"
            >
              <div className="relative inline-block mb-4">
                <div className="relative">
                  <img
                    src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}&backgroundColor=000515`}
                    alt="Foto de Perfil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                    data-testid="profile-avatar"
                  />

                  {/* Botão para alterar foto */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-2 right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
                    data-testid="change-photo-button"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="file-input"
                  />
                </div>
              </div>

              {/* Nome do usuário */}
              <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="user-name">
                {user?.fullName || user?.username || 'Usuário'}
              </h2>
            </motion.div>

            {/* Botão Visualizar Card de Progresso */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex justify-center"
            >
              <button
                onClick={handleProgressCardClick}
                className="ai-assistant-card-natural-3d h-12 px-6 rounded-full border border-border text-primary font-medium transition-all duration-300 hover:opacity-80"
                style={{ backgroundColor: '#000515', maxWidth: '280px' }}
                data-testid="progress-card-button"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">Visualizar Card de Progresso</span>
                </div>
              </button>
            </motion.div>

            {/* Card de Progresso (similar ao AI Assistant) */}
            {progressCardVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="gradient-border-card">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Eye className="w-8 h-8 text-primary" />
                      </div>

                      <h3 className="text-xl font-bold text-primary mb-2">
                        Seu Progresso
                      </h3>

                      <p className="text-muted-foreground mb-4">
                        Acompanhe sua evolução na jornada livre da pornografia
                      </p>

                      <div className="space-y-3">
                        <div className="bg-primary/10 rounded-lg p-3">
                          <span className="text-sm text-muted-foreground">Dias limpo</span>
                          <div className="text-2xl font-bold text-primary">0</div>
                        </div>

                        <div className="bg-primary/10 rounded-lg p-3">
                          <span className="text-sm text-muted-foreground">Melhor sequência</span>
                          <div className="text-2xl font-bold text-primary">0</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Card de Recordes e Scapys */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Card className="rounded-3xl border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-center text-foreground mb-4">
                    Recordes e Scapys
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl">
                      <span className="text-sm font-medium text-muted-foreground">Maior sequência</span>
                      <span className="text-lg font-bold text-primary">0 dias</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl">
                      <span className="text-sm font-medium text-muted-foreground">Total de recaídas</span>
                      <span className="text-lg font-bold text-primary">0</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl">
                      <span className="text-sm font-medium text-muted-foreground">Jornada iniciada em</span>
                      <span className="text-lg font-bold text-primary">--/--/----</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl">
                      <span className="text-sm font-medium text-muted-foreground">Pontuação Scapy</span>
                      <span className="text-lg font-bold text-primary">0 pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Novo Card para Quiz de Personalização */}
            {quizData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <Card className="rounded-3xl border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-center text-foreground mb-4">
                      Quiz de Personalização
                    </h3>

                    <div className="space-y-4 text-center">
                      {/* Display quiz information */}
                      {Object.entries(quizData).map(([key, value]) => {
                        // Skip displaying user_id and potentially other internal fields
                        if (key === 'user_id' || key === 'id' || key === 'created_at' || key === 'updated_at') {
                          return null;
                        }
                        return (
                          <div key={key} className="flex flex-col items-center p-3 bg-background/50 rounded-xl">
                            <span className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="text-lg font-bold text-primary">{String(value)}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Botão para refazer o quiz */}
                    <div className="mt-6 flex justify-center">
                      <Button 
                        onClick={handleRefazerQuiz}
                        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refazer Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </motion.div>
  );
}