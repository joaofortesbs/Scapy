import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User, WeeklyProgress } from "@shared/schema";
import PainelInterface from "@/interface/secao/painel";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer } from "@/components/timer";
import { WeeklyTracker } from "@/components/weekly-tracker";
import { FraseDoDia } from "@/components/frase-do-dia";
import { EvolutionaryAvatar } from "@/components/evolutionary-avatar";
import { DailyGoals } from "@/components/daily-goals";
import { BottomNavigation } from "@/components/bottom-navigation";

interface DashboardProps {
  user?: any;
  onLogout?: () => void;
}

export default function Dashboard({ user: initialUser, onLogout }: DashboardProps) {
  const [activeSection, setActiveSection] = useState("painel");
  const [user, setUser] = useState<User | undefined>(undefined); // State to hold user data
  const [isLoading, setIsLoading] = useState(true); // State to manage loading status
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={onLogout} />

      {/* Mensagens de Erro e Sucesso */}      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError('')}
            className="float-right font-bold text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mx-4 mt-4">
          <span className="block sm:inline">{success}</span>
          <button 
            onClick={() => setSuccess('')}
            className="float-right font-bold text-green-700 hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Seção do Cronômetro Principal */}        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Jornada NoFap</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Timer 
                user={user} 
                onUserUpdate={setUser}
                setError={setError}
                setSuccess={setSuccess}
              />
            </CardContent>
          </Card>
        </div>

        {/* Outras Seções */}        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WeeklyTracker weeklyProgress={weeklyProgress} />
          <FraseDoDia />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EvolutionaryAvatar userId={user?.id} />
          <DailyGoals userId={user?.id} />
        </div>
      </main>

      <BottomNavigation activeSection={activeSection} onSectionChange={handleSectionChange} />
    </div>
  );
}