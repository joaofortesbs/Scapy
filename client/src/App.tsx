import { Router, Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Index from "@/pages/Index";
import AuthPage from "@/pages/auth";
import PerfilUsuario from "@/pages/perfil-usuario";
import QuizPersonalizacao from "@/pages/quiz-personalizacao";
import { useState, useEffect } from "react";

function AppRouter() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  <Route path="/" component={Index} />// Estado para controlar o carregamento inicial

  // Verificar autenticação ao carregar
  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated");
    const savedUser = localStorage.getItem("user");

    if (savedAuth === "true" && savedUser) {
      try {
        const userData = JSON.parse(savedUser);

        // Normalizar dados do usuário
        const normalizedUser = {
          ...userData,
          full_name:
            userData.full_name ||
            userData.fullName ||
            userData.username ||
            "Usuário",
        };

        console.log("🔍 Usuário autenticado carregado:", normalizedUser);
        setIsAuthenticated(true);
        setUser(normalizedUser);

        // Salvar dados normalizados
        localStorage.setItem("user", JSON.stringify(normalizedUser));
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        setIsAuthenticated(false);
      }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (userData: any, isNewUser = false) => {
    try {
      setIsAuthenticated(true);
      setUser(userData);
      setShowQuiz(isNewUser); // Mostrar quiz apenas para novos usuários
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Erro durante login success:", error);
      // Fallback: forçar reload da página
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleCompleteQuiz = () => {
    setShowQuiz(false);
    localStorage.setItem("quizCompleted", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
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
      return (
        <QuizPersonalizacao user={user} onCompleteQuiz={handleCompleteQuiz} />
      );
    } catch (error) {
      console.error("Erro ao renderizar quiz:", error);
      // Fallback: ir direto para o dashboard
      return (
        <Router>
          <Switch>
            <Route
              path="/"
              component={() => (
                <Dashboard user={user} onLogout={handleLogout} />
              )}
            />
            <Route
              path="/dashboard"
              component={() => (
                <Dashboard user={user} onLogout={handleLogout} />
              )}
            />
            <Route path="/perfil-usuario">
              <PerfilUsuario
                user={user}
                onUserUpdate={(updatedUser) => {
                  console.log("🔄 Atualizando dados do usuário:", updatedUser);
                  setUser(updatedUser);
                }}
              />
            </Route>
            <Route
              path="/quiz-personalizacao"
              component={() => (
                <QuizPersonalizacao
                  user={user}
                  onCompleteQuiz={handleCompleteQuiz}
                />
              )}
            />
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
        <Route
          path="/"
          component={() => <Dashboard user={user} onLogout={handleLogout} />}
        />
        <Route
          path="/dashboard"
          component={() => <Dashboard user={user} onLogout={handleLogout} />}
        />
        <Route path="/perfil-usuario">
          <PerfilUsuario
            user={user}
            onUserUpdate={(updatedUser) => {
              console.log("🔄 Atualizando dados do usuário:", updatedUser);
              setUser(updatedUser);
            }}
          />
        </Route>
        <Route
          path="/quiz-personalizacao"
          component={() => (
            <QuizPersonalizacao
              user={user}
              onCompleteQuiz={handleCompleteQuiz}
            />
          )}
        />
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
