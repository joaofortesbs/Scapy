import { useState, useEffect } from "react"; // Import useEffect
import { useQuery } from "@tanstack/react-query";
import type { User, WeeklyProgress } from "@shared/schema";
import PainelInterface from "@/interface/secao/painel";
import { useLocation } from "wouter"; // Import useLocation from wouter

interface DashboardProps {
  user?: any;
  onLogout?: () => void;
}

export default function Dashboard({ user: initialUser, onLogout }: DashboardProps) {
  const [activeSection, setActiveSection] = useState("painel");
  const [user, setUser] = useState<User | undefined>(undefined); // State to hold user data
  const [isLoading, setIsLoading] = useState(true); // State to manage loading status
  const [, setLocation] = useLocation(); // Initialize navigation with wouter

  const { data: weeklyProgress } = useQuery<WeeklyProgress>({
    queryKey: ["/api/weekly-progress"],
  });

  // useEffect to check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Se já temos um usuário do prop, usar ele
        if (initialUser) {
          setUser(initialUser);
          setIsLoading(false);
          return;
        }

        // Verificar autenticação JWT
        const { AuthService } = await import('@/lib/auth');

        if (!AuthService.isAuthenticated()) {
          // Tentar fallback com localStorage
          const savedAuth = localStorage.getItem('isAuthenticated');
          const savedUser = localStorage.getItem('user');
          
          if (savedAuth === 'true' && savedUser) {
            try {
              const userData = JSON.parse(savedUser);
              setUser(userData);
              console.log('✅ [Dashboard] Usuário autenticado (fallback):', userData.email);
            } catch (error) {
              console.warn('⚠️ [Dashboard] Erro no fallback, redirecionando...');
              setLocation('/');
            }
          } else {
            console.warn('⚠️ [Dashboard] Usuário não autenticado, redirecionando...');
            setLocation('/');
          }
          return;
        }

        const userData = AuthService.getCurrentUser();
        if (userData) {
          setUser(userData);
          console.log('✅ [Dashboard] Usuário autenticado:', userData.email);
        } else {
          console.warn('⚠️ [Dashboard] Dados do usuário não encontrados');
          setLocation('/');
        }
      } catch (error) {
        console.error('❌ [Dashboard] Erro na verificação de autenticação:', error);
        setLocation('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [initialUser, setLocation]);

  const handleSectionChange = (section: string) => {
    if (section !== "painel") {
      alert("Esta seção estará disponível em breve!");
      return;
    }
    setActiveSection(section);
  };

  // Render loading state or the interface
  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <PainelInterface
      user={user} // Pass the user state
      weeklyProgress={weeklyProgress}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    />
  );
}