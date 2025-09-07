import { Router, Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import PerfilUsuario from "@/pages/perfil-usuario";
import { useState, useEffect } from "react";

// Cache management constants (same as in painel component)
const CACHE_KEYS = {
  USER_DATA: 'scapy_user_data',
  WEEKLY_PROGRESS: 'scapy_weekly_progress',
  TIMER_STATUS: 'scapy_timer_status',
  JOURNEY_STATE: 'scapy_journey_state',
  LAST_UPDATE: 'scapy_last_update',
  AUTH_STATE: 'scapy_auth_state'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheData<T> {
  data: T;
  timestamp: number;
}

const getCachedData = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const parsed: CacheData<T> = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION;
    
    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  } catch {
    return null;
  }
};

const setCachedData = <T>(key: string, data: T): void => {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
};

function AppRouter() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Try cache first, then fallback to legacy localStorage
    const cachedAuth = getCachedData<boolean>(CACHE_KEYS.AUTH_STATE);
    if (cachedAuth !== null) return cachedAuth;
    
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [user, setUser] = useState<any>(() => {
    // Try cache first, then fallback to legacy localStorage
    const cachedUser = getCachedData<any>(CACHE_KEYS.USER_DATA);
    if (cachedUser) return cachedUser;
    
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Verificar autenticação ao carregar com caching
  useEffect(() => {
    const cachedAuth = getCachedData<boolean>(CACHE_KEYS.AUTH_STATE);
    const cachedUser = getCachedData<any>(CACHE_KEYS.USER_DATA);

    if (cachedAuth !== null && cachedUser) {
      setIsAuthenticated(cachedAuth);
      setUser(cachedUser);
      return;
    }

    // Fallback to legacy localStorage
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('user');

    if (savedAuth === 'true' && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setIsAuthenticated(true);
      setUser(parsedUser);
      
      // Cache the data for future use
      setCachedData(CACHE_KEYS.AUTH_STATE, true);
      setCachedData(CACHE_KEYS.USER_DATA, parsedUser);
    }
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    
    // Cache authentication data
    setCachedData(CACHE_KEYS.AUTH_STATE, true);
    setCachedData(CACHE_KEYS.USER_DATA, userData);
    
    // Maintain legacy localStorage for compatibility
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    
    // Clear all cached data
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear legacy localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('hasStartedJourney');
    localStorage.removeItem('timerStartDate');
    
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
      <Switch>
        <Route path="/" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
        <Route path="/dashboard" component={() => <Dashboard user={user} onLogout={handleLogout} />} />
        <Route path="/perfil-usuario" component={() => <PerfilUsuario user={user} onUserUpdate={(updatedUser) => { setUser(updatedUser); localStorage.setItem('user', JSON.stringify(updatedUser)); }} />} />
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