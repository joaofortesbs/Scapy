
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import { useState, useEffect } from "react";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  // Verificar se usuário está logado
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      const authToken = localStorage.getItem('authToken');
      
      if (userData && authToken) {
        try {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Função de logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Função de login success
  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, mostrar página de login
  if (!isAuthenticated) {
    return (
      <TooltipProvider>
        <Toaster />
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </TooltipProvider>
    );
  }

  // Se estiver autenticado, mostrar aplicação principal
  return (
    <Switch>
      <Route path="/" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
      <Route path="/dashboard" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="bg-background text-foreground min-h-screen">
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
