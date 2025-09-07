import { Router, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import PerfilUsuario from "@/pages/perfil-usuario";
import { useState, useEffect } from "react";

function AppRouter() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('user');

    if (savedAuth === 'true' && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    // Redirect to login page could be handled here if needed
    window.location.reload();
  };

  // Loading state opcional
  if (user === null && localStorage.getItem('isAuthenticated') === 'true') {
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

  // Se estiver autenticado, mostrar aplicação principal
  return (
    <Router>
      <Route path="/" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
      <Route path="/dashboard" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
      <Route path="/perfil-usuario" component={() => <PerfilUsuario user={user} onBack={() => window.history.back()} />} />
      <Route component={NotFound} />
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