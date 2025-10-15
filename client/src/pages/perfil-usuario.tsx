import { useState, useRef, useEffect } from "react"; // Added useEffect import
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Eye, Trophy, RefreshCw, User, BarChart3, Clock, CheckCircle, Mountain, Users, Calendar, Heart, Zap, Cross, Edit, Save, X } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { motion } from "framer-motion";
import ParticlesBackground from "@/components/particles-background";
import { useProfileImage } from "@/hooks/useProfileImage";

interface PerfilUsuarioProps {
  user?: {
    id: string;
    username: string;
    full_name?: string; // Adjusted to match potential Supabase naming
    fullName?: string; // Alternative naming
    profileImage?: string;
    bestStreak?: number;
    relapseCount?: number;
    startDate?: string;
    scapyPoints?: number;
  };
  onUserUpdate?: (updatedUser: any) => void;
}

export default function PerfilUsuario({ user, onUserUpdate }: PerfilUsuarioProps) {
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [progressCardVisible, setProgressCardVisible] = useState(false);
  const [quizData, setQuizData] = useState<any>(null); // State to hold quiz data
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [currentUser, setCurrentUser] = useState(user);

  // Hook robusto para carregamento de imagem
  const { imageUrl, isLoading: imageLoading, saveImageToLocalStorage } = useProfileImage(currentUser);

  // Carregar dados completos do usuário do localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        
        // Normalizar dados do usuário para garantir consistência
        const normalizedUser = {
          ...userData,
          full_name: userData.full_name || userData.fullName || userData.username || 'Usuário'
        };
        
        console.log('🔍 Dados do usuário carregados:', normalizedUser);
        setCurrentUser(normalizedUser);
        
        // Atualizar localStorage com dados normalizados
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  // Fetch quiz data when the component mounts or user changes
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!currentUser?.id) return;
      try {
        // Buscar dados completos do usuário da nova rota consolidada
        const response = await fetch(`/api/usuarios/${currentUser.id}`);

        if (response.ok) {
          const result = await response.json();
          // Extrair dados do quiz da resposta
          const quiz = {
            genero: result.user.genero,
            frequencia: result.user.frequencia,
            motivacao: result.user.motivacao,
            gatilhos: result.user.gatilhos,
            religiao: result.user.religiao
          };
          setQuizData(quiz);
          console.log('✅ Dados do quiz carregados:', quiz);
        } else if (response.status === 404) {
          // Usuário não encontrado
          setQuizData(null);
        } else {
          console.error('Error fetching quiz data:', response.statusText);
          setQuizData(null);
        }
      } catch (error) {
        console.error('Unexpected error fetching quiz data:', error);
        setQuizData(null);
      }
    };

    fetchQuizData();
  }, [currentUser?.id]);

  const handleUploadComplete = async (result: { uploadURL: string; base64: string }) => {
    if (!currentUser?.id) return;

    try {
      setUploading(true);

      console.log('🎯 SISTEMA 100% OFFLINE - Salvando imagem...');

      // ============ SISTEMA 100% OFFLINE - SÓ LOCALSTORAGE! ============

      // Salvar imagem Base64 no localStorage específico com informações do arquivo
      const fileInfo = {
        size: new Blob([result.base64]).size,
        type: 'image/*',
        originalName: 'profile-image'
      };
      
      saveImageToLocalStorage(result.base64, fileInfo);

      // Atualizar dados do usuário com a imagem Base64
      const updatedUser = { ...currentUser, profileImage: result.base64 };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      // Atualizar estado local imediatamente
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      console.log('✅ Imagem salva com sucesso no localStorage!');
      alert('✅ Foto de perfil atualizada com sucesso!');

    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      alert('Erro ao salvar imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleProgressCardClick = () => {
    setProgressCardVisible(!progressCardVisible);
  };

  const handleEditField = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setEditValue(currentValue);
  };

  const handleSaveEdit = async () => {
    if (!currentUser?.id || !editingField) return;

    try {
      // Mapear nomes dos campos para o formato correto da API
      const fieldMapping: Record<string, string> = {
        'genero': 'gender',
        'idade': 'age',
        'motivacao': 'motivation',
        'frequencia': 'frequency',
        'gatilhos': 'triggers',
        'religiao': 'religion'
      };

      const apiFieldName = fieldMapping[editingField] || editingField;

      const response = await fetch('/api/quiz/save-step', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          stepName: apiFieldName,
          stepValue: editValue
        }),
      });

      if (response.ok) {
        // Atualizar os dados locais
        setQuizData((prev: any) => ({
          ...prev,
          [editingField]: editValue
        }));
        setEditingField(null);
        setEditValue('');
      } else {
        alert('Erro ao salvar a edição. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      alert('Erro ao salvar a edição. Tente novamente.');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Function to refazer quiz
  const handleRefazerQuiz = async () => {
    if (!currentUser?.id) return;

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
            userId: currentUser.id,
            userFullName: currentUser.full_name || currentUser.username || 'Usuário'
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
            userId: currentUser.id,
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

  // Robust function to get user display name
  const getUserDisplayName = () => {
    if (!currentUser) return 'Usuário';
    
    // Verificar full_name primeiro (formato padrão do backend)
    if (currentUser.full_name && currentUser.full_name.trim() !== '' && currentUser.full_name !== 'undefined') {
      return currentUser.full_name;
    }
    
    // Fallback para fullName (camelCase) se existir
    if (currentUser.fullName && currentUser.fullName.trim() !== '' && currentUser.fullName !== 'undefined') {
      return currentUser.fullName;
    }
    
    // Último fallback para username
    return currentUser.username || 'Usuário';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col max-w-md mx-auto bg-background relative overflow-hidden"
    >
      <ParticlesBackground isDarkTheme={true} className="fixed inset-0 z-0" />
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
                    src={imageUrl}
                    alt="Foto de Perfil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                    data-testid="profile-avatar"
                    onError={(e) => {
                      // Fallback adicional se a imagem falhar completamente
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username || 'user'}&backgroundColor=000515`;
                    }}
                  />
                  {imageLoading && (
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}

                  {/* Botão para alterar foto */}
                  <ObjectUploader
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    onComplete={handleUploadComplete}
                    disabled={uploading}
                    accept="image/*"
                    buttonClassName="absolute bottom-2 right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" />
                  </ObjectUploader>
                </div>
              </div>

              {/* Nome do usuário */}
              <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="user-name">
                {getUserDisplayName()}
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

            {/* Card de Recordes e Scapys - Container Principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="mb-8"
            >
              <Card className="border-border rounded-2xl ai-assistant-card-natural-3d" style={{ backgroundColor: '#000515' }}>
                <CardContent className="p-4">
                  {/* Header do Card */}
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <Trophy className="w-7 h-7 text-primary" />
                    <span className="text-lg text-foreground font-semibold">Recordes e Scapys</span>
                  </div>

                  {/* Cards Internos */}
                  <div className="space-y-3">
                    <Card className="border-border rounded-full" style={{ backgroundColor: 'transparent' }}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground font-medium">Maior sequência:</span>
                          <span className="text-sm text-foreground font-medium">
                            {currentUser?.bestStreak || 0} dias
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border rounded-full" style={{ backgroundColor: 'transparent' }}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground font-medium">Total de recaídas:</span>
                          <span className="text-sm text-foreground font-medium">
                            {currentUser?.relapseCount || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border rounded-full" style={{ backgroundColor: 'transparent' }}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground font-medium">Jornada iniciada em:</span>
                          <span className="text-sm text-foreground font-medium">
                            {currentUser?.startDate
                              ? new Date(currentUser.startDate).toLocaleDateString('pt-BR')
                              : '--/--/----'
                            }
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border rounded-full" style={{ backgroundColor: 'transparent' }}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground font-medium">Pontuação Scapy:</span>
                          <span className="text-sm text-foreground font-medium">
                            {currentUser?.scapyPoints || 0} pts
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card Dados Quiz de Personalização - Container Principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="mb-8"
            >
              <Card className="border-border rounded-2xl ai-assistant-card-natural-3d" style={{ backgroundColor: '#000515' }}>
                <CardContent className="p-4">
                  {/* Header do Card */}
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <BarChart3 className="w-7 h-7 text-primary" />
                    <span className="text-lg text-foreground font-semibold">Dados Quiz de Personalização</span>
                  </div>

                  {quizData ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="space-y-3"
                    >
                  {quizData.genero && (
                      <Card
                        className="border-border rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <CardContent 
                          className="p-3 cursor-pointer"
                          onClick={() => handleEditField('genero', quizData.genero)}
                        >
                          <div className="flex items-center space-x-3 cursor-pointer">
                            <Users className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="flex items-center justify-between flex-1 cursor-pointer">
                              <span className="text-sm text-muted-foreground font-medium cursor-pointer">Gênero:</span>
                              <div className="flex items-center space-x-2 cursor-pointer">
                                <span className="text-sm text-foreground font-medium cursor-pointer">{quizData.genero}</span>
                                <Edit className="w-3 h-3 text-muted-foreground cursor-pointer" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {quizData.idade && (
                      <Card
                        className="border-border rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <CardContent 
                          className="p-3 cursor-pointer"
                          onClick={() => handleEditField('idade', quizData.idade)}
                        >
                          <div className="flex items-center space-x-3 cursor-pointer">
                            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="flex items-center justify-between flex-1 cursor-pointer">
                              <span className="text-sm text-muted-foreground font-medium cursor-pointer">Idade:</span>
                              <div className="flex items-center space-x-2 cursor-pointer">
                                <span className="text-sm text-foreground font-medium cursor-pointer">{quizData.idade}</span>
                                <Edit className="w-3 h-3 text-muted-foreground cursor-pointer" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {quizData.motivacao && (
                      <Card
                        className="border-border rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <CardContent 
                          className="p-3 cursor-pointer"
                          onClick={() => handleEditField('motivacao', quizData.motivacao)}
                        >
                          <div className="flex items-center space-x-3 cursor-pointer">
                            <Heart className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="flex items-center justify-between flex-1 cursor-pointer">
                              <span className="text-sm text-muted-foreground font-medium cursor-pointer">Motivação:</span>
                              <div className="flex items-center space-x-2 cursor-pointer">
                                <span className="text-sm text-foreground font-medium cursor-pointer">{quizData.motivacao}</span>
                                <Edit className="w-3 h-3 text-muted-foreground cursor-pointer" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {quizData.frequencia && (
                      <Card
                        className="border-border rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <CardContent 
                          className="p-3 cursor-pointer"
                          onClick={() => handleEditField('frequencia', quizData.frequencia)}
                        >
                          <div className="flex items-center space-x-3 cursor-pointer">
                            <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="flex items-center justify-between flex-1 cursor-pointer">
                              <span className="text-sm text-muted-foreground font-medium cursor-pointer">Frequência:</span>
                              <div className="flex items-center space-x-2 cursor-pointer">
                                <span className="text-sm text-foreground font-medium cursor-pointer">{quizData.frequencia}</span>
                                <Edit className="w-3 h-3 text-muted-foreground cursor-pointer" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {quizData.gatilhos && (
                      <Card
                        className="border-border rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <CardContent 
                          className="p-3 cursor-pointer"
                          onClick={() => handleEditField('gatilhos', quizData.gatilhos)}
                        >
                          <div className="flex items-center space-x-3 cursor-pointer">
                            <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="flex items-center justify-between flex-1 cursor-pointer">
                              <span className="text-sm text-muted-foreground font-medium cursor-pointer">Gatilhos:</span>
                              <div className="flex items-center space-x-2 cursor-pointer">
                                <span className="text-sm text-foreground font-medium cursor-pointer">{quizData.gatilhos}</span>
                                <Edit className="w-3 h-3 text-muted-foreground cursor-pointer" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {quizData.religiao && (
                      <Card
                        className="border-border rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <CardContent 
                          className="p-3 cursor-pointer"
                          onClick={() => handleEditField('religiao', quizData.religiao)}
                        >
                          <div className="flex items-center space-x-3 cursor-pointer">
                            <Cross className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="flex items-center justify-between flex-1 cursor-pointer">
                              <span className="text-sm text-muted-foreground font-medium cursor-pointer">Religião:</span>
                              <div className="flex items-center space-x-2 cursor-pointer">
                                <span className="text-sm text-foreground font-medium cursor-pointer">{quizData.religiao}</span>
                                <Edit className="w-3 h-3 text-muted-foreground cursor-pointer" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    </motion.div>
                  ) : (
                    <Card className="border-border rounded-full" style={{ backgroundColor: 'transparent' }}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-sm text-muted-foreground font-medium">
                            Nenhum dado de quiz encontrado
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Modal de Edição */}
      {editingField && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={handleCancelEdit}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background border border-primary/30 rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Editar {editingField === 'genero' ? 'Gênero' :
                        editingField === 'idade' ? 'Idade' :
                        editingField === 'motivacao' ? 'Motivação' :
                        editingField === 'frequencia' ? 'Frequência' :
                        editingField === 'gatilhos' ? 'Gatilhos' :
                        editingField === 'religiao' ? 'Religião' : editingField}
              </h3>
              <p className="text-sm text-muted-foreground">
                Digite sua nova resposta abaixo
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-3 rounded-xl bg-primary/5 border border-primary/20 text-foreground focus:outline-none focus:border-primary"
                placeholder="Digite sua resposta..."
                autoFocus
              />

              <div className="flex space-x-3">
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                  disabled={!editValue.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}