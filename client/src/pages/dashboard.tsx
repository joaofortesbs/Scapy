import { useState, useEffect } from "react"; // Import useEffect
import { useQuery } from "@tanstack/react-query";
import type { User, WeeklyProgress } from "@shared/schema";
import PainelInterface from "@/interface/secao/painel";
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface DashboardProps {
  user?: any;
  onLogout?: () => void;
}

export default function Dashboard({ user: initialUser, onLogout }: DashboardProps) {
  const [activeSection, setActiveSection] = useState("painel");
  const [user, setUser] = useState<User | null>(null); // State to hold user data
  const [isLoading, setIsLoading] = useState(true); // State to manage loading status
  const navigate = useNavigate(); // Initialize useNavigate

  const { data: weeklyProgress } = useQuery<WeeklyProgress>({
    queryKey: ["/api/weekly-progress"],
  });

  // useEffect to check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar autenticação JWT
        const { AuthService } = await import('@/lib/auth');

        if (!AuthService.isAuthenticated()) {
          console.warn('⚠️ [Dashboard] Usuário não autenticado, redirecionando...');
          navigate('/auth');
          return;
        }

        const userData = AuthService.getCurrentUser();
        if (userData) {
          setUser(userData);
          console.log('✅ [Dashboard] Usuário autenticado:', userData.email);
        } else {
          console.warn('⚠️ [Dashboard] Dados do usuário não encontrados');
          navigate('/auth');
        }
      } catch (error) {
        console.error('❌ [Dashboard] Erro na verificação de autenticação:', error);
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

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