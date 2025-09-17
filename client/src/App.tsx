import { Router, Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import PerfilUsuario from "@/pages/perfil-usuario";
import QuizPersonalizacao from "@/pages/quiz-personalizacao";
import MelhorVersao from "@/pages/melhor-versao";
import PanicPage from "@/pages/panic-page";
import AvatareEsEvolutivos from "@/pages/avatares-evolutivos";
import { useState, useEffect } from "react";
import { initializeStorageCleanup } from "@/utils/localStorage-sync";

function AppRouter() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Estado para controlar o carregamento inicial

  // Inicializar sistema de sincronização global e verificar autenticação
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Inicializar sistema de limpeza automática do localStorage
        initializeStorageCleanup();
        console.log('🚀 Sistema de persistência robusta inicializado!');
        
        // Importar AuthService dinamicamente
        const { AuthService } = await import('@/lib/auth');
        
        // Verificar se há autenticação válida
        if (AuthService.isAuthenticated()) {
          const userData = AuthService.getCurrentUser();
          
          if (userData) {
            console.log('🔍 Usuário autenticado carregado:', userData);
            setIsAuthenticated(true);
            setUser(userData);
            
            // Verificar se precisa mostrar quiz (apenas para novos usuários)
            const quizCompleted = localStorage.getItem('quizCompleted');
            if (!quizCompleted && userData.id) {
              // Verificar se é um usuário novo (cadastrado hoje)
              const createdAt = userData.createdAt || new Date().toISOString();
              const today = new Date().toISOString().split('T')[0];
              const userCreatedToday = createdAt.split('T')[0] === today;
              setShowQuiz(userCreatedToday);
            }
          } else {
            console.warn('⚠️ Dados do usuário não encontrados');
            setIsAuthenticated(false);
          }
        } else {
          // Tentar fallback com o método antigo
          const savedAuth = localStorage.getItem('isAuthenticated');
          const savedUser = localStorage.getItem('user');

          if (savedAuth === 'true' && savedUser) {
            try {
              const userData = JSON.parse(savedUser);
              const normalizedUser = {
                ...userData,
                full_name: userData.full_name || userData.fullName || userData.username || 'Usuário'
              };

              console.log('🔍 Usuário autenticado carregado (fallback):', normalizedUser);
              setIsAuthenticated(true);
              setUser(normalizedUser);
              localStorage.setItem('user', JSON.stringify(normalizedUser));
            } catch (error) {
              console.error('Erro ao carregar usuário (fallback):', error);
              setIsAuthenticated(false);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro na verificação de autenticação:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleLoginSuccess = (userData: any, isNewUser = false) => {
    try {
      setIsAuthenticated(true);
      setUser(userData);
      setShowQuiz(isNewUser); // Mostrar quiz apenas para novos usuários
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro durante login success:', error);
      // Fallback: forçar reload da página
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleCompleteQuiz = () => {
    setShowQuiz(false);
    localStorage.setItem('quizCompleted', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    window.location.reload();
  };

  // Se estiver carregando, mostrar tela de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, mostrar APENAS página de login
  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Se estiver autenticado mas precisa fazer o quiz
  if (showQuiz) {
    try {
      return <QuizPersonalizacao user={user} onCompleteQuiz={handleCompleteQuiz} />;
    } catch (error) {
      console.error('Erro ao renderizar quiz:', error);
      // Fallback: ir direto para o dashboard
      return (
        <Router>
          <Switch>
            <Route path="/" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
            <Route path="/dashboard" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
            <Route path="/panic" component={() => <PanicPage user={user} />} />
            <Route path="/perfil-usuario">
              <PerfilUsuario
                user={user}
                onUserUpdate={(updatedUser) => {
                  console.log('🔄 Atualizando dados do usuário:', updatedUser);
                  setUser(updatedUser);
                }}
              />
            </Route>
            <Route path="/quiz-personalizacao" component={() => <QuizPersonalizacao user={user} onCompleteQuiz={handleCompleteQuiz} />} />
            <Route path="/melhor-versao" component={() => <MelhorVersao />} />
            <Route path="/avatares-evolutivos" component={() => <AvatareEsEvolutivos />} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      );
    }
  }

  // Se estiver autenticado, mostrar aplicação principal
  return (
    <Router>
      <Switch>
        <Route path="/" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
        <Route path="/dashboard" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
        <Route path="/panic" component={() => <PanicPage user={user} />} />
        <Route path="/perfil-usuario">
          <PerfilUsuario
            user={user}
            onUserUpdate={(updatedUser) => {
              console.log('🔄 Atualizando dados do usuário:', updatedUser);
              setUser(updatedUser);
            }}
          />
        </Route>
        <Route path="/quiz-personalizacao" component={() => <QuizPersonalizacao user={user} onCompleteQuiz={handleCompleteQuiz} />} />
        <Route path="/melhor-versao" component={() => <MelhorVersao />} />
        <Route path="/avatares-evolutivos" component={() => <AvatareEsEvolutivos />} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;